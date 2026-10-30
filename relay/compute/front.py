# relay/compute/front.py
"""Flood front detection and reach speed associations."""

DEFAULT_REACH_SPEEDS = [
    {
        "from": "G_RSD",
        "to": "G_HARIKE",
        "km": 165.0,
        "p25": 1.8,
        "median": 2.8,
        "p75": 4.2,
        "n_events": 12,
        "basis": "history"
    },
    {
        "from": "G_KOLDAM",
        "to": "G_HARIKE",
        "km": 210.0,
        "p25": 2.0,
        "median": 3.2,
        "p75": 4.8,
        "n_events": 18,
        "basis": "history"
    }
]

def detect_flood_fronts(gauges: list) -> list:
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
