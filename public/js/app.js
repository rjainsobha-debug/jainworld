import {
  getAudioItems,
  getBlogs,
  getCalendar,
  getCourse,
  getCourses,
  getFood,
  getLiterature,
  getNews,
  getResources,
  getTemples
} from "./api.js";
import { initCalendarPage } from "./calendar.js";
import { initCommunityForm } from "./community.js";
import { getLanguage, initLanguageToggle, translate, translateLabel, updateLanguageDOM } from "./language.js";
import {
  formatDate,
  renderAudio,
  renderAudioDetail,
  renderArticleDetail,
  renderBlogs,
  renderCards,
  renderCourseDetail,
  renderCourses,
  renderFoodRules,
  renderNews,
  renderResources,
  renderStaticInfoCards,
  renderTempleDetail,
  renderTemples
} from "./render.js";
import {
  COMMUNITY_BENEFITS,
  createFooter,
  createSearchOverlay,
  CULTURE_MODULES,
  DAILY_JAIN_ITEMS,
  EDUCATION_LEVELS,
  FEATURED_PILGRIMAGES,
  FOOD_RESTRICTIONS,
  LEARNING_PATHS,
  POPULAR_TOPICS,
  QUICK_CATEGORIES,
  START_HERE_ITEMS
} from "./templates.js";
import { initGlobalSearch } from "./search.js";

const HOME_DISCOVERY_ITEMS = [
  {
    titleEn: "Explore the JainWorld directory",
    titleHi: "JainWorld निर्देशिका देखें",
    summaryEn: "Browse Jain Dharma, literature, temples, names, devotional audio, and community resources in one place.",
    summaryHi: "जैन धर्म, साहित्य, मंदिर, नाम, भक्ति ऑडियो और सामुदायिक संसाधन एक ही स्थान पर देखें।",
    href: "/directory.html"
  },
  {
    titleEn: "Ask from JainWorld's verified sources",
    titleHi: "जैनवर्ल्ड के सत्यापित स्रोतों से पूछें",
    summaryEn: "Use Ask JainWorld carefully for source-based answers across learning, temples, food, festivals, and support topics.",
    summaryHi: "सीख, मंदिर, भोजन, पर्व और सहायक विषयों पर स्रोत-आधारित उत्तरों के लिए Ask JainWorld का सावधानी से उपयोग करें।",
    href: "/ask.html"
  },
  {
    titleEn: "Jain audio and reflection",
    titleHi: "जैन ऑडियो और मनन",
    summaryEn: "Listen to Namokar Mantra, bhajan, aarti, stavan, pravachan, and reflective audio.",
    summaryHi: "नमोकार मंत्र, भजन, आरती, स्तवन, प्रवचन और मनन के लिए ऑडियो सुनें।",
    href: "/audio.html"
  },
  {
    titleEn: "Temple and tirth guidance",
    titleHi: "मंदिर और तीर्थ मार्गदर्शन",
    summaryEn: "Search for temples, tirth destinations, dharamshala, bhojanshala, and planning support.",
    summaryHi: "मंदिर, तीर्थ स्थल, धर्मशाला, भोजनशाला और यात्रा योजना की जानकारी खोजें।",
    href: "/temples.html"
  },
  {
    titleEn: "Resources and community support",
    titleHi: "संसाधन और सामुदायिक सहयोग",
    summaryEn: "Explore scholarships, institutions, minority resources, and practical community guidance.",
    summaryHi: "छात्रवृत्ति, संस्थान, अल्पसंख्यक संसाधन और सामुदायिक मार्गदर्शन देखें।",
    href: "/resources.html"
  }
];

const SEARCH_CHIPS = [
  { en: "Paryushan", hi: "पर्युषण" },
  { en: "Navkar Mantra", hi: "णमोकार मंत्र" },
  { en: "Jain food rules", hi: "जैन भोजन नियम" },
  { en: "Ahimsa", hi: "अहिंसा" },
  { en: "Samayik", hi: "समायिक" },
  { en: "Temples near me", hi: "मेरे पास के मंदिर" },
  { en: "Scholarships", hi: "छात्रवृत्ति" }
];

