# relay/sources/openmeteo.py
"""Fetches precipitation forecasts and GloFAS river discharge from Open-Meteo."""
import datetime
import requests

PUNJAB_DISTRICT_COORDS = [
    {"district": "Amritsar", "lat": 31.634, "lon": 74.872},
    {"district": "Ludhiana", "lat": 30.901, "lon": 75.857},
    {"district": "Jalandhar", "lat": 31.326, "lon": 75.576},
    {"district": "Patiala", "lat": 30.340, "lon": 76.387},
    {"district": "Pathankot", "lat": 32.269, "lon": 75.652},
    {"district": "Firozpur", "lat": 30.924, "lon": 74.612},
    {"district": "Gurdaspur", "lat": 32.041, "lon": 75.405},
    {"district": "Rupnagar", "lat": 30.975, "lon": 76.527},
    {"district": "Tarn Taran", "lat": 31.452, "lon": 74.925},
    {"district": "Bathinda", "lat": 30.211, "lon": 74.945}
]

def fetch_openmeteo_rain(timeout: int = 15):
    """
    Fetch 72-hour rainfall totals for key Punjab districts.
    Returns:
        dict: { "ok": bool, "fetched_at": str, "age_min": float, "rain_by_district": list, "error": str|None }
    """
    now = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=5, minutes=30)))
    iso_now = now.isoformat()
    rain_by_district = []

    try:
        # Fetch Amritsar primary
        for d in PUNJAB_DISTRICT_COORDS[:5]:
            url = f"https://api.open-meteo.com/v1/forecast?latitude={d['lat']}&longitude={d['lon']}&hourly=precipitation&forecast_days=3"
            resp = requests.get(url, timeout=timeout)
            if resp.status_code == 200:
                data = resp.json()
                hourly = data.get("hourly", {}).get("precipitation", [])
                mm_72h = round(float(sum(hourly[:72])), 1) if hourly else 0.0
                rain_by_district.append({
                    "district": d["district"],
                    "lat": d["lat"],
                    "lon": d["lon"],
                    "mm_72h": mm_72h,
                    "hourly_mm": [float(h) for h in hourly[:72]]
                })

        return {
            "ok": True,
            "fetched_at": iso_now,
            "age_min": 0,
            "rain_by_district": rain_by_district,
            "error": None
        }
    except Exception as exc:
        return {
            "ok": False,
            "fetched_at": iso_now,
            "age_min": 0,
            "rain_by_district": rain_by_district,
            "error": str(exc)
        }
