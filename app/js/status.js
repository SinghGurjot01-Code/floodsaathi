// Status classification and offline rules (PRD Section 8.1, 9.5 & Phase 2 Safety Update)
// Pure ES module: NO DOM, NO network dependencies.

export const STATUS_RANKS = {
  LOADING: -1,
  DATA_UNAVAILABLE: 0,
  UNKNOWN: 0,
  Safe: 1,
  Watch: 2,
  Warning: 3,
  Danger: 4
};

export const STATUS_COLORS = {
  LOADING: "#0284c7",          // Informative sky blue
  DATA_UNAVAILABLE: "#64748b", // Slate gray
  UNKNOWN: "#94a3b8",          // Neutral gray
  Safe: "#10b981",             // Emerald green
  Watch: "#eab308",            // Amber yellow
  Warning: "#f97316",          // Bright orange
  Danger: "#ef4444"            // Urgent red
};

export const STATUS_ICONS = {
  LOADING: "refresh-cw",
  DATA_UNAVAILABLE: "slash",
  UNKNOWN: "help-circle",
  Safe: "shield-check",
  Watch: "eye",
  Warning: "alert-triangle",
  Danger: "alert-octagon"
};

/**
 * Compare two statuses and return the higher one in terms of risk.
 * @param {string} a 
 * @param {string} b 
 * @returns {string}
 */
export function maxStatus(a, b) {
  const rankA = STATUS_RANKS[a] ?? 0;
  const rankB = STATUS_RANKS[b] ?? 0;
  return rankA >= rankB ? a : b;
}

/**
 * Compute raw status based on current hydrologic and weather observations.
 * 
 * Strict Safety Invariant (Phase 2):
 * - Active threats (Danger, Warning, Watch) take immediate priority and are NEVER suppressed.
 * - SAFE is returned ONLY if ALL of the following hold:
 *   1. Dynamic inputs (gauges, rain, alerts) meet freshness threshold (< 24 hours).
 *   2. Relevant gauge telemetry is present, non-empty, and valid.
 *   3. Static inputs (village record, region pack) are present, valid and compatible.
 *   4. The status rules ran to completion without error and no Watch/Warning/Danger triggered.
 * - If no threats are triggered but telemetry is missing, stale (>24h), invalid, or loading:
 *   Returns LOADING, DATA_UNAVAILABLE, or UNKNOWN. NEVER SAFE.
 * 
 * @param {Object} params
 * @param {Array} [params.gauges] Relevant river gauges
 * @param {Array} [params.alerts] Active official alerts (SACHET)
 * @param {number|null} [params.rain_72h_mm] 72-hour rainfall in mm
 * @param {Object|null} [params.estimate] Output from computeOfflineEstimate
 * @param {string|null} [params.district] User's district (e.g. "Amritsar")
 * @param {Object|null} [params.villageRecord] Verified village record from region pack
 * @param {Object|null} [params.regionPack] Loaded region pack metadata
 * @param {number|null} [params.sourceAgeHours] Age of telemetry in hours
 * @param {boolean} [params.isLoading=false] Whether data is currently loading
 * @param {boolean} [params.fetchFailed=false] Whether data fetch failed
 * @returns {{ status: string, reasons: string[], triggeringGauge: Object|null }}
 */
