// app/test/status_safety.test.mjs
// Phase 2 (P0) Safety Invariant Regression Test Suite:
// Explicit states: LOADING, UNKNOWN, DATA_UNAVAILABLE, WATCH, WARNING, DANGER, SAFE.
// Verifies that missing, loading, stale, or unverified inputs NEVER produce SAFE.
import test from "node:test";
import assert from "node:assert/strict";

import { computeRawStatus, resolveOfflineStatus, STATUS_RANKS } from "../js/status.js";

const VALID_GAUGE = {
  id: "G_HARIKE",
  name: "Harike Barrage",
  river: "Sutlej",
  lat: 31.15,
  lon: 74.95,
  level_m: 3.1,
  warning_m: 3.8,
  danger_m: 4.5,
  trend_m_per_h: 0.0,
  observed_at: new Date().toISOString()
};

const VALID_VILLAGE = {
  id: "pb-asr-001",
  name: "Ajnala",
  lat: 31.84,
  lon: 74.76,
  hand_m: 3.5,
  bank_m: 4.2
};

const VALID_REGION_PACK = {
  district: "amritsar",
  version: "1.0.0",
  compatible: true
};

test("Safety 1: Loading state returns LOADING, never Safe", () => {
  const res = computeRawStatus({
    isLoading: true,
    gauges: [VALID_GAUGE],
    villageRecord: VALID_VILLAGE,
    regionPack: VALID_REGION_PACK
  });
  assert.equal(res.status, "LOADING");
  assert.notEqual(res.status, "Safe");
});

test("Safety 2: Fetch failure returns DATA_UNAVAILABLE, never Safe", () => {
  const res = computeRawStatus({
    fetchFailed: true,
    gauges: [],
    villageRecord: VALID_VILLAGE,
    regionPack: VALID_REGION_PACK
  });
  assert.equal(res.status, "DATA_UNAVAILABLE");
  assert.notEqual(res.status, "Safe");
});

test("Safety 3: Missing gauges returns DATA_UNAVAILABLE, never Safe", () => {
  const res = computeRawStatus({
    gauges: [],
    villageRecord: VALID_VILLAGE,
    regionPack: VALID_REGION_PACK,
    sourceAgeHours: 0
  });
  assert.equal(res.status, "DATA_UNAVAILABLE");
  assert.notEqual(res.status, "Safe");
});

test("Safety 4: Stale snapshot (> 24 hours) returns DATA_UNAVAILABLE, never Safe", () => {
  const res = computeRawStatus({
    gauges: [VALID_GAUGE],
    villageRecord: VALID_VILLAGE,
    regionPack: VALID_REGION_PACK,
    sourceAgeHours: 26.5 // Stale > 24h
  });
  assert.equal(res.status, "DATA_UNAVAILABLE");
  assert.notEqual(res.status, "Safe");
});

test("Safety 5: Missing or invalid village record returns UNKNOWN, never Safe", () => {
  const res = computeRawStatus({
    gauges: [VALID_GAUGE],
    villageRecord: null, // Missing village record
    regionPack: VALID_REGION_PACK,
    sourceAgeHours: 1
  });
  assert.equal(res.status, "UNKNOWN");
  assert.notEqual(res.status, "Safe");
});

test("Safety 6: Missing or incompatible region pack returns UNKNOWN, never Safe", () => {
  const resMissing = computeRawStatus({
    gauges: [VALID_GAUGE],
    villageRecord: VALID_VILLAGE,
    regionPack: null, // Missing region pack
    sourceAgeHours: 1
  });
  assert.equal(resMissing.status, "UNKNOWN");
  assert.notEqual(resMissing.status, "Safe");

  const resIncompatible = computeRawStatus({
    gauges: [VALID_GAUGE],
    villageRecord: VALID_VILLAGE,
    regionPack: { compatible: false }, // Incompatible pack
    sourceAgeHours: 1
  });
  assert.equal(resIncompatible.status, "UNKNOWN");
  assert.notEqual(resIncompatible.status, "Safe");
});

test("Safety 7: SAFE is reached ONLY when all dynamic and static inputs are verified", () => {
  const res = computeRawStatus({
    gauges: [VALID_GAUGE],
    villageRecord: VALID_VILLAGE,
    regionPack: VALID_REGION_PACK,
    alerts: [],
    rain_72h_mm: 5.0,
    sourceAgeHours: 0.5
  });
  assert.equal(res.status, "Safe");
});

test("Safety 8: Offline never-lower invariant holds previous Warning/Danger", () => {
  // If previous status was Warning, and newly computed status is DATA_UNAVAILABLE (stale/disconnected)
  const heldStatus = resolveOfflineStatus({
    previousStatus: "Warning",
    computedStatus: "DATA_UNAVAILABLE",
    isFreshData: false,
    userReportedReceding: false
  });
  assert.equal(heldStatus, "Warning", "Offline status must hold Warning when data becomes unavailable");

  // If previous was Danger, newly computed Watch without fresh data holds Danger
  const heldDanger = resolveOfflineStatus({
    previousStatus: "Danger",
    computedStatus: "Watch",
    isFreshData: false,
    userReportedReceding: false
  });
  assert.equal(heldDanger, "Danger", "Offline status must never silently drop from Danger");
});
