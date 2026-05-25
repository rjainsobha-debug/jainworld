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
import { getLanguage, initLanguageToggle, updateLanguageDOM } from "./language.js";
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
    titleEn: "Jain Audio",
    summaryEn: "Listen to bhajan, aarti, stavan, pravachan, mantra recitation, and calm reflective audio.",
    href: "/audio.html"
  },
  {
    titleEn: "Curated Jain updates",
    summaryEn: "Follow festival notices, temple updates, pilgrimages, sangh activities, and community developments.",
    href: "/news.html"
  },
  {
    titleEn: "Scholarships and support",
    summaryEn: "Review scholarships, minority resources, educational directories, and official-ready support links.",
    href: "/resources.html"
  },
  {
    titleEn: "Community and participation",
    summaryEn: "Join JainWorld, contribute knowledge, and stay close to families, volunteers, temples, and institutions.",
    href: "/community.html"
  }
];

const SEARCH_CHIPS = [
  "Paryushan",
  "Navkar Mantra",
  "Jain food rules",
  "Ahimsa",
  "Samayik",
  "Temples near me",
  "Scholarships"
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
  renderEducationLevels();
  renderPilgrimages();
  renderHomeDiscovery();
  renderLearningPaths();
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
    title_en: item.festival_en,
    title_hi: item.festival_hi || item.festival_en,
    summary_en: item.description_en,
    summary_hi: item.description_hi || item.description_en
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
    (item) => `<a href="/search.html?q=${encodeURIComponent(item)}" class="topic-chip">${item}</a>`
  ).join("");
}

function renderDailyJain() {
  const root = document.getElementById("daily-jain-grid");
  if (!root) {
    return;
  }

  root.innerHTML = `
    <div class="content-grid" data-columns="3">
      ${DAILY_JAIN_ITEMS.map(
        (item) => `
          <article class="daily-card">
            <span class="card-icon" aria-hidden="true">${getCardIcon(item.titleEn)}</span>
            <p class="mt-4 mb-0 text-xs uppercase tracking-[0.16em] text-stone-500">${item.meta}</p>
            <h3 class="mt-3 text-xl font-semibold text-stone-900">${item.titleEn}</h3>
            <p>${item.summaryEn}</p>
          </article>
        `
      ).join("")}
    </div>
  `;
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
            <span class="jw-badge">${level.level}</span>
            <h3 class="mt-3 text-lg font-semibold text-stone-900">${level.level}</h3>
            <p class="m-0 mt-2 text-sm leading-7 text-stone-600" data-en="${level.titleEn}" data-hi="${level.titleHi}">${level.titleEn}</p>
            <p class="m-0 mt-3 text-xs uppercase tracking-[0.16em] text-stone-500">${level.topics}</p>
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
        .map((item) => `
          <article class="daily-card">
            <span class="jw-badge">${item.category || "Calendar"}</span>
            <h3 class="mt-3 text-lg font-semibold text-stone-900">${item.festival_en || item.festival_hi || "Jain observance"}</h3>
            <p class="m-0 mt-2 text-sm leading-7 text-stone-600">${item.description_en || "Festival and observance detail will appear here."}</p>
            <p class="m-0 mt-3 text-sm text-stone-500">${formatDate(item.date_gregorian)}${item.tithi ? ` | ${item.tithi}` : ""}</p>
          </article>
        `)
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
      "Reviewed by JainWorld Editorial"
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
      "Reviewed by JainWorld Editorial"
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
            data-hi="Join the JainWorld community."
          >
            Join the JainWorld community.
          </h2>
          <p
            class="m-0 mt-3 text-sm leading-7"
            data-en="Connect with Jains across India and the world for learning, volunteering, business, temples, and family networks."
            data-hi="Connect with Jains across India and the world for learning, volunteering, business, temples, and family networks."
          >
            Connect with Jains across India and the world for learning, volunteering, business, temples, and family networks.
          </p>
        </div>
        <div class="flex flex-wrap gap-3 lg:justify-end">
          <a href="/community.html" class="jw-btn jw-btn-primary">Request to join</a>
          <a href="/resources.html" class="jw-btn">View resources</a>
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
      ${items.map((item) => `<span class="topic-chip whitespace-nowrap">${item}</span>`).join("")}
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
            <span class="jw-badge">Learning path</span>
            <h3 class="mt-4 text-xl font-semibold text-stone-900">${item.titleEn}</h3>
            <p class="m-0 mt-3 text-sm leading-7 text-stone-600">${item.summaryEn}</p>
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
      ${POPULAR_TOPICS.map((item) => `<a href="/search.html?q=${encodeURIComponent(item)}" class="topic-chip whitespace-nowrap">${item}</a>`).join("")}
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
      "Reviewed by JainWorld Editorial"
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
    .map((value) => `<option value="${value}">${value}</option>`)
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

  root.innerHTML = `
    <div class="soft-card p-5">
      <p class="m-0 text-sm text-stone-600">${text}</p>
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
