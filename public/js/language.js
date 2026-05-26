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
  no_results_found: { en: "No results found", hi: "कोई परिणाम नहीं मिला" },
  try_another_search: { en: "Try another search", hi: "दूसरी खोज करें" },
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
  curated: { en: "Curated", hi: "चयनित" },
  external_source: { en: "External source", hi: "बाहरी स्रोत" },
  ai_assisted: { en: "AI-assisted from JainWorld sources", hi: "जैनवर्ल्ड स्रोतों से एआई-सहायित" },
  limited_source_coverage: { en: "Limited source coverage", hi: "सीमित स्रोत उपलब्धता" },
  confidence: { en: "Confidence", hi: "विश्वास स्तर" },
  answer_mode: { en: "Answer mode", hi: "उत्तर मोड" },
  verify_important_details: { en: "Verify important details", hi: "महत्वपूर्ण विवरण सत्यापित करें" },
  citations: { en: "Citations", hi: "संदर्भ" },
  what_to_explore_next: { en: "What to explore next", hi: "आगे क्या देखें" },
  your_question: { en: "Your question", hi: "आपका प्रश्न" },
  read_with_confidence: { en: "Read with confidence", hi: "श्रद्धा के साथ पढ़ें" },
  literature_intro: {
    en: "Scriptures, stories, sutras, poems, and devotional reading",
    hi: "शास्त्र, कथाएँ, सूत्र, कविताएँ और भक्ति पाठ"
  },
  literature_starting_point: {
    en: "Use these entries as a starting point for personal study, family learning, and deeper reflection.",
    hi: "व्यक्तिगत अध्ययन, पारिवारिक सीख और गहरे मनन के लिए इन पाठों से शुरुआत करें।"
  },
  beginner: { en: "Beginner", hi: "प्रारंभिक" },
  intermediate: { en: "Intermediate", hi: "मध्यम" },
  advanced: { en: "Advanced", hi: "उन्नत" },
  overview: { en: "Overview", hi: "परिचय" },
  reviewed_by_editorial: { en: "Reviewed by JainWorld Editorial", hi: "जैनवर्ल्ड संपादकीय द्वारा समीक्षा की गई" },
  philosophy: { en: "Philosophy", hi: "दर्शन" },
  scripture: { en: "Scripture", hi: "शास्त्र" },
  classical_text: { en: "Classical Text", hi: "पारंपरिक ग्रंथ" },
  sutra: { en: "Sutra", hi: "सूत्र" },
  devotional: { en: "Devotional", hi: "भक्ति" },
  story: { en: "Story", hi: "कथा" },
  kids: { en: "Kids", hi: "बच्चे" },
  children: { en: "Children", hi: "बच्चे" },
  parents: { en: "Parents", hi: "माता-पिता" },
  teachers: { en: "Teachers", hi: "शिक्षक" },
  poems: { en: "Poems", hi: "कविताएँ" },
  bhajans: { en: "Bhajans", hi: "भजन" },
  aartis: { en: "Aartis", hi: "आरती" },
  agamas: { en: "Agamas", hi: "आगम" },
  tattvartha_sutra: { en: "Tattvartha Sutra", hi: "तत्त्वार्थ सूत्र" },
  samayasara: { en: "Samayasara", hi: "समयसार" },
  purana_stories: { en: "Purana stories", hi: "पुराण कथाएँ" },
  kids_stories: { en: "Kids stories", hi: "बच्चों की कथाएँ" },
  daily_practice: { en: "Daily practice", hi: "दैनिक अभ्यास" },
  start_with_basics: { en: "Start with basics", hi: "मूल बातों से शुरू करें" },
  sacred_texts: { en: "Sacred texts", hi: "पवित्र ग्रंथ" },
  sutras_and_meanings: { en: "Sutras and meanings", hi: "सूत्र और अर्थ" },
  stories_and_values: { en: "Stories and values", hi: "कथाएँ और संस्कार" },
  for_children: { en: "For children", hi: "बच्चों के लिए" },
  advanced_study: { en: "Advanced study", hi: "उन्नत अध्ययन" },
  read_more: { en: "Read more", hi: "और पढ़ें" },
  view_details: { en: "View details", hi: "विवरण देखें" },
  explore: { en: "Explore", hi: "देखें" },
  source: { en: "Source", hi: "स्रोत" },
  related_content: { en: "Related content", hi: "संबंधित सामग्री" },
  faq: { en: "FAQ", hi: "सामान्य प्रश्न" },
  news_empty_title: { en: "No news items are available right now", hi: "अभी कोई समाचार उपलब्ध नहीं है" },
  news_empty_body: { en: "Curated Jain updates will appear here after review. Please check back soon.", hi: "समीक्षा के बाद जैन समुदाय से जुड़ी खबरें यहाँ दिखाई देंगी। कृपया बाद में फिर देखें।" },
  curated_by_jainworld: { en: "Curated by JainWorld", hi: "जैनवर्ल्ड द्वारा चयनित" },
  audio_empty_title: { en: "No audio entries are available yet", hi: "अभी कोई ऑडियो प्रविष्टि उपलब्ध नहीं है" },
  audio_empty_body: { en: "Audio entries will appear here once they are reviewed and approved for listing.", hi: "समीक्षा और स्वीकृति के बाद ऑडियो प्रविष्टियाँ यहाँ दिखाई देंगी।" },
  temples_empty_title: { en: "No temples found", hi: "कोई मंदिर नहीं मिला" },
  temples_empty_body: { en: "Try changing the country, state, city, temple type, or search terms.", hi: "देश, राज्य, शहर, मंदिर प्रकार या खोज शब्द बदलकर देखें।" },
  spiritual_label: { en: "Spiritual", hi: "आध्यात्मिक" },
  practical_label: { en: "Practical", hi: "व्यावहारिक" },
  alternative_label: { en: "Alternative", hi: "विकल्प" },
  resources_empty_title: { en: "No matching resources found", hi: "मेल खाते संसाधन नहीं मिले" },
  resources_empty_body: { en: "Try a different category, state, or search term.", hi: "कोई दूसरी श्रेणी, राज्य या खोज शब्द आज़माएँ।" },
  suggest_resource_or_correction: { en: "Suggest a resource or correction", hi: "संसाधन या सुधार सुझाएँ" },
  official_link_external: { en: "Official link (external)", hi: "आधिकारिक लिंक (बाहरी)" },
  official_link_pending: { en: "Official link will be added after verification.", hi: "सत्यापन के बाद आधिकारिक लिंक जोड़ा जाएगा।" },
  suggest_correction: { en: "Suggest correction", hi: "सुधार सुझाएँ" },
  search_no_results: { en: "No results found", hi: "कोई परिणाम नहीं मिला" },
  results_label: { en: "result(s)", hi: "परिणाम" },
  open_result_more_detail: { en: "Open the result to view more detail.", hi: "अधिक जानकारी के लिए परिणाम खोलें।" },
  general: { en: "General", hi: "सामान्य" },
  scholarship: { en: "Scholarship", hi: "छात्रवृत्ति" },
  biography: { en: "Biography", hi: "जीवन परिचय" },
  stories: { en: "Stories", hi: "कथाएँ" },
  moral_story: { en: "Moral Story", hi: "संस्कार कथा" },
  tirthankara: { en: "Tirthankara", hi: "तीर्थंकर" },
  namokar_mantra: { en: "Namokar Mantra", hi: "नमोकार मंत्र" },
  kids_audio: { en: "Kids Audio", hi: "बच्चों का ऑडियो" },
  pravachan: { en: "Pravachan", hi: "प्रवचन" },
  aarti: { en: "Aarti", hi: "आरती" },
  bhaktamar: { en: "Bhaktamar", hi: "भक्तामर" },
  documents_how_to_guide: { en: "Documents / How-to Guide", hi: "दस्तावेज़ / मार्गदर्शिका" }
};

