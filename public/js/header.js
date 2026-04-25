import { createHeader } from "./templates.js";

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

  if (filename === "index.html" || pathname === "/") {
    return "home";
  }

  return filename.replace(".html", "");
}

export function injectHeader() {
  const headerRoot = document.getElementById("app-header");
  if (!headerRoot) {
    return;
  }

  headerRoot.innerHTML = createHeader(getActivePage());
  headerRoot.dataset.injected = "true";
  console.log("Header injected");
}

document.addEventListener("DOMContentLoaded", () => {
  injectHeader();
});
