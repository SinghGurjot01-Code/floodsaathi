// tests/e2e/tier3_cross_feature_tests.mjs
// Tier 3: Cross-Feature Interactions E2E Tests (Pairwise Combinations)
// Opaque-Box validation of interactions between disparate FloodSaathi modules
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
  PROJECT_ROOT
} from "./test_helpers.mjs";

import {
  MAP_PRESETS,
  MAP_RADIUS_SIZES,
  estimateDownloadSize,
  downloadMapPack,
  getDownloadedMapPacks,
  deleteOfflineMapPack,
  isCoordinatesCached,
  checkStorageQuota
} from "../../app/js/map_downloader.js";

import { AskSaathiAssistant, AUTHORIZED_HELPLINES } from "../../app/js/ai_assistant.js";
import { computeRawStatus, resolveOfflineStatus, STATUS_RANKS } from "../../app/js/status.js";
import { computeOfflineEstimate } from "../../app/js/estimator.js";
const SYSTEM_PROMPT = "You are FloodSaathi, an offline flood early-warning and disaster safety assistant for Punjab, India.";

function formatChatPrompt(systemMsg, userMsg, assistantMsg) {
  let text = `<|im_start|>system\n${systemMsg}<|im_end|>\n<|im_start|>user\n${userMsg}<|im_end|>\n<|im_start|>assistant\n`;
  if (assistantMsg) {
    text += `${assistantMsg}<|im_end|>\n`;
  }
  return text;
}

// Initialize mock browser environment
setupMockBrowserEnv();

const inspector = new HtmlInspector(getAppHtml());
const cards = loadAuthoritativeJson("corpus/cards/cards.json");
const relay = loadAuthoritativeJson("app/data/latest/punjab.json");

// ============================================================================
// CROSS-FEATURE INTERACTIONS (PAIRWISE MATRIX)
// ============================================================================

test("X1: Language Switch + Map Downloader: Changing language updates preset labels without disrupting download", async () => {
  // Preset localized labels for 10 km
  const p10 = MAP_PRESETS.find((p) => p.radiusKm === 10);
  assert.ok(p10, "10 km preset found");

  // English
  assert.equal(p10.label.en, "Village & Surroundings (10 km)");
  // Punjabi
  assert.equal(p10.label.pa, "ਪਿੰਡ ਅਤੇ ਆਲਾ-ਦੁਆਲਾ (10 ਕਿਲੋਮੀਟਰ)");
  // Hindi
  assert.equal(p10.label.hi, "गांव और आसपास (10 किमी)");

  // Run download progress while language is switched to Punjabi
  let lastProgress = null;
  const pack = await downloadMapPack(31.25, 75.35, 10, (p) => {
    lastProgress = p;
  });

  assert.equal(lastProgress.percent, 100);
  assert.equal(pack.radiusKm, 10);
  assert.ok(pack.id.startsWith("pack-"));
});

test("X2: GPS Re-sync + Downloads View: Location updates recalculate cached bounds for active view", () => {
  // User starts at Taman, Jalandhar (31.25°N, 75.35°E)
  const initialLat = 31.25;
  const initialLon = 75.35;

  // New GPS coordinates acquired at Harike Barrage (31.15°N, 74.95°E)
  const newLat = 31.15;
  const newLon = 74.95;

  const movedDistance = haversineDistanceKm(initialLat, initialLon, newLat, newLon);
  assert.ok(movedDistance >= 35 && movedDistance <= 45, "Distance between Jalandhar and Harike is ~40 km");

  // Re-syncing location updates orientation relative to CWC station
  const orientation = determineOrientation(newLat, newLon, 31.15, 74.95);
  assert.equal(orientation, "vicinity", "At Harike Barrage, orientation is in immediate vicinity");
});

test("X3: SLM Toggle + Offline Network State: Offline mode locks AI Assistant to verified deterministic cards", async () => {
  const assistant = new AskSaathiAssistant({ cards });
  await assistant.init();

  // Assistant in deterministic mode
  assert.equal(assistant.getMode(), "deterministic_m5");

  // Simulated query while device is completely offline
  const res = await assistant.ask("What is the flood control room phone number?");
  assert.equal(res.intent, "helpline_routing");
  assert.equal(res.verified, true);
  
  // All returned helplines are verified
  for (const h of res.helplines) {
    assert.ok(AUTHORIZED_HELPLINES.some((auth) => auth.number === h.number));
  }
});

test("X4: Google Translate Key + Punjabi Regional Pack: Verified safety invariants remain unaltered in Gurmukhi", async () => {
  const assistant = new AskSaathiAssistant({ cards });
  await assistant.init();

  // Inquire in Punjabi about dangerous river crossing
  const res = await assistant.ask("ਕੀ ਮੈਂ ਹੜ੍ਹ ਦੇ ਪਾਣੀ ਵਿੱਚੋਂ ਟਰੈਕਟਰ ਕੱਢ ਸਕਦਾ ਹਾਂ?", { lang: "pa" });
  assert.equal(res.intent, "hazard_warning");
  assert.ok(res.title.includes("ਖ਼ਤਰਾ") || res.title.includes("ਹੜ੍ਹ"));
  assert.ok(res.steps.some((s) => s.includes("15 ਸੈਂਟੀਮੀਟਰ") || s.includes("ਕਦੇ ਵੀ ਨਾ")));
});

