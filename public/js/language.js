const LANGUAGE_KEY = "lang";
const LEGACY_LANGUAGE_KEY = "jainworld-language";
const DEFAULT_LANGUAGE = "en";
const MOJIBAKE_PATTERN = /(?:\u00E0\u00A4|\u00E0\u00A5|\u00E2\u0080\u00A2|\u00C2\u00A9|\u00E2\u0080\u0094|\u00E2\u0080\u0093)/;

const TRANSLATIONS = {
  home: { en: "Home", hi: "होम" },
  learn: { en: "Learn", hi: "सीखें" },
  temples: { en: "Temples", hi: "मंदिर" },
  food: { en: "Food", hi: "भोजन" },
  calendar: { en: "Calendar", hi: "कैलेंडर" },
  resources: { en: "Resources", hi: "संसाधन" },
  ask_jainworld: { en: "Ask JainWorld", hi: "जैनवर्ल्ड से पूछें" },
  search_jainworld: { en: "Search JainWorld", hi: "जैनवर्ल्ड में खोजें" },
  start_learning: { en: "Start Learning", hi: "सीखना शुरू करें" },
  find_temples: { en: "Find Temples", hi: "मंदिर खोजें" },
  community: { en: "Community", hi: "समुदाय" },
  news: { en: "News", hi: "समाचार" },
  blogs: { en: "Blogs", hi: "ब्लॉग" },
  audio: { en: "Audio", hi: "ऑडियो" },
  literature: { en: "Literature", hi: "साहित्य" },
  education: { en: "Education", hi: "शिक्षा" },
  contact: { en: "Contact", hi: "संपर्क करें" },
  contribute: { en: "Contribute", hi: "योगदान दें" },
  privacy: { en: "Privacy", hi: "गोपनीयता" },
  terms: { en: "Terms", hi: "शर्तें" },
  search: { en: "Search", hi: "खोजें" },
  quick_actions: { en: "Quick Actions", hi: "त्वरित विकल्प" },
  start_here: { en: "Start Here", hi: "यहाँ से शुरू करें" },
  daily_jain: { en: "Today on JainWorld", hi: "आज जैनवर्ल्ड पर" },
  learning_paths: { en: "Learning paths", hi: "सीखने के मार्ग" },
  popular_topics: { en: "Popular topics", hi: "लोकप्रिय विषय" },
  thought_of_the_day: { en: "Thought of the day", hi: "आज का विचार" },
  search_results: { en: "Search results", hi: "खोज परिणाम" },
  popular_searches: { en: "Popular searches", hi: "लोकप्रिय खोजें" },
  no_results: { en: "No results found", hi: "कोई परिणाम नहीं मिला" },
  view_result: { en: "View result", hi: "परिणाम देखें" },
  all: { en: "All", hi: "सभी" },
  content_type: { en: "Content type", hi: "सामग्री प्रकार" },
  filters: { en: "Filters", hi: "फ़िल्टर" },
  source_based_answer: { en: "Source-based answer", hi: "स्रोत-आधारित उत्तर" },
  sources: { en: "Sources", hi: "स्रोत" },
  helpful: { en: "Helpful", hi: "उपयोगी" },
  not_helpful: { en: "Not helpful", hi: "उपयोगी नहीं" },
  needs_correction: { en: "Needs correction", hi: "सुधार चाहिए" },
  verified: { en: "Verified", hi: "सत्यापित" },
  curated: { en: "Curated", hi: "संपादित" },
  external_source: { en: "External source", hi: "बाहरी स्रोत" },
  ai_assisted: { en: "AI-assisted from JainWorld sources", hi: "जैनवर्ल्ड स्रोतों से एआई-सहायित" },
  limited_source_coverage: { en: "Limited source coverage", hi: "सीमित स्रोत उपलब्धता" },
  confidence: { en: "Confidence", hi: "विश्वास स्तर" },
  answer_mode: { en: "Answer mode", hi: "उत्तर मोड" },
  verify_important_details: { en: "Verify important details", hi: "महत्वपूर्ण विवरण सत्यापित करें" },
  citations: { en: "Citations", hi: "संदर्भ" },
  what_to_explore_next: { en: "What to explore next", hi: "आगे क्या देखें" },
  your_question: { en: "Your question", hi: "आपका प्रश्न" }
};