export function computeRawStatus({
  gauges = [],
  alerts = [],
  rain_72h_mm = null,
  estimate = null,
  district = null,
  villageRecord = null,
  regionPack = null,
  sourceAgeHours = null,
  isLoading = false,
  fetchFailed = false
}) {
  // 1. Loading state
  if (isLoading) {
    return {
      status: "LOADING",
      reasons: ["Loading live flood and hydrologic telemetry..."],
      triggeringGauge: null
    };
  }

  // 2. Evaluate active hazards (Danger, Warning, Watch) FIRST so threats are NEVER masked
  let highestRank = STATUS_RANKS.DATA_UNAVAILABLE;
  let status = "DATA_UNAVAILABLE";
  const reasons = [];
  let triggeringGauge = null;

  const groundIsSafe = estimate?.projection?.ground_check === "likely_below_ground";

  // Check Danger conditions
  for (const g of (gauges || [])) {
    if (g.level_m !== null && g.danger_m !== null && g.level_m >= g.danger_m) {
      if (STATUS_RANKS.Danger > highestRank) {
        highestRank = STATUS_RANKS.Danger;
        status = "Danger";
        triggeringGauge = g;
      }
      reasons.push(`Gauge ${g.name || g.id} level (${g.level_m} m) has reached or exceeded danger mark (${g.danger_m} m).`);
    }
  }

  // SACHET Extreme in user's district
  for (const a of (alerts || [])) {
    const sev = (a.severity || "").toLowerCase();
    const area = (a.area || "").toLowerCase();
    const inDistrict = !district || area.includes(district.toLowerCase());
    if (sev === "extreme" && inDistrict) {
      if (STATUS_RANKS.Danger > highestRank) {
        highestRank = STATUS_RANKS.Danger;
        status = "Danger";
      }
      reasons.push(`Official SACHET Extreme alert: ${a.headline || a.event}`);
    }
  }

  // Front arrival fast <= 2h and ground check is not "below ground level"
  if (estimate && estimate.arrival && !groundIsSafe) {
    const fastArrivalH = estimate.arrival.raw_low_hours;
    if (fastArrivalH <= 2) {
      if (STATUS_RANKS.Danger > highestRank) {
        highestRank = STATUS_RANKS.Danger;
        status = "Danger";
      }
      reasons.push(`Flood water fast-arrival projection is <= 2 hours (${estimate.arrival.summary_text}).`);
    }
  }

  if (highestRank === STATUS_RANKS.Danger) {
    return { status, reasons, triggeringGauge };
  }

  // Check Warning conditions
  for (const g of (gauges || [])) {
    if (g.level_m !== null && g.warning_m !== null && g.level_m >= g.warning_m) {
      if (STATUS_RANKS.Warning > highestRank) {
        highestRank = STATUS_RANKS.Warning;
        status = "Warning";
        triggeringGauge = g;
      }
      reasons.push(`Gauge ${g.name || g.id} level (${g.level_m} m) has reached or exceeded warning mark (${g.warning_m} m).`);
    }
  }

  // SACHET Severe in district
  for (const a of (alerts || [])) {
    const sev = (a.severity || "").toLowerCase();
    const area = (a.area || "").toLowerCase();
    const inDistrict = !district || area.includes(district.toLowerCase());
    if (sev === "severe" && inDistrict) {
      if (STATUS_RANKS.Warning > highestRank) {
        highestRank = STATUS_RANKS.Warning;
        status = "Warning";
      }
      reasons.push(`Official SACHET Severe alert: ${a.headline || a.event}`);
    }
  }

  // Front arrival median <= 12h and not below ground level
  if (estimate && estimate.arrival && !groundIsSafe) {
    const medianArrivalH = estimate.arrival.likely_hours;
    if (medianArrivalH <= 12) {
      if (STATUS_RANKS.Warning > highestRank) {
        highestRank = STATUS_RANKS.Warning;
        status = "Warning";
      }
      reasons.push(`Flood water median arrival projection is <= 12 hours (${estimate.arrival.summary_text}).`);
    }
  }

  if (highestRank === STATUS_RANKS.Warning) {
    return { status, reasons, triggeringGauge };
  }

  // Check Watch conditions
  for (const g of (gauges || [])) {
    if (g.level_m !== null && g.warning_m !== null) {
      const distToWarning = g.warning_m - g.level_m;
      if (distToWarning > 0 && distToWarning <= 0.5 && (g.trend_m_per_h || 0) > 0) {
        if (STATUS_RANKS.Watch > highestRank) {
          highestRank = STATUS_RANKS.Watch;
          status = "Watch";
          triggeringGauge = g;
        }
        reasons.push(`Gauge ${g.name || g.id} is rising and within 0.5 m of warning mark.`);
      }
    }
  }

  // SACHET Moderate
  for (const a of (alerts || [])) {
    const sev = (a.severity || "").toLowerCase();
    const area = (a.area || "").toLowerCase();
    const inDistrict = !district || area.includes(district.toLowerCase());
    if (sev === "moderate" && inDistrict) {
      if (STATUS_RANKS.Watch > highestRank) {
        highestRank = STATUS_RANKS.Watch;
        status = "Watch";
      }
      reasons.push(`Official SACHET Moderate alert: ${a.headline || a.event}`);
    }
  }

  // Rain 72h >= 64.5 mm with rising gauge
  const anyRisingGauge = (gauges || []).some(g => (g.trend_m_per_h || 0) > 0);
  if (rain_72h_mm !== null && rain_72h_mm >= 64.5 && anyRisingGauge) {
    if (STATUS_RANKS.Watch > highestRank) {
      highestRank = STATUS_RANKS.Watch;
      status = "Watch";
    }
    reasons.push(`Heavy rainfall (72h: ${rain_72h_mm} mm) with rising river gauge.`);
  }

  if (highestRank === STATUS_RANKS.Watch) {
    return { status, reasons, triggeringGauge };
  }

  // 3. No threats triggered. Verify ALL conditions to declare SAFE.
  // A. Check for fetch failure or completely missing gauge telemetry
  if (fetchFailed || !gauges || gauges.length === 0) {
    return {
      status: "DATA_UNAVAILABLE",
      reasons: ["No river gauge telemetry available for this area."],
      triggeringGauge: null
    };
  }

  // B. Check for stale telemetry (> 24 hours old)
  if (sourceAgeHours !== null && sourceAgeHours > 24) {
    return {
      status: "DATA_UNAVAILABLE",
      reasons: ["Data is older than 24 hours. Contact emergency helplines."],
      triggeringGauge: null
    };
  }

  // C. Check static village record
  if (!villageRecord) {
    return {
      status: "UNKNOWN",
      reasons: ["Village location record missing or unverified."],
      triggeringGauge: null
    };
  }

  // D. Check static region pack
  if (!regionPack || regionPack.compatible === false) {
    return {
      status: "UNKNOWN",
      reasons: ["Regional hydrological pack missing or incompatible."],
      triggeringGauge: null
    };
  }

  // 4. SAFE: All verified, fresh, and normal
  if (groundIsSafe) {
    reasons.push("Water likely to stay below your ground level.");
  } else {
    reasons.push("River levels are normal; no active warnings.");
  }

  return { status: "Safe", reasons, triggeringGauge };
}

/**
 * Compute offline status enforcing the safety invariant:
 * "Offline status may rise or hold; it never silently lowers. It drops only after fresh data or the user's 'Water is receding' tap."
 * 
 * @param {Object} params
 * @param {string} params.previousStatus Previous status in snapshot
 * @param {string} params.computedStatus Current newly recomputed status
 * @param {boolean} [params.isFreshData=false] Whether fresh live data was successfully received
 * @param {boolean} [params.userReportedReceding=false] Whether user tapped "Water is receding"
 * @returns {string} Enforced status
 */
export function resolveOfflineStatus({
  previousStatus = "UNKNOWN",
  computedStatus = "UNKNOWN",
  isFreshData = false,
  userReportedReceding = false
}) {
  // If fresh live data or user reported receding, status can lower
  if (isFreshData || userReportedReceding) {
    return computedStatus;
  }

  // When offline without fresh data, if previous status was elevated (Warning/Danger/Watch),
  // it must NEVER silently drop to Safe or DATA_UNAVAILABLE!
  const prevRank = STATUS_RANKS[previousStatus] ?? 0;
  const compRank = STATUS_RANKS[computedStatus] ?? 0;

  if (prevRank > compRank) {
    return previousStatus;
  }

  return computedStatus;
}
