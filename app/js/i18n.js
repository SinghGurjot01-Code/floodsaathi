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
    const navLangs = (typeof navigator !== "undefined" && (navigator.languages || [navigator.language || "en"])) || ["en"];
    for (const l of navLangs) {
      const code = l.toLowerCase().split("-")[0];
      if (SUPPORTED_LANGS.includes(code)) {
        currentLang = code;
        break;
      }
    }
  }

  await loadTranslations(currentLang);
  if (typeof document !== "undefined") {
    applyTranslations();
  }
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
    let res = null;
    try {
      if (typeof fetch === "function") {
        res = await fetch(`./i18n/${lang}.json?v=1.7.0`);
      }
    } catch (fetchErr) {
      // Offline fallback to Cache API
      if (typeof caches !== "undefined") {
        res = await caches.match(`./i18n/${lang}.json`);
      }
    }

    if (!res || !res.ok) {
      if (typeof caches !== "undefined") {
        const cached = await caches.match(`./i18n/${lang}.json`);
        if (cached && cached.ok) res = cached;
      }
    }

    // Node.js test environment fallback
    if ((!res || !res.ok) && typeof process !== "undefined" && process?.versions?.node) {
      try {
        const fs = await import("node:fs");
        const path = await import("node:path");
        const filePath = path.resolve(process.cwd(), "app", "i18n", `${lang}.json`);
        if (fs.existsSync(filePath)) {
          const raw = fs.readFileSync(filePath, "utf-8");
          translations = JSON.parse(raw);
          currentLang = lang;
          try {
            await setSetting("preferred_lang", lang);
          } catch {}
          if (typeof document !== "undefined" && document.documentElement) {
            document.documentElement.lang = lang;
          }
          return;
        }
      } catch (nodeErr) {
        // Continue to fallback error handling
      }
    }

    if (!res || !res.ok) throw new Error(`HTTP ${res?.status || "offline"}`);
    translations = await res.json();
    currentLang = lang;
    try {
      await setSetting("preferred_lang", lang);
    } catch {}
    if (typeof document !== "undefined" && document.documentElement) {
      document.documentElement.lang = lang;
    }
  } catch (err) {
    console.error("Failed to load language JSON:", err);
  }
}

/**
 * Change current language and apply translations to DOM.
 */
export async function setLanguage(lang) {
  await loadTranslations(lang);
  if (typeof document !== "undefined") {
    applyTranslations();
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("floodsaathi:language_changed", { detail: { lang } }));
  }
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
 * Translate all DOM elements marked with data-i18n, data-i18n-placeholder, data-i18n-aria.
 */
export function applyTranslations(root = document) {
  if (!root || typeof root.querySelectorAll !== "function") return;

  const elements = root.querySelectorAll("[data-i18n]");
  elements.forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (key) {
      const translated = t(key);
      if (translated && translated !== key) {
        el.textContent = translated;
      }
    }
  });

  const placeholders = root.querySelectorAll("[data-i18n-placeholder]");
  placeholders.forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (key) {
      const translated = t(key);
      if (translated && translated !== key) {
        el.placeholder = translated;
      }
    }
  });

  const ariaLabels = root.querySelectorAll("[data-i18n-aria]");
  ariaLabels.forEach((el) => {
    const key = el.getAttribute("data-i18n-aria");
    if (key) {
      const translated = t(key);
      if (translated && translated !== key) {
        el.setAttribute("aria-label", translated);
      }
    }
  });
}