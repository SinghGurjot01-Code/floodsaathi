// tests/adversarial/m1_challenger_empirical_oracle.mjs
// Empirical Challenger Oracle: Strict mathematical & stress harness for Milestone 1 Iteration 2
// Tests:
// 1. Monotonicity across integer radii 1 to 150 km and fractional spectrum (0.1..150 km)
// 2. Exact knot preservation for UI presets (10, 25, 50, 100 km)
// 3. Boundary radius handling (0, negative, NaN, undefined, null, non-numeric, Infinity)
// 4. Antimeridian wrap-around (-180 / +180 deg) and geographic distance bounds
// 5. Corrupted pack records and storage edge cases

import test from "node:test";
import assert from "node:assert/strict";

import {
  estimateDownloadSize,
  checkMapPackStatus,
  downloadMapPack,
  getDownloadedMapPacks,
  deleteOfflineMapPack,
  isCoordinatesCached,
  MAP_PRESETS,
  CACHE_NAME
} from "../../app/js/map_downloader.js";

function setupMockStorage() {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
    get length() { return store.size; }
  };
  return {
    store,
    cleanup: () => store.clear()
  };
}

// =========================================================================
// TEST SUITE 1: Monotonicity Across Integer Radii 1 to 150 km
// =========================================================================
test("ORACLE 1.1: Integer radii monotonicity (1 km to 150 km)", () => {
  const inversions = [];
  const deltas = [];

  for (let r = 1; r < 150; r++) {
    const sCurrent = estimateDownloadSize(r);
    const sNext = estimateDownloadSize(r + 1);
    const delta = Math.round((sNext - sCurrent) * 10) / 10;
    deltas.push(delta);

    if (sNext < sCurrent) {
      inversions.push({
        rCurrent: r,
        sCurrent,
        rNext: r + 1,
        sNext,
        drop: Math.round((sCurrent - sNext) * 10) / 10
      });
    }

    // Every integer step MUST be strictly increasing because min knot slope is 0.8 MB/km
    assert.ok(
      sNext > sCurrent,
      `Strict monotonicity failure at r=${r} km: size(${r}) = ${sCurrent} MB, size(${r + 1}) = ${sNext} MB`
    );
  }

  assert.equal(inversions.length, 0, `Detected ${inversions.length} inversions across 1..150 km`);
  const minDelta = Math.min(...deltas);
  const maxDelta = Math.max(...deltas);
  console.log(`[ORACLE 1.1 PASS] 1..150 km: 0 inversions. Min step: +${minDelta} MB, Max step: +${maxDelta} MB.`);
});

test("ORACLE 1.2: Fractional radii monotonicity (0.1 km to 150.0 km with step 0.1 km)", () => {
  const fractionalInversions = [];
  let prevSize = estimateDownloadSize(0.1);

  for (let r = 0.2; r <= 150.0; r = Math.round((r + 0.1) * 10) / 10) {
    const currentSize = estimateDownloadSize(r);
    if (currentSize < prevSize) {
      fractionalInversions.push({
        rPrev: Math.round((r - 0.1) * 10) / 10,
        prevSize,
        rCurrent: r,
        currentSize,
        drop: Math.round((prevSize - currentSize) * 10) / 10
      });
    }
    prevSize = currentSize;
  }

  assert.equal(
    fractionalInversions.length,
    0,
    `Detected ${fractionalInversions.length} fractional inversions across 1500 points: ${JSON.stringify(fractionalInversions)}`
  );
  console.log(`[ORACLE 1.2 PASS] Tested 1,500 fractional points: 0 monotonicity inversions.`);
});

test("ORACLE 1.3: Preset knot preservation (10, 25, 50, 100 km)", () => {
  // Requirement R1 requires exact preset sizes: 10km -> 12MB, 25km -> 28MB, 50km -> 65MB, 100km -> 140MB
  const expectedPresets = [
    { r: 10, expected: 12.0 },
    { r: 25, expected: 28.0 },
    { r: 50, expected: 65.0 },
    { r: 100, expected: 140.0 }
  ];

  for (const preset of expectedPresets) {
    const actual = estimateDownloadSize(preset.r);
    assert.equal(
      actual,
      preset.expected,
      `Preset r=${preset.r} km failed: expected ${preset.expected} MB, got ${actual} MB`
    );

    // Also verify string inputs match
    const actualStr = estimateDownloadSize(String(preset.r));
    assert.equal(
      actualStr,
      preset.expected,
      `Preset string '${preset.r}' failed: expected ${preset.expected} MB, got ${actualStr} MB`
    );
  }

  // Also check MAP_PRESETS array matches estimateDownloadSize
  for (const p of MAP_PRESETS) {
    const est = estimateDownloadSize(p.radiusKm);
    assert.equal(
      est,
      p.estSizeMB,
      `MAP_PRESETS '${p.id}' (${p.radiusKm} km) estSizeMB mismatch: preset=${p.estSizeMB}, estimate=${est}`
    );
  }

  console.log(`[ORACLE 1.3 PASS] Presets verified: 10km=12MB, 25km=28MB, 50km=65MB, 100km=140MB.`);
});

