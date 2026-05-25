import { errorResponse, hasDb, jsonResponse, normalizeString, nowIso, readJson, requireMethod, createId } from "../_lib/http.js";
import { buildExtractiveAnswer, buildSuggestions, detectSafetyLevel, normalizeQuestion, shouldQueueForReview, summarizeSources } from "../_lib/ask.js";
import { buildResult, safePublicStatus } from "../_lib/search.js";

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
  let results = [];

  try {
    results = await searchIndex(context.env.DB, question, 5);
  } catch (error) {
    return errorResponse("Ask JainWorld could not load verified sources right now.", 503);
  }

  const answerPayload = buildExtractiveAnswer(question, results);
  const confidence = answerPayload.confidence || "insufficient";
  const sourceSummaries = summarizeSources(results);
  const answer = appendSafetyNote(answerPayload.answer, safetyLevel);
  const suggestions = buildSuggestions(question, results);
  const askQueryId = createId("ask");

  const logged = await logAskQuery(context.env.DB, {
    id: askQueryId,
    question,
    normalizedQuestion: normalizeQuestion(question),
    answerMode: answerPayload.answer_mode || "extractive_search",
    answerSummary: answer,
    sourceCount: sourceSummaries.length,
    confidence,
    safetyLevel
  });

  if (logged && shouldQueueForReview(question, confidence, safetyLevel)) {
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
  const normalized = `%${normalizeQuestion(question)}%`;
  const sql = `
    SELECT id, content_type, source_id, title, summary, body, url, category, tags, language, status, review_status,
           source_name, published_at, updated_at, search_weight, created_at
    FROM search_index
    WHERE status = 'published'
      AND (review_status IN ('verified', 'approved', 'published') OR review_status IS NULL OR review_status = '')
      AND (
        lower(coalesce(title, '')) LIKE ?1 OR
        lower(coalesce(summary, '')) LIKE ?1 OR
        lower(coalesce(body, '')) LIKE ?1 OR
        lower(coalesce(category, '')) LIKE ?1 OR
        lower(coalesce(tags, '')) LIKE ?1
      )
    ORDER BY search_weight DESC, coalesce(updated_at, published_at, created_at) DESC
    LIMIT ?2
  `;
  const result = await db.prepare(sql).bind(normalized, limit).all();
  const rows = Array.isArray(result?.results) ? result.results : [];
  return rows.map((row) => buildResult(row.content_type, row, question)).filter((row) => safePublicStatus(row));
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

  return `${answer} Please verify important religious, legal, government, medical, or travel decisions with trusted authorities and original sources.`;
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