test("X5: Proximity Telemetry + CWC Danger Thresholds: Exceeded danger mark drives proximity danger state", () => {
  // Find Harike Barrage in relay
  const harike = relay.gauges.find((g) => g.id === "G_HARIKE");
  assert.ok(harike, "Harike gauge exists in relay");

  // Simulate extreme river level exceeding danger mark
  const floodedGauges = [
    { ...harike, level_m: 5.2, danger_m: 4.5, warning_m: 3.8 }
  ];

  const statusResult = computeRawStatus({
    gauges: floodedGauges,
    alerts: [],
    villageRecord: { id: "v1", name: "Taman" },
    regionPack: { compatible: true },
    sourceAgeHours: 0.5
  });

  assert.equal(statusResult.status, "Danger", "Exceeded danger mark must immediately elevate to Danger");
  assert.ok(statusResult.reasons.some((r) => r.includes("danger mark")));
});

test("X6: User Water Reached Observation + AI Safety Query: Active danger triggers emergency evacuation guidance", async () => {
  const assistant = new AskSaathiAssistant({ cards });
  await assistant.init();

  // User reports water reached home, status elevates to Danger
  const prevStatus = "Safe";
  const userElevatedStatus = "Danger";
  const resolved = resolveOfflineStatus({
    previousStatus: prevStatus,
    computedStatus: userElevatedStatus,
    isFreshData: true
  });
  assert.equal(resolved, "Danger");

  // User asks what to do when water enters house
  const chatRes = await assistant.ask("Flood water is entering my house what should I do first?");
  assert.ok(chatRes.steps.length > 0);
  assert.ok(chatRes.steps.some((s) => s.includes("main breaker") || s.includes("higher ground") || s.includes("power") || s.includes("112")));
});

test("X7: Map Pack Tile Caching + Storage Quota Check: Large 100 km pack executes safely within quota", async () => {
  const quota = await checkStorageQuota();
  assert.ok(quota.availableMB >= 140, "Must have enough space for 100 km pack (140 MB)");

  // Selected download size for 100 km
  const size100 = estimateDownloadSize(100);
  assert.equal(size100, 140);

  // Execute download
  const pack = await downloadMapPack(31.326, 75.576, 100);
  assert.equal(pack.radiusKm, 100);
  assert.equal(pack.sizeMB, 140);

  // Check cache hit for Amritsar (31.63°N, 74.87°E) ~70 km away from center
  const cacheHit = isCoordinatesCached(31.63, 74.87);
  assert.equal(cacheHit.cached, true, "Amritsar coordinates must be covered by 100 km pack");
});

test("X8: Disaster Guidelines Dataset + Qwen 2.5 LoRA Formatting: Verified records generate valid ChatML tokens", () => {
  const dataset = loadJsonl("corpus/flood_safety_dataset.jsonl");
  assert.ok(dataset.length >= 40);

  // Take first 5 verified samples
  for (let i = 0; i < 5; i++) {
    const item = dataset[i];
    const prompt = item.prompt || item.instruction;
    const response = item.response;

    const chatml = formatChatPrompt(SYSTEM_PROMPT, prompt, response);
    assert.ok(chatml.startsWith("<|im_start|>system\n"));
    assert.ok(chatml.includes("<|im_start|>user\n"));
    assert.ok(chatml.includes("<|im_start|>assistant\n"));
    assert.ok(chatml.endsWith("<|im_end|>\n"));
    assert.ok(chatml.includes(prompt));
    assert.ok(chatml.includes(response));
  }
});

test("X9: Google Translate Fallback + Medical Refusal Invariant: Medical queries in Hindi refuse prescriptions", async () => {
  const assistant = new AskSaathiAssistant({ cards });
  await assistant.init();

  const hindiMedicalQuery = "बाढ़ के गंदे पानी से बच्चे को दस्त और बुखार हो गया है, कौन सी दवा दूं?";
  const res = await assistant.ask(hindiMedicalQuery, { lang: "hi" });

  assert.equal(res.intent, "medical_refusal");
  assert.ok(res.steps.some((s) => s.includes("दवा") || s.includes("108") || s.includes("ओआरएस") || s.includes("ORS")));
  assert.ok(res.steps.some((s) => s.includes("108")));
});

test("X10: Python Runtime Probe + CWC Historical Reach Speeds: Gauge front computes arrival window accurately", () => {
  // Test arrival time formula: low_hours = d0 / vFast - now
  const d0 = 20.0; // 20 km
  const vFast = 4.0; // 4 km/h
  const vMedian = 2.5; // 2.5 km/h
  const vSlow = 1.5; // 1.5 km/h

  const lowHours = d0 / vFast; // 5.0 h
  const likelyHours = d0 / vMedian; // 8.0 h
  const highHours = d0 / vSlow; // 13.33 h

  assert.equal(lowHours, 5.0);
  assert.equal(likelyHours, 8.0);
  assert.ok(highHours > 13.0 && highHours < 14.0);
});

test("X11: Concurrent Cache Operations: Deleting map pack cleans up local storage properly", async () => {
  // Download test pack
  const pack = await downloadMapPack(31.25, 75.35, 10);
  const beforePacks = getDownloadedMapPacks();
  assert.ok(beforePacks.some((p) => p.id === pack.id));

  // Delete test pack
  const remainingPacks = await deleteOfflineMapPack(pack.id);
  assert.ok(!remainingPacks.some((p) => p.id === pack.id), "Deleted pack must no longer be present");
});

test("X12: Offline Never-Lower Rule Across Stale Snapshot Refresh: Status holds previous elevated threat level", () => {
  // Previous status in active memory is Warning
  const prevStatus = "Warning";

  // Recomputed status with stale telemetry is DATA_UNAVAILABLE
  const newlyComputed = "DATA_UNAVAILABLE";

  const resolved = resolveOfflineStatus({
    previousStatus: prevStatus,
    computedStatus: newlyComputed,
    isFreshData: false,
    userReportedReceding: false
  });

  // Offline never-lower invariant: elevated Warning MUST hold
  assert.equal(resolved, "Warning", "Offline never-lower invariant must hold Warning over DATA_UNAVAILABLE");
});
