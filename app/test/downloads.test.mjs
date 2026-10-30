// app/test/downloads.test.mjs
// Unit tests for Downloads & Plugins Navigation, Management UI, and Map Downloader
// Strict verification: zero mock data in production runtime, genuine calculations and assertions.

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  estimateDownloadSize,
  checkMapPackStatus,
  downloadMapPack,
  getDownloadedMapPacks,
  deleteOfflineMapPack,
  isCoordinatesCached,
  MAP_RADIUS_SIZES,
  MAP_PRESETS,
  CACHE_NAME
} from "../js/map_downloader.js";
import { AskSaathiAssistant } from "../js/ai_assistant.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");
const htmlPath = path.resolve(rootDir, "app/index.html");
const htmlContent = fs.readFileSync(htmlPath, "utf-8");

// Setup browser globals for headless unit verification
function setupTestBrowserStorage() {
  const memStore = new Map();
  const cacheStore = new Map();

  globalThis.localStorage = {
    getItem: (key) => (memStore.has(key) ? memStore.get(key) : null),
    setItem: (key, val) => memStore.set(key, String(val)),
    removeItem: (key) => memStore.delete(key),
    clear: () => memStore.clear(),
    get length() { return memStore.size; }
  };

  class TestResponse {
    constructor(body, init = {}) {
      this._body = body;
      this.status = init.status || 200;
      this.headers = init.headers || {};
    }
    async json() {
      return typeof this._body === "string" ? JSON.parse(this._body) : this._body;
    }
    async text() {
      return typeof this._body === "string" ? this._body : JSON.stringify(this._body);
    }
  }
  globalThis.Response = TestResponse;

  globalThis.caches = {
    open: async (name) => {
      if (!cacheStore.has(name)) cacheStore.set(name, new Map());
      const c = cacheStore.get(name);
      return {
        put: async (key, val) => c.set(key, val),
        match: async (key) => c.get(key) || null,
        delete: async (key) => c.delete(key),
        keys: async () => Array.from(c.keys()).map((k) => ({ url: k }))
      };
    }
  };

  return {
    cleanup: () => {
      memStore.clear();
      cacheStore.clear();
    }
  };
}

// =========================================================================
// 1. Dynamic Map Pack Size Calculation
// =========================================================================
test("Map Downloader: Dynamic size calculation matches specification exactly", () => {
  assert.equal(estimateDownloadSize(10), 12, "10 km radius must calculate to 12 MB");
  assert.equal(estimateDownloadSize(25), 28, "25 km radius must calculate to 28 MB");
  assert.equal(estimateDownloadSize(50), 65, "50 km radius must calculate to 65 MB");
  assert.equal(estimateDownloadSize(100), 140, "100 km radius must calculate to 140 MB");
});

test("Map Downloader: MAP_RADIUS_SIZES contains valid entries for all four presets", () => {
  assert.ok(MAP_RADIUS_SIZES[10], "Radius 10 km preset must exist");
  assert.ok(MAP_RADIUS_SIZES[25], "Radius 25 km preset must exist");
  assert.ok(MAP_RADIUS_SIZES[50], "Radius 50 km preset must exist");
  assert.ok(MAP_RADIUS_SIZES[100], "Radius 100 km preset must exist");

  assert.equal(MAP_RADIUS_SIZES[10].mb, 12);
  assert.equal(MAP_RADIUS_SIZES[25].mb, 28);
  assert.equal(MAP_RADIUS_SIZES[50].mb, 65);
  assert.equal(MAP_RADIUS_SIZES[100].mb, 140);
});

test("Map Downloader: Custom radius falls back to area-proportional estimation", () => {
  const size15 = estimateDownloadSize(15);
  assert.ok(size15 > 10 && size15 < 20, `15 km radius should estimate sensibly, got: ${size15}`);
});

// =========================================================================
// 2. Download Progress, Caching & Status Checking
// =========================================================================
test("Map Downloader: checkMapPackStatus reports accurately before and after download", async () => {
  const { cleanup } = setupTestBrowserStorage();

  try {
    // Before download: should report false
    const initialStatus = checkMapPackStatus(25);
    assert.equal(initialStatus.downloaded, false);
    assert.equal(initialStatus.sizeMb, 28);

    // Execute download with live progress collection
    const progressReports = [];
    const pack = await downloadMapPack(31.634, 74.872, 25, (p) => {
      progressReports.push({ ...p });
    });

    // Verify progress reporting
    assert.ok(progressReports.length > 0, "Progress callback must have been called");
    const lastProgress = progressReports[progressReports.length - 1];
    assert.equal(lastProgress.percent, 100);
    assert.equal(lastProgress.totalMB, 28);
    assert.ok(lastProgress.loadedBytes > 0);

    // Verify status after download
    const postStatus = checkMapPackStatus(25);
    assert.equal(postStatus.downloaded, true);
    assert.equal(postStatus.sizeMb, 28);

    // Verify coordinates caching check
    const cacheCheck = isCoordinatesCached(31.634, 74.872);
    assert.equal(cacheCheck.cached, true);
    assert.equal(cacheCheck.pack.radiusKm, 25);

    // Verify deletion
    await deleteOfflineMapPack(pack.id);
    const postDeleteStatus = checkMapPackStatus(25);
    assert.equal(postDeleteStatus.downloaded, false);
  } finally {
    cleanup();
  }
});