const PRACTICE_DHARMA_ITEMS = [
  { en: "Ahimsa", hi: "अहिंसा", summaryEn: "Begin with awareness in thought, word, and action.", summaryHi: "विचार, वचन और कर्म में सजगता से शुरुआत करें।", href: "/search.html?q=Ahimsa" },
  { en: "Samayik", hi: "समायिक", summaryEn: "Pause, reflect, and return to inner steadiness.", summaryHi: "रुकें, मनन करें और भीतर की स्थिरता में लौटें।", href: "/search.html?q=Samayik" },
  { en: "Pratikraman", hi: "प्रतिक्रमण", summaryEn: "Learn repentance, reflection, and renewal with humility.", summaryHi: "विनम्रता के साथ आत्मचिंतन, क्षमा और सुधार को समझें।", href: "/search.html?q=Pratikraman" },
  { en: "Fasting", hi: "उपवास", summaryEn: "Explore restraint, self-control, and festival observance.", summaryHi: "संयम, आत्मनियंत्रण और पर्व-अनुष्ठान को समझें।", href: "/food.html" },
  { en: "Jain Food Discipline", hi: "जैन भोजन अनुशासन", summaryEn: "See how food choices connect with Ahimsa and restraint.", summaryHi: "देखें कि भोजन के चुनाव अहिंसा और संयम से कैसे जुड़े हैं।", href: "/food.html" },
  { en: "Seva & Compassion", hi: "सेवा और करुणा", summaryEn: "Bring learning into everyday kindness and support.", summaryHi: "सीख को दया, करुणा और सहायता में बदलें।", href: "/community.html" }
];

const FAMILY_LEARNING_ITEMS = [
  { en: "Children's Jain Learning", hi: "बच्चों की जैन सीख", summaryEn: "Gentle Jain values, stories, and first prayers for children.", summaryHi: "बच्चों के लिए सरल जैन मूल्य, कहानियाँ और प्रारंभिक प्रार्थना।", href: "/education.html" },
  { en: "Parents & Teachers", hi: "माता-पिता और शिक्षक", summaryEn: "Support young learners with calm, practical guidance.", summaryHi: "बच्चों की सीख में शांत और व्यावहारिक मार्गदर्शन दें।", href: "/blogs.html" },
  { en: "Stories and Values", hi: "कहानियाँ और मूल्य", summaryEn: "Use stories to explain compassion, truth, and restraint.", summaryHi: "करुणा, सत्य और संयम को कहानियों के माध्यम से समझाएँ।", href: "/literature.html" },
  { en: "Festival Learning", hi: "पर्व सीख", summaryEn: "Understand why families observe important Jain festivals.", summaryHi: "समझें कि परिवार महत्वपूर्ण जैन पर्व क्यों मनाते हैं।", href: "/calendar.html" },
  { en: "Jain Food for Kids", hi: "बच्चों के लिए जैन भोजन", summaryEn: "Family-friendly ways to explain Jain food discipline.", summaryHi: "जैन भोजन अनुशासन को बच्चों को समझाने के सरल तरीके।", href: "/food.html" },
  { en: "Beginner Path", hi: "शुरुआती मार्ग", summaryEn: "A steady starting point for families new to Jain learning.", summaryHi: "जैन सीख में नए परिवारों के लिए सरल शुरुआत।", href: "/education.html" }
];

const LISTEN_REFLECT_ITEMS = [
  { en: "Namokar Mantra", hi: "नमोकार मंत्र", summaryEn: "Begin with the most familiar prayerful starting point.", summaryHi: "सबसे परिचित प्रार्थनामय आरंभ से दिन की शुरुआत करें।", href: "/audio.html?search=Namokar%20Mantra" },
  { en: "Bhajan", hi: "भजन", summaryEn: "Listen with devotion and family warmth.", summaryHi: "भक्ति और पारिवारिक आत्मीयता के साथ सुनें।", href: "/audio.html?category=Bhajan" },
  { en: "Aarti", hi: "आरती", summaryEn: "Explore familiar devotional listening moments.", summaryHi: "परिचित भक्तिमय श्रवण के क्षणों से जुड़ें।", href: "/audio.html?category=Aarti" },
  { en: "Stavan", hi: "स्तवन", summaryEn: "Reflect through praise, reverence, and calm repetition.", summaryHi: "स्तुति, आदर और शांत दोहराव के माध्यम से मनन करें।", href: "/audio.html?category=Stavan" },
  { en: "Pravachan", hi: "प्रवचन", summaryEn: "Listen to learning-oriented reflections and guidance.", summaryHi: "सीख और चिंतन से जुड़े प्रवचनों को सुनें।", href: "/audio.html?category=Pravachan" },
  { en: "Meditation", hi: "ध्यान", summaryEn: "Choose quieter listening for inner steadiness.", summaryHi: "भीतर की शांति के लिए शांत श्रवण चुनें।", href: "/audio.html?category=Meditation" }
];

