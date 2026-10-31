// app/test/map.test.mjs
// Unit tests for Feature F3: Water & Risk Map module (pure logic & offline resilience)

import { test } from "node:test";
import assert from "node:assert/strict";
import { getGaugeStatus, buildGaugesGeoJson, loadMapSpatialLayers, STATUS_COLORS, initWaterMap } from "../js/map.js";

test("Map Logic: getGaugeStatus correctly identifies Safe status below warning mark", () => {
  const gauge = {
    level_m: 205.0,
    warning_m: 210.0,
    danger_m: 212.0,
    trend: 0.0
  };
  const result = getGaugeStatus(gauge);
  assert.equal(result.status, "safe");
  assert.equal(result.color, STATUS_COLORS.safe);
  assert.equal(result.label, "SAFE");
});

test("Map Logic: getGaugeStatus correctly identifies Watch status (within 0.5m of warning and rising)", () => {
  const gauge = {
    level_m: 209.6,
    warning_m: 210.0,
    danger_m: 212.0,
    trend: 0.2
  };
  const result = getGaugeStatus(gauge);
  assert.equal(result.status, "watch");
  assert.equal(result.color, STATUS_COLORS.watch);
  assert.equal(result.label, "WATCH");
});

test("Map Logic: getGaugeStatus correctly identifies Warning status at or above warning mark", () => {
  const gauge = {
    level_m: 210.0,
    warning_m: 210.0,
    danger_m: 212.0,
    trend: 0.1
  };
  const result = getGaugeStatus(gauge);
  assert.equal(result.status, "warning");
  assert.equal(result.color, STATUS_COLORS.warning);
  assert.equal(result.label, "WARNING");
});

test("Map Logic: getGaugeStatus correctly identifies Danger status at or above danger mark", () => {
  const gauge = {
    level_m: 212.5,
    warning_m: 210.0,
    danger_m: 212.0,
    trend: 0.3
  };
  const result = getGaugeStatus(gauge);
  assert.equal(result.status, "danger");
  assert.equal(result.color, STATUS_COLORS.danger);
  assert.equal(result.label, "DANGER");
});

test("Map Logic: buildGaugesGeoJson generates valid GeoJSON FeatureCollection", () => {
  const gauges = [
    {
      id: "harike",
      station_name: "Harike Barrage",
      river: "Sutlej",
      level_m: 208.5,
      warning_m: 210.0,
      danger_m: 212.0,
      trend: 0.1,
      lat: 31.15,
      lon: 74.95,
      observed_at: "2026-10-31T04:00:00Z"
    },
    {
      id: "ranjit_sagar",
      station_name: "Ranjit Sagar Dam",
      river: "Ravi",
      level_m: 528.0,
      warning_m: 524.0,
      danger_m: 527.0,
      trend: 0.5,
      lat: 32.44,
      lon: 75.76,
      observed_at: "2026-10-31T04:00:00Z"
    }
  ];

  const geojson = buildGaugesGeoJson(gauges);
  assert.equal(geojson.type, "FeatureCollection");
  assert.equal(geojson.features.length, 2);

  const f0 = geojson.features[0];
  assert.equal(f0.geometry.type, "Point");
  assert.deepEqual(f0.geometry.coordinates, [74.95, 31.15]);
  assert.equal(f0.properties.name, "Harike Barrage");
  assert.equal(f0.properties.status, "safe");

  const f1 = geojson.features[1];
  assert.equal(f1.properties.name, "Ranjit Sagar Dam");
  assert.equal(f1.properties.status, "danger");
  assert.equal(f1.properties.status_color, STATUS_COLORS.danger);
});

test("Map Logic: loadMapSpatialLayers loads real GeoJSON features safely", async () => {
  const layers = await loadMapSpatialLayers();
  assert.ok(Array.isArray(layers.shelters), "Shelters array exists");
  assert.ok(Array.isArray(layers.hospitals), "Hospitals array exists");
  assert.ok(Array.isArray(layers.riskAreas), "Risk areas array exists");
});

test("Map Resilience: initWaterMap falls back gracefully when WebGL is absent without throwing", async () => {
  const mockContainer = {
    id: "map-container",
    innerHTML: ""
  };
  globalThis.document = {
    getElementById: (id) => (id === "map-container" ? mockContainer : null)
  };

  const res = await initWaterMap("map-container", { lat: 31.326, lon: 75.576, district: "Jalandhar" }, {});
  assert.ok(res, "Initialization returned response");
  assert.ok(mockContainer.innerHTML.includes("Offline Water & Risk Map"), "Fallback contains offline map title");
  assert.ok(mockContainer.innerHTML.includes("OpenStreetMap"), "Mandatory attribution is rendered");
  assert.ok(mockContainer.innerHTML.includes("Harike Barrage"), "Real CWC gauges rendered in fallback view");
});
