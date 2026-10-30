# relay/publish/builder.py
"""Builds, validates, and writes latest/punjab.json and archive files."""
import datetime
import json
import pathlib
import jsonschema

SCHEMA_PATH = pathlib.Path(__file__).resolve().parent.parent.parent / "schemas" / "relay.v1.schema.json"

def build_relay_payload(
    region: str = "punjab",
    sources: dict = None,
    gauges: list = None,
    reach_speeds: list = None,
    rain_by_district: list = None,
    alerts: list = None,
    model_forecasts: list = None
) -> dict:
    now = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=5, minutes=30)))
    iso_now = now.isoformat()

    payload = {
        "schema": "floodsaathi.relay.v1",
        "region": region,
        "generated_at": iso_now,
        "sources": sources or {},
        "gauges": gauges or [],
        "reach_speeds": reach_speeds or [],
        "rain_by_district": rain_by_district or [],
        "alerts": alerts or []
    }

    if model_forecasts:
        payload["model_forecasts"] = model_forecasts

    return payload

def validate_relay_payload(payload: dict) -> None:
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    jsonschema.validate(instance=payload, schema=schema)

def publish_relay(payload: dict, out_dir: pathlib.Path) -> pathlib.Path:
    validate_relay_payload(payload)

    # 1. Write latest/punjab.json
    latest_dir = out_dir / "latest"
    latest_dir.mkdir(parents=True, exist_ok=True)
    latest_file = latest_dir / f"{payload['region']}.json"
    latest_file.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")

    # 2. Write archive file YYYY-MM-DD/HH-MM.json
    gen_time = datetime.datetime.fromisoformat(payload["generated_at"])
    date_str = gen_time.strftime("%Y-%m-%d")
    time_str = gen_time.strftime("%H-%M")
    archive_dir = out_dir / "archive" / date_str
    archive_dir.mkdir(parents=True, exist_ok=True)
    archive_file = archive_dir / f"{time_str}.json"
    archive_file.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")

    return latest_file
