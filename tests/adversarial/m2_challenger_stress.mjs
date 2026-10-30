// tests/adversarial/m2_challenger_stress.mjs
// Adversarial Empirical Challenge Suite for Milestone 2 (R2 - GPS Re-sync & Proximity Telemetry Display)
// Role: teamwork_challenger (critic, specialist)
// Run with: node --test tests/adversarial/m2_challenger_stress.mjs

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  haversineDistanceKm,
  findNearestGauge,
  determineFlowDirection,
  formatProximityText,
  updateProximityBanner,
  setupGpsResync,
  getUserProfile,
  setUserProfile,
  setCurrentSnapshot,
  getCurrentSnapshot
} from "../../app/js/main.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");
const punjabJsonPath = path.resolve(projectRoot, "app/data/latest/punjab.json");
const authoritativePunjabData = JSON.parse(fs.readFileSync(punjabJsonPath, "utf-8"));

// Mock IndexedDB for store.js persistence calls
function setupMockIndexedDB() {
  const tables = new Map();
  globalThis.indexedDB = {
    open() {
      const db = {
        objectStoreNames: { contains: () => true },
        transaction() {
          const tx = {
            oncomplete: null,
            onerror: null,
            objectStore(name) {
              if (!tables.has(name)) tables.set(name, new Map());
              const store = tables.get(name);
              return {
                put(record) {
                  store.set(record.key, record);
                  const req = {};
                  queueMicrotask(() => {
                    if (req.onsuccess) req.onsuccess({ target: { result: record.key } });
                    if (typeof tx.oncomplete === "function") tx.oncomplete();
                  });
                  return req;
                },
                get(key) {
                  const req = {};
                  queueMicrotask(() => {
                    const res = store.get(key);
                    if (req.onsuccess) req.onsuccess({ target: { result: res } });
                    if (typeof tx.oncomplete === "function") tx.oncomplete();
                  });
                  return req;
                }
              };
            }
          };
          return tx;
        }
      };
      const req = {};
      queueMicrotask(() => {
        if (req.onsuccess) req.onsuccess({ target: { result: db } });
      });
      return req;
    }
  };
}
setupMockIndexedDB();

// Helper to create mock DOM elements for GPS re-sync testing
function createMockDom() {
  const spanEl = { textContent: "Re-sync GPS" };
  const btnEl = {
    classList: {
      _classes: new Set(["btn-resync-gps"]),
      add(...args) { for (const a of args) this._classes.add(a); },
      remove(...args) { for (const a of args) this._classes.delete(a); },
      contains(c) { return this._classes.has(c); },
      toggle(c, f) { f ? this._classes.add(c) : this._classes.delete(c); }
    },
    style: { borderColor: "", color: "" },
    disabled: false,
    querySelector(sel) { return sel === "span" ? spanEl : null; },
    listeners: {},
    addEventListener(evt, fn) { this.listeners[evt] = fn; },
    dispatchEvent(evt) {
      if (this.listeners[evt.type]) {
        this.listeners[evt.type](evt);
      }
    }
  };

  const textEl = { textContent: "" };
  const bannerEl = {
    classList: {
      _classes: new Set(["telemetry-proximity-banner"]),
      add(...args) { for (const a of args) this._classes.add(a); },
      remove(...args) { for (const a of args) this._classes.delete(a); },
      toggle(c, f) { f ? this._classes.add(c) : this._classes.delete(c); },
      contains(c) { return this._classes.has(c); }
    }
  };
  const villageEl = { textContent: "Taman, Jalandhar" };

  const prevDoc = globalThis.document;
  globalThis.document = {
    getElementById(id) {
      if (id === "btn-resync-gps") return btnEl;
      if (id === "telemetry-proximity-banner") return bannerEl;
      if (id === "telemetry-proximity-text") return textEl;
      if (id === "loc-village-name") return villageEl;
      return null;
    }
  };

  return {
    btnEl,
    spanEl,
    textEl,
    bannerEl,
    villageEl,
    restoreDoc: () => { globalThis.document = prevDoc; }
  };
}