const TEMPLES_TIRTH_ITEMS = [
  { en: "Find Temples", hi: "मंदिर खोजें", summaryEn: "Search for nearby temples and trusted listing details.", summaryHi: "निकट के मंदिर और विश्वसनीय सूची विवरण खोजें।", href: "/temples.html" },
  { en: "Plan a Tirth Yatra", hi: "तीर्थ यात्रा की योजना बनाएँ", summaryEn: "Use temple and calendar information to plan carefully.", summaryHi: "मंदिर और कैलेंडर जानकारी के साथ यात्रा की योजना बनाएँ।", href: "/search.html?q=Pilgrimage%20planning" },
  { en: "Dharamshala / Bhojanshala", hi: "धर्मशाला / भोजनशाला", summaryEn: "Look for stay and meal support before travelling.", summaryHi: "यात्रा से पहले ठहरने और भोजन सहायता की जानकारी देखें।", href: "/search.html?q=Dharamshala%20Bhojanshala" },
  { en: "Report Temple Correction", hi: "मंदिर सुधार भेजें", summaryEn: "Help keep addresses, timings, and facilities accurate.", summaryHi: "पते, समय और सुविधाओं की जानकारी सही रखने में मदद करें।", href: "/corrections.html" }
];

document.addEventListener("DOMContentLoaded", async () => {
  console.log("App loaded");
  console.log("Page loaded:", document.body.dataset.page || "home");
  ensureMainContentTarget();
  ensureFavicon();
  injectShell();
  initLanguageToggle();
  initGlobalSearch();
  setFooterYear();
  await loadPage(document.body.dataset.page || "home");
  updateLanguageDOM(getLanguage());
});

window.addEventListener("jainworld:language-change", async (event) => {
  await loadPage(document.body.dataset.page || "home");
  updateLanguageDOM(event.detail?.lang || getLanguage());
});

async function loadPage(page) {
  switch (page) {
    case "home":
      await loadHomePage();
      break;
    case "literature":
      await loadLiteraturePage();
      break;
    case "audio":
      await loadAudioPage();
      break;
    case "education":
      await loadEducationPage();
      break;
    case "temples":
      await loadTemplesPage();
      break;
    case "culture":
      await loadCulturePage();
      break;
    case "food":
      await loadFoodPage();
      break;
    case "news":
      await loadNewsPage();
      break;
    case "blogs":
      await loadBlogsPage();
      break;
    case "community":
      loadCommunityPage();
      break;
    case "calendar":
      await initCalendarPage();
      break;
    case "resources":
      await loadResourcesPage();
      break;
    case "article":
      await loadArticlePage();
      break;
    case "audio-detail":
      await loadAudioDetailPage();
      break;
    case "temple-detail":
      await loadTempleDetailPage();
      break;
    case "course-detail":
      await loadCourseDetailPage();
      break;
    default:
      break;
  }
}

function ensureMainContentTarget() {
  const main = document.querySelector("main");
  if (main && !main.id) {
    main.id = "main-content";
    main.setAttribute("tabindex", "-1");
  }
}

function ensureFavicon() {
  if (document.querySelector('link[rel="icon"]')) {
    return;
  }

  const link = document.createElement("link");
  link.rel = "icon";
  link.href = "/favicon.svg";
  link.type = "image/svg+xml";
  document.head.appendChild(link);
}

function injectShell() {
  const headerRoot = document.getElementById("app-header");
  const footerRoot = document.getElementById("app-footer");
  const overlayRoot = document.getElementById("app-overlay");

  if (headerRoot && !headerRoot.dataset.injected) {
    headerRoot.innerHTML = "";
  }

  if (footerRoot) {
    footerRoot.innerHTML = createFooter();
  }

  if (overlayRoot) {
    overlayRoot.innerHTML = createSearchOverlay();
  }
}

function setFooterYear() {
  const yearNode = document.getElementById("footer-year");
  if (yearNode) {
    yearNode.textContent = String(new Date().getFullYear());
  }
}

async function loadHomePage() {
  renderQuickCategories();
  renderStartHere();
  renderSearchChips();
  renderDailyJain();
  renderPracticeDharma();
  renderFamilyLearning();
  renderEducationLevels();
  renderPilgrimages();
  renderTemplesTirth();
  renderHomeDiscovery();
  renderLearningPaths();
  renderListenReflect();
  renderPopularTopics();
  renderFoodRules("#food-guide-rules", FOOD_RESTRICTIONS.slice(0, 4));
  setLoadingState("#featured-literature");
  setLoadingState("#education-course-grid");
  setLoadingState("#temple-finder-results");
  setLoadingState("#food-guide-list");
  setLoadingState("#news-column");
  setLoadingState("#blogs-column");
  setLoadingState("#resources-preview");
  setLoadingState("#calendar-preview");

  const [literature, courses, temples, food, news, blogs, resources, calendar] = await Promise.all([
    getLiterature({ limit: 4 }),
    getCourses({ limit: 4 }),
    getTemples({ limit: 4 }),
    getFood({ limit: 4 }),
    getNews({ limit: 4 }),
    getBlogs({ limit: 5 }),
    getResources({ limit: 4 }),
    getCalendar({ limit: 4 })
  ]);

  renderSimpleLiterature(literature);
  renderCourses("#education-course-grid", courses);
  renderTemples("#temple-finder-results", temples);
  renderFoodHighlights(food);
  renderNews("#news-column", news);
  renderBlogs("#blogs-column", blogs);
  renderResources("#resources-preview", resources);
  renderCalendarPreview(calendar);
  renderCommunityCta();
}

