# relay/tests/test_relay.py
import datetime
import pathlib
import pytest
from relay.compute.front import detect_flood_fronts, DEFAULT_REACH_SPEEDS
from relay.publish.builder import build_relay_payload, validate_relay_payload, publish_relay

def test_front_detection():
    # Gauges with one above warning
    gauges = [
        {"id": "G1", "level_m": 3.0, "warning_m": 3.5, "danger_m": 4.0, "trend_m_per_h": 0.1, "observed_at": "2026-10-30T10:00:00+05:30"},
        {"id": "G2", "level_m": 3.6, "warning_m": 3.5, "danger_m": 4.0, "trend_m_per_h": 0.2, "observed_at": "2026-10-30T10:00:00+05:30"}
    ]
    fronts = detect_flood_fronts(gauges)
    assert len(fronts) == 1
    assert fronts[0]["gauge_id"] == "G2"
    assert fronts[0]["level_m"] == 3.6

def test_relay_payload_validation(tmp_path):
    iso_now = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=5, minutes=30))).isoformat()
    sources = {
        "cwc": {"ok": True, "fetched_at": iso_now, "age_min": 5},
        "sachet": {"ok": True, "fetched_at": iso_now, "age_min": 10},
        "openmeteo": {"ok": True, "fetched_at": iso_now, "age_min": 2}
    }
    gauges = [
        {
            "id": "G_HARIKE",
            "name": "Harike Barrage",
            "river": "Sutlej",
            "lat": 31.15,
            "lon": 74.95,
            "level_m": 3.4,
            "warning_m": 3.8,
            "danger_m": 4.5,
            "bank_m": 4.2,
            "trend_m_per_h": 0.05,
            "observed_at": iso_now,
            "upstream_id": None,
            "downstream_id": None,
            "regulated": True
        }
    ]
    alerts = [
        {
            "id": "A101",
            "source": "SACHET",
            "severity": "Moderate",
            "event": "Disaster Alert",
            "headline": "Rain Advisory",
            "description": "Rain expected in Amritsar",
            "area": "Amritsar",
            "effective": iso_now,
            "expires": iso_now,
            "issued_at": iso_now,
            "url": "https://sachet.ndma.gov.in"
        }
    ]
    rain = [
        {
            "district": "Amritsar",
            "lat": 31.634,
            "lon": 74.872,
            "mm_72h": 12.4,
            "hourly_mm": [1.0, 2.0]
        }
    ]

    payload = build_relay_payload(
        region="punjab",
        sources=sources,
        gauges=gauges,
        reach_speeds=DEFAULT_REACH_SPEEDS,
        rain_by_district=rain,
        alerts=alerts
    )

    # Validate against schema
    validate_relay_payload(payload)

    # Publish to temp directory
    out_file = publish_relay(payload, tmp_path)
    assert out_file.exists()
    assert (tmp_path / "latest" / "punjab.json").exists()

    # Check archive directory created
    archive_dir = tmp_path / "archive"
    assert archive_dir.exists()