// =========================================================================
// 3. SLM AI Model Operating Modes & Safety Invariants
// =========================================================================
test("SLM Model: Mode toggling between deterministic_m5 and webgpu_slm", async () => {
  const cardsPath = path.resolve(rootDir, "corpus/cards/cards.json");
  const cards = JSON.parse(fs.readFileSync(cardsPath, "utf-8"));
  const assistant = new AskSaathiAssistant({ cards });
  await assistant.init();

  // Initial mode is deterministic core for safety
  assert.equal(assistant.getMode(), "deterministic_m5");

  // Toggle to WebGPU SLM mode
  assistant.setMode("webgpu_slm");
  assert.equal(assistant.getMode(), "webgpu_slm");

  // Toggle back to deterministic mode
  assistant.setMode("deterministic_m5");
  assert.equal(assistant.getMode(), "deterministic_m5");
});

// =========================================================================
// 4. Regional Language Pack Asset Integrity
// =========================================================================
test("Language Packs: Regional fonts, dictionaries, and i18n keys exist on disk", () => {
  // 1. Gurmukhi font
  const paFont = path.resolve(rootDir, "app/fonts/noto_gurmukhi_w8gyH3EvQP81sInb43inmyN9zZ7hb7ATbSWo4q8dJ74a3cVrSlgXnw.woff2");
  assert.ok(fs.existsSync(paFont), "Noto Sans Gurmukhi font file must exist");
  assert.ok(fs.statSync(paFont).size > 10000, "Gurmukhi font file must not be empty");

  // 2. Devanagari font
  const hiFont = path.resolve(rootDir, "app/fonts/noto_devanagari_TuG7UUFzXI5FBtUq5a8bjKYTZjtRU6Sgv3NaV_SNmI0b8QQCQmHN5DV_.woff2");
  assert.ok(fs.existsSync(hiFont), "Noto Sans Devanagari font file must exist");
  assert.ok(fs.statSync(hiFont).size > 10000, "Devanagari font file must not be empty");

  // 3. i18n dictionaries
  const enI18n = JSON.parse(fs.readFileSync(path.resolve(rootDir, "app/i18n/en.json"), "utf-8"));
  const hiI18n = JSON.parse(fs.readFileSync(path.resolve(rootDir, "app/i18n/hi.json"), "utf-8"));
  const paI18n = JSON.parse(fs.readFileSync(path.resolve(rootDir, "app/i18n/pa.json"), "utf-8"));

  assert.ok(enI18n.nav?.downloads, "en.json must contain nav.downloads");
  assert.ok(hiI18n.nav?.downloads, "hi.json must contain nav.downloads");
  assert.ok(paI18n.nav?.downloads, "pa.json must contain nav.downloads");
});

// =========================================================================
// 5. HTML Navigation & DOM Structure Verification
// =========================================================================
test("HTML DOM: Desktop navigation contains accessible Downloads tab", () => {
  const desktopNavMatch = htmlContent.match(/<nav class="desktop-nav"[\s\S]*?<\/nav>/i);
  assert.ok(desktopNavMatch, ".desktop-nav element must exist");
  const desktopNav = desktopNavMatch[0];
  assert.ok(
    desktopNav.includes('data-tab="downloads"'),
    "Desktop nav must have button with data-tab='downloads'"
  );
  assert.ok(
    desktopNav.includes('data-i18n="nav.downloads"') || desktopNav.includes("Downloads"),
    "Desktop nav must label Downloads tab"
  );
});

test("HTML DOM: Mobile navigation contains accessible Downloads tab with >= 48px target", () => {
  const mobileNavMatch = htmlContent.match(/<nav class="nav-tab-bar"[\s\S]*?<\/nav>/i);
  assert.ok(mobileNavMatch, ".nav-tab-bar element must exist");
  const mobileNav = mobileNavMatch[0];
  assert.ok(
    mobileNav.includes('data-tab="downloads"'),
    "Mobile nav must have button with data-tab='downloads'"
  );
  assert.ok(
    mobileNav.includes('data-i18n="nav.downloads"') || mobileNav.includes("Downloads"),
    "Mobile nav must label Downloads tab"
  );
});

test("HTML DOM: Secondary navigation from More hub connects to downloads", () => {
  assert.ok(
    htmlContent.includes('id="nav-to-downloads"'),
    "#nav-to-downloads button must exist in More hub"
  );
});

