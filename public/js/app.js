import {
  getAudioItems,
  getBlogs,
  getCalendar,
  getCourse,
  getCourses,
  getFood,
  getLiterature,
  getNews,
  getTemples
} from "./api.js";
import { initCalendarPage } from "./calendar.js";
import { initCommunityForm } from "./community.js";
import { getLanguage, initLanguageToggle, updateLanguageDOM } from "./language.js";
import {
  buildDetailUrl,
  renderAudio,
  renderAudioDetail,
  renderArticleDetail,
  renderBlogs,
  renderCards,
  renderCourses,
  renderFoodRules,
  renderNews,
  renderStaticInfoCards,
  renderCourseDetail,
  renderTempleDetail,
  renderTemples
} from "./render.js";
import {
  COMMUNITY_BENEFITS,
  createFooter,
  createHeader,
  createSearchOverlay,
  CULTURE_MODULES,
  EDUCATION_LEVELS,
  FEATURED_PILGRIMAGES,
  FOOD_RESTRICTIONS,
  QUICK_CATEGORIES
} from "./templates.js";
import { initGlobalSearch } from "./search.js";

document.addEventListener("DOMContentLoaded", async () => {
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

function injectShell() {
  const page = document.body.dataset.page || "home";
  const headerRoot = document.getElementById("app-header");
  const footerRoot = document.getElementById("app-footer");
  const overlayRoot = document.getElementById("app-overlay");

  if (headerRoot) {
    headerRoot.innerHTML = createHeader(page);
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
  renderEducationLevels();
  renderPilgrimages();
  renderFoodRules("#food-guide-rules", FOOD_RESTRICTIONS.slice(0, 4));

  const [literature, courses, temples, food, news, blogs] = await Promise.all([
    getLiterature({ limit: 4 }),
    getCourses({ limit: 4 }),
    getTemples({ limit: 4 }),
    getFood({ limit: 4 }),
    getNews({ limit: 4 }),
    getBlogs({ limit: 5 })
  ]);

  renderSimpleLiterature(literature);
  renderCourses("#education-course-grid", courses);
  renderTemples("#temple-finder-results", temples);
  renderFoodHighlights(food);
  renderNews("#news-column", news);
  renderBlogs("#blogs-column", blogs);
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

  const items = await getLiterature({ limit: 24 });
  renderSimpleLiterature(items, "#literature-list");
}

async function loadAudioPage() {
  const items = await getAudioItems({ limit: 24 });
  renderAudio("#audio-list", items);
}

async function loadEducationPage() {
  renderEducationLevels("#education-level-cards");
  const items = await getCourses({ limit: 24 });
  renderCourses("#education-course-list", items);
}

async function loadTemplesPage() {
  const items = await getTemples({ limit: 500 });
  setupTempleFilters(items);
  renderTemples("#temples-list", items);
}

async function loadCulturePage() {
  renderStaticInfoCards("#culture-modules", CULTURE_MODULES);
  const festivals = await getCalendar({ limit: 6 });
  const cards = festivals.map((item) => ({
    title_en: item.festival_en,
    title_hi: item.festival_hi,
    summary_en: item.description_en,
    summary_hi: item.description_hi
  }));
  renderStaticInfoCards("#culture-festivals", cards);
}

async function loadFoodPage() {
  renderFoodRules("#food-rules", FOOD_RESTRICTIONS);
  const items = await getFood({ limit: 24 });
  renderSimpleFood(items);
}

async function loadNewsPage() {
  const items = await getNews({ limit: 24 });
  renderNews("#news-feed", items);
}

async function loadBlogsPage() {
  const items = await getBlogs({ limit: 24 });
  renderBlogs("#blogs-list", items);
}

function loadCommunityPage() {
  renderStaticInfoCards("#community-benefits", COMMUNITY_BENEFITS);
  initCommunityForm();
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
    <div class="explore-grid jw-grid-3">
      ${QUICK_CATEGORIES.map(
        (item) => `
          <a href="${item.href}" class="cat-card jw-card p-5 no-underline transition hover:border-amber-300">
            <h3 class="cat-name m-0 text-lg font-semibold text-stone-900" data-en="${item.titleEn}" data-hi="${item.titleHi}">${item.titleEn}</h3>
            <p class="cat-count m-0 mt-3 text-sm leading-7 text-stone-600" data-en="${item.summaryEn}" data-hi="${item.summaryHi}">${item.summaryEn}</p>
          </a>
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
          <article class="jw-card p-5">
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
    <div class="jw-card p-5">
      <div class="jw-inline-scroll">
        ${FEATURED_PILGRIMAGES.map((item) => `<span class="jw-badge whitespace-nowrap">${item}</span>`).join("")}
      </div>
    </div>
  `;
}

function renderSimpleLiterature(items, targetSelector = "#featured-literature") {
  renderCards(targetSelector, items, {
    type: "literature",
    metaBuilder: (item) => [item.category, item.subcategory, item.difficulty].filter(Boolean)
  });
}

function renderFoodHighlights(items) {
  renderCards("#food-guide-list", items, {
    type: "food",
    metaBuilder: (item) => [item.category, item.type, item.allowed_status].filter(Boolean)
  });
}

function renderCommunityCta() {
  const root = document.getElementById("community-cta");
  if (!root) {
    return;
  }

  root.innerHTML = `
    <div class="jw-card p-6 lg:p-8">
      <div class="jw-grid-2 items-center">
        <div>
          <span class="jw-kicker">Community</span>
          <h2 class="mt-3 text-2xl font-semibold tracking-tight text-stone-900" data-en="Build a verified Jain network" data-hi="सत्यापित जैन नेटवर्क बनाएं">Build a verified Jain network</h2>
          <p class="m-0 mt-3 text-sm leading-7 text-stone-600" data-en="Collect student, business, volunteer, and city-based interest data now, then add approval workflows and private groups later." data-hi="अभी छात्र, व्यवसाय, स्वयंसेवक और शहर-आधारित रुचि डेटा एकत्र करें, फिर आगे अप्रूवल वर्कफ्लो और निजी समूह जोड़ें।">Collect student, business, volunteer, and city-based interest data now, then add approval workflows and private groups later.</p>
        </div>
        <div class="flex flex-wrap gap-3 lg:justify-end">
          <a href="/community.html" class="jw-btn jw-btn-primary">Open Community</a>
          <a href="/education.html" class="jw-btn">Explore Education</a>
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
      ${items.map((item) => `<span class="jw-badge whitespace-nowrap">${item}</span>`).join("")}
    </div>
  `;
}

function renderSimpleFood(items) {
  renderCards("#food-recipes", items, {
    type: "food",
    metaBuilder: (item) => [item.category, item.allowed_status, item.tags].filter(Boolean)
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
