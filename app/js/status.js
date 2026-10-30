// Status classification and offline rules (PRD Section 8.1 & 9.5)
// Pure ES module: NO DOM, NO network dependencies.

export const STATUS_RANKS = {
  Safe: 0,
  Watch: 1,
  Warning: 2,
  Danger: 3
};

export const STATUS_COLORS = {
  Safe: "#10b981",    // Emerald green
  Watch: "#eab308",   // Amber yellow
  Warning: "#f97316", // Bright orange
  Danger: "#ef4444"   // Urgent red
};

export const STATUS_ICONS = {
  Safe: "shield-check",
  Watch: "eye",
  Warning: "alert-triangle",
  Danger: "alert-octagon"
};

/**
 * Compare two statuses and return the higher one.
 * @param {"Safe"|"Watch"|"Warning"|"Danger"} a 
 * @param {"Safe"|"Watch"|"Warning"|"Danger"} b 
 * @returns {"Safe"|"Watch"|"Warning"|"Danger"}
 */
export function maxStatus(a, b) {
  const rankA = STATUS_RANKS[a] ?? 0;
  const rankB = STATUS_RANKS[b] ?? 0;
  return rankA >= rankB ? a : b;
}

/**
 * Compute raw status based on current hydrologic and weather observations.
 * 
 * @param {Object} params
 * @param {Array} [params.gauges] Relevant river gauges
 * @param {Array} [params.alerts] Active official alerts (SACHET)
 * @param {number|null} [params.rain_72h_mm] 72-hour rainfall in mm
 * @param {Object|null} [params.estimate] Output from computeOfflineEstimate
 * @param {string|null} [params.district] User's district (e.g. "Amritsar")
 * @returns {{ status: "Safe"|"Watch"|"Warning"|"Danger", reasons: string[], triggeringGauge: Object|null }}
 */
export function computeRawStatus({
  gauges = [],
  alerts = [],
  rain_72h_mm = null,
  estimate = null,
  district = null
}) {
  let highestRank = STATUS_RANKS.Safe;
  let status = "Safe";
  const reasons = [];
  let triggeringGauge = null;

  const groundIsSafe = estimate?.projection?.ground_check === "likely_below_ground";

  // 1. Check Danger conditions
  for (const g of gauges) {
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
  for (const a of alerts) {
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

  // 2. Check Warning conditions
  for (const g of gauges) {
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
  for (const a of alerts) {
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

  // 3. Check Watch conditions
  // Gauge within 0.5 m below warning mark AND trend > 0
  for (const g of gauges) {
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
  for (const a of alerts) {
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
  const anyRisingGauge = gauges.some(g => (g.trend_m_per_h || 0) > 0);
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

  // 4. Safe
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
 * @param {string} params.previousStatus Previous status in snapshot ("Safe"|"Watch"|"Warning"|"Danger")
 * @param {string} params.computedStatus Current newly recomputed status
 * @param {boolean} [params.isFreshData=false] Whether fresh live data was successfully received
 * @param {boolean} [params.userReportedReceding=false] Whether user tapped "Water is receding"
 * @returns {string} Enforced status
 */
export function resolveOfflineStatus({
  previousStatus = "Safe",
  computedStatus = "Safe",
  isFreshData = false,
  userReportedReceding = false
}) {
  // If fresh live data or user reported receding, status can lower
  if (isFreshData || userReportedReceding) {
    return computedStatus;
  }

  // Otherwise, offline status can only rise or hold, NEVER lower
  return maxStatus(previousStatus, computedStatus);
}
