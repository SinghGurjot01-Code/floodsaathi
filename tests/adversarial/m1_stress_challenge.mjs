// tests/adversarial/m1_stress_challenge.mjs
// Adversarial Empirical Challenge Suite for Milestone 1 (Downloads UI, Map pack calculator and caching)
// Role: teamwork_challenger (critic, specialist)
// Run with: node --test tests/adversarial/m1_stress_challenge.mjs

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
  checkStorageQuota,
  MAP_RADIUS_SIZES,
  MAP_PRESETS,
  CACHE_NAME
} from "../../app/js/map_downloader.js";

import { AskSaathiAssistant } from "../../app/js/ai_assistant.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");
const htmlPath = path.resolve(rootDir, "app/index.html");
const htmlContent = fs.readFileSync(htmlPath, "utf-8");

// Mock environment for headless testing
function setupMockEnv() {
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
    },
    keys: async () => Array.from(cacheStore.keys()),
    delete: async (name) => cacheStore.delete(name)
  };

  return {
    memStore,
    cacheStore,
    cleanup: () => {
      memStore.clear();
      cacheStore.clear();
    }
  };
}

// =========================================================================
// CHALLENGE 1: Map Size Calculator Monotonicity & Discontinuities
// =========================================================================
test("STRESS 1.1: Size calculator monotonicity check across radius spectrum", () => {
  // A larger radius represents a strictly larger geographical area (Area = pi * r^2).
  // Therefore, download size MUST be monotonically non-decreasing: if r1 < r2, estimate(r1) <= estimate(r2).
  const inversions = [];
  let prevSize = estimateDownloadSize(1);

  for (let r = 2; r <= 150; r++) {
    const size = estimateDownloadSize(r);
    if (size < prevSize) {
      inversions.push({
        radiusBefore: r - 1,
        sizeBefore: prevSize,
        radiusCurrent: r,
        sizeCurrent: size,
        dropMB: Math.round((prevSize - size) * 10) / 10
      });
    }
    prevSize = size;
  }

  // Check specifically around preset boundaries: 10 km (12 MB), 25 km (28 MB), 50 km (65 MB), 100 km (140 MB)
  console.log("Calculated inversions:", inversions);
  if (inversions.length > 0) {
    console.warn(`WARNING: Detected ${inversions.length} monotonicity inversions in estimateDownloadSize!`);
  }
  const size10 = estimateDownloadSize(10);
  const size11 = estimateDownloadSize(11);
  console.log(`Radius 10 km = ${size10} MB, Radius 11 km = ${size11} MB`);
  assert.ok(
    size11 >= size10,
    `Monotonicity violation: radius 11 km (${size11} MB) is smaller than radius 10 km (${size10} MB)!`
  );
});

// =========================================================================
// CHALLENGE 2: Boundary Value Inputs for estimateDownloadSize
// =========================================================================
test("STRESS 2.1: Boundary values for estimateDownloadSize (0, negative, NaN, null, string, Infinity)", () => {
  // 1. Zero radius
  const size0 = estimateDownloadSize(0);
  console.log("estimateDownloadSize(0):", size0);
  assert.ok(typeof size0 === "number" && !Number.isNaN(size0), "Size for 0 must be a valid number");

  // 2. Negative radius
  const sizeNeg = estimateDownloadSize(-25);
  console.log("estimateDownloadSize(-25):", sizeNeg);

  // 3. NaN input
  const sizeNaN = estimateDownloadSize(NaN);
  console.log("estimateDownloadSize(NaN):", sizeNaN);
  assert.ok(
    !Number.isNaN(sizeNaN),
    `estimateDownloadSize(NaN) produced NaN: UI will display 'NaN MB'`
  );

  // 4. Undefined input
  const sizeUndef = estimateDownloadSize(undefined);
  console.log("estimateDownloadSize(undefined):", sizeUndef);
  assert.ok(
    !Number.isNaN(sizeUndef),
    `estimateDownloadSize(undefined) produced NaN`
  );

  // 5. String input ("10", "25", "50", "100")
  assert.equal(estimateDownloadSize("10"), 12, "String '10' must match preset 12 MB");
  assert.equal(estimateDownloadSize("25"), 28, "String '25' must match preset 28 MB");
  assert.equal(estimateDownloadSize("50"), 65, "String '50' must match preset 65 MB");
  assert.equal(estimateDownloadSize("100"), 140, "String '100' must match preset 140 MB");

  // 6. Non-numeric string ("abc")
  const sizeStr = estimateDownloadSize("abc");
  console.log("estimateDownloadSize('abc'):", sizeStr);
  assert.ok(!Number.isNaN(sizeStr), "estimateDownloadSize('abc') must not return NaN");

  // 7. Extreme radius (e.g. 50000 km)
  const sizeHuge = estimateDownloadSize(50000);
  console.log("estimateDownloadSize(50000):", sizeHuge);
  assert.ok(Number.isFinite(sizeHuge), "Extreme radius must remain finite");
});

