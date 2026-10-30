// app/test/downloads_proximity.test.mjs
// Unit tests for R2: GPS Re-sync with visual feedback and Home view transparent telemetry proximity indicator
// Strict adherence to real data and native Node.js test runner.

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
  setCurrentSnapshot
} from "../js/main.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");
const punjabJsonPath = path.resolve(projectRoot, "app/data/latest/punjab.json");
const authoritativePunjabData = JSON.parse(fs.readFileSync(punjabJsonPath, "utf-8"));

// Lightweight IndexedDB mock for headless tests calling setSetting
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

// ---------------------------------------------------------------------------
// 1. Haversine Geodesic Distance Calculations
// ---------------------------------------------------------------------------
test("Haversine: Identical coordinates return exactly 0 km", () => {
  const d1 = haversineDistanceKm(31.15, 74.95, 31.15, 74.95);
  assert.equal(d1, 0);

  const d2 = haversineDistanceKm(0, 0, 0, 0);
  assert.equal(d2, 0);
});

test("Haversine: Known Punjab geographic distance Harike -> Taman/Jalandhar", () => {
  // Harike Barrage: 31.15°N, 74.95°E
  // Taman/Jalandhar: 31.25°N, 75.35°E
  const dist = haversineDistanceKm(31.25, 75.35, 31.15, 74.95);
  assert.ok(dist >= 38 && dist <= 42, `Distance should be ~40 km, computed ${dist} km`);
  assert.equal(dist, 39.6);
});

test("Haversine: Known Punjab river distance Harike -> Ranjit Sagar Dam", () => {
  // Harike: 31.15°N, 74.95°E
  // Ranjit Sagar Dam (Thein Dam): 32.444°N, 75.734°E
  const dist = haversineDistanceKm(31.15, 74.95, 32.444, 75.734);
  assert.ok(dist >= 155 && dist <= 165, `Distance should be ~162 km, computed ${dist} km`);
  assert.equal(dist, 161.8);
});

test("Haversine: Sub-kilometer distance precision", () => {
  // Small offset (~0.005 degrees latitude is ~555 meters)
  const dist = haversineDistanceKm(31.150, 74.950, 31.155, 74.950);
  assert.ok(dist >= 0.5 && dist <= 0.6, `Should compute ~0.6 km, got ${dist}`);
});

test("Haversine: Commutativity (distance from A to B equals B to A)", () => {
  const dAB = haversineDistanceKm(31.634, 74.872, 31.3824, 76.87199);
  const dBA = haversineDistanceKm(31.3824, 76.87199, 31.634, 74.872);
  assert.equal(dAB, dBA);
});

test("Haversine: Non-numeric and NaN coordinates return Infinity safely without throwing", () => {
  assert.equal(haversineDistanceKm(NaN, 74.95, 31.15, 74.95), Infinity);
  assert.equal(haversineDistanceKm(31.15, "invalid", 31.15, 74.95), Infinity);
  assert.equal(haversineDistanceKm(null, undefined, 31.15, 74.95), Infinity);
});

// ---------------------------------------------------------------------------
// 2. Nearest Gauge Selection from Authoritative Punjab Telemetry
// ---------------------------------------------------------------------------
test("Nearest Gauge: Real Punjab gauges identify Harike Barrage for Jalandhar/Taman coordinates", () => {
  const gauges = authoritativePunjabData.gauges;
  assert.ok(Array.isArray(gauges) && gauges.length >= 3);

  // User at Taman/Jalandhar: 31.25°N, 75.35°E
  const nearest = findNearestGauge(31.25, 75.35, gauges);
  assert.ok(nearest !== null);
  assert.equal(nearest.gauge.id, "G_HARIKE");
  assert.equal(nearest.gauge.name, "Harike Barrage");
  assert.equal(nearest.distanceKm, 39.6);
});

test("Nearest Gauge: Identifies Ranjit Sagar Dam for Pathankot/Ravi coordinates", () => {
  const gauges = authoritativePunjabData.gauges;
  // Pathankot / northern Punjab border: 32.30°N, 75.60°E
  const nearest = findNearestGauge(32.30, 75.60, gauges);
  assert.ok(nearest !== null);
  assert.equal(nearest.gauge.id, "G_RSD");
  assert.ok(nearest.distanceKm < 30);
});

test("Nearest Gauge: Identifies Kol Dam for eastern Sutlej border coordinates", () => {
  const gauges = authoritativePunjabData.gauges;
  // Near Nangal / Bilaspur border: 31.35°N, 76.70°E
  const nearest = findNearestGauge(31.35, 76.70, gauges);
  assert.ok(nearest !== null);
  assert.equal(nearest.gauge.id, "G_KOLDAM");
  assert.ok(nearest.distanceKm < 25);
});

