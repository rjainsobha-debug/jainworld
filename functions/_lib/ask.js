import { normalizeString } from "./http.js";

const HIGH_RISK_PATTERNS = {
  government_scheme: /\b(government|scheme|scholarship|minority|eligibility|deadline|documents?|application|benefit|certificate)\b/i,
  medical: /\b(medical|health|medicine|treatment|doctor|disease|illness)\b/i,
  legal: /\b(legal|court|dispute|rights|law|case|petition)\b/i,
  travel: /\b(temple timings?|travel|route|visit|dharamshala|bhojanshala|parking|accessibility)\b/i,
  doctrine: /\b(doctrine|tradition|digambar|shwetambar|sthanakvasi|terapanth|correct belief|which tradition)\b/i,
  money: /\b(donation|money|business|invest|finance|financial)\b/i
};

export function normalizeQuestion(question) {
  return normalizeString(question)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function detectSafetyLevel(question) {
  const value = normalizeQuestion(question);
  if (!value) {
    return "normal";
  }

  if (
    HIGH_RISK_PATTERNS.government_scheme.test(value) ||
    HIGH_RISK_PATTERNS.medical.test(value) ||
    HIGH_RISK_PATTERNS.legal.test(value) ||
    HIGH_RISK_PATTERNS.travel.test(value) ||
    HIGH_RISK_PATTERNS.doctrine.test(value) ||
    HIGH_RISK_PATTERNS.money.test(value)
  ) {
    return "high_review";
  }

  return "normal";
}

export function summarizeSources(results = []) {
  return results
    .slice(0, 5)
    .map((item) => ({
      title: normalizeString(item.title) || "Untitled source",
      type: normalizeString(item.type) || "source",
      url: normalizeString(item.url),
      summary: normalizeString(item.summary),
      score: Number(item.score || 0)
    }))
    .filter((item) => item.title && item.url);
}

export function buildExtractiveAnswer(question, results = []) {
  const safeResults = summarizeSources(results);
  if (!safeResults.length) {
    return {
      answer:
        "I could not find enough verified JainWorld sources for this question yet. Please try a simpler search or check related sections.",
      confidence: "insufficient",
      answer_mode: "no_source"
    };
  }

  const snippets = safeResults
    .map((item) => item.summary)
    .filter(Boolean)
    .slice(0, 3)
    .map((summary) => trimSentence(summary, 220));

  if (!snippets.length) {
    return {
      answer:
        "Based on available JainWorld sources, there are related entries for this topic, but source coverage is still limited. Please open the linked sources below for the most reliable details.",
      confidence: safeResults.length >= 3 ? "low" : "insufficient",
      answer_mode: "source_limited"
    };
  }

  const leadIn =
    safeResults.length >= 3
      ? "Based on available JainWorld sources, here is a concise answer:"
      : "Based on limited JainWorld sources, here is a cautious summary:";

  const answer = `${leadIn} ${snippets.join(" ")}`.trim();
  const confidence = safeResults.length >= 4 ? "high" : safeResults.length >= 2 ? "medium" : "low";

  return {
    answer,
    confidence,
    answer_mode: "extractive_search"
  };
}

export function buildSuggestions(question, results = []) {
  const normalized = normalizeQuestion(question);
  const suggestions = [];
  const sourceMap = new Map();

  results.forEach((item) => {
    if (item.type && !sourceMap.has(item.type)) {
      sourceMap.set(item.type, item);
    }
  });

  sourceMap.forEach((item, type) => {
    suggestions.push({
      label: buildSuggestionLabel(type, item, normalized),
      url: item.url || "/search.html",
      type
    });
  });

  return suggestions.slice(0, 4);
}

export function shouldQueueForReview(question, confidence, safetyLevel) {
  if (safetyLevel === "high_review") {
    return true;
  }

  if (confidence === "insufficient" || confidence === "low") {
    return true;
  }

  return normalizeQuestion(question).length > 180;
}

function buildSuggestionLabel(type, item, normalizedQuestion) {
  if (type === "resources") {
    return "Explore related resources";
  }
  if (type === "temples") {
    return "Open temple details";
  }
  if (type === "education") {
    return "Continue learning";
  }
  if (type === "audio") {
    return "Listen to related audio";
  }
  if (type === "literature") {
    return "Read related literature";
  }
  if (type === "food") {
    return "See food guidance";
  }
  if (type === "calendar") {
    return "Open the Jain calendar";
  }
  if (type === "news") {
    return "Review related Jain updates";
  }

  if (normalizedQuestion.includes("ahimsa")) {
    return "Explore Ahimsa sources";
  }

  return `Explore related ${type || "sources"}`;
}

function trimSentence(text, maxLength) {
  const value = normalizeString(text);
  if (!value) {
    return "";
  }

  if (value.length <= maxLength) {
    return ensureSentenceEnd(value);
  }

  return ensureSentenceEnd(`${value.slice(0, maxLength).trim()}...`);
}

function ensureSentenceEnd(text) {
  if (/[.!?]$/.test(text)) {
    return text;
  }
  return `${text}.`;
}
