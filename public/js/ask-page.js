import { askJainWorld, searchAll, submitAskFeedback } from "./api.js";
import { getLanguage, updateLanguageDOM } from "./language.js";

const SUGGESTIONS = [
  { en: "Why do Jains follow Ahimsa?", hi: "जैन अहिंसा का पालन क्यों करते हैं?" },
  { en: "What are Jain food rules?", hi: "जैन भोजन के नियम क्या हैं?" },
  { en: "What is Paryushan?", hi: "पर्युषण क्या है?" },
  { en: "Find Jain scholarships", hi: "जैन छात्रवृत्ति खोजें" },
  { en: "Explain Namokar Mantra", hi: "णमोकार मंत्र समझाइए" },
  { en: "Find temples with dharamshala", hi: "धर्मशाला वाले मंदिर खोजें" },
  { en: "What documents are needed for minority scholarships?", hi: "अल्पसंख्यक छात्रवृत्ति के लिए कौन से दस्तावेज़ चाहिए?" }
];

const FEEDBACK_ACTIONS = [
  { key: "helpful", en: "Helpful", hi: "उपयोगी" },
  { key: "not_helpful", en: "Not helpful", hi: "उपयोगी नहीं" },
  { key: "needs_correction", en: "Needs correction", hi: "सुधार चाहिए" },
  { key: "missing_source", en: "Missing source", hi: "स्रोत अधूरा है" },
  { key: "unsafe_or_wrong", en: "Unsafe or wrong", hi: "गलत या असुरक्षित" }
];

const state = {
  question: "",
  payload: null,
  fallbackResults: [],
  mode: "empty"
};

document.addEventListener("DOMContentLoaded", async () => {
  if (document.body.dataset.page !== "ask") {
    return;
  }

  const form = document.getElementById("ask-page-form");
  const input = document.getElementById("ask-page-input");
  const params = new URLSearchParams(window.location.search);
  state.question = params.get("q") || "";

  if (input) {
    input.value = state.question;
  }

  if (state.question) {
    await runAsk(state.question);
  } else {
    rerenderState();
  }

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const nextQuestion = String(input?.value || "").trim();
    updateUrl(nextQuestion);
    await runAsk(nextQuestion);
  });

  window.addEventListener("jainworld:language-change", () => {
    rerenderState();
  });
});

async function runAsk(question) {
  const answerRoot = document.getElementById("ask-answer");
  const sourcesRoot = document.getElementById("ask-sources");
  const suggestionsRoot = document.getElementById("ask-suggestions");

  if (!answerRoot || !sourcesRoot || !suggestionsRoot) {
    return;
  }

  state.question = question;
  state.payload = null;
  state.fallbackResults = [];

  if (!question) {
    state.mode = "empty";
    rerenderState();
    setBanner(copy().askPrompt, "neutral");
    return;
  }

  answerRoot.innerHTML = `<div class="soft-card p-5"><p class="m-0 text-sm text-stone-600">${escapeHtml(copy().loading)}</p></div>`;
  sourcesRoot.innerHTML = "";
  suggestionsRoot.innerHTML = "";

  try {
    const data = await askJainWorld({ question, language: currentLanguage() });
    state.payload = data;
    state.mode = "answer";
    renderAskAnswer(data);
    setBanner(copy().ready, "success");
  } catch (error) {
    state.mode = "fallback";
    await renderFallback(question, error.message || copy().fallbackError);
  }
}

async function renderFallback(question, message) {
  const answerRoot = document.getElementById("ask-answer");
  const sourcesRoot = document.getElementById("ask-sources");
  const suggestionsRoot = document.getElementById("ask-suggestions");
  state.fallbackResults = await searchAll(question, { limit: 10 }).catch(() => []);

  setBanner(copy().fallbackBanner, "error");

  if (answerRoot) {
    answerRoot.innerHTML = `
      <div class="soft-card p-5">
        <div class="flex flex-wrap items-center gap-2">
          <span class="jw-badge jw-badge--pending-review">${escapeHtml(copy().limitedMode)}</span>
          <span class="jw-badge jw-badge--needs-update">${escapeHtml(copy().insufficientCoverage)}</span>
        </div>
        <h2 class="mt-4 text-2xl font-semibold text-stone-900">${escapeHtml(copy().fallbackHeading)}</h2>
        <p class="m-0 mt-3 text-sm leading-8 text-stone-700">${escapeHtml(message)}</p>
      </div>
    `;
  }

  if (sourcesRoot) {
    sourcesRoot.innerHTML = renderSources(state.fallbackResults.slice(0, 5), question, [], "insufficient", "normal");
  }

  if (suggestionsRoot) {
    suggestionsRoot.innerHTML = renderSuggestions([
      { label: copy().trySearch, url: `/search.html?q=${encodeURIComponent(question)}` },
      { label: copy().browseLearn, url: "/education.html" },
      { label: copy().exploreResources, url: "/resources.html" }
    ]);
  }

  updateLanguageDOM(getLanguage());
}

