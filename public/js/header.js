import { NAV_ITEMS } from "./templates.js";

const DETAIL_PAGE_MAP = {
  article: "education",
  "audio-detail": "search",
  "course-detail": "education",
  "temple-detail": "temples"
};

const PAGE_GROUP_MAP = {
  literature: "education",
  blogs: "search",
  news: "search",
  audio: "search",
  community: "resources",
  ask: "search"
};

function getActivePage() {
  const page = document.body?.dataset?.page || "";

  if (DETAIL_PAGE_MAP[page]) {
    return DETAIL_PAGE_MAP[page];
  }

  if (PAGE_GROUP_MAP[page]) {
    return PAGE_GROUP_MAP[page];
  }

  if (page) {
    return page;
  }

  const pathname = window.location.pathname;
  const filename = pathname.split("/").filter(Boolean).pop() || "index.html";
  return filename === "index.html" ? "home" : filename.replace(".html", "");
}

function renderHeader() {
  const activePage = getActivePage();
  const headerRoot = document.getElementById("app-header");

  if (!headerRoot) {
    return;
  }

  const navLinks = NAV_ITEMS.map((item) => {
    const activeClass = item.key === activePage ? "is-active" : "";

    return `
      <a class="jw-nav-link ${activeClass}" href="${item.href}">
        <span data-en="${item.labelEn}" data-hi="${item.labelHi}">${item.labelEn}</span>
      </a>
    `;
  }).join("");

  headerRoot.innerHTML = `
    <a href="#main-content" class="jw-skip-link">Skip to main content</a>
    <header class="jw-topbar">
      <div class="jw-container">
        <div class="jw-topbar-row">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div class="flex items-start justify-between gap-4">
              <a href="/index.html" class="site-logo min-w-0" aria-label="JainWorld home">
                <span class="site-logo-mark" aria-hidden="true">JW</span>
                <span class="site-logo-text">
                  <span class="site-logo-title">JainWorld</span>
                  <span
                    class="site-logo-tagline"
                    data-en="Learn, practice, and stay connected with Jain life."
                    data-hi="जैन जीवन से सीखें, जुड़ें और साधना में साथ रहें।"
                  >
                    Learn, practice, and stay connected with Jain life.
                  </span>
                </span>
              </a>
              <div class="jw-lang-toggle shrink-0" data-lang-toggle>
                <button type="button" data-lang="en" aria-pressed="true">EN</button>
                <button type="button" data-lang="hi" aria-pressed="false">HI</button>
              </div>
            </div>
            <div class="jw-topbar-actions">
              <form
                class="jw-search-shell flex w-full items-center gap-2 lg:min-w-[360px] lg:max-w-xl"
                data-global-search-form
                role="search"
                aria-label="Search JainWorld"
              >
                <input
                  type="search"
                  name="q"
                  data-global-search-input
                  data-placeholder-en="Search JainWorld for temples, prayers, food rules, festivals, and resources"
                  data-placeholder-hi="मंदिर, प्रार्थना, भोजन नियम, पर्व और संसाधनों के लिए JainWorld में खोजें"
                  placeholder="Search JainWorld for temples, prayers, food rules, festivals, and resources"
                  aria-label="Search JainWorld"
                />
                <button type="submit" class="jw-btn jw-btn-primary">
                  <span data-en="Search" data-hi="खोजें">Search</span>
                </button>
              </form>
            </div>
          </div>
          <div class="jw-nav-row">
            <nav class="jw-inline-scroll" aria-label="Primary">
              ${navLinks}
            </nav>
            <div class="jw-header-cta">
              <a href="/ask.html" class="jw-btn jw-btn-secondary" data-en="Ask JainWorld" data-hi="जैनवर्ल्ड से पूछें">Ask JainWorld</a>
            </div>
          </div>
        </div>
      </div>
    </header>
  `;

  headerRoot.dataset.injected = "true";
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("Header loaded");
  renderHeader();
  console.log("Header injected");
});