const LABEL_KEY_MAP = {
  "read with confidence": "read_with_confidence",
  "scriptures, stories, sutras, poems, and devotional reading": "literature_intro",
  "use these entries as a starting point for personal study, family learning, and deeper reflection.": "literature_starting_point",
  beginner: "beginner",
  intermediate: "intermediate",
  advanced: "advanced",
  overview: "overview",
  "reviewed by jainworld editorial": "reviewed_by_editorial",
  philosophy: "philosophy",
  scripture: "scripture",
  "classical text": "classical_text",
  sutra: "sutra",
  devotional: "devotional",
  story: "story",
  kids: "kids",
  children: "children",
  parents: "parents",
  teachers: "teachers",
  poems: "poems",
  bhajans: "bhajans",
  aartis: "aartis",
  agamas: "agamas",
  "tattvartha sutra": "tattvartha_sutra",
  samayasara: "samayasara",
  "purana stories": "purana_stories",
  "kids stories": "kids_stories",
  "daily practice": "daily_practice",
  "start with basics": "start_with_basics",
  "sacred texts": "sacred_texts",
  "sutras and meanings": "sutras_and_meanings",
  "stories and values": "stories_and_values",
  "for children": "for_children",
  "advanced study": "advanced_study",
  "read more": "read_more",
  "view details": "view_details",
  explore: "explore",
  search: "search",
  source: "source",
  verified: "verified",
  curated: "curated",
  "related content": "related_content",
  faq: "faq",
  "no results found": "no_results_found",
  "try another search": "try_another_search",
  general: "general",
  scholarship: "scholarship",
  biography: "biography",
  stories: "stories",
  "moral story": "moral_story",
  tirthankara: "tirthankara",
  "namokar mantra": "namokar_mantra",
  "kids audio": "kids_audio",
  pravachan: "pravachan",
  aarti: "aarti",
  bhaktamar: "bhaktamar",
  "documents / how-to guide": "documents_how_to_guide"
};

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

  const preferredKeys = [
    `${base}_${lang}`,
    `${base}${lang === "hi" ? "Hi" : "En"}`,
    base,
    `${base}_${lang === "hi" ? "en" : "hi"}`,
    `${base}${lang === "hi" ? "En" : "Hi"}`
  ];

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
