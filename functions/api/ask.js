import {
  createId,
  hasDb,
  jsonResponse,
  normalizeString,
  nowIso,
  readJson,
  requireMethod
} from "../_lib/http.js";
import {
  buildExtractiveAnswer,
  buildGroundedPrompt,
  buildSuggestions,
  detectQuestionLanguage,
  detectSafetyLevel,
  estimateAnswerConfidence,
  extractCitations,
  normalizeQuestion,
  shouldQueueForReview,
  shouldUseAi,
  summarizeSources,
  validateAiAnswer
} from "../_lib/ask.js";
import { generateGroundedAnswer, getConfiguredProvider } from "../_lib/ai-provider.js";
import { buildResult, expandQueryVariants, safePublicStatus } from "../_lib/search.js";

export async function onRequestPost(context) {
  const methodError = requireMethod(context.request, "POST");
  if (methodError) {
    return methodError;
  }

  const body = await readJson(context.request);
  if (!body.ok) {
    return jsonResponse({ ok: false, error: body.error }, 400);
  }

  const rawQuestion = normalizeString(body.data?.question);
  if (!rawQuestion) {
    return jsonResponse({ ok: false, error: "Question is required." }, 400);
  }

  if (rawQuestion.length > 500) {
    return jsonResponse({ ok: false, error: "Question is too long." }, 400);
  }

  const question = rawQuestion;
  const language = detectQuestionLanguage(question, body.data?.language);
  const safetyLevel = detectSafetyLevel(question);
  const askQueryId = createId("ask");
  const db = hasDb(context.env) ? context.env.DB : null;

  let results = [];
  if (db) {
    try {
      results = await searchIndex(db, question, 5);
    } catch (error) {
      results = [];
    }
  }

  const summarizedSources = summarizeSources(results, language);
  let answerPayload = buildExtractiveAnswer(question, results, {
    language,
    safetyLevel
  });
  let answerMode = answerPayload.answer_mode || "extractive";
  let providerUsed = "";
  let modelUsed = "";

  if (summarizedSources.length && shouldUseAi(question, results, context.env)) {
    const provider = getConfiguredProvider(context.env);
    const prompt = buildGroundedPrompt(question, results, safetyLevel, language);
    const aiAnswer = await generateGroundedAnswer({
      question,
      sources: results,
      safetyLevel,
      language,
      env: context.env,
      prompt
    });

    if (provider && validateAiAnswer(aiAnswer, results, language)) {
      answerPayload = {
        answer: aiAnswer,
        confidence: estimateAnswerConfidence(aiAnswer, results, {
          language,
          safetyLevel
        }),
        answer_mode: "ai_grounded"
      };
      answerMode = "ai_grounded";
      providerUsed = provider.provider;
      modelUsed = provider.model || "";
    }
  }

  const confidence = answerPayload.confidence || "insufficient";
  const citations = extractCitations(answerPayload.answer, results, language);
  const suggestions = buildSuggestions(question, results, language);

  if (db) {
    await logAskQuery(db, {
      id: askQueryId,
      question,
      normalizedQuestion: normalizeQuestion(question),
      answerMode,
      answerSummary: answerPayload.answer,
      sourceCount: summarizedSources.length,
      confidence,
      safetyLevel,
      sourceIds: results.map((item) => normalizeString(item.id)).filter(Boolean).join(","),
      providerUsed,
      modelUsed
    });

    if (shouldQueueForReview(question, confidence, safetyLevel)) {
      await queueAskReview(db, {
        question,
        safetyLevel,
        reason: buildQueueReason(confidence, safetyLevel, summarizedSources.length, answerMode)
      });
    }
  }

  return jsonResponse({
    ok: true,
    question,
    answer: answerPayload.answer,
    answer_mode: answerMode,
    confidence,
    safety_level: safetyLevel,
    language,
    sources: summarizedSources,
    citations,
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

  bindings.push(Math.max(limit * 8, 40));
  const sql = `
    SELECT id, content_type, source_id, title, summary, body, url, category, tags, language, status, review_status,
           source_name, published_at, updated_at, search_weight, created_at
    FROM search_index
    WHERE status = 'published'
      AND (review_status IN ('verified', 'approved', 'published') OR review_status IS NULL OR review_status = '')
      AND (${tokenClauses || "1 = 0"})
    ORDER BY coalesce(updated_at, published_at, created_at) DESC
    LIMIT ?${nextPosition}
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
    await db
      .prepare(
        `INSERT INTO ask_queries
        (id, question, normalized_question, answer_mode, answer_summary, source_count, confidence, safety_level, source_ids, provider_used, model_used, created_at)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)`
      )
      .bind(
        payload.id,
        payload.question,
        payload.normalizedQuestion,
        payload.answerMode,
        payload.answerSummary.slice(0, 1600),
        Number(payload.sourceCount || 0),
        payload.confidence,
        payload.safetyLevel,
        payload.sourceIds,
        payload.providerUsed || null,
        payload.modelUsed || null,
        nowIso()
      )
      .run();
    return true;
  } catch (error) {
    try {
      await db
        .prepare(
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
    } catch (fallbackError) {
      return false;
    }
  }
}

async function queueAskReview(db, payload) {
  try {
    await db
      .prepare(
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

function buildQueueReason(confidence, safetyLevel, sourceCount, answerMode) {
  if (safetyLevel === "high_review") {
    return "High-review question with sensitive subject matter.";
  }
  if (sourceCount === 0) {
    return "No verified sources found for this question.";
  }
  if (answerMode === "insufficient") {
    return "Insufficient source coverage for a safe answer.";
  }
  if (confidence === "low" || confidence === "insufficient") {
    return "Source coverage was limited for this question.";
  }
  return "Editorial follow-up suggested.";
}
