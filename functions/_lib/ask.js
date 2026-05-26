import { normalizeString } from "./http.js";

const HIGH_RISK_PATTERNS = {
  government_scheme: /\b(government|scheme|scholarship|minority|eligibility|deadline|documents?|application|benefit|certificate|hostel)\b/i,
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

export function detectQuestionLanguage(question, explicitLanguage = "") {
  const normalizedExplicit = normalizeString(explicitLanguage).toLowerCase();
  if (normalizedExplicit === "hi") {
    return "hi";
  }

  if (/[\u0900-\u097F]/.test(String(question || ""))) {
    return "hi";
  }

  return "en";
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

export function summarizeSources(results = [], language = "en") {
  return results
    .slice(0, 5)
    .map((item) => ({
      title: normalizeString(item.title) || fallbackTitle(language),
      type: normalizeString(item.type) || "source",
      url: normalizeString(item.url),
      summary: normalizeString(item.summary),
      score: Number(item.score || 0)
    }))
    .filter((item) => item.title && item.url);
}

export function buildExtractiveAnswer(question, results = [], options = {}) {
  const language = options.language || detectQuestionLanguage(question);
  const safetyLevel = options.safetyLevel || detectSafetyLevel(question);
  const safeResults = summarizeSources(results, language);

  if (!safeResults.length) {
    return {
      answer: insufficientAnswer(language),
      confidence: "insufficient",
      answer_mode: "insufficient"
    };
  }

  const snippets = safeResults
    .map((item) => item.summary)
    .filter(Boolean)
    .slice(0, 3)
    .map((summary) => trimSentence(summary, language === "hi" ? 180 : 220));

  if (!snippets.length) {
    return {
      answer:
        language === "hi"
          ? "जैनवर्ल्ड के उपलब्ध स्रोतों में इस विषय से जुड़े कुछ परिणाम मिले, लेकिन अभी सामग्री सीमित है। कृपया नीचे दिए गए स्रोत खोलकर विवरण देखें।"
          : "Based on available JainWorld sources, there are related entries for this topic, but source coverage is still limited. Please open the linked sources below for the most reliable details.",
      confidence: safeResults.length >= 3 ? "low" : "insufficient",
      answer_mode: "extractive"
    };
  }

  const leadIn =
    language === "hi"
      ? safeResults.length >= 3
        ? "जैनवर्ल्ड के उपलब्ध स्रोतों के आधार पर संक्षिप्त उत्तर:"
        : "जैनवर्ल्ड के सीमित स्रोतों के आधार पर सावधानीपूर्वक सारांश:"
      : safeResults.length >= 3
        ? "Based on available JainWorld sources, here is a concise answer:"
        : "Based on limited JainWorld sources, here is a cautious summary:";

  let answer = `${leadIn} ${snippets.join(" ")}`.trim();
  if (safetyLevel === "high_review") {
    answer = appendSafetyDisclaimer(answer, safetyLevel, language);
  }

  const confidence = safeResults.length >= 4 ? "high" : safeResults.length >= 2 ? "medium" : "low";

  return {
    answer,
    confidence,
    answer_mode: "extractive"
  };
}

export function buildGroundedPrompt(question, sources, safetyLevel, language = "en") {
  const sourceText = summarizeSources(sources, language)
    .map(
      (source, index) =>
        `[Source ${index + 1}] Title: ${source.title}\nType: ${source.type}\nURL: ${source.url}\nSummary: ${source.summary || "No summary provided."}`
    )
    .join("\n\n");

  const disclaimerRule =
    safetyLevel === "high_review"
      ? language === "hi"
        ? "यदि प्रश्न सरकारी योजना, छात्रवृत्ति, कानूनी, चिकित्सीय, यात्रा, मंदिर समय या संस्थागत पात्रता से जुड़ा है, तो उत्तर में स्पष्ट रूप से सत्यापन की सलाह दें।"
        : "If the question involves government schemes, scholarships, legal, medical, travel, temple timing, or institutional eligibility, include a clear verification disclaimer."
      : "";

  return language === "hi"
    ? [
        "आप JainWorld Knowledge Assistant के लिए एक सुरक्षित बैकएंड सहायक हैं।",
        "केवल नीचे दिए गए JainWorld स्रोतों का उपयोग करें। बाहर की जानकारी का उपयोग न करें।",
        "यदि स्रोत प्रश्न का उत्तर नहीं देते, तो स्पष्ट कहें कि JainWorld के सत्यापित स्रोत अभी पर्याप्त नहीं हैं।",
        "धार्मिक, कानूनी, सरकारी, चिकित्सीय, आर्थिक या मंदिर समय संबंधी जानकारी का अनुमान न लगाएँ।",
        disclaimerRule,
        "उत्तर छोटा, सम्मानपूर्ण, परिवार-अनुकूल और सरल हिंदी में रखें।",
        `प्रश्न: ${question}`,
        "स्रोत:",
        sourceText
      ]
        .filter(Boolean)
        .join("\n\n")
    : [
        "You are a safe backend assistant for JainWorld Knowledge Assistant.",
        "Answer only from the JainWorld sources provided below. Do not use outside knowledge.",
        "If the sources do not answer the question, say clearly that JainWorld does not yet have enough verified information.",
        "Do not invent religious, legal, government, medical, financial, scholarship, or temple timing details.",
        disclaimerRule,
        "Keep the answer concise, respectful, family-friendly, and source-grounded.",
        `Question: ${question}`,
        "Sources:",
        sourceText
      ]
        .filter(Boolean)
        .join("\n\n");
}

export function validateAiAnswer(answer, sources = [], language = "en") {
  const value = normalizeString(answer);
  if (!value) {
    return false;
  }

  if (value.length < 30) {
    return false;
  }

  if (!summarizeSources(sources, language).length) {
    return false;
  }

  return true;
}

export function extractCitations(answer, sources = [], language = "en") {
  const safeSources = summarizeSources(sources, language);
  return safeSources.slice(0, 3).map((source, index) => ({
    label: `Source ${index + 1}`,
    title: source.title,
    url: source.url,
    type: source.type,
    summary: source.summary
  }));
}

export function estimateAnswerConfidence(answer, sources = [], options = {}) {
  const language = options.language || "en";
  const safetyLevel = options.safetyLevel || "normal";
  const sourceCount = summarizeSources(sources, language).length;

  if (!normalizeString(answer) || sourceCount === 0) {
    return "insufficient";
  }

  if (safetyLevel === "high_review" && sourceCount < 2) {
    return "low";
  }

  if (sourceCount >= 4) {
    return "high";
  }

  if (sourceCount >= 2) {
    return "medium";
  }

  return "low";
}

export function shouldUseAi(question, sources = [], env = {}) {
  const provider =
    normalizeString(env?.AI_PROVIDER) ||
    normalizeString(env?.OPENAI_API_KEY) ||
    normalizeString(env?.GEMINI_API_KEY) ||
    normalizeString(env?.OPENROUTER_API_KEY) ||
    normalizeString(env?.CLOUDFLARE_AI_ENABLED);

  if (!provider) {
    return false;
  }

  return summarizeSources(sources).length >= 2 && normalizeQuestion(question).length >= 8;
}

export function buildSuggestions(question, results = [], language = "en") {
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
      label: buildSuggestionLabel(type, normalized, language),
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

function buildSuggestionLabel(type, normalizedQuestion, language) {
  const labels = {
    resources: { en: "Explore related resources", hi: "संबंधित संसाधन देखें" },
    temples: { en: "Open temple details", hi: "मंदिर विवरण देखें" },
    education: { en: "Continue learning", hi: "सीखना जारी रखें" },
    audio: { en: "Listen to related audio", hi: "संबंधित ऑडियो सुनें" },
    literature: { en: "Read related literature", hi: "संबंधित साहित्य पढ़ें" },
    food: { en: "See food guidance", hi: "भोजन मार्गदर्शन देखें" },
    calendar: { en: "Open the Jain calendar", hi: "जैन कैलेंडर खोलें" },
    news: { en: "Review related Jain updates", hi: "संबंधित जैन अपडेट देखें" },
    blogs: { en: "Read related articles", hi: "संबंधित लेख पढ़ें" }
  };

  if (labels[type]) {
    return labels[type][language] || labels[type].en;
  }

  if (normalizedQuestion.includes("ahimsa")) {
    return language === "hi" ? "अहिंसा से जुड़े स्रोत देखें" : "Explore Ahimsa sources";
  }

  return language === "hi" ? "संबंधित सामग्री देखें" : `Explore related ${type || "sources"}`;
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
  if (/[.!?।]$/.test(text)) {
    return text;
  }
  return `${text}.`;
}

function fallbackTitle(language) {
  return language === "hi" ? "बिना शीर्षक स्रोत" : "Untitled source";
}

function insufficientAnswer(language) {
  return language === "hi"
    ? "जैनवर्ल्ड के उपलब्ध सत्यापित स्रोतों में इस प्रश्न के लिए पर्याप्त जानकारी नहीं मिली। कृपया सरल खोज करें या संबंधित अनुभाग देखें।"
    : "I could not find enough verified JainWorld sources for this question yet. Please try a simpler search or check related sections.";
}

function appendSafetyDisclaimer(answer, safetyLevel, language) {
  if (safetyLevel !== "high_review") {
    return answer;
  }

  const note =
    language === "hi"
      ? "कृपया पात्रता, दस्तावेज़, समयसीमा, यात्रा विवरण या मंदिर सुविधाओं की पुष्टि आधिकारिक सरकार, संस्था, ट्रस्ट या मंदिर स्रोत से करें।"
      : "Please verify eligibility, documents, deadlines, travel details, or temple facilities with the official government, institution, trust, or temple source.";

  return `${answer} ${note}`.trim();
}