function renderAskAnswer(payload) {
  const answerRoot = document.getElementById("ask-answer");
  const sourcesRoot = document.getElementById("ask-sources");
  const suggestionsRoot = document.getElementById("ask-suggestions");

  if (answerRoot) {
    answerRoot.innerHTML = `
      <div class="soft-card p-5">
        <div class="flex flex-wrap items-center gap-2">
          <span class="${buildModeBadgeClass(payload.answer_mode)}">${escapeHtml(formatMode(payload.answer_mode))}</span>
          <span class="${buildConfidenceBadgeClass(payload.confidence)}">${escapeHtml(formatConfidence(payload.confidence))}</span>
          <span class="${payload.safety_level === "high_review" ? "jw-badge jw-badge--needs-update" : "jw-badge jw-badge--verified"}">${escapeHtml(formatSafety(payload.safety_level))}</span>
        </div>
        <h2 class="mt-4 text-2xl font-semibold text-stone-900">${escapeHtml(copy().answerHeading)}</h2>
        <p class="m-0 mt-3 text-sm leading-8 text-stone-700">${escapeHtml(payload.answer || copy().noAnswer)}</p>
        ${payload.safety_level === "high_review" ? `<p class="m-0 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-900">${escapeHtml(copy().verifyImportant)}</p>` : ""}
        <div class="mt-5 border-t border-stone-200 pt-4">
          <p class="m-0 text-sm font-semibold text-stone-900">${escapeHtml(copy().helpfulPrompt)}</p>
          <div class="jw-page-actions mt-3">${renderFeedbackActions(payload.ask_query_id, payload.question, payload.answer_mode)}</div>
        </div>
      </div>
    `;
  }

  if (sourcesRoot) {
    sourcesRoot.innerHTML = renderSources(payload.sources || [], payload.question, payload.citations || [], payload.confidence, payload.safety_level);
  }

  if (suggestionsRoot) {
    suggestionsRoot.innerHTML = renderSuggestions(payload.suggestions || []);
  }

  bindFeedbackButtons();
  updateLanguageDOM(getLanguage());
}

function rerenderState() {
  if (state.mode === "answer" && state.payload) {
    renderAskAnswer(state.payload);
    return;
  }

  if (state.mode === "fallback") {
    renderFallback(state.question, copy().fallbackError);
    return;
  }

  const answerRoot = document.getElementById("ask-answer");
  const sourcesRoot = document.getElementById("ask-sources");
  const suggestionsRoot = document.getElementById("ask-suggestions");

  if (answerRoot) {
    answerRoot.innerHTML = "";
  }
  if (sourcesRoot) {
    sourcesRoot.innerHTML = "";
  }
  if (suggestionsRoot) {
    suggestionsRoot.innerHTML = renderSuggestions(SUGGESTIONS);
  }

  updateLanguageDOM(getLanguage());
}

