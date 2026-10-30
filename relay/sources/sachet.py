# relay/sources/sachet.py
"""Fetches and parses real NDMA SACHET CAP RSS alerts for Punjab."""
import datetime
import re
import requests
import feedparser
import urllib3

urllib3.disable_warnings()

PUNJAB_RSS_URL = "https://sachet.ndma.gov.in/cap_public_website/rss/rss_punjab.xml"

def fetch_sachet_alerts(timeout: int = 15):
    """
    Fetch official SACHET alerts for Punjab.
    Returns:
        dict: { "ok": bool, "fetched_at": iso_str, "age_min": float, "alerts": list, "error": str|None }
    """
    now = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=5, minutes=30)))
    iso_now = now.isoformat()

    try:
        resp = requests.get(PUNJAB_RSS_URL, verify=False, timeout=timeout)
        if resp.status_code != 200:
            return {
                "ok": False,
                "fetched_at": iso_now,
                "age_min": 0,
                "alerts": [],
                "error": f"HTTP {resp.status_code}"
            }

        feed = feedparser.parse(resp.content)
        alerts = []

        for entry in feed.entries[:50]:
            alert_id = entry.get("id") or entry.get("link") or str(len(alerts) + 1)
            title = (entry.get("title") or "").strip()
            summary = (entry.get("summary") or "").strip()
            published = entry.get("published") or iso_now

            # Severity heuristic from alert wording
            lower_title = title.lower()
            severity = "Moderate"
            if any(w in lower_title for w in ["extreme", "very heavy", "inundation", "flash flood", "danger", "evacuate"]):
                severity = "Extreme"
            elif any(w in lower_title for w in ["severe", "heavy rain", "gusty winds", "warning", "thunder"]):
                severity = "Severe"
            elif any(w in lower_title for w in ["advisory", "watch", "moderate"]):
                severity = "Moderate"

            # Detect affected area
            area = "Punjab"
            districts = [
                "Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib",
                "Fazilka", "Firozpur", "Gurdaspur", "Hoshiarpur", "Jalandhar",
                "Kapurthala", "Ludhiana", "Mansa", "Moga", "Muktsar", "Pathankot",
                "Patiala", "Rupnagar", "S.A.S Nagar", "SAS Nagar", "SBS Nagar",
                "Sangrur", "Tarn Taran", "Malerkotla"
            ]
            found_districts = [d for d in districts if re.search(r"\b" + re.escape(d) + r"\b", title, re.I)]
            if found_districts:
                area = ", ".join(found_districts)

            alerts.append({
                "id": str(alert_id),
                "source": "SACHET",
                "severity": severity,
                "event": "Disaster Alert",
                "headline": title,
                "description": summary or title,
                "area": area,
                "effective": published,
                "expires": published,
                "issued_at": published,
                "url": entry.get("link") or "https://sachet.ndma.gov.in"
            })

        return {
            "ok": True,
            "fetched_at": iso_now,
            "age_min": 0,
            "alerts": alerts,
            "error": None
        }

    except Exception as exc:
        return {
            "ok": False,
            "fetched_at": iso_now,
            "age_min": 0,
            "alerts": [],
            "error": str(exc)
        }