// ===========================================================================
// SUITE 1: Geolocation Error Matrix
// ===========================================================================
test("CHALLENGE 1.1: Error code 1 (PERMISSION_DENIED) releases disabled, removes spinner, applies red styling and stale text", () => {
  const dom = createMockDom();
  const originalNavDesc = Object.getOwnPropertyDescriptor(globalThis, "navigator");

  let errorCallback = null;
  Object.defineProperty(globalThis, "navigator", {
    value: {
      geolocation: {
        getCurrentPosition(success, error, options) {
          errorCallback = error;
        }
      }
    },
    configurable: true,
    writable: true
  });

  try {
    setCurrentSnapshot(authoritativePunjabData);
    setUserProfile({ lat: 31.25, lon: 75.35, village_name: "Taman, Jalandhar" });
    setupGpsResync();

    // Trigger acquisition
    dom.btnEl.listeners["click"]();
    assert.equal(dom.btnEl.disabled, true, "Button must be disabled while acquiring");
    assert.equal(dom.btnEl.classList.contains("spinning"), true, "Spinner must be active while acquiring");

    // Simulate PERMISSION_DENIED (code: 1)
    errorCallback({ code: 1, message: "User denied Geolocation prompt" });

    // Invariant assertions:
    assert.equal(dom.btnEl.disabled, false, "Button disabled state must be released on PERMISSION_DENIED");
    assert.equal(dom.btnEl.classList.contains("spinning"), false, "Spinner class .spinning must be removed");
    assert.equal(dom.btnEl.classList.contains("stale"), true, "Button must have .stale class");
    assert.equal(dom.spanEl.textContent, "GPS Stale", "Label must display 'GPS Stale'");
    assert.equal(dom.btnEl.style.borderColor, "#ef1c24", "Border must turn red #ef1c24");
    assert.equal(dom.btnEl.style.color, "#ef1c24", "Text color must turn red #ef1c24");
    assert.ok(dom.textEl.textContent.includes("[GPS Stale / Cached]"), "Proximity text must append '[GPS Stale / Cached]'");
    assert.equal(dom.bannerEl.classList.contains("stale"), true, "Proximity banner must toggle .stale class");
  } finally {
    dom.restoreDoc();
    if (originalNavDesc) Object.defineProperty(globalThis, "navigator", originalNavDesc);
  }
});

test("CHALLENGE 1.2: Error code 2 (POSITION_UNAVAILABLE) releases disabled, removes spinner, applies red styling and stale text", () => {
  const dom = createMockDom();
  const originalNavDesc = Object.getOwnPropertyDescriptor(globalThis, "navigator");

  let errorCallback = null;
  Object.defineProperty(globalThis, "navigator", {
    value: {
      geolocation: {
        getCurrentPosition(success, error, options) {
          errorCallback = error;
        }
      }
    },
    configurable: true,
    writable: true
  });

  try {
    setCurrentSnapshot(authoritativePunjabData);
    setUserProfile({ lat: 31.25, lon: 75.35, village_name: "Taman, Jalandhar" });
    setupGpsResync();

    dom.btnEl.listeners["click"]();
    assert.equal(dom.btnEl.disabled, true);
    assert.equal(dom.btnEl.classList.contains("spinning"), true);

    // Simulate POSITION_UNAVAILABLE (code: 2)
    errorCallback({ code: 2, message: "Position unavailable: no satellite or cellular triangulation fix" });

    assert.equal(dom.btnEl.disabled, false, "Button disabled state must be released on POSITION_UNAVAILABLE");
    assert.equal(dom.btnEl.classList.contains("spinning"), false, "Spinner class .spinning must be removed");
    assert.equal(dom.btnEl.classList.contains("stale"), true, "Button must have .stale class");
    assert.equal(dom.spanEl.textContent, "GPS Stale", "Label must display 'GPS Stale'");
    assert.equal(dom.btnEl.style.borderColor, "#ef1c24", "Border must turn red #ef1c24");
    assert.equal(dom.btnEl.style.color, "#ef1c24", "Text color must turn red #ef1c24");
    assert.ok(dom.textEl.textContent.includes("[GPS Stale / Cached]"), "Proximity text must append '[GPS Stale / Cached]'");
    assert.equal(dom.bannerEl.classList.contains("stale"), true, "Proximity banner must toggle .stale class");
  } finally {
    dom.restoreDoc();
    if (originalNavDesc) Object.defineProperty(globalThis, "navigator", originalNavDesc);
  }
});

