// tests/adversarial/m2_challenger_oracle.mjs
// Adversarial Empirical Oracle & Mathematical Verification Suite for Milestone 2 (R2)
// Roles: Empirical Challenger / Mathematical Critic & Specialist
// Validates:
// 1. Haversine mathematical precision vs Spherical Law of Cosines across Punjab bounding box
// 2. Hydrologic orientation oracle across boundary latitudes
// 3. Malformed input fuzzing and zero-exception robustness
// 4. Physical Punjab stations verification with real authoritative punjab.json telemetry

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
  getUserProfile,
  setUserProfile
} from "../../app/js/main.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");
const punjabJsonPath = path.resolve(projectRoot, "app/data/latest/punjab.json");
const realPunjabData = JSON.parse(fs.readFileSync(punjabJsonPath, "utf-8"));

// Earth's mean radius in kilometers (WGS-84 / IUGG sphere)
const R_EARTH_KM = 6371;

/**
 * Independent Spherical Law of Cosines Oracle
 * Computes great-circle distance on a sphere:
 * cos(c) = sin(phi1)*sin(phi2) + cos(phi1)*cos(phi2)*cos(dLambda)
 * d = R * c
 */
function sphericalLawOfCosinesKm(lat1, lon1, lat2, lon2) {
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dLambda = ((lon2 - lon1) * Math.PI) / 180;
  const cosC = Math.sin(phi1) * Math.sin(phi2) + Math.cos(phi1) * Math.cos(phi2) * Math.cos(dLambda);
  const clampedCosC = Math.max(-1, Math.min(1, cosC));
  const c = Math.acos(clampedCosC);
  return R_EARTH_KM * c;
}

/**
 * Deterministic Linear Congruential Generator (LCG) for reproducible pseudorandom coordinates
 */
