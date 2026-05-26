const LANGUAGE_KEY = "lang";
const LEGACY_LANGUAGE_KEY = "jainworld-language";
const DEFAULT_LANGUAGE = "en";
const MOJIBAKE_PATTERN = /(?:\u00E0\u00A4|\u00E0\u00A5|\u00E2\u0080\u00A2|\u00C2\u00A9|\u00E2\u0080\u0094|\u00E2\u0080\u0093)/;

const TRANSLATIONS = {
  home: { en: "Home", hi: "होम" },
  learn: { en: "Learn", hi: "सीखें" },
  temples: { en: "Temples", hi: "मंदिर" },
  temple: { en: "Temple", hi: "मंदिर" },
  food: { en: "Food", hi: "भोजन" },
  calendar: { en: "Calendar", hi: "कैलेंडर" },
  resources: { en: "Resources", hi: "संसाधन" },
  audio: { en: "Audio", hi: "ऑडियो" },
  article: { en: "Article", hi: "लेख" },
  literature: { en: "Literature", hi: "साहित्य" },
  education: { en: "Education", hi: "शिक्षा" },
  course: { en: "Course", hi: "पाठ्यक्रम" },
  community: { en: "Community", hi: "समुदाय" },
  contact: { en: "Contact", hi: "संपर्क करें" },
  contribute: { en: "Contribute", hi: "योगदान दें" },
  privacy: { en: "Privacy", hi: "गोपनीयता" },
  terms: { en: "Terms", hi: "शर्तें" },
  ask: { en: "Ask", hi: "पूछें" },
  search: { en: "Search", hi: "खोजें" },
  ask_jainworld: { en: "Ask JainWorld", hi: "जैनवर्ल्ड से पूछें" },
  search_jainworld: { en: "Search JainWorld", hi: "जैनवर्ल्ड में खोजें" },
  start_learning: { en: "Start Learning", hi: "सीखना शुरू करें" },
  find_temples: { en: "Find Temples", hi: "मंदिर खोजें" },
  read_more: { en: "Read more", hi: "और पढ़ें" },
  view_details: { en: "View details", hi: "विवरण देखें" },
  view_result: { en: "View result", hi: "परिणाम देखें" },
  explore: { en: "Explore", hi: "देखें" },
  source: { en: "Source", hi: "स्रोत" },
  sources: { en: "Sources", hi: "स्रोत" },
  verified: { en: "Verified", hi: "सत्यापित" },
  curated: { en: "Curated", hi: "चयनित" },
  reviewed: { en: "Reviewed", hi: "समीक्षित" },
  reviewed_by_editorial: { en: "Reviewed by JainWorld Editorial", hi: "जैनवर्ल्ड संपादकीय द्वारा समीक्षा की गई" },
  last_updated: { en: "Last updated", hi: "अंतिम अपडेट" },
  related_content: { en: "Related content", hi: "संबंधित सामग्री" },
  faq: { en: "FAQ", hi: "सामान्य प्रश्न" },
  report_correction: { en: "Report correction", hi: "सुधार भेजें" },
  suggest_improvement: { en: "Suggest improvement", hi: "सुधार सुझाएँ" },
  contribute_information: { en: "Contribute information", hi: "जानकारी जोड़ें" },
  not_available_yet: { en: "Not available yet", hi: "अभी उपलब्ध नहीं" },
  search_results: { en: "Search results", hi: "खोज परिणाम" },
  popular_searches: { en: "Popular searches", hi: "लोकप्रिय खोजें" },
  suggested_questions: { en: "Suggested questions", hi: "सुझाए गए प्रश्न" },
  no_results_found: { en: "No results found", hi: "कोई परिणाम नहीं मिला" },
  try_another_search: { en: "Try another search", hi: "दूसरी खोज करें" },
  answer: { en: "Answer", hi: "उत्तर" },
  sources_used: { en: "Sources used", hi: "उपयोग किए गए स्रोत" },
  confidence: { en: "Confidence", hi: "विश्वास स्तर" },
  limited_source_coverage: { en: "Limited source coverage", hi: "सीमित स्रोत उपलब्धता" },
  source_based_answer: { en: "Source-based answer", hi: "स्रोत-आधारित उत्तर" },
  ai_assisted: { en: "AI-assisted from JainWorld sources", hi: "जैनवर्ल्ड स्रोतों से एआई-सहायित" },
  helpful: { en: "Helpful", hi: "उपयोगी" },
  not_helpful: { en: "Not helpful", hi: "उपयोगी नहीं" },
  needs_correction: { en: "Needs correction", hi: "सुधार चाहिए" },
  missing_source: { en: "Missing source", hi: "स्रोत अधूरा है" },
  festival: { en: "Festival", hi: "पर्व" },
  scripture: { en: "Scripture", hi: "शास्त्र" },
  scriptures: { en: "Scriptures", hi: "शास्त्र" },
  bhajan: { en: "Bhajan", hi: "भजन" },
  bhajans: { en: "Bhajans", hi: "भजन" },
  aarti: { en: "Aarti", hi: "आरती" },
  aartis: { en: "Aartis", hi: "आरती" },
  stavan: { en: "Stavan", hi: "स्तवन" },
  pravachan: { en: "Pravachan", hi: "प्रवचन" },
  meditation: { en: "Meditation", hi: "ध्यान" },
  children: { en: "Children", hi: "बच्चे" },
  parents: { en: "Parents", hi: "माता-पिता" },
  teachers: { en: "Teachers", hi: "शिक्षक" },
  family: { en: "Family", hi: "परिवार" },
  beginner: { en: "Beginner", hi: "प्रारंभिक" },
  intermediate: { en: "Intermediate", hi: "मध्यम" },
  advanced: { en: "Advanced", hi: "उन्नत" },
  overview: { en: "Overview", hi: "परिचय" },
  guide: { en: "Guide", hi: "मार्गदर्शिका" },
  learning_path: { en: "Learning path", hi: "सीखने का मार्ग" },
  daily_practice: { en: "Daily practice", hi: "दैनिक अभ्यास" },
  poems: { en: "Poems", hi: "कविताएँ" },
  stories: { en: "Stories", hi: "कथाएँ" },
  sutras: { en: "Sutras", hi: "सूत्र" },
  read_with_confidence: { en: "Read with confidence", hi: "श्रद्धा के साथ पढ़ें" },
  literature_intro: { en: "Scriptures, stories, sutras, poems, and devotional reading", hi: "शास्त्र, कथाएँ, सूत्र, कविताएँ और भक्ति पाठ" },
  literature_starting_point: { en: "Use these entries as a starting point for personal study, family learning, and deeper reflection.", hi: "व्यक्तिगत अध्ययन, पारिवारिक सीख और गहरे मनन के लिए इन पाठों से शुरुआत करें।" },
  agamas: { en: "Agamas", hi: "आगम" },
  tattvartha_sutra: { en: "Tattvartha Sutra", hi: "तत्त्वार्थ सूत्र" },
  samayasara: { en: "Samayasara", hi: "समयसार" },
  purana_stories: { en: "Purana stories", hi: "पुराण कथाएँ" },
  kids_stories: { en: "Kids stories", hi: "बच्चों की कथाएँ" },
  start_with_basics: { en: "Start with basics", hi: "मूल बातों से शुरू करें" },
  sacred_texts: { en: "Sacred texts", hi: "पवित्र ग्रंथ" },
  sutras_and_meanings: { en: "Sutras and meanings", hi: "सूत्र और अर्थ" },
  stories_and_values: { en: "Stories and values", hi: "कथाएँ और संस्कार" },
  for_children: { en: "For children", hi: "बच्चों के लिए" },
  advanced_study: { en: "Advanced study", hi: "उन्नत अध्ययन" },
  jain_calendar: { en: "Jain Calendar", hi: "जैन कैलेंडर" },
  festivals: { en: "Festivals", hi: "पर्व" },
  tithi: { en: "Tithi", hi: "तिथि" },
  fasting_days: { en: "Fasting Days", hi: "उपवास दिवस" },
  festival_learning: { en: "Festival Learning", hi: "पर्व ज्ञान" },
  today: { en: "Today", hi: "आज" },
  this_month: { en: "This Month", hi: "इस माह" },
  view_calendar: { en: "View Calendar", hi: "कैलेंडर देखें" },
  learn_more: { en: "Learn More", hi: "और जानें" },
  plan_your_day: { en: "Plan your day", hi: "दिन की योजना बनाएं" },
  temple_visit: { en: "Temple visit", hi: "मंदिर दर्शन" },
  prayer: { en: "Prayer", hi: "प्रार्थना" },
  fasting: { en: "Fasting", hi: "उपवास" },
  reflection: { en: "Reflection", hi: "मनन" },
  forgiveness: { en: "Forgiveness", hi: "क्षमा" },
  discipline: { en: "Discipline", hi: "अनुशासन" },
  paryushan: { en: "Paryushan", hi: "पर्युषण" },
  samvatsari: { en: "Samvatsari", hi: "संवत्सरी" },
  das_lakshan: { en: "Das Lakshan", hi: "दशलक्षण" },
  mahavir_jayanti: { en: "Mahavir Jayanti", hi: "महावीर जयंती" },
  ayambil_oli: { en: "Ayambil Oli", hi: "आयंबिल ओली" },
  kartik_purnima: { en: "Kartik Purnima", hi: "कार्तिक पूर्णिमा" },
  reading_time: { en: "Reading time", hi: "पढ़ने का समय" },
  before_you_visit: { en: "Before you visit", hi: "दर्शन से पहले" },
  respectful_visit_reminder: { en: "Respectful visit reminder", hi: "सम्मानपूर्वक दर्शन की याद" },
  listen_with_reflection: { en: "Listen with reflection", hi: "मनन के साथ सुनें" },
  learning_objectives: { en: "Learning objectives", hi: "सीखने के उद्देश्य" },
  practice_this_today: { en: "Practice this today", hi: "आज का अभ्यास" },
  source_details_reviewed: { en: "Source details are being reviewed", hi: "स्रोत विवरण की समीक्षा जारी है" },
  address: { en: "Address", hi: "पता" },
  timings: { en: "Timings", hi: "समय" },
  website: { en: "Website", hi: "वेबसाइट" },
  map: { en: "Map", hi: "मानचित्र" },
  dharamshala: { en: "Dharamshala", hi: "धर्मशाला" },
  bhojanshala: { en: "Bhojanshala", hi: "भोजनशाला" },
  parking: { en: "Parking", hi: "पार्किंग" },
  accessibility: { en: "Accessibility", hi: "सुविधा" },
  last_verified: { en: "Last verified", hi: "अंतिम सत्यापन" },
  duration: { en: "Duration", hi: "अवधि" },
  language: { en: "Language", hi: "भाषा" },
  singer: { en: "Singer", hi: "गायक" },
  speaker: { en: "Speaker", hi: "प्रवचनकर्ता" },
  permission_status: { en: "Permission status", hi: "अनुमति स्थिति" },
  meaning: { en: "Meaning", hi: "अर्थ" },
  related_audio: { en: "Related audio", hi: "संबंधित ऑडियो" },
  source_details_are_being_reviewed: { en: "Source details are being reviewed.", hi: "स्रोत विवरण की समीक्षा जारी है।" },
  verify_important_details: { en: "Verify important details", hi: "महत्वपूर्ण विवरण सत्यापित करें" },
  ask_topic_cta: { en: "Have a question about this topic? Ask JainWorld.", hi: "क्या इस विषय पर कोई प्रश्न है? जैनवर्ल्ड से पूछें।" },
  no_article_found: { en: "The requested article could not be found.", hi: "मांगा गया लेख नहीं मिला।" },
  no_audio_found: { en: "The requested audio entry could not be found.", hi: "मांगी गई ऑडियो प्रविष्टि नहीं मिली।" },
  no_temple_found: { en: "The requested temple could not be found.", hi: "मांगा गया मंदिर नहीं मिला।" },
  no_course_found: { en: "The requested lesson could not be found.", hi: "मांगा गया पाठ नहीं मिला।" },
  search_suggestion: { en: "Try JainWorld Search or open the related section below.", hi: "जैनवर्ल्ड खोज आज़माएँ या नीचे संबंधित अनुभाग खोलें।" }
};