test("CHALLENGE 1.3: Error code 3 (TIMEOUT) releases disabled, removes spinner, applies red styling and stale text", () => {
  const dom = createMockDom();
  const originalNavDesc = Object.getOwnPropertyDescriptor(globalThis, "navigator");

  let errorCallback = null;
  Object.defineProperty(globalThis, "navigator", {
    value: {
      geolocation: {
        getCurrentPosition(success, error, options) {
          errorCallback = error;
        }
      }
    },
    configurable: true,
    writable: true
  });

  try {
    setCurrentSnapshot(authoritativePunjabData);
    setUserProfile({ lat: 31.25, lon: 75.35, village_name: "Taman, Jalandhar" });
    setupGpsResync();

    dom.btnEl.listeners["click"]();
    assert.equal(dom.btnEl.disabled, true);
    assert.equal(dom.btnEl.classList.contains("spinning"), true);

    // Simulate TIMEOUT (code: 3)
    errorCallback({ code: 3, message: "Geolocation acquisition timed out after 12000ms" });

    assert.equal(dom.btnEl.disabled, false, "Button disabled state must be released on TIMEOUT");
    assert.equal(dom.btnEl.classList.contains("spinning"), false, "Spinner class .spinning must be removed");
    assert.equal(dom.btnEl.classList.contains("stale"), true, "Button must have .stale class");
    assert.equal(dom.spanEl.textContent, "GPS Stale", "Label must display 'GPS Stale'");
    assert.equal(dom.btnEl.style.borderColor, "#ef1c24", "Border must turn red #ef1c24");
    assert.equal(dom.btnEl.style.color, "#ef1c24", "Text color must turn red #ef1c24");
    assert.ok(dom.textEl.textContent.includes("[GPS Stale / Cached]"), "Proximity text must append '[GPS Stale / Cached]'");
    assert.equal(dom.bannerEl.classList.contains("stale"), true, "Proximity banner must toggle .stale class");
  } finally {
    dom.restoreDoc();
    if (originalNavDesc) Object.defineProperty(globalThis, "navigator", originalNavDesc);
  }
});

test("CHALLENGE 1.4: Missing navigator.geolocation object entirely: releases disabled, removes spinner, applies red styling and stale text", () => {
  const dom = createMockDom();
  const originalNavDesc = Object.getOwnPropertyDescriptor(globalThis, "navigator");

  // Mock navigator with NO geolocation object
  Object.defineProperty(globalThis, "navigator", {
    value: { onLine: true },
    configurable: true,
    writable: true
  });

  try {
    setCurrentSnapshot(authoritativePunjabData);
    setUserProfile({ lat: 31.25, lon: 75.35, village_name: "Taman, Jalandhar" });
    setupGpsResync();

    // Trigger click on button
    dom.btnEl.listeners["click"]();

    // Verify all invariant conditions:
    assert.equal(dom.btnEl.disabled, false, "Button disabled state must be false when geolocation is absent");
    assert.equal(dom.btnEl.classList.contains("spinning"), false, "Spinner class .spinning must NOT be present");
    assert.equal(dom.btnEl.classList.contains("stale"), true, "Button must have .stale class");
    assert.equal(dom.spanEl.textContent, "GPS Unavailable", "Label must display 'GPS Unavailable'");
    assert.equal(dom.btnEl.style.borderColor, "#ef1c24", "Border must turn red #ef1c24");
    assert.equal(dom.btnEl.style.color, "#ef1c24", "Text color must turn red #ef1c24");
    assert.ok(dom.textEl.textContent.includes("[GPS Stale / Cached]"), "Proximity text must append '[GPS Stale / Cached]'");
    assert.equal(dom.bannerEl.classList.contains("stale"), true, "Proximity banner must toggle .stale class");
  } finally {
    dom.restoreDoc();
    if (originalNavDesc) Object.defineProperty(globalThis, "navigator", originalNavDesc);
  }
});

