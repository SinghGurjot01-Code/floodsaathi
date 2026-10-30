// tests/e2e/tier4_real_world_tests.mjs
// Tier 4: Real-World Workload Scenarios E2E Tests
// Multi-step realistic user journeys simulating monsoon crises, emergency responses, and cold-start offline operation
// Zero external dependencies, pure ES modules compatible with Node 20+

import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";

import {
  HtmlInspector,
  getAppHtml,
  setupMockBrowserEnv,
  haversineDistanceKm,
  determineOrientation,
  loadAuthoritativeJson,
  loadJsonl,
  runCmd,
  PROJECT_ROOT
} from "./test_helpers.mjs";

import {
  MAP_RADIUS_SIZES,
  estimateDownloadSize,
  downloadMapPack,
  getDownloadedMapPacks,
  isCoordinatesCached
} from "../../app/js/map_downloader.js";

import { AskSaathiAssistant, AUTHORIZED_HELPLINES } from "../../app/js/ai_assistant.js";
import { computeRawStatus, resolveOfflineStatus, STATUS_RANKS } from "../../app/js/status.js";
import { computeOfflineEstimate } from "../../app/js/estimator.js";

// Initialize mock browser environment
setupMockBrowserEnv();

const inspector = new HtmlInspector(getAppHtml());
const cards = loadAuthoritativeJson("corpus/cards/cards.json");
const relay = loadAuthoritativeJson("app/data/latest/punjab.json");
const helplines = loadAuthoritativeJson("corpus/helplines.json");

// ============================================================================
// SCENARIO 1: Rural Punjab User in Jalandhar (Taman Village) Active Monsoon Flood
// ============================================================================

test("Scenario 1: Rural user during active monsoon warning (Map Caching -> GPS -> Telemetry -> AI Safety -> Helplines)", async () => {
  // Step 1: Pre-monsoon map caching
  const packSize = estimateDownloadSize(25);
  assert.equal(packSize, 28, "25 km pack size is 28 MB");
  
  const mapPack = await downloadMapPack(31.25, 75.35, 25);
  assert.equal(mapPack.radiusKm, 25);
  assert.ok(isCoordinatesCached(31.25, 75.35).cached, "Taman coordinates cached in map pack");

  // Step 2: Location and proximity telemetry check
  const harike = relay.gauges.find((g) => g.id === "G_HARIKE");
  assert.ok(harike);
  const distToHarike = haversineDistanceKm(31.25, 75.35, harike.lat, harike.lon);
  assert.ok(distToHarike >= 35 && distToHarike <= 45);
  const orientation = determineOrientation(31.25, 75.35, harike.lat, harike.lon);
  assert.equal(orientation, "upstream");

  // Step 3: Rising river telemetry triggers Warning
  const warningGauges = [
    { ...harike, level_m: 4.1, warning_m: 3.8, danger_m: 4.5, trend_m_per_h: 0.05 }
  ];
  const statusRes = computeRawStatus({
    gauges: warningGauges,
    alerts: [],
    villageRecord: { id: "v_taman", name: "Taman", hand_m: 2.0 },
    regionPack: { compatible: true },
    sourceAgeHours: 1.0
  });
  assert.equal(statusRes.status, "Warning");

  // Step 4: User queries AI assistant regarding tractor crossing
  const assistant = new AskSaathiAssistant({ cards });
  await assistant.init();
  const tractorQuery = await assistant.ask("Water is 1 foot deep on road, can I drive tractor across to market?");
  assert.equal(tractorQuery.intent, "hazard_warning");
  assert.ok(tractorQuery.steps.some((s) => s.includes("15 cm") || s.includes("never")));

  // Step 5: User dials emergency helpline
  const helplineQuery = await assistant.ask("What is the flood helpline number?");
  assert.equal(helplineQuery.intent, "helpline_routing");
  assert.ok(helplineQuery.steps.some((s) => s.includes("112")));
  assert.ok(helplineQuery.steps.some((s) => s.includes("1070")));
});

// ============================================================================
// SCENARIO 2: Midnight Embankment Breach in Amritsar (Ravi Basin)
// ============================================================================

