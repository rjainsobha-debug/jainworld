const LANGUAGE_KEY = "lang";
const LEGACY_LANGUAGE_KEY = "jainworld-language";
const DEFAULT_LANGUAGE = "en";

export function getLanguage() {
  const saved =
    window.localStorage.getItem(LANGUAGE_KEY) ||
    window.localStorage.getItem(LEGACY_LANGUAGE_KEY);
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
    const nextText = node.dataset[lang];
    if (typeof nextText === "string") {
      node.textContent = nextText;
    }
  });

  document.querySelectorAll("[data-placeholder-hi][data-placeholder-en]").forEach((node) => {
    const nextPlaceholder = node.dataset[`placeholder${lang === "hi" ? "Hi" : "En"}`];
    if (typeof nextPlaceholder === "string") {
      node.setAttribute("placeholder", nextPlaceholder);
    }
  });

  document.querySelectorAll("[data-title-hi][data-title-en]").forEach((node) => {
    const nextTitle = node.dataset[`title${lang === "hi" ? "Hi" : "En"}`];
    if (typeof nextTitle === "string") {
      node.setAttribute("title", nextTitle);
    }
  });

  document.querySelectorAll("[data-value-hi][data-value-en]").forEach((node) => {
    const nextValue = node.dataset[`value${lang === "hi" ? "Hi" : "En"}`];
    if (typeof nextValue === "string") {
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
    base,
    `${base}_${lang === "hi" ? "en" : "hi"}`
  ];

  for (const key of preferredKeys) {
    const value = item[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function syncLanguageButtons() {
  const activeLanguage = getLanguage();

  document.querySelectorAll("[data-lang-toggle] button[data-lang]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.lang === activeLanguage);
    button.setAttribute("aria-pressed", String(button.dataset.lang === activeLanguage));
  });
}