function createLcg(seed = 42) {
  let s = seed >>> 0;
  return function nextFloat() {
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// =========================================================================
// TEST SUITE 1: Haversine Mathematical Precision vs Spherical Law of Cosines
// =========================================================================

test("ORACLE 1.1: Precision comparison across 100 random coordinate pairs in Punjab bounding box", () => {
  // Punjab bounding box: Latitude 29.5°N to 32.5°N, Longitude 73.8°E to 76.9°E
  const lcg = createLcg(20261030);
  const latMin = 29.5, latMax = 32.5;
  const lonMin = 73.8, lonMax = 76.9;

  let maxDeltaUnrounded = 0;
  let maxDeltaRounded = 0;
  const deltas = [];

  for (let i = 0; i < 100; i++) {
    const lat1 = latMin + lcg() * (latMax - latMin);
    const lon1 = lonMin + lcg() * (lonMax - lonMin);
    const lat2 = latMin + lcg() * (latMax - latMin);
    const lon2 = lonMin + lcg() * (lonMax - lonMin);

    const dHaversine = haversineDistanceKm(lat1, lon1, lat2, lon2);
    const dCosinesRaw = sphericalLawOfCosinesKm(lat1, lon1, lat2, lon2);
    const dCosinesRounded = Math.round(dCosinesRaw * 10) / 10;

    const deltaUnrounded = Math.abs(dHaversine - dCosinesRaw);
    const deltaRounded = Math.abs(dHaversine - dCosinesRounded);

    if (deltaUnrounded > maxDeltaUnrounded) maxDeltaUnrounded = deltaUnrounded;
    if (deltaRounded > maxDeltaRounded) maxDeltaRounded = deltaRounded;
    deltas.push({ i, dHaversine, dCosinesRaw, deltaUnrounded });

    // Invariant 1: Haversine rounds to 1 decimal place (0.1 km quantization).
    // The theoretical maximum discrepancy between rounded value and raw great-circle is bounded by 0.05 km.
    assert.ok(
      deltaUnrounded <= 0.05001,
      `Pair #${i}: absolute delta ${deltaUnrounded.toFixed(6)} km exceeds 0.05 km threshold (h=${dHaversine}, cos=${dCosinesRaw})`
    );

    // Invariant 2: When both formulas are rounded to 1 decimal place, they must agree identically
    assert.equal(
      dHaversine,
      dCosinesRounded,
      `Pair #${i}: rounded Haversine (${dHaversine}) differs from rounded Law of Cosines (${dCosinesRounded})`
    );
  }

  assert.ok(maxDeltaUnrounded <= 0.05, `Max observed delta ${maxDeltaUnrounded} <= 0.05 km`);
  assert.equal(maxDeltaRounded, 0, `Max rounded delta ${maxDeltaRounded} === 0.0 km`);
});

test("ORACLE 1.2: Boundary and corner precision of Punjab bounding box", () => {
  const corners = [
    { name: "SW", lat: 29.5, lon: 73.8 },
    { name: "NW", lat: 32.5, lon: 73.8 },
    { name: "NE", lat: 32.5, lon: 76.9 },
    { name: "SE", lat: 29.5, lon: 76.9 }
  ];

  for (let i = 0; i < corners.length; i++) {
    for (let j = 0; j < corners.length; j++) {
      const c1 = corners[i];
      const c2 = corners[j];
      const dH = haversineDistanceKm(c1.lat, c1.lon, c2.lat, c2.lon);
      const dCos = sphericalLawOfCosinesKm(c1.lat, c1.lon, c2.lat, c2.lon);
      const delta = Math.abs(dH - dCos);
      assert.ok(delta <= 0.05, `Corner ${c1.name}->${c2.name} delta ${delta} exceeds 0.05 km`);

      // Commutativity assertion
      const dHRev = haversineDistanceKm(c2.lat, c2.lon, c1.lat, c1.lon);
      assert.equal(dH, dHRev, `Commutativity failure for ${c1.name} <-> ${c2.name}`);
    }
  }
});

test("ORACLE 1.3: Zero distance and sub-meter precision", () => {
  // Exact identical coordinates must yield 0
  assert.equal(haversineDistanceKm(31.5, 75.5, 31.5, 75.5), 0);

  // Sub-meter shift (~11 cm at 1e-6 degrees)
  const dSubMeter = haversineDistanceKm(31.5, 75.5, 31.500001, 75.5);
  assert.equal(dSubMeter, 0, "Displacement under 100 meters rounds to 0.0 km");

  // ~111 meter shift (0.001 degrees lat)
  const d111m = haversineDistanceKm(31.5, 75.5, 31.501, 75.5);
  assert.equal(d111m, 0.1, "111m displacement rounds to 0.1 km");
});

// =========================================================================
// TEST SUITE 2: Hydrologic Flow Direction Orientation Oracle
// =========================================================================

test("ORACLE 2.1: Flow direction across boundary latitudes", () => {
  const userLat = 31.25;

  // Case A: gauge.lat > user.lat -> "upstream"
  assert.equal(determineFlowDirection(31.2501, userLat), "upstream");
  assert.equal(determineFlowDirection(32.444, userLat), "upstream");
  assert.equal(determineFlowDirection(35.0, userLat), "upstream");

  // Case B: gauge.lat < user.lat -> "downstream"
  assert.equal(determineFlowDirection(31.2499, userLat), "downstream");
  assert.equal(determineFlowDirection(30.0, userLat), "downstream");
  assert.equal(determineFlowDirection(29.5, userLat), "downstream");

  // Case C: gauge.lat === user.lat -> defaults to "upstream"
  assert.equal(determineFlowDirection(31.25, userLat), "upstream");
  assert.equal(determineFlowDirection(0, 0), "upstream");
  assert.equal(determineFlowDirection(-30.5, -30.5), "upstream");
});

test("ORACLE 2.2: Micro-step orientation stress around epsilon boundaries", () => {
  const baseLat = 31.634; // Amritsar latitude
  const epsilons = [1e-12, 1e-9, 1e-6, 1e-4, 0.001];

  for (const eps of epsilons) {
    assert.equal(
      determineFlowDirection(baseLat + eps, baseLat),
      "upstream",
      `baseLat + ${eps} must be upstream`
    );
    assert.equal(
      determineFlowDirection(baseLat - eps, baseLat),
      "downstream",
      `baseLat - ${eps} must be downstream`
    );
  }
});

// =========================================================================
// TEST SUITE 3: Malformed Input Fuzzing & Zero-Exception Robustness
// =========================================================================

test("ORACLE 3.1: haversineDistanceKm input fuzzing with invalid types and NaN", () => {
  const invalidInputs = [
    [NaN, 75, 31, 75],
    [31, NaN, 31, 75],
    [31, 75, NaN, 75],
    [31, 75, 31, NaN],
    [null, 75, 31, 75],
    [31, null, 31, 75],
    [undefined, 75, 31, 75],
    [31, undefined, 31, 75],
    ["31.5", 75, 31, 75],
    [31, "75.5", 31, 75],
    [{}, 75, 31, 75],
    [[], 75, 31, 75],
    [false, 75, 31, 75],
    [true, 75, 31, 75]
  ];

  for (const args of invalidInputs) {
    assert.doesNotThrow(() => {
      const res = haversineDistanceKm(...args);
      assert.equal(res, Infinity, `Expected Infinity for args [${args}], got ${res}`);
    });
  }
});

test("ORACLE 3.2: haversineDistanceKm with extreme and infinity coordinates", () => {
  // Extremely large coordinates must not throw uncaught exceptions
  assert.doesNotThrow(() => {
    const resLarge = haversineDistanceKm(1e12, 1e12, 31, 75);
    assert.ok(typeof resLarge === "number");
  });

  // Coordinates with Infinity should execute without throwing uncaught exceptions
  assert.doesNotThrow(() => {
    haversineDistanceKm(Infinity, 75, 31, 75);
    haversineDistanceKm(31, -Infinity, 31, 75);
  });
});

test("ORACLE 3.3: findNearestGauge input fuzzing with invalid gauge collections", () => {
  const invalidGaugesCases = [
    null,
    undefined,
    [],
    "gauges",
    12345,
    {},
    [null],
    [undefined],
    [{}],
    [{ id: "G1" }],
    [{ id: "G2", lat: null, lon: 75 }],
    [{ id: "G3", lat: 31, lon: null }],
    [{ id: "G4", lat: NaN, lon: 75 }],
    [{ id: "G5", lat: "31", lon: 75 }],
    [null, {}, { id: "G6", lat: undefined }]
  ];

  for (const badGauges of invalidGaugesCases) {
    assert.doesNotThrow(() => {
      const result = findNearestGauge(31.25, 75.35, badGauges);
      assert.equal(result, null, `Expected null for invalid gauges input`);
    });
  }
});

test("ORACLE 3.4: findNearestGauge gracefully handles corrupted gauge amidst valid gauges", () => {
  const mixedGauges = [
    null,
    {},
    { id: "CORRUPT_1", lat: NaN, lon: 75.0 },
    { id: "VALID_FAR", name: "Far Station", lat: 32.5, lon: 76.5 },
    { id: "CORRUPT_2", lat: "invalid", lon: 75.0 },
    { id: "VALID_NEAR", name: "Near Station", lat: 31.26, lon: 75.36 },
    undefined
  ];

  assert.doesNotThrow(() => {
    const res = findNearestGauge(31.25, 75.35, mixedGauges);
    assert.ok(res !== null, "Should recover valid nearest gauge from mixed array");
    assert.equal(res.gauge.id, "VALID_NEAR");
    assert.ok(res.distanceKm < 5, "Near station should be within 5 km");
  });
});

// =========================================================================
// TEST SUITE 4: Real Physical Punjab Stations Telemetry Verification
// =========================================================================

test("ORACLE 4.1: Real punjab.json telemetry structure contains authoritative stations", () => {
  assert.ok(realPunjabData, "Authoritative punjab.json must exist");
  assert.ok(Array.isArray(realPunjabData.gauges), "punjab.json must contain gauges array");

  const gaugeIds = realPunjabData.gauges.map((g) => g.id);
  assert.ok(gaugeIds.includes("G_HARIKE"), "Harike Barrage must be present");
  assert.ok(gaugeIds.includes("G_KOLDAM"), "Kol Dam must be present");
  assert.ok(gaugeIds.includes("G_RSD"), "Ranjit Sagar Dam must be present");

  const harike = realPunjabData.gauges.find((g) => g.id === "G_HARIKE");
  const koldam = realPunjabData.gauges.find((g) => g.id === "G_KOLDAM");
  const rsd = realPunjabData.gauges.find((g) => g.id === "G_RSD");

  assert.equal(harike.lat, 31.15);
  assert.equal(harike.lon, 74.95);
  assert.equal(koldam.lat, 31.3824);
  assert.equal(koldam.lon, 76.87199);
  assert.equal(rsd.lat, 32.444);
  assert.equal(rsd.lon, 75.734);
});

test("ORACLE 4.2: Nearest gauge resolution for Pathankot user coordinates", () => {
  // Pathankot: Latitude 32.268°N, Longitude 75.649°E (Ravi basin)
  const pathankotLat = 32.268;
  const pathankotLon = 75.649;

  const result = findNearestGauge(pathankotLat, pathankotLon, realPunjabData.gauges);
  assert.ok(result !== null);
  assert.equal(result.gauge.id, "G_RSD");
  assert.equal(result.gauge.name, "Ranjit Sagar Dam (Thein Dam)");
  assert.ok(result.distanceKm >= 20.0 && result.distanceKm <= 22.5, `Pathankot->RSD dist: ${result.distanceKm} km`);
  assert.equal(result.distanceKm, 21.1);

  // Direction: RSD lat 32.444 > Pathankot lat 32.268 -> upstream
  const dir = determineFlowDirection(result.gauge.lat, pathankotLat);
  assert.equal(dir, "upstream");
});

test("ORACLE 4.3: Nearest gauge resolution for Jalandhar / Taman user coordinates", () => {
  // Taman, Jalandhar: Latitude 31.25°N, Longitude 75.35°E
  const jalandharLat = 31.25;
  const jalandharLon = 75.35;

  const result = findNearestGauge(jalandharLat, jalandharLon, realPunjabData.gauges);
  assert.ok(result !== null);
  assert.equal(result.gauge.id, "G_HARIKE");
  assert.equal(result.gauge.name, "Harike Barrage");
  assert.ok(result.distanceKm >= 38.0 && result.distanceKm <= 41.0, `Jalandhar->Harike dist: ${result.distanceKm} km`);
  assert.equal(result.distanceKm, 39.6);

  // Direction: Harike lat 31.15 < Jalandhar lat 31.25 -> downstream
  const dir = determineFlowDirection(result.gauge.lat, jalandharLat);
  assert.equal(dir, "downstream");
});

test("ORACLE 4.4: Nearest gauge resolution for Ropar (Rupnagar) user coordinates", () => {
  // Ropar: Latitude 30.966°N, Longitude 76.533°E (Upper Sutlej basin)
  const roparLat = 30.966;
  const roparLon = 76.533;

  const result = findNearestGauge(roparLat, roparLon, realPunjabData.gauges);
  assert.ok(result !== null);
  assert.equal(result.gauge.id, "G_KOLDAM");
  assert.equal(result.gauge.name, "Kol Dam");
  assert.ok(result.distanceKm >= 55.0 && result.distanceKm <= 58.0, `Ropar->Kol Dam dist: ${result.distanceKm} km`);
  assert.equal(result.distanceKm, 56.4);

  // Direction: Kol Dam lat 31.3824 > Ropar lat 30.966 -> upstream
  const dir = determineFlowDirection(result.gauge.lat, roparLat);
  assert.equal(dir, "upstream");
});

// =========================================================================
// TEST SUITE 5: Proximity Telemetry Output Formatting Oracle
// =========================================================================

test("ORACLE 5.1: formatProximityText formatting strings and units", () => {
  const profile = { village_name: "Taman, Jalandhar", district: "Jalandhar" };
  const gauge = { name: "Harike Barrage", river: "Sutlej-Beas" };

  // Standard formatting >= 1 km
  const text1 = formatProximityText(profile, gauge, 39.6, "downstream", false);
  assert.equal(
    text1,
    "Your location: Taman, Jalandhar · Hydrologic telemetry from: Harike Barrage (Sutlej-Beas) (39.6 km downstream)"
  );

  // Sub-kilometer formatting in meters
  const text2 = formatProximityText(profile, gauge, 0.45, "upstream", false);
  assert.equal(
    text2,
    "Your location: Taman, Jalandhar · Hydrologic telemetry from: Harike Barrage (Sutlej-Beas) (450 m upstream)"
  );

  // Stale GPS flag
  const text3 = formatProximityText(profile, gauge, 15.2, "upstream", true);
  assert.equal(
    text3,
    "Your location: Taman, Jalandhar [GPS Stale / Cached] · Hydrologic telemetry from: Harike Barrage (Sutlej-Beas) (15.2 km upstream)"
  );

  // Offline / missing gauges fallback
  const textOffline = formatProximityText(profile, null, 0, "", false);
  assert.equal(
    textOffline,
    "Your location: Taman, Jalandhar · Hydrologic telemetry: Feeds currently offline"
  );
});
