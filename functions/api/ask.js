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
  buildContentGapReason,
  buildExtractiveAnswer,
  buildGroundedPrompt,
  buildSuggestions,
  buildCitationList,
  computeAnswerQuality,
  detectLanguage,
  detectQuestionIntent,
  detectSafetyLevel,
  estimateAnswerConfidence,
  estimateSourceCoverage,
  normalizeQuestion,
  shouldQueueForReview,
  shouldUseAi,
  summarizeSources,
  validateAiAnswer
} from "../_lib/ask.js";
import { generateGroundedAnswer } from "../_lib/ai-provider.js";
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
  const normalizedQuestion = normalizeQuestion(question);
  const language = detectLanguage(question, body.data?.language);
  const safetyLevel = detectSafetyLevel(question);
  const detectedIntent = detectQuestionIntent(question);
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

  const sourceCoverage = estimateSourceCoverage(question, results);
  const summarizedSources = summarizeSources(results, language);
  const citations = buildCitationList(results, language);
  const suggestions = buildSuggestions(question, results, language);

  let answerPayload = buildExtractiveAnswer(question, results, {
    language,
    safetyLevel
  });
  let answerMode = answerPayload.answer_mode || "extractive";
  let providerUsed = "";
  let modelUsed = "";

  if (sourceCoverage.coverage === "insufficient") {
    answerMode = "insufficient";
    answerPayload.answer_mode = "insufficient";
    answerPayload.confidence = "insufficient";
  } else if (shouldUseAi(question, results, context.env)) {
    const prompt = buildGroundedPrompt(question, results, safetyLevel, language);
    const aiResponse = await generateGroundedAnswer({
      question,
      sources: results,
      safetyLevel,
      language,
      env: context.env,
      prompt
    });

    if (aiResponse.ok && validateAiAnswer(aiResponse.answer, results)) {
      answerPayload = {
        answer: aiResponse.answer,
        confidence: estimateAnswerConfidence(aiResponse.answer, results, {
          language,
          safetyLevel
        }),
        answer_mode: "ai_grounded"
      };
      answerMode = "ai_grounded";
      providerUsed = aiResponse.provider_used || "";
      modelUsed = aiResponse.model_used || "";
    }
  }

  const confidence = answerPayload.confidence || "insufficient";
  const quality = computeAnswerQuality({
    answer: answerPayload.answer,
    sources: results,
    confidence,
    safetyLevel
  });

  if (db) {
    await logAskQuery(db, {
      id: askQueryId,
      question,
      normalizedQuestion,
      answerMode,
      answerSummary: answerPayload.answer,
      sourceCount: summarizedSources.length,
      confidence,
      safetyLevel,
      detectedIntent,
      sourceIds: results.map((item) => normalizeString(item.id || item.source_id)).filter(Boolean).join(","),
      providerUsed,
      modelUsed,
      qualityScore: quality.quality_score,
      qualityLabel: quality.quality_label
    });

    if (sourceCoverage.coverage === "insufficient" || sourceCoverage.coverage === "limited") {
      await upsertContentGap(db, {
        question,
        normalizedQuestion,
        detectedIntent,
        missingTopic: buildContentGapReason(question, results),
        sourceCount: summarizedSources.length,
        priority: safetyLevel === "high_review" ? "high" : "medium"
      });
    }

    if (
      shouldQueueForReview(question, confidence, safetyLevel) ||
      quality.quality_label === "needs_review" ||
      (answerMode === "ai_grounded" && sourceCoverage.coverage === "limited")
    ) {
      await queueAskReview(db, {
        question,
        safetyLevel,
        reason: buildQueueReason({
          safetyLevel,
          sourceCoverage: sourceCoverage.coverage,
          qualityLabel: quality.quality_label,
          answerMode,
          confidence
        })
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
        (id, question, normalized_question, answer_mode, answer_summary, source_ids, provider_used, model_used, source_count, confidence, safety_level, detected_intent, quality_score, quality_label, created_at)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)`
      )
      .bind(
        payload.id,
        payload.question,
        payload.normalizedQuestion,
        payload.answerMode,
        payload.answerSummary.slice(0, 1600),
        payload.sourceIds || null,
        payload.providerUsed || null,
        payload.modelUsed || null,
        Number(payload.sourceCount || 0),
        payload.confidence,
        payload.safetyLevel,
        payload.detectedIntent || null,
        Number(payload.qualityScore || 0),
        payload.qualityLabel || null,
        nowIso()
      )
      .run();
    return true;
  } catch (error) {
    try {
      await db
        .prepare(
          `INSERT INTO ask_queries
          (id, question, normalized_question, answer_mode, answer_summary, source_count, confidence, safety_level, created_at)
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

async function upsertContentGap(db, payload) {
  try {
    const existing = await db
      .prepare(
        `SELECT id, frequency_count
         FROM content_gaps
         WHERE normalized_question = ?1
         LIMIT 1`
      )
      .bind(payload.normalizedQuestion)
      .first();

    if (existing?.id) {
      await db
        .prepare(
          `UPDATE content_gaps
           SET frequency_count = coalesce(frequency_count, 0) + 1,
               last_asked_at = ?1,
               source_count = ?2,
               detected_intent = ?3,
               missing_topic = ?4,
               priority = ?5
           WHERE id = ?6`
        )
        .bind(nowIso(), Number(payload.sourceCount || 0), payload.detectedIntent, payload.missingTopic, payload.priority, existing.id)
        .run();
      return true;
    }

    const createdAt = nowIso();
    await db
      .prepare(
        `INSERT INTO content_gaps
         (id, question, normalized_question, detected_intent, missing_topic, source_count, frequency_count, last_asked_at, first_asked_at, status, priority, admin_notes)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, 1, ?7, ?8, 'open', ?9, NULL)`
      )
      .bind(
        createId("gap"),
        payload.question,
        payload.normalizedQuestion,
        payload.detectedIntent,
        payload.missingTopic,
        Number(payload.sourceCount || 0),
        createdAt,
        createdAt,
        payload.priority
      )
      .run();
    return true;
  } catch (error) {
    return false;
  }
}

function buildQueueReason({ safetyLevel, sourceCoverage, qualityLabel, answerMode, confidence }) {
  if (safetyLevel === "high_review") {
    return "high_risk_question";
  }
  if (sourceCoverage === "insufficient") {
    return "insufficient_sources";
  }
  if (qualityLabel === "needs_review" || confidence === "low" || confidence === "insufficient") {
    return "low_quality_answer";
  }
  if (answerMode === "ai_grounded" && sourceCoverage === "limited") {
    return "low_quality_answer";
  }
  return "editorial_follow_up";
}