function renderSources(sources, question, citations, confidence, safetyLevel) {
  const hasSources = Array.isArray(sources) && sources.length > 0;
  const hasCitations = Array.isArray(citations) && citations.length > 0;

  if (!hasSources) {
    return `
      <div class="soft-card p-5">
        <h3 class="m-0 text-xl font-semibold text-stone-900">${escapeHtml(copy().sourcesUsed)}</h3>
        <p class="m-0 mt-3 text-sm leading-7 text-stone-600">${escapeHtml(copy().noSources)}</p>
        <p class="m-0 mt-3 text-sm"><a href="/search.html?q=${encodeURIComponent(question || "")}" class="text-amber-800 hover:text-amber-900">${escapeHtml(copy().openSearchInstead)}</a></p>
      </div>
    `;
  }

  return `
    <div class="jw-grid-2 gap-6">
      <div class="soft-card p-5">
        <div class="flex flex-wrap items-center gap-2">
          <span class="${buildConfidenceBadgeClass(confidence)}">${escapeHtml(formatConfidence(confidence))}</span>
          <span class="${safetyLevel === "high_review" ? "jw-badge jw-badge--needs-update" : "jw-badge jw-badge--verified"}">${escapeHtml(formatSafety(safetyLevel))}</span>
        </div>
        <h3 class="m-0 mt-4 text-xl font-semibold text-stone-900">${escapeHtml(copy().sourcesUsed)}</h3>
        <div class="jw-list mt-4">
          ${sources
            .map(
              (source, index) => `
                <article class="jw-card p-5">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="jw-badge">${escapeHtml(copy().sourceNumber(index + 1))}</span>
                    <span class="jw-badge jw-badge--verified">${escapeHtml(formatType(source.type))}</span>
                    ${source.score ? `<span class="jw-badge">${escapeHtml(currentLanguage() === "hi" ? `स्कोर ${source.score}` : `Score ${source.score}`)}</span>` : ""}
                  </div>
                  <h4 class="mt-3 text-lg font-semibold text-stone-900"><a href="${escapeHtml(source.url || "/search.html")}" class="hover:text-amber-800">${escapeHtml(source.title || copy().untitledSource)}</a></h4>
                  <p class="m-0 mt-2 text-sm leading-7 text-stone-600">${escapeHtml(source.summary || copy().noSummary)}</p>
                  <p class="m-0 mt-3 text-sm"><a href="${escapeHtml(source.url || "/search.html")}" class="text-amber-800 hover:text-amber-900">${escapeHtml(copy().viewSource)}</a></p>
                </article>
              `
            )
            .join("")}
        </div>
      </div>
      <div class="soft-card p-5">
        <h3 class="m-0 text-xl font-semibold text-stone-900">${escapeHtml(copy().citationsTitle)}</h3>
        ${
          hasCitations
            ? `<ol class="mt-4 space-y-3 pl-5 text-sm leading-7 text-stone-700">
                ${citations
                  .map(
                    (citation) => `
                      <li>
                        <a href="${escapeHtml(citation.url || "/search.html")}" class="font-semibold text-amber-800 hover:text-amber-900">${escapeHtml(citation.title || copy().untitledSource)}</a>
                        <div class="mt-1 text-stone-500">${escapeHtml(formatType(citation.type))}</div>
                        ${citation.summary ? `<div class="text-stone-600">${escapeHtml(citation.summary)}</div>` : ""}
                      </li>
                    `
                  )
                  .join("")}
              </ol>`
            : `<p class="m-0 mt-3 text-sm leading-7 text-stone-600">${escapeHtml(copy().citationsLimited)}</p>`
        }
        <p class="m-0 mt-4 text-sm leading-7 text-stone-600">${escapeHtml(copy().sourceOnlyNote)}</p>
      </div>
    </div>
  `;
}

function renderSuggestions(suggestions) {
  const items = Array.isArray(suggestions) && suggestions.length ? suggestions : SUGGESTIONS;
  return `
    <div class="soft-card p-5">
      <h3 class="m-0 text-xl font-semibold text-stone-900">${escapeHtml(copy().whatNext)}</h3>
      <div class="jw-search-suggestions mt-4">
        ${items
          .map((item) => {
            const label = typeof item === "string" ? item : item.label || item[currentLanguage()] || item.en || item.hi;
            const url = typeof item === "string" ? `/search.html?q=${encodeURIComponent(item)}` : item.url || `/search.html?q=${encodeURIComponent(item.en || item.label || "")}`;
            return `<a href="${escapeHtml(url || "/search.html")}" class="topic-chip">${escapeHtml(label || copy().exploreMore)}</a>`;
          })
          .join("")}
      </div>
    </div>
  `;
}

function renderFeedbackActions(askQueryId, question, answerMode) {
  return FEEDBACK_ACTIONS.map(
    (action) => `
      <button
        type="button"
        class="jw-btn"
        data-ask-feedback="${escapeHtml(action.key)}"
        data-ask-query-id="${escapeHtml(askQueryId || "")}"
        data-ask-question="${escapeHtml(question || "")}"
        data-ask-answer-mode="${escapeHtml(answerMode || "")}"
        data-source-helpful="${String(action.key === "helpful")}"
      >
        ${escapeHtml(action[currentLanguage()] || action.en)}
      </button>
    `
  ).join("");
}