// =========================================================================
// TEST SUITE 2: Boundary Radius Handling (0, Negative, NaN, Special Types)
// =========================================================================
test("ORACLE 2.1: Boundary radius values (0, negative, -Infinity, NaN, undefined, null, non-numeric)", () => {
  // 1. Zero radius
  assert.equal(estimateDownloadSize(0), 4.0, "r=0 must return base 4.0 MB");
  assert.equal(estimateDownloadSize(-0), 4.0, "r=-0 must return base 4.0 MB");

  // 2. Negative radius
  assert.equal(estimateDownloadSize(-0.001), 4.0, "r=-0.001 must return 4.0 MB");
  assert.equal(estimateDownloadSize(-1), 4.0, "r=-1 must return 4.0 MB");
  assert.equal(estimateDownloadSize(-25), 4.0, "r=-25 must return 4.0 MB");
  assert.equal(estimateDownloadSize(-1000), 4.0, "r=-1000 must return 4.0 MB");
  assert.equal(estimateDownloadSize(-Infinity), 4.0, "r=-Infinity must return 4.0 MB");

  // 3. NaN input
  const nanResult = estimateDownloadSize(NaN);
  assert.equal(nanResult, 4.0, "r=NaN must return safe fallback 4.0 MB");
  assert.ok(!Number.isNaN(nanResult), "r=NaN must never return NaN");

  // 4. Undefined and Null
  assert.equal(estimateDownloadSize(undefined), 4.0, "r=undefined must return 4.0 MB");
  assert.equal(estimateDownloadSize(null), 4.0, "r=null must return 4.0 MB");

  // 5. Strings
  assert.equal(estimateDownloadSize(""), 4.0, "r='' must return 4.0 MB");
  assert.equal(estimateDownloadSize("   "), 4.0, "r='   ' must return 4.0 MB");
  assert.equal(estimateDownloadSize("abc"), 4.0, "r='abc' must return 4.0 MB");
  assert.equal(estimateDownloadSize("NaN"), 4.0, "r='NaN' must return 4.0 MB");
  assert.equal(estimateDownloadSize("-50"), 4.0, "r='-50' must return 4.0 MB");

  // 6. Objects and Arrays
  assert.equal(estimateDownloadSize({}), 4.0, "r={} must return 4.0 MB");
  assert.equal(estimateDownloadSize([]), 4.0, "r=[] must return 4.0 MB");
  assert.equal(estimateDownloadSize([25]), 28.0, "r=[25] coerces to 25 -> 28.0 MB");

  // 7. Large numbers and +Infinity
  assert.equal(estimateDownloadSize(Infinity), 4.0, "r=Infinity must return 4.0 MB (non-finite)");
  const largeVal = estimateDownloadSize(1000);
  assert.equal(largeVal, 140.0 + (1000 - 100) * 1.5, "r=1000 scaling check");
  assert.ok(Number.isFinite(largeVal), "r=1000 must be finite");

  console.log(`[ORACLE 2.1 PASS] Boundary inputs safely clamped to 4.0 MB with zero NaN emissions.`);
});

