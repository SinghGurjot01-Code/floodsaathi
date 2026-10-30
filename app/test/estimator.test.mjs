// app/test/estimator.test.mjs
// Verification of PRD Section 9.7 Test Vectors & Section 8.1 / 9.5 Status Invariants
import test from "node:test";
import assert from "node:assert/strict";

import { computeOfflineEstimate, formatHours } from "../js/estimator.js";
import { computeRawStatus, resolveOfflineStatus, maxStatus } from "../js/status.js";

test("Vector 1: Front 10 km, speeds 4/2.5/1.5, now = t0 + 2h", () => {
  const t0 = new Date("2026-08-30T10:00:00+05:30");
  const now = new Date("2026-08-30T12:00:00+05:30"); // t0 + 2h

  const res = computeOfflineEstimate({
    front: {
      gauge_id: "G1",
      crossed_warning_at: t0.toISOString(),
      km_to_user: 10,
      km_basis: "pack"
    },
    reach_speed_km_h: {
      p75: 4.0,    // fast
      median: 2.5, // likely
      p25: 1.5,    // slow
      basis: "history"
    },
    now,
    source_age_hours: 2
  });

  assert.equal(res.numbers_hidden, false);
  assert.ok(res.arrival);
  // low = (10 / 4) - 2 = 2.5 - 2 = 0.5 h
  assert.equal(res.arrival.low_hours, 0.5);
  // likely = (10 / 2.5) - 2 = 4 - 2 = 2.0 h
  assert.equal(res.arrival.likely_hours, 2.0);
  // high = (10 / 1.5) - 2 = 6.6667 - 2 ≈ 4.67 h
  assert.ok(Math.abs(res.arrival.high_hours - 4.667) < 0.01);

  assert.equal(formatHours(res.arrival.low_hours), "30 min");
  assert.equal(formatHours(res.arrival.likely_hours), "2 h");
  assert.equal(formatHours(res.arrival.high_hours), "5 h");
  assert.match(res.arrival.summary_text, /30 min to 5 h, most likely 2 h/);
});

test("Vector 2: Front 10 km, now = t0 + 3h -> low <= 0", () => {
  const t0 = new Date("2026-08-30T10:00:00+05:30");
  const now = new Date("2026-08-30T13:00:00+05:30"); // t0 + 3h

  const res = computeOfflineEstimate({
    front: {
      gauge_id: "G1",
      crossed_warning_at: t0.toISOString(),
      km_to_user: 10,
      km_basis: "pack"
    },
    reach_speed_km_h: {
      p75: 4.0,
      median: 2.5,
      p25: 1.5,
      basis: "history"
    },
    now,
    source_age_hours: 3
  });

  assert.equal(res.numbers_hidden, false);
  assert.ok(res.arrival);
  // low = 2.5 - 3 = -0.5 <= 0
  assert.equal(res.arrival.low_hours, 0); // clamped
  assert.equal(res.arrival.raw_low_hours, -0.5);
  // high = 6.6667 - 3 ≈ 3.67 h
  assert.ok(Math.abs(res.arrival.high_hours - 3.667) < 0.01);
  assert.equal(res.arrival.status_tag, "may_reach_now");
  assert.equal(res.arrival.summary_text, "May already be reaching your area.");
});

test("Vector 3: Front 10 km, now = t0 + 7h -> high <= 0", () => {
  const t0 = new Date("2026-08-30T10:00:00+05:30");
  const now = new Date("2026-08-30T17:00:00+05:30"); // t0 + 7h

  const res = computeOfflineEstimate({
    front: {
      gauge_id: "G1",
      crossed_warning_at: t0.toISOString(),
      km_to_user: 10,
      km_basis: "pack"
    },
    reach_speed_km_h: {
      p75: 4.0,
      median: 2.5,
      p25: 1.5,
      basis: "history"
    },
    now,
    source_age_hours: 7
  });

  assert.equal(res.numbers_hidden, false);
  assert.ok(res.arrival);
  // high = 6.6667 - 7 = -0.3333 <= 0
  assert.ok(res.arrival.high_hours <= 0);
  assert.equal(res.arrival.status_tag, "likely_reached");
  assert.equal(res.arrival.summary_text, "Water is likely already reaching your area.");
});

test("Vector 4: Age 30 h -> numbers hidden, helplines shown", () => {
  const res = computeOfflineEstimate({
    front: {
      gauge_id: "G1",
      crossed_warning_at: "2026-08-29T10:00:00+05:30",
      km_to_user: 10
    },
    source_age_hours: 30
  });

  assert.equal(res.numbers_hidden, true);
  assert.equal(res.age_band, ">24h");
  assert.equal(res.helplines_required, true);
});

test("Vector 5: Never-lower invariant: Warning -> computed Watch -> stays Warning", () => {
  const previousStatus = "Warning";
  const computedStatus = "Watch";

  // When offline without fresh data or receding report
  const offlineResolved = resolveOfflineStatus({
    previousStatus,
    computedStatus,
    isFreshData: false,
    userReportedReceding: false
  });
  assert.equal(offlineResolved, "Warning", "Offline status must never silently lower");

  // With fresh data, it can lower
  const freshResolved = resolveOfflineStatus({
    previousStatus,
    computedStatus,
    isFreshData: true,
    userReportedReceding: false
  });
  assert.equal(freshResolved, "Watch", "Fresh data allows status to lower");

  // With user reported receding, it can lower
  const recedingResolved = resolveOfflineStatus({
    previousStatus,
    computedStatus,
    isFreshData: false,
    userReportedReceding: true
  });
  assert.equal(recedingResolved, "Watch", "User receding report allows status to lower");
});

