import { errorResponse, hasDb, jsonResponse, normalizeString, nowIso, readJson, requireMethod, createId } from "../_lib/http.js";
import { buildExtractiveAnswer, buildSuggestions, detectSafetyLevel, normalizeQuestion, shouldQueueForReview, summarizeSources } from "../_lib/ask.js";
import { buildResult, expandQueryVariants, safePublicStatus } from "../_lib/search.js";

export async function onRequestPost(context) {
  const methodError = requireMethod(context.request, "POST");
  if (methodError) {
    return methodError;
  }

  const body = await readJson(context.request);
  if (!body.ok) {
    return errorResponse(body.error, 400);
  }

  const rawQuestion = normalizeString(body.data?.question);
  if (!rawQuestion) {
    return errorResponse("Question is required.", 400);
  }

  if (rawQuestion.length > 500) {
    return errorResponse("Question is too long.", 400);
  }

  const question = rawQuestion;

  if (!hasDb(context.env)) {
    return errorResponse("Ask JainWorld is not available right now.", 503);
  }

  const safetyLevel = detectSafetyLevel(question);
  const askQueryId = createId("ask");
  let results = [];

  try {
    results = await searchIndex(context.env.DB, question, 5);
  } catch (error) {
    results = [];
  }

  const answerPayload = buildExtractiveAnswer(question, results);
  const confidence = answerPayload.confidence || "insufficient";
  const sourceSummaries = summarizeSources(results);
  const answer = appendSafetyNote(answerPayload.answer, safetyLevel);
  const suggestions = buildSuggestions(question, results);

  await logAskQuery(context.env.DB, {
    id: askQueryId,
    question,
    normalizedQuestion: normalizeQuestion(question),
    answerMode: answerPayload.answer_mode || "extractive_search",
    answerSummary: answer,
    sourceCount: sourceSummaries.length,
    confidence,
    safetyLevel
  });

  if (shouldQueueForReview(question, confidence, safetyLevel)) {
    await queueAskReview(context.env.DB, {
      question,
      safetyLevel,
      reason: buildQueueReason(confidence, safetyLevel, sourceSummaries.length)
    });
  }

  return jsonResponse({
    ok: true,
    question,
    answer,
    confidence,
    safety_level: safetyLevel,
    sources: sourceSummaries,
    suggestions,
    ask_query_id: askQueryId
  });
}

async function searchIndex(db, question, limit) {
  const variants = expandQueryVariants(question);
  const tokens = variants.tokens.length ? variants.tokens : [variants.normalized].filter(Boolean);
  const bindings = [];
  const searchableColumns = [
    "lower(coalesce(title, ''))",
    "lower(coalesce(summary, ''))",
    "lower(coalesce(body, ''))",
    "lower(coalesce(category, ''))",
    "lower(coalesce(tags, ''))",
    "lower(coalesce(source_name, ''))"
  ];
  let nextPosition = 1;
  const tokenClauses = tokens
    .map((token) => {
      bindings.push(`%${token}%`);
      const clause = searchableColumns.map((column) => `${column} LIKE ?${nextPosition}`).join(" OR ");
      nextPosition += 1;
      return `(${clause})`;
    })
    .join(" OR ");
  bindings.push(Math.max(limit * 6, 30));
  const limitPosition = `?${nextPosition}`;
  const sql = `
    SELECT id, content_type, source_id, title, summary, body, url, category, tags, language, status, review_status,
           source_name, published_at, updated_at, search_weight, created_at
    FROM search_index
    WHERE status = 'published'
      AND (review_status IN ('verified', 'approved', 'published') OR review_status IS NULL OR review_status = '')
      AND (${tokenClauses || "1 = 0"})
    ORDER BY coalesce(updated_at, published_at, created_at) DESC
    LIMIT ${limitPosition}
  `;
  const result = await db.prepare(sql).bind(...bindings).all();
  const rows = Array.isArray(result?.results) ? result.results : [];
  return rows
    .map((row) => buildResult(row.content_type, row, question))
    .filter((row) => safePublicStatus(row))
    .filter((row) => row.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}

async function logAskQuery(db, payload) {
  try {
    await db.prepare(
      `INSERT INTO ask_queries (id, question, normalized_question, answer_mode, answer_summary, source_count, confidence, safety_level, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`
    )
      .bind(
        payload.id,
        payload.question,
        payload.normalizedQuestion,
        payload.answerMode,
        payload.answerSummary.slice(0, 1200),
        Number(payload.sourceCount || 0),
        payload.confidence,
        payload.safetyLevel,
        nowIso()
      )
      .run();
    return true;
  } catch (error) {
    return false;
  }
}

async function queueAskReview(db, payload) {
  try {
    await db.prepare(
      `INSERT INTO ask_review_queue (id, question, reason, safety_level, review_status, created_at, reviewed_at, reviewed_by)
       VALUES (?1, ?2, ?3, ?4, 'pending_review', ?5, NULL, NULL)`
    )
      .bind(createId("ask-review"), payload.question, payload.reason, payload.safetyLevel, nowIso())
      .run();
    return true;
  } catch (error) {
    return false;
  }
}

function appendSafetyNote(answer, safetyLevel) {
  if (safetyLevel !== "high_review") {
    return answer;
  }

  return `${answer} Please verify eligibility, documents, and deadlines on the official government, institution, or trust website before applying.`;
}

function buildQueueReason(confidence, safetyLevel, sourceCount) {
  if (safetyLevel === "high_review") {
    return "High-review question with sensitive subject matter.";
  }
  if (sourceCount === 0) {
    return "No verified sources found for this question.";
  }
  if (confidence === "low" || confidence === "insufficient") {
    return "Source coverage was limited for this question.";
  }
  return "Editorial follow-up suggested.";
}