async function loadLiteraturePage() {
  renderCategoryPills("#literature-pillars", [
    "Agamas",
    "Tattvartha Sutra",
    "Samayasara",
    "Purana stories",
    "Kids stories",
    "Bhajans",
    "Aartis",
    "Poems"
  ]);

  setLoadingState("#literature-list");
  const items = await getLiterature({ limit: 24 });
  renderSimpleLiterature(items, "#literature-list");
}

async function loadAudioPage() {
  setLoadingState("#audio-list");
  const items = await getAudioItems({ limit: 50 });
  setupAudioFilters(items);
  renderAudio("#audio-list", items);
}

async function loadEducationPage() {
  renderEducationLevels("#education-level-cards");
  setLoadingState("#education-course-list");
  const items = await getCourses({ limit: 24 });
  renderCourses("#education-course-list", items);
}

async function loadTemplesPage() {
  setLoadingState("#temples-list");
  const items = await getTemples({ limit: 500 });
  setupTempleFilters(items);
  renderTemples("#temples-list", items);
}

async function loadCulturePage() {
  renderStaticInfoCards("#culture-modules", CULTURE_MODULES);
  const festivals = await getCalendar({ limit: 6 });
  const cards = festivals.map((item) => ({
    title_en: item.title,
    title_hi: item.title_hi || item.title,
    summary_en: item.summary,
    summary_hi: item.summary_hi || item.summary
  }));
  renderStaticInfoCards("#culture-festivals", cards);
}

async function loadFoodPage() {
  renderFoodRules("#food-rules", FOOD_RESTRICTIONS);
  setLoadingState("#food-recipes");
  const items = await getFood({ limit: 24 });
  renderSimpleFood(items);
}

async function loadNewsPage() {
  setLoadingState("#news-feed");
  const items = await getNews({ limit: 50 });
  setupNewsFilters(items);
  renderNews("#news-feed", items);
}

async function loadBlogsPage() {
  setLoadingState("#blogs-list");
  const items = await getBlogs({ limit: 24 });
  renderBlogs("#blogs-list", items);
}

function loadCommunityPage() {
  renderStaticInfoCards("#community-benefits", COMMUNITY_BENEFITS);
  initCommunityForm();
}

async function loadResourcesPage() {
  setLoadingState("#resources-list");
  const items = await getResources({ limit: 100 });
  setupResourcesFilters(items);
  renderResources("#resources-list", items);
}

async function loadArticlePage() {
  const params = new URLSearchParams(window.location.search);
  const type = params.get("type") || "";
  const slug = params.get("slug") || "";

  let item = null;
  let resolvedType = type || "blogs";

  if (!slug) {
    renderArticleDetail("#article-detail", null, resolvedType);
    return;
  }

  if (!type || type === "blogs") {
    const blogs = await getBlogs({ limit: 100 });
    item = blogs.find((entry) => entry.slug === slug || entry.id === slug) || null;
    resolvedType = "blogs";
  } else if (type === "literature") {
    const literature = await getLiterature({ limit: 100 });
    item = literature.find((entry) => entry.slug === slug || entry.id === slug) || null;
  } else if (type === "food") {
    const food = await getFood({ limit: 100 });
    item = food.find((entry) => entry.slug === slug || entry.id === slug) || null;
  }

  if (!item && !type) {
    const literature = await getLiterature({ limit: 100 });
    item = literature.find((entry) => entry.slug === slug || entry.id === slug) || null;
    if (item) {
      resolvedType = "literature";
    }
  }

  if (!item && !type) {
    const food = await getFood({ limit: 100 });
    item = food.find((entry) => entry.slug === slug || entry.id === slug) || null;
    if (item) {
      resolvedType = "food";
    }
  }

  renderArticleDetail("#article-detail", item, item ? resolvedType : "blogs");
}

async function loadTempleDetailPage() {
  const slug = new URLSearchParams(window.location.search).get("slug") || "";
  if (!slug) {
    renderTempleDetail("#temple-detail", null);
    return;
  }

  const items = await getTemples({ limit: 500 });
  const item = items.find((entry) => entry.slug === slug || entry.id === slug) || null;
  renderTempleDetail("#temple-detail", item);
}

async function loadAudioDetailPage() {
  const slug = new URLSearchParams(window.location.search).get("slug") || "";
  if (!slug) {
    renderAudioDetail("#audio-detail", null);
    return;
  }

  const items = await getAudioItems({ limit: 500 });
  const item = items.find((entry) => entry.slug === slug || entry.id === slug) || null;
  renderAudioDetail("#audio-detail", item);
}

