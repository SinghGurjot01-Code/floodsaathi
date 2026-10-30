// Internationalization module for FloodSaathi (en, hi, pa)
import { getSetting, setSetting } from "./store.js";

const SUPPORTED_LANGS = ["en", "hi", "pa"];
const DEFAULT_LANG = "en";

let currentLang = DEFAULT_LANG;
let translations = {};

/**
 * Initialize i18n system and load current language.
 */
export async function initI18n() {
  const saved = await getSetting("preferred_lang");
  if (saved && SUPPORTED_LANGS.includes(saved)) {
    currentLang = saved;
  } else {
    // Detect browser language if Hindi or Punjabi
    const navLangs = navigator.languages || [navigator.language || "en"];
    for (const l of navLangs) {
      const code = l.toLowerCase().split("-")[0];
      if (SUPPORTED_LANGS.includes(code)) {
        currentLang = code;
        break;
      }
    }
  }

  await loadTranslations(currentLang);
  applyTranslations();
  return currentLang;
}

/**
 * Load translation JSON dictionary.
 */
export async function loadTranslations(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) {
    lang = DEFAULT_LANG;
  }
  try {
    const res = await fetch(`./i18n/${lang}.json?v=1.6.0`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    translations = await res.json();
    currentLang = lang;
    await setSetting("preferred_lang", lang);
    document.documentElement.lang = lang;
  } catch (err) {
    console.error("Failed to load language JSON:", err);
  }
}

/**
 * Change current language.
 */
export async function setLanguage(lang) {
  if (lang === currentLang) return;
  await loadTranslations(lang);
  applyTranslations();
  window.dispatchEvent(new CustomEvent("floodsaathi:language_changed", { detail: { lang } }));
}

export function getCurrentLanguage() {
  return currentLang;
}

/**
 * Translate a key string (e.g. "status.safe" or "estimator.arrival_range").
 */
export function t(key, params = {}) {
  const parts = key.split(".");
  let node = translations;
  for (const p of parts) {
    if (node && typeof node === "object" && p in node) {
      node = node[p];
    } else {
      return key; // fallback to key
    }
  }

  if (typeof node !== "string") {
    return key;
  }

  let text = node;
  for (const [k, v] of Object.entries(params)) {
    text = text.replace(new RegExp(`\\{${k}\\}`, "g"), v);
  }
  return text;
}

/**
 * Translate all DOM elements marked with data-i18n attribute.
 */
export function applyTranslations(root = document) {
  const elements = root.querySelectorAll("[data-i18n]");
  elements.forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (key) {
      el.textContent = t(key);
    }
  });

  const placeholders = root.querySelectorAll("[data-i18n-placeholder]");
  placeholders.forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (key) {
      el.placeholder = t(key);
    }
  });

  const ariaLabels = root.querySelectorAll("[data-i18n-aria]");
  ariaLabels.forEach((el) => {
    const key = el.getAttribute("data-i18n-aria");
    if (key) {
      el.setAttribute("aria-label", t(key));
    }
  });
}