test("Vector 6: Trend 0 and level below danger -> stays flat never crosses", () => {
  const res = computeOfflineEstimate({
    now: "2026-08-30T12:00:00+05:30",
    observed_at: "2026-08-30T10:00:00+05:30",
    level_m: 3.2,
    warning_m: 3.5,
    danger_m: 4.0,
    trend_m_per_h: 0,
    source_age_hours: 2
  });

  assert.ok(res.projection);
  assert.equal(res.projection.stays_flat_level, 3.2);
  assert.equal(res.projection.trend_continues_level, 3.2);
  assert.equal(res.projection.projected_crossing_h, null, "No crossing time when trend is 0");
});

test("Vector 7: bank_m null -> ground check skipped, no below ground level text", () => {
  const res = computeOfflineEstimate({
    now: "2026-08-30T12:00:00+05:30",
    observed_at: "2026-08-30T10:00:00+05:30",
    level_m: 3.2,
    warning_m: 3.5,
    danger_m: 4.0,
    bank_m: null,
    village: { hand_m: 1.5, bank_m: null },
    source_age_hours: 2
  });

  assert.ok(res.projection);
  assert.equal(res.projection.ground_check, null, "Ground check must be null when bank_m is null");
});

test("Vector 8: Unified vertical datum HAND ground check", () => {
  // Case A: Stage above bank (1.0m) + bank_height (3.0m) = 4.0m < HAND (4.5m) -> likely_below_ground
  const resA = computeOfflineEstimate({
    now: "2026-08-30T12:00:00+05:30",
    observed_at: "2026-08-30T10:00:00+05:30",
    level_m: 234.5,
    warning_m: 234.0,
    danger_m: 236.0,
    bank_m: 233.5,
    village: { hand_m: 4.5, bank_m: 233.5, bank_height_above_channel: 3.0 },
    source_age_hours: 2
  });
  assert.equal(resA.projection.ground_check, "likely_below_ground");

  // Case B: Stage above bank (2.0m) + bank_height (3.0m) = 5.0m >= HAND (4.5m) -> potential_inundation
  const resB = computeOfflineEstimate({
    now: "2026-08-30T12:00:00+05:30",
    observed_at: "2026-08-30T10:00:00+05:30",
    level_m: 235.5,
    warning_m: 234.0,
    danger_m: 236.0,
    bank_m: 233.5,
    village: { hand_m: 4.5, bank_m: 233.5, bank_height_above_channel: 3.0 },
    source_age_hours: 2
  });
  assert.equal(resB.projection.ground_check, "potential_inundation");
});

test("Phase 4 Arrival: Assumed speed (<5 events) flags rough and widens bounds", () => {
  const res = computeOfflineEstimate({
    front: {
      gauge_id: "G_HARIKE",
      crossed_warning_at: "2026-08-30T06:00:00+05:30",
      km_to_user: 50.0,
      reach_km: 140.0
    },
    reach_speed_km_h: {
      p25: 2.15,
      median: 2.80,
      p75: 3.50,
      basis: "assumed",
      n_events: 2,
      is_rough: true
    },
    now: "2026-08-30T08:00:00+05:30",
    source_age_hours: 2
  });

  assert.ok(res.arrival);
  assert.equal(res.arrival.is_rough, true);
  assert.equal(res.arrival.is_extrapolated, false);
  assert.ok(res.arrival.summary_text.includes("Rough estimate"));
  assert.ok(!res.arrival.summary_text.toLowerCase().includes("safe"), "Never use 'safe' in arrival estimate");
});

test("Phase 4 Arrival: Beyond downstream gauge flags extrapolated", () => {
  const res = computeOfflineEstimate({
    front: {
      gauge_id: "G_RSD",
      crossed_warning_at: "2026-08-30T00:00:00+05:30",
      km_to_user: 190.0, // beyond reach of 165 km
      reach_km: 165.0
    },
    reach_speed_km_h: {
      p25: 2.75,
      median: 2.82,
      p75: 3.11,
      basis: "history",
      n_events: 6,
      is_rough: false
    },
    now: "2026-08-30T08:00:00+05:30",
    source_age_hours: 2
  });

  assert.ok(res.arrival);
  assert.equal(res.arrival.is_extrapolated, true);
  assert.equal(res.arrival.is_rough, true);
  assert.ok(res.arrival.summary_text.includes("Rough estimate"));
});

test("Status rules: Extreme SACHET alert triggers Danger", () => {
  const raw = computeRawStatus({
    gauges: [{ id: "G1", level_m: 2.0, warning_m: 3.5, danger_m: 4.0, trend_m_per_h: 0 }],
    alerts: [{ id: "A1", source: "SACHET", severity: "Extreme", area: "Amritsar", headline: "Flash Flood Alert" }],
    district: "Amritsar"
  });

  assert.equal(raw.status, "Danger");
});

test("Status rules: Level >= warning triggers Warning", () => {
  const raw = computeRawStatus({
    gauges: [{ id: "G1", name: "Harike", level_m: 3.6, warning_m: 3.5, danger_m: 4.0, trend_m_per_h: 0.1 }],
    alerts: []
  });

  assert.equal(raw.status, "Warning");
});

test("Status rules: Rising within 0.5m of warning triggers Watch", () => {
  const raw = computeRawStatus({
    gauges: [{ id: "G1", name: "Harike", level_m: 3.1, warning_m: 3.5, danger_m: 4.0, trend_m_per_h: 0.2 }],
    alerts: []
  });

  assert.equal(raw.status, "Watch");
});
