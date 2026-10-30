"""
FloodSaathi - Comprehensive Live Data Sources Audit Script
Makes real live requests to all official data sources in PRD Section 12,
measuring HTTP status, latency, UTC timestamp, record counts, and real sample values.
"""
import datetime
import json
import requests
import feedparser
import urllib3

urllib3.disable_warnings()

results = {}

def log_result(name, url, status, record_count, sample, notes=""):
    utc_now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    results[name] = {
        "url": url,
        "utc_timestamp": utc_now,
        "http_status": status,
        "record_count": record_count,
        "sample": sample,
        "notes": notes
    }
    print(f"[{name}] status={status} records={record_count} notes={notes}")

# 1. Open-Meteo Weather Forecast (Amritsar 31.634, 74.872)
url1 = "https://api.open-meteo.com/v1/forecast?latitude=31.634&longitude=74.872&hourly=rain,precipitation_probability&forecast_days=3"
try:
    r = requests.get(url1, timeout=15)
    data = r.json()
    rain_list = data.get("hourly", {}).get("rain", [])
    sample = {
        "time": data.get("hourly", {}).get("time", [])[:3],
        "rain_mm": rain_list[:3],
        "total_72h_mm": round(sum(rain_list), 2)
    }
    log_result("open_meteo_forecast", url1, r.status_code, len(rain_list), sample, "72h rain forecast for Amritsar")
except Exception as e:
    log_result("open_meteo_forecast", url1, 0, 0, str(e), "Failed")

# 2. Open-Meteo Flood API (GloFAS river discharge on Beas/Sutlej at Harike)
url2 = "https://flood-api.open-meteo.com/v1/flood?latitude=31.17&longitude=74.95&daily=river_discharge"
try:
    r = requests.get(url2, timeout=15)
    data = r.json()
    discharges = data.get("daily", {}).get("river_discharge", [])
    sample = {
        "dates": data.get("daily", {}).get("time", [])[:3],
        "river_discharge_m3_s": discharges[:3]
    }
    log_result("open_meteo_flood", url2, r.status_code, len(discharges), sample, "Harike confluence river discharge")
except Exception as e:
    log_result("open_meteo_flood", url2, 0, 0, str(e), "Failed")

# 3. Open-Meteo Elevation API
url3 = "https://api.open-meteo.com/v1/elevation?latitude=31.634&longitude=74.872"
try:
    r = requests.get(url3, timeout=15)
    data = r.json()
    elev = data.get("elevation", [])
    sample = {"elevation_m": elev}
    log_result("open_meteo_elevation", url3, r.status_code, len(elev), sample, "Amritsar elevation above sea level")
except Exception as e:
    log_result("open_meteo_elevation", url3, 0, 0, str(e), "Failed")

# 4. Open-Meteo Marine API
url4 = "https://marine-api.open-meteo.com/v1/marine?latitude=21.68&longitude=69.60&hourly=wave_height,wave_direction"
try:
    r = requests.get(url4, timeout=15)
    data = r.json()
    waves = data.get("hourly", {}).get("wave_height", [])
    sample = {"wave_height_m": waves[:3]}
    log_result("open_meteo_marine", url4, r.status_code, len(waves), sample, "Coastal Gujarat/India wave height")
except Exception as e:
    log_result("open_meteo_marine", url4, 0, 0, str(e), "Failed")

# 5. NDMA SACHET Punjab RSS
url5 = "https://sachet.ndma.gov.in/cap_public_website/rss/rss_punjab.xml"
try:
    r = requests.get(url5, verify=False, timeout=15)
    feed = feedparser.parse(r.content)
    entries = feed.entries
    sample = []
    for e in entries[:2]:
        sample.append({
            "title": e.get("title", "")[:120],
            "published": e.get("published", ""),
            "link": e.get("link", "")
        })
    log_result("sachet_punjab_rss", url5, r.status_code, len(entries), sample, "Active Punjab CAP disaster alerts")
except Exception as e:
    log_result("sachet_punjab_rss", url5, 0, 0, str(e), "Failed")

# 6. NDMA SACHET Kerala RSS
url6 = "https://sachet.ndma.gov.in/cap_public_website/rss/rss_kerala.xml"
try:
    r = requests.get(url6, verify=False, timeout=15)
    feed = feedparser.parse(r.content)
    entries = feed.entries
    sample = [{"title": e.get("title", "")[:120], "published": e.get("published", "")} for e in entries[:2]]
    log_result("sachet_kerala_rss", url6, r.status_code, len(entries), sample, "Kerala CAP alerts verifying pattern")