test("Scenario 2: Midnight embankment breach (SACHET Extreme Alert -> Danger Override -> Gurmukhi Wire Safety -> Shelter Lookup)", async () => {
  // Step 1: Official SACHET Extreme Alert arrives for Amritsar
  const sachetAlert = {
    id: "alert-ravi-breach-01",
    event: "Embankment Breach Warning",
    severity: "Extreme",
    headline: "Critical breach on Ravi River secondary bund near Ajnala",
    area: "Amritsar District",
    sender: "NDMA SACHET / Punjab SDMA",
    sent: new Date().toISOString()
  };

  // Step 2: SACHET Extreme takes absolute priority and triggers Danger
  const rawStatus = computeRawStatus({
    gauges: relay.gauges,
    alerts: [sachetAlert],
    district: "Amritsar",
    villageRecord: { id: "v_ajnala", name: "Ajnala", hand_m: 1.5 },
    regionPack: { compatible: true },
    sourceAgeHours: 0.2
  });
  assert.equal(rawStatus.status, "Danger", "SACHET Extreme in user district must immediately trigger Danger");
  assert.ok(rawStatus.reasons.some((r) => r.includes("SACHET Extreme")));

  // Step 3: User submits Gurmukhi electrical wire query to AI assistant
  const assistant = new AskSaathiAssistant({ cards });
  await assistant.init();
  const elecQuery = await assistant.ask("ਹੜ੍ਹ ਦੇ ਪਾਣੀ ਵਿੱਚ ਬਿਜਲੀ ਦੀ ਤਾਰ ਡਿੱਗ ਗਈ ਹੈ, ਕੀ ਕਰੀਏ?", { lang: "pa" });
  assert.equal(elecQuery.intent, "electrical_safety");
  assert.ok(elecQuery.title.includes("ਬਿਜਲੀ"));
  assert.ok(elecQuery.steps.some((s) => s.includes("10 ਮੀਟਰ") || s.includes("10m")));
  assert.ok(elecQuery.steps.some((s) => s.includes("1912")));

  // Step 4: Nearest verified shelters lookup in Amritsar pack
  const sheltersPath = path.join(PROJECT_ROOT, "app", "packs", "region-amritsar", "shelters.geojson");
  assert.ok(fs.existsSync(sheltersPath), "Amritsar shelters.geojson pack must exist");
  const sheltersGeo = JSON.parse(fs.readFileSync(sheltersPath, "utf-8"));
  assert.ok(sheltersGeo.features.length >= 3, "Must have at least 3 verified shelters in Amritsar");
  
  const shelter = sheltersGeo.features[0];
  assert.ok(shelter.properties.name, "Shelter has verified name");
  assert.ok(shelter.properties.capacity >= 50, "Shelter has adequate emergency capacity");
});

// ============================================================================
// SCENARIO 3: Post-Flood Return and Well Disinfection in Firozpur
// ============================================================================

test("Scenario 3: Post-flood recovery (Water Receding -> Safe Status -> 2.5g Bleaching Powder -> Medical Refusal)", async () => {
  // Step 1: User notes water receding and taps observation button
  const prevElevatedStatus = "Danger";
  const newlyRecededStatus = "Safe";
  
  const resolved = resolveOfflineStatus({
    previousStatus: prevElevatedStatus,
    computedStatus: newlyRecededStatus,
    isFreshData: true,
    userReportedReceding: true
  });
  assert.equal(resolved, "Safe", "User reported receding releases offline danger hold");

  // Step 2: Well disinfection query
  const assistant = new AskSaathiAssistant({ cards });
  await assistant.init();
  const wellQuery = await assistant.ask("How to disinfect open drinking water well using bleaching powder?");
  assert.equal(wellQuery.cardId, "card-drinking-water");
  assert.ok(wellQuery.steps.some((s) => s.includes("Boil water") || s.includes("boil") || s.includes("clean")));

  // Step 3: Verify the exact 2.5g / 1000L formula in the guidelines corpus
  const dataset = loadJsonl("corpus/flood_safety_dataset.jsonl");
  const wellRecord = dataset.find((d) => 
    (d.prompt && d.prompt.includes("bleaching powder")) ||
    (d.instruction && d.instruction.includes("bleaching powder"))
  );
  assert.ok(wellRecord, "Must find bleaching powder guideline record");
  assert.ok(wellRecord.response.includes("2.5") && wellRecord.response.includes("1,000"));

  // Step 4: Medical inquiry triggers strict refusal and routes to 108
  const medQuery = await assistant.ask("My child has diarrhea from contaminated well water. What antibiotic dose should I give?");
  assert.equal(medQuery.intent, "medical_refusal");
  assert.ok(medQuery.steps.some((s) => s.includes("cannot prescribe")));
  assert.ok(medQuery.steps.some((s) => s.includes("108")));
  assert.ok(medQuery.steps.some((s) => s.includes("ORS")));
});