function bindFeedbackButtons() {
  document.querySelectorAll("[data-ask-feedback]").forEach((button) => {
    if (button.dataset.bound === "true") {
      return;
    }

    button.dataset.bound = "true";
    button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        const response = await submitAskFeedback({
          ask_query_id: button.getAttribute("data-ask-query-id"),
          question: button.getAttribute("data-ask-question"),
          answer_mode: button.getAttribute("data-ask-answer-mode"),
          feedback: button.getAttribute("data-ask-feedback"),
          source_helpful: button.getAttribute("data-source-helpful") === "true",
          notes: ""
        });

        if (!response?.ok) {
          throw new Error(response?.error || copy().feedbackError);
        }

        setBanner(copy().feedbackSaved, "success");
      } catch (error) {
        setBanner(copy().feedbackError, "error");
      } finally {
        button.disabled = false;
      }
    });
  });
}

function setBanner(text, tone = "neutral") {
  const node = document.getElementById("ask-feedback-banner");
  if (!node) {
    return;
  }

  const classes = {
    neutral: "soft-card p-5",
    success: "soft-card p-5 border border-amber-200 bg-amber-50",
    error: "soft-card p-5 border border-red-200 bg-red-50"
  };

  node.className = classes[tone] || classes.neutral;
  node.innerHTML = `<p class="m-0 text-sm text-stone-600">${escapeHtml(text)}</p>`;
}

function updateUrl(question) {
  const url = new URL(window.location.href);
  if (question) {
    url.searchParams.set("q", question);
  } else {
    url.searchParams.delete("q");
  }
  window.history.replaceState({}, "", url);
}

function buildModeBadgeClass(mode) {
  if (mode === "ai_grounded") {
    return "jw-badge jw-badge--approved";
  }
  if (mode === "insufficient") {
    return "jw-badge jw-badge--pending-review";
  }
  return "jw-badge jw-badge--verified";
}

function buildConfidenceBadgeClass(confidence) {
  if (confidence === "high") {
    return "jw-badge jw-badge--approved";
  }
  if (confidence === "medium") {
    return "jw-badge jw-badge--verified";
  }
  if (confidence === "low") {
    return "jw-badge jw-badge--needs-update";
  }
  return "jw-badge jw-badge--pending-review";
}

function formatMode(mode) {
  if (mode === "ai_grounded") {
    return copy().aiAssisted;
  }
  if (mode === "insufficient") {
    return copy().limitedCoverage;
  }
  return copy().sourceBased;
}

