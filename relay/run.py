#!/usr/bin/env python3
"""FloodSaathi Relay Runner (PRD Section 7.1)."""
import argparse
import pathlib
import sys

# Ensure repository root is on sys.path
ROOT = pathlib.Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from relay.sources.sachet import fetch_sachet_alerts
from relay.sources.openmeteo import fetch_openmeteo_rain
from relay.sources.cwc import fetch_cwc_gauges
from relay.compute.front import DEFAULT_REACH_SPEEDS
from relay.publish.builder import build_relay_payload, publish_relay

def main():
    parser = argparse.ArgumentParser(description="FloodSaathi Data Relay")
    parser.add_argument("--out", default="./.out", help="Output directory for latest and archive files")
    parser.add_argument("--region", default="punjab", help="Target region")
    parser.add_argument("--publish", action="store_true", help="Publish to configured remote storage")
    args = parser.parse_args()

    out_dir = pathlib.Path(args.out).resolve()
    print(f"Running FloodSaathi Relay for region: {args.region} -> {out_dir}")

    # 1. Fetch live sources
    print("Fetching SACHET Punjab alerts...")
    sachet_res = fetch_sachet_alerts()
    print(f"  SACHET: ok={sachet_res['ok']}, alerts={len(sachet_res['alerts'])}")

    print("Fetching Open-Meteo precipitation...")
    om_res = fetch_openmeteo_rain()
    print(f"  Open-Meteo: ok={om_res['ok']}, districts={len(om_res['rain_by_district'])}")

    print("Fetching CWC / GloFAS river gauges...")
    cwc_res = fetch_cwc_gauges()
    print(f"  CWC/GloFAS: ok={cwc_res['ok']}, gauges={len(cwc_res['gauges'])}")

    sources_meta = {
        "sachet": {"ok": sachet_res["ok"], "fetched_at": sachet_res["fetched_at"], "age_min": sachet_res["age_min"]},
        "openmeteo": {"ok": om_res["ok"], "fetched_at": om_res["fetched_at"], "age_min": om_res["age_min"]},
        "cwc": {"ok": cwc_res["ok"], "fetched_at": cwc_res["fetched_at"], "age_min": cwc_res["age_min"]}
    }

    # 2. Build payload
    payload = build_relay_payload(
        region=args.region,
        sources=sources_meta,
        gauges=cwc_res["gauges"],
        reach_speeds=DEFAULT_REACH_SPEEDS,
        rain_by_district=om_res["rain_by_district"],
        alerts=sachet_res["alerts"]
    )

    # 3. Publish and validate
    try:
        latest_path = publish_relay(payload, out_dir)
        print(f"Relay successfully published and validated: {latest_path}")

        # Also write copy to app/data for local offline serving
        app_data_dir = pathlib.Path(__file__).resolve().parent.parent / "app" / "data"
        publish_relay(payload, app_data_dir)
        print(f"Copied to app/data/latest/{args.region}.json for PWA.")
    except Exception as exc:
        print(f"Error validating or publishing relay: {exc}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
