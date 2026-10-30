// Offline flood estimator (PRD Section 9)
// Pure ES module: NO DOM, NO network dependencies.

/**
 * Format a duration in hours into human-readable string (e.g., "30 min", "2 h", "5 h").
 * @param {number} hours 
 * @returns {string}
 */
export function formatHours(hours) {
  if (hours <= 0) return "0 min";
  const totalMinutes = Math.round(hours * 60);
  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }
  // For horizons >= 3 hours, round to nearest integer hour
  if (hours >= 3) {
    return `${Math.round(hours)} h`;
  }
  const roundedHours = Math.round(hours);
  if (Math.abs(hours - roundedHours) < 0.1) {
    return `${roundedHours} h`;
  }
  const wholeHours = Math.floor(hours);
  const remMinutes = Math.round((hours - wholeHours) * 60);
  if (remMinutes === 0) return `${wholeHours} h`;
  return `${wholeHours} h ${remMinutes} min`;
}

/**
 * Depth band lookup from stage_depth table [[stage, depth], ...]
 * @param {number} stage 
 * @param {Array<[number, number]>} stageDepth 
 * @returns {"none" | "<0.5 m" | "0.5–1.5 m" | ">1.5 m"}
 */
export function getDepthBand(stage, stageDepth) {
  if (!stageDepth || !Array.isArray(stageDepth) || stageDepth.length === 0) {
    return null;
  }
  let interpolatedDepth = 0;
  // Piecewise linear interpolation or step lookup
  if (stage <= stageDepth[0][0]) {
    interpolatedDepth = stageDepth[0][1];
  } else if (stage >= stageDepth[stageDepth.length - 1][0]) {
    interpolatedDepth = stageDepth[stageDepth.length - 1][1];
  } else {
    for (let i = 0; i < stageDepth.length - 1; i++) {
      const [s0, d0] = stageDepth[i];
      const [s1, d1] = stageDepth[i + 1];
      if (stage >= s0 && stage <= s1) {
        const factor = (stage - s0) / (s1 - s0);
        interpolatedDepth = d0 + factor * (d1 - d0);
        break;
      }
    }
  }

  if (interpolatedDepth <= 0.05) return "none";
  if (interpolatedDepth < 0.5) return "<0.5 m";
  if (interpolatedDepth <= 1.5) return "0.5–1.5 m";
  return ">1.5 m";
}

/**
 * Compute offline flood estimate.
 * 
 * @param {Object} params
 * @param {Object} [params.front] { gauge_id, crossed_warning_at, km_to_user, km_basis }
 * @param {Object} [params.reach_speed_km_h] { p25, median, p75, basis }
 * @param {Date|string|number} params.now Current timestamp
 * @param {Date|string|number} [params.observed_at] Timestamp of gauge reading
 * @param {number} [params.level_m] Current gauge level in metres
 * @param {number} [params.warning_m] Warning level in metres
 * @param {number} [params.danger_m] Danger level in metres
 * @param {number} [params.trend_m_per_h] Water level trend in m/h
 * @param {number|null} [params.bank_m] River bank level in metres (null if unknown)
 * @param {Object|null} [params.village] { hand_m, bank_m, stage_depth }
 * @param {Array} [params.observations] [{ type: "reached"|"receding", at: "..." }]
 * @param {number} [params.source_age_hours] Age of data in hours
 * @returns {Object} Estimated arrival times, depth, level projection, and flags
 */