async function loadCourseDetailPage() {
  const slug = new URLSearchParams(window.location.search).get("slug") || "";
  const item = await getCourse(slug);
  renderCourseDetail("#course-detail", item);
}

function renderQuickCategories() {
  const root = document.getElementById("quick-categories");
  if (!root) {
    return;
  }

  root.innerHTML = `
    <div class="content-grid" data-columns="3">
      ${QUICK_CATEGORIES.map(
        (item) => `
          <a href="${item.href}" class="quick-action-card">
            <span class="card-icon" aria-hidden="true">${getCardIcon(item.titleEn)}</span>
            <h3 class="cat-name m-0 mt-4 text-lg font-semibold text-stone-900" data-en="${item.titleEn}" data-hi="${item.titleHi}">${item.titleEn}</h3>
            <p class="cat-count m-0 mt-3 text-sm leading-7 text-stone-600" data-en="${item.summaryEn}" data-hi="${item.summaryHi}">${item.summaryEn}</p>
          </a>
        `
      ).join("")}
    </div>
  `;
}

function renderStartHere() {
  const root = document.getElementById("start-here-grid");
  if (!root) {
    return;
  }

  root.innerHTML = `
    <div class="content-grid" data-columns="3">
      ${START_HERE_ITEMS.map(
        (item) => `
          <a href="${item.href}" class="journey-card">
            <span class="card-icon" aria-hidden="true">${getCardIcon(item.titleEn)}</span>
            <h3 class="m-0 mt-4 text-lg font-semibold text-stone-900" data-en="${item.titleEn}" data-hi="${item.titleHi}">${item.titleEn}</h3>
            <p class="m-0 mt-3 text-sm leading-7 text-stone-600" data-en="${item.summaryEn}" data-hi="${item.summaryHi}">${item.summaryEn}</p>
          </a>
        `
      ).join("")}
    </div>
  `;
}

function renderSearchChips() {
  const root = document.getElementById("search-chip-list");
  if (!root) {
    return;
  }

  root.innerHTML = SEARCH_CHIPS.map(
    (item) =>
      `<a href="/search.html?q=${encodeURIComponent(item.en)}" class="topic-chip" data-en="${item.en}" data-hi="${item.hi}">${item.en}</a>`
  ).join("");
}

function renderDailyJain() {
  const root = document.getElementById("daily-jain-grid");
  if (!root) {
    return;
  }

  root.innerHTML = `
    <div class="content-grid" data-columns="4">
      <a href="/audio.html?search=Namokar%20Mantra" class="mantra-card">
        <span class="section-kicker" data-en="Prayer" data-hi="प्रार्थना">Prayer</span>
        <h3 data-en="Namokar Mantra" data-hi="नमोकार मंत्र">Namokar Mantra</h3>
        <p data-en="Begin with the title and listening path for a simple daily devotional start." data-hi="एक सरल दैनिक भक्तिमय शुरुआत के लिए शीर्षक और श्रवण मार्ग से आरंभ करें।">Begin with the title and listening path for a simple daily devotional start.</p>
      </a>
      ${DAILY_JAIN_ITEMS.map(
        (item) => `
          <article class="${item.titleEn === "Festival highlight" ? "festival-highlight-card" : "daily-dharma-card"}">
            <span class="card-icon" aria-hidden="true">${getCardIcon(item.titleEn)}</span>
            <p class="mt-4 mb-0 text-xs uppercase tracking-[0.16em] text-stone-500" data-en="${item.metaEn}" data-hi="${item.metaHi}">${item.metaEn}</p>
            <h3 class="mt-3 text-xl font-semibold text-stone-900" data-en="${item.titleEn}" data-hi="${item.titleHi}">${item.titleEn}</h3>
            <p data-en="${item.summaryEn}" data-hi="${item.summaryHi}">${item.summaryEn}</p>
          </article>
        `
      ).join("")}
    </div>
  `;
}

function renderPracticeDharma() {
  renderDevotionalCards("#practice-dharma-grid", PRACTICE_DHARMA_ITEMS, "practice-card");
}

function renderFamilyLearning() {
  renderDevotionalCards("#family-learning-grid", FAMILY_LEARNING_ITEMS, "family-learning-card");
}

function renderListenReflect() {
  renderDevotionalCards("#listen-reflect-grid", LISTEN_REFLECT_ITEMS, "audio-devotion-card");
}

function renderTemplesTirth() {
  renderDevotionalCards("#temples-tirth-grid", TEMPLES_TIRTH_ITEMS, "tirth-card");
}