test("CHALLENGE 1.5: Missing navigator.geolocation when currentSnapshot is null: must still set [GPS Stale / Cached]", () => {
  const dom = createMockDom();
  const originalNavDesc = Object.getOwnPropertyDescriptor(globalThis, "navigator");

  Object.defineProperty(globalThis, "navigator", {
    value: {},
    configurable: true,
    writable: true
  });

  try {
    // Current snapshot is null (e.g., initial offline boot before relay load)
    setCurrentSnapshot(null);
    setUserProfile({ lat: 31.25, lon: 75.35, village_name: "Taman, Jalandhar" });
    setupGpsResync();

    dom.btnEl.listeners["click"]();

    assert.equal(dom.btnEl.disabled, false, "Button must not remain disabled");
    assert.equal(dom.btnEl.classList.contains("spinning"), false, "Spinner must not be spinning");
    assert.equal(dom.btnEl.style.borderColor, "#ef1c24", "Border must be red #ef1c24");
    // Check if proximity indicator text reflects stale state even without active snapshot
    assert.ok(
      dom.textEl.textContent.includes("[GPS Stale / Cached]"),
      `Proximity indicator must show [GPS Stale / Cached] even when currentSnapshot is null; got: "${dom.textEl.textContent}"`
    );
  } finally {
    dom.restoreDoc();
    if (originalNavDesc) Object.defineProperty(globalThis, "navigator", originalNavDesc);
  }
});

// ===========================================================================
// SUITE 2: Rapid Concurrent Clicks & Concurrency Lock
// ===========================================================================
test("CHALLENGE 2.1: Rapid concurrent clicks during acquiring state: only one acquisition request runs at a time", () => {
  const dom = createMockDom();
  const originalNavDesc = Object.getOwnPropertyDescriptor(globalThis, "navigator");

  let invocationCount = 0;
  let capturedSuccessCb = null;

  Object.defineProperty(globalThis, "navigator", {
    value: {
      geolocation: {
        getCurrentPosition(success, error, options) {
          invocationCount++;
          capturedSuccessCb = success;
        }
      }
    },
    configurable: true,
    writable: true
  });

  try {
    setCurrentSnapshot(authoritativePunjabData);
    setUserProfile({ lat: 31.25, lon: 75.35, village_name: "Taman, Jalandhar" });
    setupGpsResync();

    // 1st click: Initiates acquiring state
    dom.btnEl.listeners["click"]();
    assert.equal(invocationCount, 1, "First click should trigger exactly 1 geolocation request");
    assert.equal(dom.btnEl.disabled, true, "Button must be disabled while acquiring");
    assert.equal(dom.btnEl.classList.contains("spinning"), true, "Spinner must be active");
    assert.equal(dom.spanEl.textContent, "Acquiring...", "Label must be 'Acquiring...'");

    // 2nd rapid click: Simulated while in acquiring state (e.g., touch double-tap or programmatic click event)
    dom.btnEl.listeners["click"]();

    // 3rd rapid click: Simulated while in acquiring state
    dom.btnEl.listeners["click"]();

    // Empirical assertion: Concurrency lock must prevent re-entrant calls
    assert.equal(
      invocationCount,
      1,
      `VULNERABILITY DETECTED: Rapid concurrent clicks triggered ${invocationCount} concurrent getCurrentPosition requests! Only 1 must run at a time.`
    );
    assert.equal(dom.btnEl.disabled, true, "Button must stay disabled while acquisition is pending");
    assert.equal(dom.btnEl.classList.contains("spinning"), true, "Button must keep spinning");
  } finally {
    dom.restoreDoc();
    if (originalNavDesc) Object.defineProperty(globalThis, "navigator", originalNavDesc);
  }
});