const LABEL_KEY_MAP = Object.fromEntries(
  Object.entries(TRANSLATIONS).flatMap(([key, value]) => [
    [normalizeLabelKey(value.en), key],
    [normalizeLabelKey(value.hi), key]
  ])
);

export function getLanguage() {
  const saved = window.localStorage.getItem(LANGUAGE_KEY) || window.localStorage.getItem(LEGACY_LANGUAGE_KEY);
  return saved === "hi" ? "hi" : DEFAULT_LANGUAGE;
}

export function currentLanguage() {
  return getLanguage();
}

export function setLanguage(lang) {
  const nextLanguage = lang === "hi" ? "hi" : DEFAULT_LANGUAGE;
  window.localStorage.setItem(LANGUAGE_KEY, nextLanguage);
  window.localStorage.setItem(LEGACY_LANGUAGE_KEY, nextLanguage);
  document.documentElement.lang = nextLanguage;
  updateLanguageDOM(nextLanguage);
  window.dispatchEvent(new CustomEvent("jainworld:language-change", { detail: { lang: nextLanguage } }));
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
    const nextText = getSafeLocalizedValue(node.dataset[lang], node.dataset.en, lang);
    if (nextText) {
      node.textContent = nextText;
    }
  });

  document.querySelectorAll("[data-placeholder-hi][data-placeholder-en]").forEach((node) => {
    const nextPlaceholder = getSafeLocalizedValue(node.dataset[`placeholder${lang === "hi" ? "Hi" : "En"}`], node.dataset.placeholderEn, lang);
    if (nextPlaceholder) {
      node.setAttribute("placeholder", nextPlaceholder);
    }
  });

  document.querySelectorAll("[data-title-hi][data-title-en]").forEach((node) => {
    const nextTitle = getSafeLocalizedValue(node.dataset[`title${lang === "hi" ? "Hi" : "En"}`], node.dataset.titleEn, lang);
    if (nextTitle) {
      node.setAttribute("title", nextTitle);
    }
  });

  document.querySelectorAll("[data-value-hi][data-value-en]").forEach((node) => {
    const nextValue = getSafeLocalizedValue(node.dataset[`value${lang === "hi" ? "Hi" : "En"}`], node.dataset.valueEn, lang);
    if (nextValue) {
      node.setAttribute("value", nextValue);
    }
  });

  syncLanguageButtons();
}