function renderEducationLevels(targetSelector = "#education-levels") {
  const root = document.querySelector(targetSelector);
  if (!root) {
    return;
  }

  root.innerHTML = `
    <div class="jw-grid-4">
      ${EDUCATION_LEVELS.map(
        (level) => `
          <article class="feature-card">
            <span class="jw-badge" data-en="${level.level}" data-hi="${level.levelHi || level.level}">${level.level}</span>
            <h3 class="mt-3 text-lg font-semibold text-stone-900" data-en="${level.level}" data-hi="${level.levelHi || level.level}">${level.level}</h3>
            <p class="m-0 mt-2 text-sm leading-7 text-stone-600" data-en="${level.titleEn}" data-hi="${level.titleHi}">${level.titleEn}</p>
            <p class="m-0 mt-3 text-xs uppercase tracking-[0.16em] text-stone-500" data-en="${level.topicsEn}" data-hi="${level.topicsHi}">${level.topicsEn}</p>
          </article>
        `
      ).join("")}
    </div>
  `;
}

function renderPilgrimages() {
  const root = document.getElementById("featured-pilgrimages");
  if (!root) {
    return;
  }

  root.innerHTML = `
    <div class="soft-card p-5">
      <div class="jw-inline-scroll">
        ${FEATURED_PILGRIMAGES.map((item) => `<a href="/temples.html?search=${encodeURIComponent(item)}" class="topic-chip whitespace-nowrap">${item}</a>`).join("")}
      </div>
    </div>
  `;
}

function renderHomeDiscovery() {
  renderStaticInfoCards("#home-discovery-grid", HOME_DISCOVERY_ITEMS);
}

function renderCalendarPreview(items) {
  const root = document.getElementById("calendar-preview");
  if (!root) {
    return;
  }

  if (!Array.isArray(items) || items.length === 0) {
    root.innerHTML = `
      <div class="soft-card p-5">
        <h3 class="m-0 text-lg font-semibold text-stone-900">Calendar preview is not available yet</h3>
        <p class="m-0 mt-2 text-sm text-stone-600">Festival and fasting highlights will appear here once the reviewed calendar is available.</p>
      </div>
    `;
    return;
  }

  root.innerHTML = `
    <div class="jw-grid-2">
      ${items
        .map((item) => {
          const title =
            getLanguage() === "hi"
              ? item.title_hi || item.title || "जैन पर्व"
              : item.title || item.title_hi || "Jain observance";
          const description =
            getLanguage() === "hi"
              ? item.summary_hi || item.summary || "पर्व की जानकारी यहाँ दिखाई जाएगी।"
              : item.summary || item.summary_hi || "Festival and observance detail will appear here.";
          const metaLine =
            item.date_confidence === "educational_only"
              ? translate("educational_overview", "Educational overview")
              : item.date_display || item.date_display_hi || translate("needs_review", "Needs Review");
          return `
          <article class="daily-card">
            <span class="jw-badge">${translateLabel(item.type || "festival", item.type || translate("calendar", "Calendar"))}</span>
            <h3 class="mt-3 text-lg font-semibold text-stone-900">${title}</h3>
            <p class="m-0 mt-2 text-sm leading-7 text-stone-600">${description}</p>
            <p class="m-0 mt-3 text-sm text-stone-500">${metaLine}</p>
          </article>
        `;
        })
        .join("")}
    </div>
  `;
}

function renderSimpleLiterature(items, targetSelector = "#featured-literature") {
  renderCards(targetSelector, items, {
    type: "literature",
    emptyTitle: "No literature is available yet",
    emptyBody: "Reviewed Jain texts, stories, and study notes will appear here soon.",
    metaBuilder: (item) => [
      item.category,
      item.subcategory,
      item.difficulty,
      translate("reviewed_by_editorial", "Reviewed by JainWorld Editorial")
    ].filter(Boolean)
  });
}

function renderFoodHighlights(items) {
  renderCards("#food-guide-list", items, {
    type: "food",
    emptyTitle: "No food guides are available yet",
    emptyBody: "Practical Jain food guidance will appear here after review.",
    metaBuilder: (item) => [
      item.category,
      item.type,
      item.allowed_status,
      translate("reviewed_by_editorial", "Reviewed by JainWorld Editorial")
    ].filter(Boolean)
  });
}

function renderCommunityCta() {
  const root = document.getElementById("community-cta");
  if (!root) {
    return;
  }

  root.innerHTML = `
    <div class="jw-page-cta">
      <div class="jw-grid-2 items-center">
        <div>
          <span class="jw-kicker">Community</span>
        <h2
          class="mt-3 text-2xl font-semibold tracking-tight text-stone-900"
          data-en="Join the JainWorld community."
          data-hi="JainWorld समुदाय से जुड़ें।"
        >
          Join the JainWorld community.
        </h2>
        <p
          class="m-0 mt-3 text-sm leading-7"
          data-en="Connect with Jains across India and the world for learning, volunteering, business, temples, and family networks."
          data-hi="सीखने, सेवा, व्यवसाय, मंदिरों और पारिवारिक संपर्कों के लिए भारत और दुनिया भर के जैनों से जुड़ें।"
        >
          Connect with Jains across India and the world for learning, volunteering, business, temples, and family networks.
        </p>
        </div>
        <div class="flex flex-wrap gap-3 lg:justify-end">
          <a href="/community.html" class="jw-btn jw-btn-primary" data-en="Request to join" data-hi="जुड़ने का अनुरोध करें">Request to join</a>
          <a href="/resources.html" class="jw-btn" data-en="View resources" data-hi="संसाधन देखें">View resources</a>
        </div>
      </div>
    </div>
  `;
}