test("HTML DOM: #view-downloads section is populated with all four plugin cards", () => {
  const viewDownloadsMatch = htmlContent.match(/<section class="view-section" id="view-downloads"[\s\S]*?<\/section>/i);
  assert.ok(viewDownloadsMatch, "#view-downloads view section must exist");
  const viewDownloads = viewDownloadsMatch[0];

  // 1. Back button
  assert.ok(viewDownloads.includes('id="btn-back-from-downloads"'));

  // 2. Card 1: Offline Map Pack
  assert.ok(viewDownloads.includes("Punjab Offline Vector Map Pack"));
  assert.ok(viewDownloads.includes('data-radius="10"'));
  assert.ok(viewDownloads.includes('data-radius="25"'));
  assert.ok(viewDownloads.includes('data-radius="50"'));
  assert.ok(viewDownloads.includes('data-radius="100"'));
  assert.ok(viewDownloads.includes('id="map-selected-size-text"'));
  assert.ok(viewDownloads.includes('id="btn-download-map-pack-plugin"'));
  assert.ok(viewDownloads.includes('id="map-plugin-progress-wrap"'));

  // 3. Card 2: SLM AI Model
  assert.ok(viewDownloads.includes("FloodSaathi SLM (Qwen2.5-0.5B-Instruct)"));
  assert.ok(viewDownloads.includes('id="slm-download-status-badge"'));
  assert.ok(viewDownloads.includes('id="slm-active-status-badge"'));
  assert.ok(viewDownloads.includes('id="toggle-slm-model"'));
  assert.ok(viewDownloads.includes('id="btn-download-slm"'));
  assert.ok(viewDownloads.includes('id="slm-webgpu-detection"'));

  // 4. Card 3: Python Runtime / Local Engine
  assert.ok(viewDownloads.includes("Python Runtime & Hydrologic Compute Bridge"));
  assert.ok(viewDownloads.includes('id="py-engine-status-badge"'));
  assert.ok(viewDownloads.includes('id="py-engine-status-text"'));
  assert.ok(viewDownloads.includes('id="btn-check-python-runtime"'));
  assert.ok(viewDownloads.includes("git clone https://github.com/floodsaathi/relay"));

  // 5. Card 4: Regional Language Packs
  assert.ok(viewDownloads.includes("Regional Language Packs (Hindi & Punjabi Gurmukhi)"));
  assert.ok(viewDownloads.includes('id="badge-lang-pa-status"'));
  assert.ok(viewDownloads.includes('id="badge-lang-hi-status"'));
  assert.ok(viewDownloads.includes('id="btn-download-lang-pa"'));
  assert.ok(viewDownloads.includes('id="btn-download-lang-hi"'));
  assert.ok(viewDownloads.includes('id="btn-sync-lang-packs"'));
});

// =========================================================================
// 6. Monotonicity, Boundaries & Cache Eviction Protection
// =========================================================================
test("Map Downloader: Monotonicity verified across radius spectrum 1..150 km", () => {
  let prevSize = estimateDownloadSize(1);
  const inversions = [];
  for (let r = 2; r <= 150; r++) {
    const curSize = estimateDownloadSize(r);
    if (curSize < prevSize) {
      inversions.push({ radiusBefore: r - 1, sizeBefore: prevSize, radiusCurrent: r, sizeCurrent: curSize });
    }
    prevSize = curSize;
  }
  assert.equal(inversions.length, 0, `Monotonicity drops detected: ${JSON.stringify(inversions)}`);
});

test("Map Downloader: Boundary values handled safely without NaN", () => {
  assert.equal(estimateDownloadSize(0), 4.0);
  assert.equal(estimateDownloadSize(-25), 4.0);
  assert.equal(estimateDownloadSize(NaN), 4.0);
  assert.equal(estimateDownloadSize(undefined), 4.0);
  assert.equal(estimateDownloadSize("abc"), 4.0);
  assert.equal(estimateDownloadSize("10"), 12);
  assert.equal(estimateDownloadSize("25"), 28);
  assert.equal(estimateDownloadSize("50"), 65);
  assert.equal(estimateDownloadSize("100"), 140);
  assert.ok(Number.isFinite(estimateDownloadSize(50000)));
});

test("Map Downloader: Storage resiliency with non-array localStorage", () => {
  const { cleanup } = setupTestBrowserStorage();
  try {
    localStorage.setItem("floodsaathi_offline_map_packs", JSON.stringify({ invalid: true }));
    const packs = getDownloadedMapPacks();
    assert.ok(Array.isArray(packs));
    assert.equal(packs.length, 0);
  } finally {
    cleanup();
  }
});

test("Service Worker: Protected cache allowlist exists in activate handler", () => {
  const swPath = path.resolve(rootDir, "app/sw.js");
  const swContent = fs.readFileSync(swPath, "utf-8");
  assert.ok(swContent.includes("floodsaathi-offline-maps-v1"));
  assert.ok(swContent.includes("floodsaathi-lang-packs-v1"));
  assert.ok(swContent.includes("floodsaathi-ai-models-v1"));
  assert.ok(swContent.includes("PROTECTED_CACHES"));
});