test("ORACLE 2.2: checkMapPackStatus with boundary radius values", () => {
  const { cleanup } = setupMockStorage();

  try {
    // Empty storage:
    const status0 = checkMapPackStatus(0);
    assert.equal(status0.sizeMb, 4.0);
    assert.equal(status0.downloaded, false);

    const statusNeg = checkMapPackStatus(-25);
    assert.equal(statusNeg.sizeMb, 4.0);
    assert.equal(statusNeg.downloaded, false);

    const statusNaN = checkMapPackStatus(NaN);
    assert.equal(statusNaN.sizeMb, 4.0);
    assert.equal(statusNaN.downloaded, false);

    const statusUndef = checkMapPackStatus(undefined);
    assert.equal(statusUndef.sizeMb, 4.0);
    assert.equal(statusUndef.downloaded, false);

    // With a cached pack of radius 25:
    localStorage.setItem(
      "floodsaathi_offline_map_packs",
      JSON.stringify([{ id: "pack-1", radiusKm: 25, lat: 31.6, lon: 74.8, sizeMB: 28.0 }])
    );

    // Queries for smaller or equal radius should show downloaded: true
    assert.equal(checkMapPackStatus(10).downloaded, true);
    assert.equal(checkMapPackStatus(25).downloaded, true);
    // Queries for larger radius should show downloaded: false
    assert.equal(checkMapPackStatus(50).downloaded, false);
    assert.equal(checkMapPackStatus(100).downloaded, false);

    console.log(`[ORACLE 2.2 PASS] checkMapPackStatus correctly resolves boundary radii and status.`);
  } finally {
    cleanup();
  }
});

// =========================================================================
// TEST SUITE 3: Antimeridian Wrap-Around & Geographic Bounds
// =========================================================================
test("ORACLE 3.1: Antimeridian wrap-around (-180 / +180 deg longitude)", () => {
  const { cleanup } = setupMockStorage();

  try {
    // Place a pack at (lat: 0.0, lon: 179.9), radius: 25 km
    localStorage.setItem(
      "floodsaathi_offline_map_packs",
      JSON.stringify([
        { id: "antimeridian-east", lat: 0.0, lon: 179.9, radiusKm: 25, sizeMB: 28.0 }
      ])
    );

    // Point 1: Across the 180 antimeridian at (lat: 0.0, lon: -179.9)
    // Distance across boundary: 0.2 degrees longitude = 0.2 * 111.32 * cos(0) = 22.264 km.
    // Since 22.264 km <= 25 km radius, this point MUST be cached!
    const queryWithin = isCoordinatesCached(0.0, -179.9);
    assert.equal(
      queryWithin.cached,
      true,
      "Point at (0.0, -179.9) across antimeridian from (0.0, 179.9) must be within 25 km radius"
    );

    // Point 2: Across antimeridian at (lat: 0.0, lon: -179.6)
    // Distance across boundary: 0.5 degrees = 0.5 * 111.32 = 55.66 km > 25 km -> NOT cached
    const queryOutside = isCoordinatesCached(0.0, -179.6);
    assert.equal(
      queryOutside.cached,
      false,
      "Point at 55.66 km distance across antimeridian must NOT be cached"
    );

    // Point 3: Reverse direction - pack at -179.95, query at +179.95
    localStorage.setItem(
      "floodsaathi_offline_map_packs",
      JSON.stringify([
        { id: "antimeridian-west", lat: 31.634, lon: -179.95, radiusKm: 15, sizeMB: 18.0 }
      ])
    );
    // Delta lon = 0.1 deg. cos(31.634 deg) = 0.8514. dist = 0.1 * 111.32 * 0.8514 = 9.478 km <= 15 km
    const reverseQuery = isCoordinatesCached(31.634, 179.95);
    assert.equal(
      reverseQuery.cached,
      true,
      "Reverse antimeridian query (pack west, query east) must be cached"
    );

    // Point 4: Exact antimeridian meridian (180 vs -180)
    localStorage.setItem(
      "floodsaathi_offline_map_packs",
      JSON.stringify([
        { id: "antimeridian-exact", lat: 10.0, lon: 180.0, radiusKm: 5, sizeMB: 12.0 }
      ])
    );
    const exactQuery = isCoordinatesCached(10.0, -180.0);
    assert.equal(
      exactQuery.cached,
      true,
      "Exact antimeridian line (+180 vs -180) must be 0 km distance and cached"
    );

    // Point 5: Antipodal points (180 deg away on equator: (0, 0) vs (0, 180))
    localStorage.setItem(
      "floodsaathi_offline_map_packs",
      JSON.stringify([
        { id: "equator-origin", lat: 0.0, lon: 0.0, radiusKm: 100, sizeMB: 140.0 }
      ])
    );
    const antipodal = isCoordinatesCached(0.0, 180.0);
    assert.equal(
      antipodal.cached,
      false,
      "Antipodal point (~20,000 km away) must NOT be cached within 100 km radius"
    );

    console.log(`[ORACLE 3.1 PASS] Antimeridian wrap-around correctly normalizes longitude across +-180 deg.`);
  } finally {
    cleanup();
  }
});

