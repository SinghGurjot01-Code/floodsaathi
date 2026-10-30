import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { initI18n, setLanguage, getCurrentLanguage, t, applyTranslations } from "../js/i18n.js";

const rootDir = process.cwd();
const htmlPath = path.resolve(rootDir, "app/index.html");
const htmlContent = fs.readFileSync(htmlPath, "utf-8");

test("i18n: All keys in index.html data-i18n exist across en.json, hi.json, and pa.json", () => {
  const en = JSON.parse(fs.readFileSync(path.resolve(rootDir, "app/i18n/en.json"), "utf-8"));
  const hi = JSON.parse(fs.readFileSync(path.resolve(rootDir, "app/i18n/hi.json"), "utf-8"));
  const pa = JSON.parse(fs.readFileSync(path.resolve(rootDir, "app/i18n/pa.json"), "utf-8"));

  const keyMatches = [...htmlContent.matchAll(/data-i18n="([^"]+)"/g)].map(m => m[1]);
  const placeholderMatches = [...htmlContent.matchAll(/data-i18n-placeholder="([^"]+)"/g)].map(m => m[1]);
  const allKeys = [...new Set([...keyMatches, ...placeholderMatches])];

  assert.ok(allKeys.length >= 40, `Expected at least 40 i18n keys, found ${allKeys.length}`);

  const resolveKey = (dict, keyStr) => {
    const parts = keyStr.split(".");
    let cur = dict;
    for (const p of parts) {
      if (!cur || typeof cur !== "object" || !(p in cur)) return undefined;
      cur = cur[p];
    }
    return cur;
  };

  const missingEn = [];
  const missingHi = [];
  const missingPa = [];

  for (const k of allKeys) {
    if (resolveKey(en, k) === undefined) missingEn.push(k);
    if (resolveKey(hi, k) === undefined) missingHi.push(k);
    if (resolveKey(pa, k) === undefined) missingPa.push(k);
  }

  assert.deepEqual(missingEn, [], `Keys missing in en.json: ${missingEn.join(", ")}`);
  assert.deepEqual(missingHi, [], `Keys missing in hi.json: ${missingHi.join(", ")}`);
  assert.deepEqual(missingPa, [], `Keys missing in pa.json: ${missingPa.join(", ")}`);
});

test("i18n: Switching to Punjabi ('pa') translates app content into Gurmukhi", async () => {
  await setLanguage("pa");
  assert.equal(getCurrentLanguage(), "pa");

  assert.equal(t("nav.home"), "ਮੁੱਖ ਪੰਨਾ");
  assert.equal(t("nav.map"), "ਹੜ੍ਹ ਨਕਸ਼ਾ");
  assert.equal(t("nav.saathi"), "ਸਾਥੀ");
  assert.equal(t("nav.alerts"), "ਸਰਕਾਰੀ ਅਲਰਟ");
  assert.equal(t("nav.shelters"), "ਰਾਹਤ ਕੈਂਪ");
  assert.equal(t("nav.downloads"), "ਡਾਊਨਲੋਡ / ਪੈਕ");
  assert.equal(t("more.title"), "ਹੋਰ ਸਾਧਨ ਅਤੇ ਸਹਾਇਤਾ");
  assert.equal(t("ask.topic_water"), "ਪੀਣ ਵਾਲੇ ਪਾਣੀ ਦਾ ਸ਼ੁੱਧੀਕਰਨ");
  assert.equal(t("downloads.lang_title"), "ਖੇਤਰੀ ਭਾਸ਼ਾ ਪੈਕ (ਹਿੰਦੀ ਅਤੇ ਪੰਜਾਬੀ ਗੁਰਮੁਖੀ)");
});

test("i18n: Switching to Hindi ('hi') translates app content into Devanagari", async () => {
  await setLanguage("hi");
  assert.equal(getCurrentLanguage(), "hi");

  assert.equal(t("nav.home"), "होम");
  assert.equal(t("nav.map"), "बाढ़ मानचित्र");
  assert.equal(t("nav.saathi"), "साथी");
  assert.equal(t("nav.alerts"), "सरकारी चेतावनियां");
  assert.equal(t("nav.shelters"), "राहत शिविर");
  assert.equal(t("nav.downloads"), "डाउनलोड / पैक");
  assert.equal(t("more.title"), "अन्य उपकरण और सहायता");
  assert.equal(t("ask.topic_water"), "पीने के पानी का शुद्धिकरण");
  assert.equal(t("downloads.lang_title"), "क्षेत्रीय भाषा पैक (हिन्दी और पंजाबी गुरुमुखी)");
});

test("i18n: Switching back to English ('en') restores system default", async () => {
  await setLanguage("en");
  assert.equal(getCurrentLanguage(), "en");

  assert.equal(t("nav.home"), "Home");
  assert.equal(t("nav.map"), "Water Map");
  assert.equal(t("nav.downloads"), "Downloads");
  assert.equal(t("more.title"), "More Tools & Assistance");
});

test("i18n: applyTranslations modifies mock DOM elements in-place", async () => {
  await setLanguage("pa");

  const mockDiv = {
    attributes: { "data-i18n": "nav.home" },
    textContent: "Home",
    getAttribute(attr) { return this.attributes[attr]; }
  };
  const mockInput = {
    attributes: { "data-i18n-placeholder": "ask.placeholder" },
    placeholder: "Ask...",
    getAttribute(attr) { return this.attributes[attr]; }
  };

  const mockRoot = {
    querySelectorAll(selector) {
      if (selector === "[data-i18n]") return [mockDiv];
      if (selector === "[data-i18n-placeholder]") return [mockInput];
      return [];
    }
  };

  applyTranslations(mockRoot);

  assert.equal(mockDiv.textContent, "ਮੁੱਖ ਪੰਨਾ");
  assert.equal(mockInput.placeholder, "ਅੰਗਰੇਜ਼ੀ, ਹਿੰਦੀ ਜਾਂ ਪੰਜਾਬੀ ਵਿੱਚ ਸਵਾਲ ਪੁੱਛੋ...");
});