// ============================================================================
// SCENARIO 4: Multi-Lingual Field Responder Rapid Assessment
// ============================================================================

test("Scenario 4: Multi-lingual field responder (Hindi Mode -> Alert Radius 50km -> Python Engine Check -> Full Telemetry Sweep)", async () => {
  // Step 1: Verify Hindi translation dictionary availability
  const hi = loadAuthoritativeJson("app/i18n/hi.json");
  assert.ok(hi.app_name.includes("फ्लडसाथी") || hi.app_name.includes("FloodSaathi"));
  assert.ok(hi["nav.downloads"] || hi.nav?.downloads);

  // Step 2: Preferences alert radius 50 km calculation
  const size50 = estimateDownloadSize(50);
  assert.equal(size50, 65, "50 km district radius estimate is 65 MB");

  // Step 3: Python runtime specifications verification
  const viewHtml = inspector.findElementById("view-downloads").content;
  assert.ok(viewHtml.includes("Python Runtime"));
  assert.ok(viewHtml.includes("Local Sidecar") || viewHtml.includes("Browser Native"));

  // Step 4: Multi-station telemetry sweep across basins
  const stations = relay.gauges.map((g) => ({ id: g.id, name: g.name, river: g.river, level: g.level_m }));
  assert.ok(stations.some((s) => s.river.includes("Sutlej")));
  assert.ok(stations.some((s) => s.river.includes("Ravi")));

  // Step 5: Verify all national & state emergency helplines
  const helplineNums = helplines.items.map((h) => h.number);
  assert.ok(helplineNums.includes("112"));
  assert.ok(helplineNums.includes("1078"));
  assert.ok(helplineNums.includes("1070"));
  assert.ok(helplineNums.includes("1077"));
  assert.ok(helplineNums.includes("108"));
});

// ============================================================================
// SCENARIO 5: Cold-Start Device Onboarding Under Airplane Mode
// ============================================================================

test("Scenario 5: Cold-start offline device onboarding (No Network -> Offline Invariant -> Card Checks -> Baseline 100% Pass)", async () => {
  // Step 1: Cold start with zero network and no prior snapshot
  const rawStatus = computeRawStatus({
    gauges: [],
    alerts: [],
    isLoading: false,
    fetchFailed: true
  });
  // Must return DATA_UNAVAILABLE, NEVER Safe!
  assert.equal(rawStatus.status, "DATA_UNAVAILABLE");
  assert.notEqual(rawStatus.status, "Safe");

  // Step 2: Verify all 4 plugin card headers in Downloads view
  const viewHtml = inspector.findElementById("view-downloads").content;
  assert.ok(viewHtml.includes("Punjab Offline Vector Map Pack"));
  assert.ok(viewHtml.includes("FloodSaathi SLM (Qwen2.5-0.5B-Instruct)"));
  assert.ok(viewHtml.includes("Python Runtime &amp; Hydrologic Compute Bridge") || viewHtml.includes("Python Runtime"));
  assert.ok(viewHtml.includes("Regional Language Packs (Hindi &amp; Punjabi Gurmukhi)") || viewHtml.includes("Regional Language Packs"));

  // Step 3: Offline deterministic cards handle queries without internet
  const assistant = new AskSaathiAssistant({ cards });
  await assistant.init();
  const offlineRes = await assistant.ask("Where to find safe flood evacuation shelters?");
  assert.ok(offlineRes.cardId.startsWith("card-evacuation"));
  assert.equal(offlineRes.verified, true);

  // Step 4: Verify zero-mock AST rules pass cleanly
  const mockCheck = runCmd(".venv\\Scripts\\python scripts/check_no_mock.py");
  assert.equal(mockCheck.exitCode, 0);
  assert.ok(mockCheck.stdout.includes("check_no_mock: OK"));

  // Step 5: Verify Pytest model pipeline tests pass cleanly
  const pytestCheck = runCmd(".venv\\Scripts\\python -m pytest relay/tests/test_mobile_model.py");
  assert.equal(pytestCheck.exitCode, 0);
  assert.ok(pytestCheck.stdout.includes("passed"));
});