test("ORACLE 3.2: Geographic boundary validation and invalid inputs in isCoordinatesCached", () => {
  const { cleanup } = setupMockStorage();

  try {
    localStorage.setItem(
      "floodsaathi_offline_map_packs",
      JSON.stringify([
        { id: "punjab-pack", lat: 31.634, lon: 74.872, radiusKm: 50, sizeMB: 65.0 }
      ])
    );

    // Valid coordinate inside radius
    assert.equal(isCoordinatesCached(31.634, 74.872).cached, true);

    // Out of bounds latitudes (|lat| > 90)
    assert.equal(isCoordinatesCached(90.1, 74.872).cached, false, "lat > 90 must be rejected");
    assert.equal(isCoordinatesCached(-90.1, 74.872).cached, false, "lat < -90 must be rejected");
    assert.equal(isCoordinatesCached(95, 74.872).cached, false);
    assert.equal(isCoordinatesCached(-120, 74.872).cached, false);

    // Non-finite / invalid coordinate types
    assert.equal(isCoordinatesCached(NaN, 74.872).cached, false);
    assert.equal(isCoordinatesCached(31.634, NaN).cached, false);
    assert.equal(isCoordinatesCached(Infinity, 74.872).cached, false);
    assert.equal(isCoordinatesCached(31.634, -Infinity).cached, false);
    assert.equal(isCoordinatesCached(null, null).cached, false);
    assert.equal(isCoordinatesCached(undefined, undefined).cached, false);
    assert.equal(isCoordinatesCached("31.634", "74.872").cached, false, "String coordinates must be rejected");
    assert.equal(isCoordinatesCached({}, {}).cached, false);

    console.log(`[ORACLE 3.2 PASS] Geographic boundaries and malformed coordinate inputs safely rejected.`);
  } finally {
    cleanup();
  }
});

test("ORACLE 3.3: Storage resilience against malformed / corrupt pack entries", () => {
  const { cleanup } = setupMockStorage();

  try {
    // 1. Pack items with missing or invalid lat/lon or negative radius
    const corruptPacks = [
      null,
      undefined,
      {},
      { id: "bad-1" }, // missing lat, lon
      { id: "bad-2", lat: "not-a-number", lon: 74.8, radiusKm: 25 },
      { id: "bad-3", lat: 31.6, lon: "not-a-number", radiusKm: 25 },
      { id: "bad-5", lat: 31.6, lon: 74.8, radiusKm: -10 }
    ];

    localStorage.setItem("floodsaathi_offline_map_packs", JSON.stringify(corruptPacks));

    // Must NOT crash with TypeError and must not match invalid packs
    const result = isCoordinatesCached(31.6, 74.8);
    assert.equal(result.cached, false, "Packs with invalid lat/lon or negative radius must not match");

    // 2. Adversarial Edge Finding: pack with radiusKm: null (or serialized NaN)
    // When serialized to JSON, NaN becomes null. In JS, Number(null) === 0, so at exact distance 0, 0 <= null evaluates to true.
    localStorage.setItem(
      "floodsaathi_offline_map_packs",
      JSON.stringify([{ id: "edge-null-radius", lat: 31.6, lon: 74.8, radiusKm: null }])
    );
    const nullRadiusDist0 = isCoordinatesCached(31.6, 74.8);
    const nullRadiusDistAway = isCoordinatesCached(31.6 + 0.01, 74.8);
    // Malformed pack with radiusKm: null must not cause false cache hits
    assert.equal(nullRadiusDist0.cached, false, "Malformed pack with null radius must not match");
    // At any non-zero distance (e.g. 1.1 km away), dist <= null evaluates false
    assert.equal(nullRadiusDistAway.cached, false, "At non-zero distance, radiusKm null evaluates false");

    // 3. Add one valid pack among corrupt ones
    corruptPacks.push({
      id: "valid-pack",
      lat: 31.6,
      lon: 74.8,
      radiusKm: 25,
      sizeMB: 28.0
    });
    localStorage.setItem("floodsaathi_offline_map_packs", JSON.stringify(corruptPacks));

    const validResult = isCoordinatesCached(31.6, 74.8);
    assert.equal(validResult.cached, true, "Valid pack must match even if corrupt items precede it");
    assert.equal(validResult.pack.id, "valid-pack");

    console.log(`[ORACLE 3.3 PASS] Corrupt pack records handled without crashing; JS null coercion verified.`);
  } finally {
    cleanup();
  }
});
