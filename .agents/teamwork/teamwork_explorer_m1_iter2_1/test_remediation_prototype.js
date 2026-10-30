// Prototype verification test for Remediation Blueprint
import test from "node:test";
import assert from "node:assert/strict";

// 1. Proposed estimateDownloadSize
export function estimateDownloadSize(radiusKm) {
  const r = Number(radiusKm);
  if (!Number.isFinite(r) || r <= 0) return 0;

  let mb;
  if (r <= 10) {
    mb = (12 / 10) * r;
  } else if (r <= 25) {
    mb = 12 + ((28 - 12) / (25 - 10)) * (r - 10);
  } else if (r <= 50) {
    mb = 28 + ((65 - 28) / (50 - 25)) * (r - 25);
  } else if (r <= 100) {
    mb = 65 + ((140 - 65) / (100 - 50)) * (r - 50);
  } else {
    mb = 140 + 1.5 * (r - 100);
  }
  return Math.round(mb * 10) / 10;
}

// 2. Proposed getDownloadedMapPacks
export function getDownloadedMapPacks(store) {
  try {
    if (store) {
      const raw = store.getItem("floodsaathi_offline_map_packs");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    }
    return [];
  } catch {
    return [];
  }
}

// 3. Proposed isCoordinatesCached
export function isCoordinatesCached(lat, lon, packs = []) {
  if (typeof lat !== "number" || typeof lon !== "number" || !Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { cached: false, pack: null };
  }
  if (lat > 90 || lat < -90) {
    return { cached: false, pack: null };
  }

  for (const pack of packs) {
    if (!pack || typeof pack.lat !== "number" || typeof pack.lon !== "number") continue;
    let dLonDeg = Math.abs(pack.lon - lon) % 360;
    if (dLonDeg > 180) {
      dLonDeg = 360 - dLonDeg;
    }
    const midLat = ((pack.lat + lat) / 2) * (Math.PI / 180);
    const dLon = dLonDeg * 111.32 * Math.cos(midLat);
    const dLat = (pack.lat - lat) * 111.32;
    const dist = Math.sqrt(dLat * dLat + dLon * dLon);
    if (dist <= pack.radiusKm) {
      return { cached: true, pack };
    }
  }
  return { cached: false, pack: null };
}

// Run unit checks
test("Blueprint 1: Size monotonicity & presets", () => {
  assert.equal(estimateDownloadSize(10), 12);
  assert.equal(estimateDownloadSize(25), 28);
  assert.equal(estimateDownloadSize(50), 65);
  assert.equal(estimateDownloadSize(100), 140);
  assert.equal(estimateDownloadSize("10"), 12);
  assert.equal(estimateDownloadSize("25"), 28);
  assert.equal(estimateDownloadSize("50"), 65);
  assert.equal(estimateDownloadSize("100"), 140);

  const size15 = estimateDownloadSize(15);
  assert.ok(size15 > 10 && size15 < 20);

  let prev = estimateDownloadSize(1);
  for (let r = 2; r <= 150; r++) {
    const cur = estimateDownloadSize(r);
    assert.ok(cur >= prev, `Monotonicity violated at r=${r}: ${cur} < ${prev}`);
    prev = cur;
  }
});

test("Blueprint 2: Boundary values", () => {
  assert.equal(estimateDownloadSize(0), 0);
  assert.equal(estimateDownloadSize(-25), 0);
  assert.equal(estimateDownloadSize(NaN), 0);
  assert.equal(estimateDownloadSize(undefined), 0);
  assert.equal(estimateDownloadSize("abc"), 0);
  assert.ok(Number.isFinite(estimateDownloadSize(50000)));
});

test("Blueprint 3: LocalStorage robustness", () => {
  const mockStore = {
    _map: new Map(),
    getItem(k) { return this._map.get(k) || null; },
    setItem(k, v) { this._map.set(k, String(v)); }
  };

  mockStore.setItem("floodsaathi_offline_map_packs", JSON.stringify({ error: "not an array" }));
  assert.ok(Array.isArray(getDownloadedMapPacks(mockStore)));
  assert.equal(getDownloadedMapPacks(mockStore).length, 0);

  mockStore.setItem("floodsaathi_offline_map_packs", "12345");
  assert.ok(Array.isArray(getDownloadedMapPacks(mockStore)));

  mockStore.setItem("floodsaathi_offline_map_packs", "{ invalid json");
  assert.ok(Array.isArray(getDownloadedMapPacks(mockStore)));
});

test("Blueprint 4: Antimeridian coordinate normalization", () => {
  const packs = [{ lat: 0, lon: 179.9, radiusKm: 50 }];
  const result = isCoordinatesCached(0, -179.9, packs);
  assert.equal(result.cached, true, "Antimeridian wrap-around should be within 50km");
  
  assert.equal(isCoordinatesCached(NaN, NaN, packs).cached, false);
  assert.equal(isCoordinatesCached(95, 0, packs).cached, false);
});