test("Nearest Gauge: Gracefully handles empty or invalid gauge arrays", () => {
  assert.equal(findNearestGauge(31.25, 75.35, []), null);
  assert.equal(findNearestGauge(31.25, 75.35, null), null);
  assert.equal(findNearestGauge(31.25, 75.35, [{}, { name: "Missing Coords" }]), null);
});

// ---------------------------------------------------------------------------
// 3. Hydrologic Flow Orientation (Upstream vs Downstream)
// ---------------------------------------------------------------------------
test("Flow Direction: Gauge at higher latitude is upstream of user", () => {
  // Ranjit Sagar Dam (32.444°N) vs user in Jalandhar (31.634°N)
  const dir = determineFlowDirection(32.444, 31.634);
  assert.equal(dir, "upstream");
});

test("Flow Direction: Gauge at lower latitude is downstream of user", () => {
  // Harike (31.15°N) vs user in Amritsar (31.634°N)
  const dir = determineFlowDirection(31.15, 31.634);
  assert.equal(dir, "downstream");
});

test("Flow Direction: Boundary condition (identical latitude defaults to upstream)", () => {
  const dir = determineFlowDirection(31.15, 31.15);
  assert.equal(dir, "upstream");
});

// ---------------------------------------------------------------------------
// 4. Proximity Text Formatting
// ---------------------------------------------------------------------------
test("Formatting: Standard live telemetry banner formatting", () => {
  const profile = { village_name: "Taman, Jalandhar" };
  const gauge = { name: "Harike Barrage", river: "Sutlej-Beas", lat: 31.15, lon: 74.95 };
  const text = formatProximityText(profile, gauge, 39.6, "downstream", false);

  assert.equal(
    text,
    "Your location: Taman, Jalandhar · Hydrologic telemetry from: Harike Barrage (Sutlej-Beas) (39.6 km downstream)"
  );
});

test("Formatting: Sub-kilometer distance rendered in meters", () => {
  const profile = { village_name: "Harike Village" };
  const gauge = { name: "Harike Barrage", river: "Sutlej-Beas", lat: 31.15, lon: 74.95 };
  const text = formatProximityText(profile, gauge, 0.45, "upstream", false);

  assert.equal(
    text,
    "Your location: Harike Village · Hydrologic telemetry from: Harike Barrage (Sutlej-Beas) (450 m upstream)"
  );
});

test("Formatting: Stale GPS indicator appends [GPS Stale / Cached]", () => {
  const profile = { village_name: "Taman, Jalandhar" };
  const gauge = { name: "CWC Beas Gauge", river: "Beas", lat: 31.30, lon: 75.10 };
  const text = formatProximityText(profile, gauge, 12.5, "upstream", true);

  assert.equal(
    text,
    "Your location: Taman, Jalandhar [GPS Stale / Cached] · Hydrologic telemetry from: CWC Beas Gauge (Beas) (12.5 km upstream)"
  );
});

test("Formatting: Offline feeds banner when no reporting gauges exist", () => {
  const profile = { village_name: "Taman, Jalandhar" };
  const textLive = formatProximityText(profile, null, 0, "", false);
  assert.equal(
    textLive,
    "Your location: Taman, Jalandhar · Hydrologic telemetry: Feeds currently offline"
  );

  const textStale = formatProximityText(profile, null, 0, "", true);
  assert.equal(
    textStale,
    "Your location: Taman, Jalandhar [GPS Stale / Cached] · Hydrologic telemetry: Feeds currently offline"
  );
});

// ---------------------------------------------------------------------------
// 5. DOM Proximity Banner Live Update
// ---------------------------------------------------------------------------
test("DOM Banner: updateProximityBanner updates DOM text and toggles stale class", () => {
  const bannerEl = {
    classList: {
      _classes: new Set(["telemetry-proximity-banner"]),
      add(c) { this._classes.add(c); },
      remove(c) { this._classes.delete(c); },
      toggle(c, force) {
        if (force === undefined) {
          if (this._classes.has(c)) this._classes.delete(c);
          else this._classes.add(c);
        } else if (force) {
          this._classes.add(c);
        } else {
          this._classes.delete(c);
        }
      },
      contains(c) { return this._classes.has(c); }
    }
  };

  const textEl = { textContent: "" };

  const prevDoc = globalThis.document;
  globalThis.document = {
    getElementById(id) {
      if (id === "telemetry-proximity-banner") return bannerEl;
      if (id === "telemetry-proximity-text") return textEl;
      return null;
    }
  };

  try {
    setUserProfile({
      lat: 31.25,
      lon: 75.35,
      village_name: "Taman, Jalandhar"
    });

    // 1. Live update with authoritative data
    updateProximityBanner(authoritativePunjabData, false);
    assert.ok(textEl.textContent.includes("Harike Barrage"));
    assert.ok(textEl.textContent.includes("39.6 km"));
    assert.ok(textEl.textContent.includes("downstream"));
    assert.equal(bannerEl.classList.contains("stale"), false);

    // 2. Stale update
    updateProximityBanner(authoritativePunjabData, true);
    assert.ok(textEl.textContent.includes("[GPS Stale / Cached]"));
    assert.equal(bannerEl.classList.contains("stale"), true);

    // 3. Feeds offline update
    updateProximityBanner({ gauges: [] }, false);
    assert.ok(textEl.textContent.includes("Feeds currently offline"));
    assert.equal(bannerEl.classList.contains("stale"), false);
  } finally {
    globalThis.document = prevDoc;
  }
});