function renderCategoryPills(targetSelector, items) {
  const root = document.querySelector(targetSelector);
  if (!root) {
    return;
  }

  root.innerHTML = `
    <div class="jw-inline-scroll">
      ${items
        .map((item) => {
          const label = typeof item === "string" ? item : getLanguage() === "hi" ? item.hi || item.en : item.en;
          const localized = typeof item === "string" ? translateLabel(item, item) : label;
          return `<span class="topic-chip whitespace-nowrap">${localized}</span>`;
        })
        .join("")}
    </div>
  `;
}

function renderLearningPaths() {
  const root = document.getElementById("learning-paths-grid");
  if (!root) {
    return;
  }

  root.innerHTML = `
    <div class="content-grid" data-columns="3">
      ${LEARNING_PATHS.map(
        (item) => `
          <a href="${item.href}" class="feature-card">
            <span class="jw-badge" data-en="Learning path" data-hi="सीखने का मार्ग">Learning path</span>
            <h3 class="mt-4 text-xl font-semibold text-stone-900" data-en="${item.titleEn}" data-hi="${item.titleHi || item.titleEn}">${item.titleEn}</h3>
            <p class="m-0 mt-3 text-sm leading-7 text-stone-600" data-en="${item.summaryEn}" data-hi="${item.summaryHi || item.summaryEn}">${item.summaryEn}</p>
          </a>
        `
      ).join("")}
    </div>
  `;
}

function renderPopularTopics() {
  const root = document.getElementById("popular-topics");
  if (!root) {
    return;
  }

  root.innerHTML = `
    <div class="jw-inline-scroll">
      ${POPULAR_TOPICS.map((item) => `<a href="/search.html?q=${encodeURIComponent(item.en)}" class="topic-chip whitespace-nowrap" data-en="${item.en}" data-hi="${item.hi}">${item.en}</a>`).join("")}
    </div>
  `;
}

function renderDevotionalCards(targetSelector, items, className) {
  const root = document.querySelector(targetSelector);
  if (!root) {
    return;
  }

  root.innerHTML = `
    <div class="content-grid" data-columns="3">
      ${items
        .map(
          (item) => `
            <a href="${item.href}" class="${className}">
              <span class="card-icon" aria-hidden="true">${getCardIcon(item.en)}</span>
              <h3 data-en="${item.en}" data-hi="${item.hi}">${item.en}</h3>
              <p data-en="${item.summaryEn}" data-hi="${item.summaryHi}">${item.summaryEn}</p>
            </a>
          `
        )
        .join("")}
    </div>
  `;
}

function renderSimpleFood(items) {
  renderCards("#food-recipes", items, {
    type: "food",
    emptyTitle: "No food entries are available yet",
    emptyBody: "Recipes and discipline notes will appear here once they are reviewed.",
    metaBuilder: (item) => [
      item.category,
      item.allowed_status,
      item.tags,
      translate("reviewed_by_editorial", "Reviewed by JainWorld Editorial")
    ].filter(Boolean)
  });
}

function setupTempleFilters(items) {
  const form = document.getElementById("temple-filters");
  if (!form || form.dataset.bound === "true") {
    return;
  }

  const countrySelect = document.getElementById("temple-country");
  const stateSelect = document.getElementById("temple-state");
  const citySelect = document.getElementById("temple-city");
  const typeSelect = document.getElementById("temple-type");
  const searchInput = document.getElementById("temple-search");

  fillSelect(countrySelect, getUnique(items, "country"));
  fillSelect(stateSelect, getUnique(items, "state"));
  fillSelect(citySelect, getUnique(items, "city"));
  fillSelect(typeSelect, getUnique(items, "category"));

  const update = () => {
    let filtered = [...items];

    if (countrySelect?.value) {
      filtered = filtered.filter((item) => item.country === countrySelect.value);
    }
    if (stateSelect?.value) {
      filtered = filtered.filter((item) => item.state === stateSelect.value);
    }
    if (citySelect?.value) {
      filtered = filtered.filter((item) => item.city === citySelect.value);
    }
    if (typeSelect?.value) {
      filtered = filtered.filter((item) => item.category === typeSelect.value);
    }
    if (searchInput?.value.trim()) {
      const query = searchInput.value.toLowerCase();
      filtered = filtered.filter((item) => JSON.stringify(item).toLowerCase().includes(query));
    }

    renderTemples("#temples-list", filtered);
  };

  form.dataset.bound = "true";
  form.addEventListener("input", update);
  form.addEventListener("change", update);
}

