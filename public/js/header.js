const NAV = [
  { name: "Home", link: "/index.html", key: "home", hi: "होम" },
  { name: "Literature", link: "/literature.html", key: "literature", hi: "साहित्य" },
  { name: "Temples", link: "/temples.html", key: "temples", hi: "मंदिर" },
  { name: "Food", link: "/food.html", key: "food", hi: "आहार" },
  { name: "Education", link: "/education.html", key: "education", hi: "शिक्षा" },
  { name: "News", link: "/news.html", key: "news", hi: "समाचार" },
  { name: "Blogs", link: "/blogs.html", key: "blogs", hi: "ब्लॉग" },
  { name: "Audio", link: "/audio.html", key: "audio", hi: "ऑडियो" },
  { name: "Community", link: "/community.html", key: "community", hi: "समुदाय" }
];

const DETAIL_PAGE_MAP = {
  article: "blogs",
  "audio-detail": "audio",
  "course-detail": "education",
  "temple-detail": "temples"
};

function getActivePage() {
  const page = document.body?.dataset?.page || "";
  if (DETAIL_PAGE_MAP[page]) {
    return DETAIL_PAGE_MAP[page];
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

  const navLinks = NAV.map((item) => {
    const activeClass = item.key === activePage ? "is-active" : "";
    return `
      <a class="jw-nav-link ${activeClass}" href="${item.link}">
        <span data-en="${item.name}" data-hi="${item.hi}">${item.name}</span>
      </a>
    `;
  }).join("");

  headerRoot.innerHTML = `
    <header class="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div class="jw-container py-3">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex items-start justify-between gap-4">
            <a href="/index.html" class="flex min-w-0 items-center gap-3 no-underline">
              <div class="flex h-11 w-11 items-center justify-center rounded-full border border-amber-700/20 bg-amber-50 text-lg font-bold text-amber-800">JW</div>
              <div>
                <div class="text-lg font-bold tracking-tight text-stone-900">JainWorld.in</div>
                <p class="m-0 text-sm text-stone-600" data-en="Jain digital knowledge ecosystem" data-hi="जैन डिजिटल नॉलेज इकोसिस्टम">Jain digital knowledge ecosystem</p>
              </div>
            </a>
            <div class="jw-lang-toggle shrink-0" data-lang-toggle>
              <button type="button" data-lang="en" aria-pressed="true">EN</button>
              <button type="button" data-lang="hi" aria-pressed="false">हिं</button>
            </div>
          </div>
          <form class="jw-search-shell flex w-full items-center gap-2 lg:max-w-xl" data-global-search-form>
            <input
              type="search"
              name="q"
              data-global-search-input
              data-placeholder-en="Search literature, audio, temples, food, courses, and blogs"
              data-placeholder-hi="साहित्य, ऑडियो, मंदिर, आहार, पाठ्यक्रम और ब्लॉग खोजें"
              placeholder="Search literature, audio, temples, food, courses, and blogs"
            />
            <button type="submit" class="jw-btn jw-btn-primary">
              <span data-en="Search" data-hi="खोज">Search</span>
            </button>
          </form>
        </div>
        <nav class="jw-inline-scroll mt-3" aria-label="Primary">
          ${navLinks}
        </nav>
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
