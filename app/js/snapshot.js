// Snapshot builder and validator (PRD Section 7.2 & schema floodsaathi.snapshot.v1)
import { saveSnapshot, getLatestSnapshot, getObservations } from "./store.js";
import { computeOfflineEstimate } from "./estimator.js";
import { computeRawStatus, resolveOfflineStatus } from "./status.js";

/**
 * Build a valid snapshot from relay data and local profile.
 * 
 * @param {Object} relayData Output from punjab.json (schema floodsaathi.relay.v1)
 * @param {Object} userProfile { lat, lon, elevation_m, village_id, district }
 * @param {Object|null} villageRecord Pack record for village if available
 * @returns {Promise<Object>} Snapshot object (schema floodsaathi.snapshot.v1)
 */
export async function createSnapshotFromRelay(relayData, userProfile, villageRecord = null) {
  const saved_at = new Date().toISOString();
  const observations = await getObservations();

  const user = {
    lat: userProfile.lat ?? 31.634,
    lon: userProfile.lon ?? 74.872,
    elevation_m: userProfile.elevation_m ?? null,
    village_id: userProfile.village_id ?? null
  };

  const gauges = relayData.gauges || [];
  const alerts = relayData.alerts || [];

  // Find nearest upstream gauge or nearest gauge
  let nearestGauge = null;
  let minDistance = Infinity;

  for (const g of gauges) {
    const dLat = (g.lat - user.lat) * 111.0;
    const dLon = (g.lon - user.lon) * 111.0 * Math.cos(user.lat * Math.PI / 180);
    const dist = Math.sqrt(dLat * dLat + dLon * dLon);
    if (dist < minDistance) {
      minDistance = dist;
      nearestGauge = g;
    }
  }

  // Reach speed
  let reach_speed_km_h = null;
  if (relayData.reach_speeds && relayData.reach_speeds.length > 0) {
    reach_speed_km_h = {
      p25: relayData.reach_speeds[0].p25,
      median: relayData.reach_speeds[0].median,
      p75: relayData.reach_speeds[0].p75,
      basis: relayData.reach_speeds[0].basis
    };
  }

  // Front calculation if nearest gauge crossed warning mark
  let front = null;
  if (nearestGauge && nearestGauge.level_m >= nearestGauge.warning_m) {
    front = {
      gauge_id: nearestGauge.id,
      crossed_warning_at: nearestGauge.observed_at || saved_at,
      km_to_user: minDistance * 1.3, // fallback straight_line_x1.3
      km_basis: "straight_line_x1.3"
    };
  }

  // Rain for user's district
  let rain_72h_mm = null;
  if (relayData.rain_by_district && userProfile.district) {
    const match = relayData.rain_by_district.find(
      (r) => r.district.toLowerCase() === userProfile.district.toLowerCase()
    );
    if (match) rain_72h_mm = match.mm_72h;
  }

  // Source age in minutes
  const source_age_min = {};
  if (relayData.sources) {
    for (const [src, info] of Object.entries(relayData.sources)) {
      source_age_min[src] = info.age_min ?? 0;
    }
  }

  const village = villageRecord ? {
    hand_m: villageRecord.hand_m ?? null,
    bank_m: villageRecord.bank_m ?? null,
    stage_depth: villageRecord.stage_depth ?? []
  } : null;

  // Compute estimate
  const estimate = computeOfflineEstimate({
    front,
    reach_speed_km_h,
    now: saved_at,
    observed_at: nearestGauge?.observed_at,
    level_m: nearestGauge?.level_m,
    warning_m: nearestGauge?.warning_m,
    danger_m: nearestGauge?.danger_m,
    trend_m_per_h: nearestGauge?.trend_m_per_h,
    bank_m: nearestGauge?.bank_m,
    village,
    observations,
    source_age_hours: 0 // fresh
  });

  // Compute status
  const rawStatus = computeRawStatus({
    gauges,
    alerts,
    rain_72h_mm,
    estimate,
    district: userProfile.district
  });

  const previousSnapshot = await getLatestSnapshot();
  const previousStatus = previousSnapshot ? previousSnapshot.status : "Safe";

  const resolvedStatus = resolveOfflineStatus({
    previousStatus,
    computedStatus: rawStatus.status,
    isFreshData: true
  });

  const snapshot = {
    schema: "floodsaathi.snapshot.v1",
    saved_at,
    user,
    gauges,
    front,
    reach_speed_km_h,
    rain_72h_mm,
    alerts,
    status: resolvedStatus,
    source_age_min,
    village,
    observations
  };

  await saveSnapshot(snapshot);
  return snapshot;
}

/**
 * Calculate age of snapshot in human-readable terms.
 * @param {string} isoDate 
 * @returns {{ minutes: number, hours: number, display: string }}
 */
export function getSnapshotAge(isoDate) {
  if (!isoDate) return { minutes: 0, hours: 0, display: "just now" };
  const diffMs = Math.max(0, Date.now() - new Date(isoDate).getTime());
  const minutes = Math.floor(diffMs / 60000);
  const hours = diffMs / 3600000;

  let display = "";
  if (minutes < 1) {
    display = "just now";
  } else if (minutes < 60) {
    display = `${minutes} min`;
  } else {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    display = m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  return { minutes, hours, display };
}