export function pickLocalized(item, base, lang = getLanguage()) {
  if (!item || !base) {
    return "";
  }

  const keys = [
    `${base}_${lang}`,
    `${base}${lang === "hi" ? "Hi" : "En"}`,
    base,
    `${base}_${lang === "hi" ? "en" : "hi"}`,
    `${base}${lang === "hi" ? "En" : "Hi"}`
  ];

  for (const key of keys) {
    const value = item[key];
    if (isUsableLocalizedText(value)) {
      return value.trim();
    }
  }

  if (lang === "hi") {
    const fallback = item[`${base}_en`] || item[`${base}En`] || item[base];
    return translateLabel(fallback, fallback);
  }

  return item[`${base}_en`] || item[`${base}En`] || item[base] || "";
}

export function translate(key, fallback = "") {
  const entry = TRANSLATIONS[key];
  if (!entry) {
    return fallback || key;
  }

  const lang = getLanguage();
  return entry[lang] || entry.en || fallback || key;
}

export function translateLabel(label, fallback = "") {
  const normalized = normalizeLabelKey(label);
  const key = LABEL_KEY_MAP[normalized];
  if (!key) {
    return fallback || label || "";
  }
  return translate(key, fallback || label);
}

function normalizeLabelKey(label) {
  return String(label || "")
    .trim()
    .toLowerCase()
    .replace(/\s*\/\s*/g, " / ")
    .replace(/\s+/g, " ");
}

function getSafeLocalizedValue(value, fallback = "", lang = getLanguage()) {
  if (isUsableLocalizedText(value)) {
    return value.trim();
  }

  if (lang === "hi" && typeof fallback === "string" && fallback.trim()) {
    return translateLabel(fallback, fallback).trim();
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
    const isActive = button.dataset.lang === activeLanguage;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

window.JainWorldLanguage = {
  apply: () => updateLanguageDOM(getLanguage()),
  get: () => getLanguage(),
  set: (lang) => setLanguage(lang)
};