function formatType(type) {
  const normalized = String(type || "source").replace(/-/g, " ").toLowerCase();
  const map = {
    literature: { en: "Literature", hi: "साहित्य" },
    education: { en: "Education", hi: "शिक्षा" },
    temples: { en: "Temples", hi: "मंदिर" },
    food: { en: "Food", hi: "भोजन" },
    news: { en: "News", hi: "समाचार" },
    blogs: { en: "Blogs", hi: "ब्लॉग" },
    audio: { en: "Audio", hi: "ऑडियो" },
    resources: { en: "Resources", hi: "संसाधन" },
    calendar: { en: "Calendar", hi: "कैलेंडर" },
    source: { en: "Source", hi: "स्रोत" }
  };

  if (map[normalized]) {
    return map[normalized][currentLanguage()] || map[normalized].en;
  }

  return String(type || "source")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatConfidence(confidence) {
  const value = String(confidence || "").toLowerCase();
  if (currentLanguage() === "hi") {
    if (value === "high") {
      return "मजबूत स्रोत उपलब्धता";
    }
    if (value === "medium") {
      return "अच्छी स्रोत उपलब्धता";
    }
    if (value === "low") {
      return "सीमित स्रोत उपलब्धता";
    }
    return "पर्याप्त स्रोत उपलब्ध नहीं";
  }

  if (value === "high") {
    return "Strong source coverage";
  }
  if (value === "medium") {
    return "Good source coverage";
  }
  if (value === "low") {
    return "Limited source coverage";
  }
  return "Insufficient source coverage";
}

function formatSafety(level) {
  if (level === "high_review") {
    return currentLanguage() === "hi" ? "इस उत्तर को समीक्षा चाहिए" : "This answer needs review";
  }
  return currentLanguage() === "hi" ? "सामान्य समीक्षा स्तर" : "Normal review level";
}

function copy() {
  if (currentLanguage() === "hi") {
    return {
      askPrompt: "स्रोत-आधारित JainWorld उत्तर देखने के लिए स्पष्ट प्रश्न पूछें।",
      loading: "JainWorld उत्तर तैयार कर रहा है...",
      ready: "स्रोत-आधारित उत्तर तैयार है।",
      fallbackBanner: "JainWorld ने संबंधित स्रोत ढूँढे, लेकिन अभी सत्यापित उत्तर तैयार नहीं कर सका।",
      fallbackHeading: "JainWorld को संबंधित स्रोत मिले, लेकिन अभी सत्यापित उत्तर तैयार नहीं हो सका।",
      fallbackError: "JainWorld अभी सत्यापित उत्तर तैयार नहीं कर सका।",
      answerHeading: "जैनवर्ल्ड ज्ञान सहायक",
      noAnswer: "उत्तर उपलब्ध नहीं है।",
      limitedMode: "सीमित उत्तर मोड",
      insufficientCoverage: "पर्याप्त स्रोत उपलब्ध नहीं",
      trySearch: "जैनवर्ल्ड खोज आज़माएँ",
      browseLearn: "जैन धर्म सीखें",
      exploreResources: "संसाधन देखें",
      noSources: "इस प्रश्न के लिए JainWorld के पास अभी पर्याप्त स्रोत नहीं हैं।",
      openSearchInstead: "इसके बजाय JainWorld खोज खोलें",
      citationsLimited: "अभी विस्तृत संदर्भ सूची उपलब्ध नहीं है।",
      sourceOnlyNote: "उत्तर उपलब्ध जैनवर्ल्ड स्रोतों पर आधारित है। महत्वपूर्ण निर्णयों से पहले आधिकारिक या विश्वसनीय स्रोतों से पुष्टि करें।",
      exploreMore: "और जानें",
      feedbackSaved: "धन्यवाद। आपकी प्रतिक्रिया प्राप्त हो गई है।",
      feedbackError: "प्रतिक्रिया अभी सहेजी नहीं जा सकी। कृपया बाद में फिर प्रयास करें।",
      verifyImportant: "महत्वपूर्ण धार्मिक, सरकारी, छात्रवृत्ति, स्वास्थ्य, कानूनी, यात्रा या मंदिर-संबंधी जानकारी के लिए कृपया आधिकारिक या विश्वसनीय स्रोत से पुष्टि करें।",
      untitledSource: "बिना शीर्षक स्रोत",
      noSummary: "सारांश उपलब्ध नहीं है।",
      aiAssisted: "जैनवर्ल्ड स्रोतों से एआई-सहायित",
      sourceBased: "स्रोत-आधारित उत्तर",
      limitedCoverage: "सीमित स्रोत उपलब्धता",
      sourcesUsed: "उपयोग किए गए स्रोत",
      citationsTitle: "संदर्भ",
      helpfulPrompt: "क्या यह उत्तर उपयोगी था?",
      whatNext: "आगे क्या देखें",
      viewSource: "स्रोत देखें",
      sourceNumber: (value) => `स्रोत ${value}`
    };
  }

  return {
    askPrompt: "Ask a clear question to see a source-based JainWorld answer.",
    loading: "Asking JainWorld...",
    ready: "Source-based answer ready.",
    fallbackBanner: "JainWorld found related sources, but could not generate a verified answer right now.",
    fallbackHeading: "JainWorld found these related sources, but cannot generate a verified answer right now.",
    fallbackError: "JainWorld could not generate a verified answer right now.",
    answerHeading: "JainWorld Knowledge Assistant",
    noAnswer: "No answer available.",
    limitedMode: "Limited answer mode",
    insufficientCoverage: "Insufficient source coverage",
    trySearch: "Try JainWorld Search",
    browseLearn: "Browse Learn Jainism",
    exploreResources: "Explore Resources",
    noSources: "JainWorld does not have enough linked sources for this question yet.",
    openSearchInstead: "Open JainWorld Search instead",
    citationsLimited: "Detailed citations are not available yet for this answer.",
    sourceOnlyNote: "Answers are based on available JainWorld sources. Please verify important details with trusted authorities.",
    exploreMore: "Explore",
    feedbackSaved: "Thank you. Your feedback was received.",
    feedbackError: "Feedback could not be saved right now. Please try again later.",
    verifyImportant: "Please verify important religious, government, scholarship, medical, legal, travel, or temple-related details with official or trusted sources.",
    untitledSource: "Untitled source",
    noSummary: "No summary available.",
    aiAssisted: "AI-assisted from JainWorld sources",
    sourceBased: "Source-based answer",
    limitedCoverage: "Limited source coverage",
    sourcesUsed: "Sources used",
    citationsTitle: "Citations",
    helpfulPrompt: "Was this answer helpful?",
    whatNext: "What to explore next",
    viewSource: "View source",
    sourceNumber: (value) => `Source ${value}`
  };
}

function currentLanguage() {
  return getLanguage() === "hi" ? "hi" : "en";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
