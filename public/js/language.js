const LANGUAGE_KEY = "lang";
const LEGACY_LANGUAGE_KEY = "jainworld-language";
const DEFAULT_LANGUAGE = "en";
const MOJIBAKE_PATTERN = /(?:\u00E0\u00A4|\\u00E0\\u00A4|\u00E0\u00A5|\\u00E0\\u00A5|\u00E2\u0080\u00A2|\\u00E2\\u0080\\u00A2|\u00C2\u00A9|\\u00C2\\u00A9|\u00E2\u0080\u0094|\\u00E2\\u0080\\u0094|\u00E2\u0080\u0093|\\u00E2\\u0080\\u0093)/;

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
    base,
    `${base}_${lang === "hi" ? "en" : "hi"}`
  ];

  for (const key of preferredKeys) {
    const value = item[key];
    if (typeof value === "string" && isUsableLocalizedText(value)) {
      return value.trim();
    }
  }

  return "";
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
