# relay/compute/front.py
"""Flood front detection and reach speed associations."""
from typing import List, Dict, Any
from relay.compute.reach_speeds import HISTORICAL_REACH_DISTRIBUTIONS, get_reach_speed

# Formatted reach speeds for relay payloads
DEFAULT_REACH_SPEEDS = [
    {
        "from": r["from"],
        "to": r["to"],
        "km": r["km"],
        "p25": r["speed_p25"],
        "median": r["speed_median"],
        "p75": r["speed_p75"],
        "n_events": r["n_events"],
        "basis": r["basis"],
        "is_rough": r["n_events"] < 5 or r["basis"] == "assumed",
        "is_regulated": r.get("is_regulated", False)
    }
    for r in HISTORICAL_REACH_DISTRIBUTIONS
]

def detect_flood_fronts(gauges: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Check gauges for flood front initiation (crossing warning or danger marks).
    Returns list of active fronts.
    """
    fronts = []
    for g in gauges:
        level = g.get("level_m")
        warning = g.get("warning_m")
        if level is not None and warning is not None and level >= warning:
            fronts.append({
                "gauge_id": g["id"],
                "crossed_warning_at": g.get("observed_at"),
                "level_m": level,
                "warning_m": warning,
                "trend_m_per_h": g.get("trend_m_per_h", 0.0)
            })
    return fronts