export function computeOfflineEstimate({
  front = null,
  reach_speed_km_h = null,
  now = new Date(),
  observed_at = null,
  level_m = null,
  warning_m = null,
  danger_m = null,
  trend_m_per_h = 0,
  bank_m = null,
  village = null,
  observations = [],
  source_age_hours = 0
}) {
  const nowMs = new Date(now).getTime();

  // Rule 4: Data age > 24 hours -> numbers hidden
  if (source_age_hours > 24) {
    return {
      numbers_hidden: true,
      age_band: ">24h",
      reason: "Data is older than 24 hours. Contact emergency helplines.",
      last_facts: { level_m, warning_m, danger_m, trend_m_per_h, observed_at },
      helplines_required: true
    };
  }

  // Age band designation
  let age_band = "fresh";
  if (source_age_hours >= 6) {
    age_band = "rough_estimate";
  } else if (source_age_hours >= 1) {
    age_band = "estimated";
  }

  // Check user observations (e.g. user reported "reached")
  const recentObservation = observations && observations.length > 0
    ? observations[observations.length - 1]
    : null;

  if (recentObservation && recentObservation.type === "reached") {
    return {
      numbers_hidden: false,
      age_band,
      reached_reported: true,
      summary_text: "Reached (reported by you)",
      status_override: "Danger"
    };
  }

  // Front arrival estimation
  let arrival = null;
  if (front && front.crossed_warning_at && reach_speed_km_h && front.km_to_user > 0) {
    const t0 = new Date(front.crossed_warning_at).getTime();
    const d0 = front.km_to_user;
    const vFast = reach_speed_km_h.p75;     // fast speed -> low arrival time
    const vMedian = reach_speed_km_h.median; // median speed -> likely arrival
    const vSlow = reach_speed_km_h.p25;     // slow speed -> high arrival time

    if (vFast > 0 && vMedian > 0 && vSlow > 0) {
      const arrFastMs = t0 + (d0 / vFast) * 3600 * 1000;
      const arrMedianMs = t0 + (d0 / vMedian) * 3600 * 1000;
      const arrSlowMs = t0 + (d0 / vSlow) * 3600 * 1000;

      const lowH = (arrFastMs - nowMs) / (3600 * 1000);
      const likelyH = (arrMedianMs - nowMs) / (3600 * 1000);
      const highH = (arrSlowMs - nowMs) / (3600 * 1000);

      let summaryText = "";
      let statusTag = "in_transit";

      if (highH <= 0) {
        summaryText = "Water is likely already reaching your area.";
        statusTag = "likely_reached";
      } else if (lowH <= 0) {
        summaryText = "May already be reaching your area.";
        statusTag = "may_reach_now";
      } else {
        const lowStr = formatHours(lowH);
        const highStr = formatHours(highH);
        const likelyStr = formatHours(likelyH);
        summaryText = `Water may reach your area in about ${lowStr} to ${highStr}, most likely ${likelyStr}.`;
      }

      arrival = {
        low_hours: Math.max(0, lowH),
        raw_low_hours: lowH,
        likely_hours: likelyH,
        high_hours: highH,
        status_tag: statusTag,
        summary_text: summaryText,
        basis: reach_speed_km_h.basis || "assumed",
        km_basis: front.km_basis || "pack"
      };
    }
  }

  // Gauge level projection
  let projection = null;
  if (level_m !== null && observed_at) {
    const obsMs = new Date(observed_at).getTime();
    const hoursSinceObs = Math.max(0, (nowMs - obsMs) / (3600 * 1000));
    const cappedHours = Math.min(24, hoursSinceObs);

    const projectedLevel = level_m + (trend_m_per_h || 0) * cappedHours;

    let projectedCrossingH = null;
    if (danger_m !== null && trend_m_per_h > 0 && level_m < danger_m) {
      projectedCrossingH = (danger_m - level_m) / trend_m_per_h;
    }

    // Unified Vertical Datum Ground Check (Phase 3 P1 correction)
    // water_head = (projected_level - bank_m) + bank_height_above_channel
    // If water_head < village.hand_m -> water remains below village ground level.
    let groundCheck = null;
    const effectiveBankM = (bank_m !== null && bank_m !== undefined) 
      ? bank_m 
      : (village && village.bank_m !== null && village.bank_m !== undefined ? village.bank_m : null);

    if (effectiveBankM !== null && village && village.hand_m !== null && village.hand_m !== undefined) {
      const stageAboveBank = projectedLevel - effectiveBankM;
      const bankHeight = village.bank_height_above_channel ?? 0.0;
      const effectiveWaterHead = stageAboveBank + bankHeight;

      if (effectiveWaterHead < village.hand_m) {
        groundCheck = "likely_below_ground"; // "Water likely to stay below your ground level"
      } else {
        groundCheck = "potential_inundation";
      }
    }

    // Depth band if village has stage_depth
    const depthBand = (village && village.stage_depth)
      ? getDepthBand(projectedLevel, village.stage_depth)
      : null;

    projection = {
      stays_flat_level: level_m,
      trend_continues_level: projectedLevel,
      projected_crossing_h: projectedCrossingH,
      ground_check: groundCheck,
      depth_band: depthBand
    };
  }

  return {
    numbers_hidden: false,
    age_band,
    arrival,
    projection,
    source_age_hours
  };
}