test("CHALLENGE 2.2: Concurrency lock prevents state corruption across sequential acquisition and error cycles", async () => {
  const dom = createMockDom();
  const originalNavDesc = Object.getOwnPropertyDescriptor(globalThis, "navigator");

  let invocationCount = 0;
  let activeCallback = null;
  let activeErrorCallback = null;

  Object.defineProperty(globalThis, "navigator", {
    value: {
      geolocation: {
        getCurrentPosition(success, error, options) {
          invocationCount++;
          activeCallback = success;
          activeErrorCallback = error;
        }
      }
    },
    configurable: true,
    writable: true
  });

  try {
    setCurrentSnapshot(authoritativePunjabData);
    setUserProfile({ lat: 31.25, lon: 75.35, village_name: "Taman, Jalandhar" });
    setupGpsResync();

    // Start 1st cycle
    dom.btnEl.listeners["click"]();
    assert.equal(invocationCount, 1);
    const firstSuccess = activeCallback;

    // Resolve 1st acquisition with new coordinates
    await firstSuccess({
      coords: { latitude: 31.152, longitude: 74.954, accuracy: 12 }
    });

    assert.equal(dom.btnEl.disabled, false);
    assert.equal(dom.spanEl.textContent, "GPS Synced");
    assert.equal(dom.btnEl.classList.contains("success"), true);

    // Start 2nd cycle after resolution (click again to re-sync)
    dom.btnEl.listeners["click"]();
    assert.equal(invocationCount, 2, "Re-click after resolution should initiate a fresh acquisition");
    assert.equal(dom.btnEl.disabled, true);
    assert.equal(dom.spanEl.textContent, "Acquiring...");
    assert.equal(dom.btnEl.classList.contains("spinning"), true);
    assert.equal(dom.btnEl.classList.contains("success"), false, ".success class must be cleared on re-sync");

    // Fail 2nd cycle with TIMEOUT
    activeErrorCallback({ code: 3, message: "Timeout" });
    assert.equal(dom.btnEl.disabled, false);
    assert.equal(dom.spanEl.textContent, "GPS Stale");
    assert.equal(dom.btnEl.classList.contains("stale"), true);
    assert.equal(dom.btnEl.style.borderColor, "#ef1c24");
  } finally {
    dom.restoreDoc();
    if (originalNavDesc) Object.defineProperty(globalThis, "navigator", originalNavDesc);
  }
});

// ===========================================================================
// SUITE 3: Sub-Kilometer Distance Thresholds & Formatting Oracles
// ===========================================================================
test("CHALLENGE 3.1: Sub-kilometer distance threshold (< 1.0 km) formats as rounded meters ('0 m', '120 m', '750 m')", () => {
  const profile = { village_name: "Taman, Jalandhar" };
  const mockGauge = { name: "Harike Barrage", river: "Sutlej", lat: 31.15, lon: 74.95 };

  // 1. Distance = 0 km exactly
  const res0 = formatProximityText(profile, mockGauge, 0, "upstream");
  assert.ok(res0.includes("(0 m upstream)"), `Expected '(0 m upstream)', got: '${res0}'`);

  // 2. Distance = 0.05 km (50 m)
  const res50 = formatProximityText(profile, mockGauge, 0.05, "upstream");
  assert.ok(res50.includes("(50 m upstream)"), `Expected '(50 m upstream)', got: '${res50}'`);

  // 3. Distance = 0.12 km (120 m)
  const res120 = formatProximityText(profile, mockGauge, 0.12, "upstream");
  assert.ok(res120.includes("(120 m upstream)"), `Expected '(120 m upstream)', got: '${res120}'`);

  // 4. Distance = 0.75 km (750 m)
  const res750 = formatProximityText(profile, mockGauge, 0.75, "downstream");
  assert.ok(res750.includes("(750 m downstream)"), `Expected '(750 m downstream)', got: '${res750}'`);

  // 5. Distance = 0.999 km (999 m) - strict boundary just under 1.0 km
  const res999 = formatProximityText(profile, mockGauge, 0.999, "upstream");
  assert.ok(res999.includes("(999 m upstream)"), `Expected '(999 m upstream)', got: '${res999}'`);
});