export function getLanguage() {
  const saved = window.localStorage.getItem(LANGUAGE_KEY) || window.localStorage.getItem(LEGACY_LANGUAGE_KEY);
  return saved === "hi" ? "hi" : DEFAULT_LANGUAGE;
}

export function setLanguage(lang) {
  const nextLanguage = lang === "hi" ? "hi" : DEFAULT_LANGUAGE;
  window.localStorage.setItem(LANGUAGE_KEY, nextLanguage);
  window.localStorage.setItem(LEGACY_LANGUAGE_KEY, nextLanguage);
  document.documentElement.lang = nextLanguage;
  updateLanguageDOM(nextLanguage);
  window.dispatchEvent(
    new CustomEvent("jainworld:language-change", {
      detail: { lang: nextLanguage }
    })
  );
}

export function initLanguageToggle() {
  document.querySelectorAll("[data-lang-toggle]").forEach((group) => {
    if (group.dataset.bound === "true") {
      syncLanguageButtons();
      return;
    }

    group.dataset.bound = "true";

    group.querySelectorAll("button[data-lang]").forEach((button) => {
      button.addEventListener("click", () => setLanguage(button.dataset.lang));
    });
  });

  syncLanguageButtons();
}

export function updateLanguageDOM(lang = getLanguage()) {
  document.documentElement.lang = lang;

  document.querySelectorAll("[data-hi][data-en]").forEach((node) => {
    const nextText = getSafeLocalizedValue(node.dataset[lang], node.dataset.en);
    if (typeof nextText === "string" && nextText.trim()) {
      node.textContent = nextText;
    }
  });

  document.querySelectorAll("[data-placeholder-hi][data-placeholder-en]").forEach((node) => {
    const nextPlaceholder = getSafeLocalizedValue(
      node.dataset[`placeholder${lang === "hi" ? "Hi" : "En"}`],
      node.dataset.placeholderEn
    );

    if (typeof nextPlaceholder === "string" && nextPlaceholder.trim()) {
      node.setAttribute("placeholder", nextPlaceholder);
    }
  });

  document.querySelectorAll("[data-title-hi][data-title-en]").forEach((node) => {
    const nextTitle = getSafeLocalizedValue(
      node.dataset[`title${lang === "hi" ? "Hi" : "En"}`],
      node.dataset.titleEn
    );

    if (typeof nextTitle === "string" && nextTitle.trim()) {
      node.setAttribute("title", nextTitle);
    }
  });

  document.querySelectorAll("[data-value-hi][data-value-en]").forEach((node) => {
    const nextValue = getSafeLocalizedValue(
      node.dataset[`value${lang === "hi" ? "Hi" : "En"}`],
      node.dataset.valueEn
    );

    if (typeof nextValue === "string" && nextValue.trim()) {
      node.setAttribute("value", nextValue);
    }
  });

  syncLanguageButtons();
}

export function pickLocalized(item, base, lang = getLanguage()) {
  if (!item || !base) {
    return "";
  }

  const preferredKeys = [`${base}_${lang}`, base, `${base}_${lang === "hi" ? "en" : "hi"}`];

  for (const key of preferredKeys) {
    const value = item[key];
    if (typeof value === "string" && isUsableLocalizedText(value)) {
      return value.trim();
    }
  }

  return "";
}

export function translate(key, fallback = "") {
  const entry = TRANSLATIONS[key];
  if (!entry) {
    return fallback || key;
  }

  const lang = getLanguage();
  return entry[lang] || entry.en || fallback || key;
}

function getSafeLocalizedValue(value, fallback = "") {
  if (typeof value === "string" && isUsableLocalizedText(value)) {
    return value.trim();
  }

  if (typeof fallback === "string" && fallback.trim()) {
    return fallback.trim();
  }

  return "";
}

function isUsableLocalizedText(value) {
  return typeof value === "string" && value.trim() && !MOJIBAKE_PATTERN.test(value);
}

function syncLanguageButtons() {
  const activeLanguage = getLanguage();

  document.querySelectorAll("[data-lang-toggle] button[data-lang]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.lang === activeLanguage);
    button.setAttribute("aria-pressed", String(button.dataset.lang === activeLanguage));
  });
}

window.JainWorldLanguage = {
  apply: () => updateLanguageDOM(getLanguage()),
  get: () => getLanguage(),
  set: (lang) => setLanguage(lang)
};