// ---------------------------------------------------------------------------
// 6. GPS Re-sync Button Controller & Visual Feedback State Machine
// ---------------------------------------------------------------------------
test("GPS Re-sync: Missing geolocation gracefully updates UI and flags stale banner", () => {
  const spanEl = { textContent: "Re-sync GPS" };
  const btnEl = {
    classList: {
      _classes: new Set(["btn-resync-gps"]),
      add(c) { this._classes.add(c); },
      remove(...args) { for (const a of args) this._classes.delete(a); },
      contains(c) { return this._classes.has(c); }
    },
    style: {},
    disabled: false,
    querySelector(sel) { return sel === "span" ? spanEl : null; },
    listeners: {},
    addEventListener(evt, fn) { this.listeners[evt] = fn; }
  };

  const textEl = { textContent: "" };
  const bannerEl = {
    classList: {
      _classes: new Set(["telemetry-proximity-banner"]),
      add(c) { this._classes.add(c); },
      remove(c) { this._classes.delete(c); },
      toggle(c, f) { f ? this._classes.add(c) : this._classes.delete(c); },
      contains(c) { return this._classes.has(c); }
    }
  };

  const prevDoc = globalThis.document;
  const originalNavDesc = Object.getOwnPropertyDescriptor(globalThis, "navigator");

  globalThis.document = {
    getElementById(id) {
      if (id === "btn-resync-gps") return btnEl;
      if (id === "telemetry-proximity-banner") return bannerEl;
      if (id === "telemetry-proximity-text") return textEl;
      return null;
    }
  };

  // Navigator without geolocation
  Object.defineProperty(globalThis, "navigator", {
    value: {},
    configurable: true,
    writable: true
  });

  try {
    setCurrentSnapshot(authoritativePunjabData);
    setupGpsResync();
    assert.ok(typeof btnEl.listeners["click"] === "function");

    // Click button
    btnEl.listeners["click"]();

    assert.equal(spanEl.textContent, "GPS Unavailable");
    assert.equal(btnEl.style.borderColor, "#ef1c24");
    assert.equal(btnEl.style.color, "#ef1c24");
    assert.ok(textEl.textContent.includes("[GPS Stale / Cached]"));
    assert.equal(bannerEl.classList.contains("stale"), true);
  } finally {
    globalThis.document = prevDoc;
    if (originalNavDesc) {
      Object.defineProperty(globalThis, "navigator", originalNavDesc);
    }
  }
});