// =========================================================================
// CHALLENGE 3: Coordinates Calculation & Edge Cases in isCoordinatesCached
// =========================================================================
test("STRESS 3.1: Geographic boundary edge cases in isCoordinatesCached", async () => {
  const { cleanup } = setupMockEnv();

  try {
    // Cache a pack centered in Punjab: Amritsar (lat 31.634, lon 74.872, radius 25 km)
    await downloadMapPack(31.634, 74.872, 25);

    // 1. Center coordinate check
    const center = isCoordinatesCached(31.634, 74.872);
    assert.equal(center.cached, true, "Center point must be cached");

    // 2. Far away location: New Delhi (lat 28.6139, lon 77.2090, ~400 km away)
    const delhi = isCoordinatesCached(28.6139, 77.2090);
    assert.equal(delhi.cached, false, "Delhi must not be marked cached");

    // 3. Boundary edge: exactly ~22 km away (within 25 km)
    const nearEdge = isCoordinatesCached(31.634 + 0.2, 74.872);
    assert.equal(nearEdge.cached, true, "Point at ~22.2 km must be cached");

    // 4. Just outside boundary: ~27.8 km away
    const outsideEdge = isCoordinatesCached(31.634 + 0.25, 74.872);
    assert.equal(outsideEdge.cached, false, "Point at ~27.8 km must not be cached");

    // 5. Antimeridian boundary test:
    await downloadMapPack(0, 179.9, 50);
    const antimeridianPoint = isCoordinatesCached(0, -179.9);
    console.log("Antimeridian test point cached result:", antimeridianPoint.cached);

    // 6. Extreme coordinates: NaN, null, undefined
    assert.equal(isCoordinatesCached(NaN, NaN).cached, false);
    assert.equal(isCoordinatesCached(null, null).cached, false);
    assert.equal(isCoordinatesCached(undefined, undefined).cached, false);

    // 7. Out of range coordinates (lat > 90, lat < -90)
    assert.equal(isCoordinatesCached(95, 74.872).cached, false);
    assert.equal(isCoordinatesCached(-95, 74.872).cached, false);
  } finally {
    cleanup();
  }
});

// =========================================================================
// CHALLENGE 4: Corrupted LocalStorage & Resiliency
// =========================================================================
test("STRESS 4.1: Corrupted or non-array localStorage in map pack queries", () => {
  const { cleanup } = setupMockEnv();

  try {
    // Test non-array JSON: object
    localStorage.setItem("floodsaathi_offline_map_packs", JSON.stringify({ error: "not an array" }));
    let packs = getDownloadedMapPacks();
    console.log("getDownloadedMapPacks() with object in storage:", packs);
    assert.ok(
      Array.isArray(packs),
      `getDownloadedMapPacks must return an Array, but returned ${typeof packs}`
    );

    // Test non-array JSON: primitive number
    localStorage.setItem("floodsaathi_offline_map_packs", "12345");
    packs = getDownloadedMapPacks();
    console.log("getDownloadedMapPacks() with number in storage:", packs);
    assert.ok(
      Array.isArray(packs),
      `getDownloadedMapPacks must return an Array when storage has '12345'`
    );

    // Test corrupted JSON
    localStorage.setItem("floodsaathi_offline_map_packs", "{ corrupted json ... ");
    packs = getDownloadedMapPacks();
    assert.ok(Array.isArray(packs) && packs.length === 0, "Corrupted JSON must return empty array");
  } finally {
    cleanup();
  }
});

// =========================================================================
// CHALLENGE 5: Service Worker Cache Deletion on Activation
// =========================================================================
test("STRESS 5.1: Service Worker activate event must not delete offline map packs or language packs", () => {
  const swPath = path.resolve(rootDir, "app/sw.js");
  const swContent = fs.readFileSync(swPath, "utf-8");

  const activateMatch = swContent.match(/self\.addEventListener\("activate"[\s\S]*?\}\);/);
  assert.ok(activateMatch, "Service worker must have an activate event listener");

  const activateBody = activateMatch[0];
  console.log("SW Activate handler snippet:\n", activateBody);

  const hasUnsafeCacheDeletion =
    activateBody.includes("key !== CACHE_NAME") &&
    !activateBody.includes("offline-maps") &&
    !activateBody.includes("lang-packs") &&
    !activateBody.includes("ai-models");

  console.log("Unsafe SW cache wipe detected:", hasUnsafeCacheDeletion);
  assert.ok(
    !hasUnsafeCacheDeletion,
    "CRITICAL VULNERABILITY: Service Worker activate handler deletes all offline map, language pack, and model caches!"
  );
});

// =========================================================================
// CHALLENGE 6: Actual Tile Caching vs Fake Timers in downloadMapPack
// =========================================================================
test("STRESS 6.1: Actual byte payload verification for downloadMapPack", async () => {
  const { cacheStore, cleanup } = setupMockEnv();

  try {
    const pack = await downloadMapPack(31.634, 74.872, 25);
    assert.equal(pack.sizeMB, 28, "Pack metadata claims 28 MB");

    const offlineMapsCache = cacheStore.get(CACHE_NAME);
    assert.ok(offlineMapsCache, "offline-maps cache must exist");

    const entries = Array.from(offlineMapsCache.entries());
    console.log("Entries cached in offline-maps cache:", entries.length);

    let totalCachedBytes = 0;
    for (const [key, response] of entries) {
      const text = await response.text();
      totalCachedBytes += Buffer.byteLength(text, "utf-8");
      console.log(`Cache entry: ${key}, size: ${Buffer.byteLength(text, "utf-8")} bytes`);
    }

    console.log(`Total actual bytes cached: ${totalCachedBytes} bytes (~${(totalCachedBytes / 1024).toFixed(2)} KB)`);
    console.log(`Ratio of actual cached data to claimed data: ${(totalCachedBytes / (28 * 1024 * 1024) * 100).toFixed(4)}%`);
  } finally {
    cleanup();
  }
});