function setupAudioFilters(items) {
  const form = document.getElementById("audio-filters");
  if (!form || form.dataset.bound === "true") {
    return;
  }

  const categorySelect = document.getElementById("audio-category");
  const languageSelect = document.getElementById("audio-language");
  const searchInput = document.getElementById("audio-search");

  fillSelect(categorySelect, getUnique(items, "category"));
  fillSelect(languageSelect, getUnique(items, "language"));

  const update = () => {
    let filtered = [...items];

    if (categorySelect?.value) {
      filtered = filtered.filter((item) => item.category === categorySelect.value);
    }

    if (languageSelect?.value) {
      filtered = filtered.filter((item) => item.language === languageSelect.value);
    }

    if (searchInput?.value.trim()) {
      const query = searchInput.value.toLowerCase();
      filtered = filtered.filter((item) => JSON.stringify(item).toLowerCase().includes(query));
    }

    renderAudio("#audio-list", filtered);
  };

  form.dataset.bound = "true";
  form.addEventListener("input", update);
  form.addEventListener("change", update);
}

function setupNewsFilters(items) {
  const form = document.getElementById("news-filters");
  if (!form || form.dataset.bound === "true") {
    return;
  }

  const categorySelect = document.getElementById("news-category");
  const searchInput = document.getElementById("news-search");

  fillSelect(categorySelect, getUnique(items, "category"));

  const update = () => {
    let filtered = [...items];

    if (categorySelect?.value) {
      filtered = filtered.filter((item) => item.category === categorySelect.value);
    }

    if (searchInput?.value.trim()) {
      const query = searchInput.value.toLowerCase();
      filtered = filtered.filter((item) => JSON.stringify(item).toLowerCase().includes(query));
    }

    renderNews("#news-feed", filtered);
  };

  form.dataset.bound = "true";
  form.addEventListener("input", update);
  form.addEventListener("change", update);
}

function setupResourcesFilters(items) {
  const form = document.getElementById("resources-filters");
  if (!form || form.dataset.bound === "true") {
    return;
  }

  const categorySelect = document.getElementById("resources-category");
  const stateSelect = document.getElementById("resources-state");
  const searchInput = document.getElementById("resources-search");

  fillSelect(categorySelect, getUnique(items, "category"));
  fillSelect(stateSelect, getUnique(items, "state"));

  const update = () => {
    let filtered = [...items];

    if (categorySelect?.value) {
      filtered = filtered.filter((item) => item.category === categorySelect.value);
    }

    if (stateSelect?.value) {
      filtered = filtered.filter((item) => item.state === stateSelect.value);
    }

    if (searchInput?.value.trim()) {
      const query = searchInput.value.toLowerCase();
      filtered = filtered.filter((item) => JSON.stringify(item).toLowerCase().includes(query));
    }

    renderResources("#resources-list", filtered);
  };

  form.dataset.bound = "true";
  form.addEventListener("input", update);
  form.addEventListener("change", update);
}

function fillSelect(select, values) {
  if (!select) {
    return;
  }

  const firstOption = select.querySelector("option");
  const placeholder = firstOption ? firstOption.outerHTML : `<option value="">All</option>`;

  select.innerHTML = `${placeholder}${values
    .map((value) => `<option value="${value}">${translateLabel(value, value)}</option>`)
    .join("")}`;
}

function getUnique(items, key) {
  return [...new Set(items.map((item) => item[key]).filter(Boolean))].sort();
}

function setLoadingState(targetSelector, text = "Loading...") {
  const root = document.querySelector(targetSelector);
  if (!root) {
    return;
  }

  const nextText = text === "Loading..." ? (getLanguage() === "hi" ? "लोड हो रहा है..." : "Loading...") : text;

  root.innerHTML = `
    <div class="soft-card p-5">
      <p class="m-0 text-sm text-stone-600">${nextText}</p>
    </div>
  `;
}

function getCardIcon(label) {
  const text = String(label || "").toLowerCase();

  if (text.includes("temple")) {
    return "TM";
  }
  if (text.includes("food")) {
    return "FD";
  }
  if (text.includes("calendar") || text.includes("festival")) {
    return "CL";
  }
  if (text.includes("resource") || text.includes("scholar")) {
    return "RS";
  }
  if (text.includes("audio") || text.includes("bhajan")) {
    return "AU";
  }
  if (text.includes("children") || text.includes("kids")) {
    return "KD";
  }
  if (text.includes("community")) {
    return "CM";
  }

  return "JW";
}