test("GPS Re-sync: Successful acquisition updates coords, store, village label, and green feedback", async () => {
  const spanEl = { textContent: "Re-sync GPS" };
  const villageEl = { textContent: "Taman, Jalandhar" };
  const btnEl = {
    classList: {
      _classes: new Set(["btn-resync-gps"]),
      add(c) { this._classes.add(c); },
      remove(...args) { for (const a of args) this._classes.delete(a); },
      contains(c) { return this._classes.has(c); }
    },
    style: {},
    disabled: false,
    querySelector(sel) { return sel === "span" ? spanEl : null; },
    listeners: {},
    addEventListener(evt, fn) { this.listeners[evt] = fn; }
  };

  const textEl = { textContent: "" };
  const bannerEl = {
    classList: {
      _classes: new Set(["telemetry-proximity-banner"]),
      add(c) { this._classes.add(c); },
      remove(c) { this._classes.delete(c); },
      toggle(c, f) { f ? this._classes.add(c) : this._classes.delete(c); },
      contains(c) { return this._classes.has(c); }
    }
  };

  const prevDoc = globalThis.document;
  const originalNavDesc = Object.getOwnPropertyDescriptor(globalThis, "navigator");

  globalThis.document = {
    getElementById(id) {
      if (id === "btn-resync-gps") return btnEl;
      if (id === "loc-village-name") return villageEl;
      if (id === "telemetry-proximity-banner") return bannerEl;
      if (id === "telemetry-proximity-text") return textEl;
      return null;
    }
  };

  let capturedSuccessCb = null;
  let capturedOptions = null;

  Object.defineProperty(globalThis, "navigator", {
    value: {
      geolocation: {
        getCurrentPosition(success, error, options) {
          capturedSuccessCb = success;
          capturedOptions = options;
        }
      }
    },
    configurable: true,
    writable: true
  });

  try {
    setCurrentSnapshot(authoritativePunjabData);
    setUserProfile({
      lat: 31.634,
      lon: 74.872,
      village_name: "Taman, Jalandhar"
    });

    setupGpsResync();
    btnEl.listeners["click"]();

    // Verify acquiring state
    assert.equal(btnEl.disabled, true);
    assert.equal(btnEl.classList.contains("spinning"), true);
    assert.equal(spanEl.textContent, "Acquiring...");
    assert.ok(capturedOptions.enableHighAccuracy === true);

    // Trigger success callback with real coordinates near Harike (±15m accuracy)
    await capturedSuccessCb({
      coords: {
        latitude: 31.152,
        longitude: 74.954,
        accuracy: 15.2
      }
    });

    // Verify success state
    assert.equal(btnEl.disabled, false);
    assert.equal(btnEl.classList.contains("spinning"), false);
    assert.equal(btnEl.classList.contains("success"), true);
    assert.equal(spanEl.textContent, "GPS Synced");
    assert.equal(btnEl.style.borderColor, "#16a34a");
    assert.equal(btnEl.style.color, "#16a34a");

    // Profile coordinates updated
    const updatedProfile = getUserProfile();
    assert.equal(updatedProfile.lat, 31.152);
    assert.equal(updatedProfile.lon, 74.954);
    assert.equal(updatedProfile.accuracy_m, 15);
    assert.ok(typeof updatedProfile.gps_synced_at === "string");

    // Village label updated with accuracy
    assert.equal(villageEl.textContent, "Taman, Jalandhar (GPS ±15m)");

    // Proximity banner recalculated with new coordinates
    assert.ok(textEl.textContent.includes("Harike Barrage"));
    assert.equal(bannerEl.classList.contains("stale"), false);
  } finally {
    globalThis.document = prevDoc;
    if (originalNavDesc) {
      Object.defineProperty(globalThis, "navigator", originalNavDesc);
    }
  }
});

test("GPS Re-sync: Error callback removes spinner, shows red feedback and sets stale banner", async () => {
  const spanEl = { textContent: "Re-sync GPS" };
  const btnEl = {
    classList: {
      _classes: new Set(["btn-resync-gps"]),
      add(c) { this._classes.add(c); },
      remove(...args) { for (const a of args) this._classes.delete(a); },
      contains(c) { return this._classes.has(c); }
    },
    style: {},
    disabled: false,
    querySelector(sel) { return sel === "span" ? spanEl : null; },
    listeners: {},
    addEventListener(evt, fn) { this.listeners[evt] = fn; }
  };

  const textEl = { textContent: "" };
  const bannerEl = {
    classList: {
      _classes: new Set(["telemetry-proximity-banner"]),
      add(c) { this._classes.add(c); },
      remove(c) { this._classes.delete(c); },
      toggle(c, f) { f ? this._classes.add(c) : this._classes.delete(c); },
      contains(c) { return this._classes.has(c); }
    }
  };

  const prevDoc = globalThis.document;
  const originalNavDesc = Object.getOwnPropertyDescriptor(globalThis, "navigator");

  globalThis.document = {
    getElementById(id) {
      if (id === "btn-resync-gps") return btnEl;
      if (id === "telemetry-proximity-banner") return bannerEl;
      if (id === "telemetry-proximity-text") return textEl;
      return null;
    }
  };

  let capturedErrorCb = null;

  Object.defineProperty(globalThis, "navigator", {
    value: {
      geolocation: {
        getCurrentPosition(success, error) {
          capturedErrorCb = error;
        }
      }
    },
    configurable: true,
    writable: true
  });

  try {
    setCurrentSnapshot(authoritativePunjabData);
    setupGpsResync();
    btnEl.listeners["click"]();

    // Trigger error callback
    capturedErrorCb({ code: 1, message: "User denied Geolocation" });

    // Verify error state
    assert.equal(btnEl.disabled, false);
    assert.equal(btnEl.classList.contains("spinning"), false);
    assert.equal(btnEl.classList.contains("stale"), true);
    assert.equal(spanEl.textContent, "GPS Stale");
    assert.equal(btnEl.style.borderColor, "#ef1c24");
    assert.equal(btnEl.style.color, "#ef1c24");

    // Banner flagged stale
    assert.ok(textEl.textContent.includes("[GPS Stale / Cached]"));
    assert.equal(bannerEl.classList.contains("stale"), true);
  } finally {
    globalThis.document = prevDoc;
    if (originalNavDesc) {
      Object.defineProperty(globalThis, "navigator", originalNavDesc);
    }
  }
});