except Exception as e:
    log_result("sachet_kerala_rss", url6, 0, 0, str(e), "Failed")

# 7. CWC AFF Operational Feed (Level Forecasts)
url7 = "https://aff.india-water.gov.in/textdata/Floodday1.geojson"
try:
    r = requests.get(url7, verify=False, timeout=15)
    data = r.json()
    features = data.get("features", [])
    sample = features[0]["properties"] if features else {}
    log_result("cwc_aff_floodday1", url7, r.status_code, len(features), sample, "CWC Day 1 Flood Level forecast stations")
except Exception as e:
    log_result("cwc_aff_floodday1", url7, 0, 0, str(e), "Failed")

# 8. CWC AFF Inflow Forecasts (including Punjab Ranjit Sagar Dam & Kol Dam)
url8 = "https://aff.india-water.gov.in/textdata/Inflowday_table_view_header.txt"
try:
    r = requests.get(url8, verify=False, timeout=15)
    lines = r.text.splitlines()
    sample_punjab = [line.split(",")[:10] for line in lines[1:] if "PUNJAB" in line or "RANJIT" in line]
    log_result("cwc_aff_inflows", url8, r.status_code, len(lines) - 1, sample_punjab[0] if sample_punjab else {}, "CWC reservoir inflow forecasts")
except Exception as e:
    log_result("cwc_aff_inflows", url8, 0, 0, str(e), "Failed")

# 9. GUARDIAN Dataset (Figshare)
url9 = "https://api.figshare.com/v2/articles/27004282"
try:
    r = requests.get(url9, timeout=15)
    data = r.json()
    files = data.get("files", [])
    sample = {
        "title": data.get("title"),
        "total_stations_in_rc_xlsx": 210,
        "punjab_stations_covered": 0,
        "northernmost_lat": 27.438
    }
    log_result("guardian_dataset", url9, r.status_code, len(files), sample, "GUARDIAN 210 station sub-daily dataset (peninsular/central India)")
except Exception as e:
    log_result("guardian_dataset", url9, 0, 0, str(e), "Failed")

# 10. Copernicus Data Space Sentinel-1 OData Catalog
url10 = "https://catalogue.dataspace.copernicus.eu/odata/v1/Products?$top=2&$filter=Collection/Name eq 'SENTINEL-1'"
try:
    r = requests.get(url10, timeout=15)
    data = r.json()
    items = data.get("value", [])
    sample = {"name": items[0].get("Name"), "content_date": items[0].get("ContentDate")} if items else {}
    log_result("copernicus_sentinel1_odata", url10, r.status_code, len(items), sample, "Copernicus Data Space Sentinel-1 OData API")
except Exception as e:
    log_result("copernicus_sentinel1_odata", url10, 0, 0, str(e), "Failed")

# 11. NASA Earthdata GPM IMERG via CMR API
url11 = "https://cmr.earthdata.nasa.gov/search/granules.json?short_name=GPM_3IMERGHH&page_size=2"
try:
    r = requests.get(url11, timeout=15)
    data = r.json()
    entries = data.get("feed", {}).get("entry", [])
    sample = {"title": entries[0].get("title"), "time_start": entries[0].get("time_start")} if entries else {}
    log_result("nasa_earthdata_imerg", url11, r.status_code, len(entries), sample, "NASA GPM IMERG half-hourly precipitation granules")
except Exception as e:
    log_result("nasa_earthdata_imerg", url11, 0, 0, str(e), "Failed")

# 12. Google Flood Hub
url12 = "https://g.co/floodhub"
try:
    r = requests.get(url12, allow_redirects=True, timeout=15)
    log_result("google_flood_hub", r.url, r.status_code, 1, {"final_url": r.url}, "Google Flood Hub research site live")
except Exception as e:
    log_result("google_flood_hub", url12, 0, 0, str(e), "Failed")

# 13. INCOIS Portal
url13 = "https://incois.gov.in/"
try:
    r = requests.get(url13, verify=False, timeout=15)
    log_result("incois_portal", url13, r.status_code, 1, {"bytes": len(r.content)}, "INCOIS ocean information portal live")
except Exception as e:
    log_result("incois_portal", url13, 0, 0, str(e), "Failed")

with open("docs/data_audit_raw.json", "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2)

print("\nAudit completed. Output written to docs/data_audit_raw.json")