test("CHALLENGE 3.2: Distance >= 1.0 km formats with exactly 1 decimal place ('1.0 km', '1.2 km', '38.5 km')", () => {
  const profile = { village_name: "Taman, Jalandhar" };
  const mockGauge = { name: "Harike Barrage", river: "Sutlej", lat: 31.15, lon: 74.95 };

  // 1. Exact boundary at 1.0 km
  const res1_0 = formatProximityText(profile, mockGauge, 1.0, "upstream");
  assert.ok(res1_0.includes("(1.0 km upstream)"), `Expected '(1.0 km upstream)', got: '${res1_0}'`);

  // 2. Distance = 1.04 km (rounds to 1 decimal: '1.0 km')
  const res1_04 = formatProximityText(profile, mockGauge, 1.04, "upstream");
  assert.ok(res1_04.includes("(1.0 km upstream)"), `Expected '(1.0 km upstream)', got: '${res1_04}'`);

  // 3. Distance = 1.2 km
  const res1_2 = formatProximityText(profile, mockGauge, 1.2, "downstream");
  assert.ok(res1_2.includes("(1.2 km downstream)"), `Expected '(1.2 km downstream)', got: '${res1_2}'`);

  // 4. Distance = 38.5 km
  const res38_5 = formatProximityText(profile, mockGauge, 38.5, "downstream");
  assert.ok(res38_5.includes("(38.5 km downstream)"), `Expected '(38.5 km downstream)', got: '${res38_5}'`);

  // 5. Large distance = 161.8 km
  const res161_8 = formatProximityText(profile, mockGauge, 161.8, "upstream");
  assert.ok(res161_8.includes("(161.8 km upstream)"), `Expected '(161.8 km upstream)', got: '${res161_8}'`);
});

test("CHALLENGE 3.3: Geodesic calculation precision: verify whether haversineDistanceKm preserves sub-km fidelity", () => {
  // Offset of ~0.0067 degrees latitude corresponds to ~745 meters
  // Lat 31.150 -> 31.1567 is 745.0 meters = 0.745 km
  const dLatDeg = 0.0067;
  const rawDistKm = haversineDistanceKm(31.15, 74.95, 31.15 + dLatDeg, 74.95);

  // haversineDistanceKm rounds to 1 decimal place (Math.round(R * c * 10) / 10):
  // Thus rawDistKm is 0.7 km, and formatProximityText formats it as 700 m.
  assert.ok(typeof rawDistKm === "number" && !isNaN(rawDistKm));
  assert.ok(rawDistKm < 1.0, `Calculated distance ${rawDistKm} should be < 1.0 km`);

  const formatted = formatProximityText(
    { village_name: "Test Village" },
    { name: "Test Gauge" },
    rawDistKm,
    "upstream"
  );
  assert.ok(
    formatted.endsWith(" m upstream)"),
    `Formatted string for sub-km distance must end with 'm upstream)'; got: '${formatted}'`
  );
});

// ===========================================================================
// SUITE 4: Flow Direction & Boundary Invariants
// ===========================================================================
test("CHALLENGE 4.1: Flow direction determinism across Punjab latitudinal gradient", () => {
  // River flows NE (higher lat) to SW (lower lat)
  assert.equal(determineFlowDirection(32.444, 31.25), "upstream", "Gauge North of user must be upstream");
  assert.equal(determineFlowDirection(31.15, 31.25), "downstream", "Gauge South of user must be downstream");
  assert.equal(determineFlowDirection(31.25, 31.25), "upstream", "Gauge at exact user latitude defaults upstream");
});

test("CHALLENGE 4.2: Robustness against malformed gauge arrays and empty telemetry", () => {
  assert.equal(findNearestGauge(31.25, 75.35, null), null);
  assert.equal(findNearestGauge(31.25, 75.35, []), null);
  assert.equal(findNearestGauge(31.25, 75.35, [{ lat: "not-a-number", lon: null }]), null);

  const fallbackText = formatProximityText({ village_name: "Taman" }, null, 0, "", false);
  assert.equal(fallbackText, "Your location: Taman · Hydrologic telemetry: Feeds currently offline");

  const fallbackStale = formatProximityText({ village_name: "Taman" }, null, 0, "", true);
  assert.equal(fallbackStale, "Your location: Taman [GPS Stale / Cached] · Hydrologic telemetry: Feeds currently offline");
});
