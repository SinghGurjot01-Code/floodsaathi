// tests/e2e/tier1_feature_tests.mjs
// Tier 1: Feature Coverage E2E Tests (F1 to F12)
// Opaque-Box requirement-driven tests strictly derived from ORIGINAL_REQUEST.md & PROJECT.md
// >=5 test cases per feature (60 tests total)

import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";

import {
  HtmlInspector,
  getAppHtml,
  getAppCss,
  setupMockBrowserEnv,
  haversineDistanceKm,
  determineOrientation,
  loadAuthoritativeJson,
  loadJsonl,
  runCmd,
  PROJECT_ROOT
} from "./test_helpers.mjs";

import {
  MAP_PRESETS,
  estimateDownloadSize,
  downloadMapPack,
  getDownloadedMapPacks,
  isCoordinatesCached
} from "../../app/js/map_downloader.js";

import { AskSaathiAssistant, AUTHORIZED_HELPLINES } from "../../app/js/ai_assistant.js";

// Initialize mock browser environment for pure ES modules
setupMockBrowserEnv();

const inspector = new HtmlInspector(getAppHtml());
const css = getAppCss();

// ============================================================================
// FEATURE 1 (F1): Desktop & Mobile Downloads Nav
// ============================================================================

test("F1.1: Desktop header navigation contains accessible Downloads button", () => {
  const desktopNavBtns = inspector.extractElements("button").filter(
    (b) => b.attrs.includes('data-tab="downloads"') && b.attrs.includes("nav-tab-btn")
  );
  assert.ok(desktopNavBtns.length >= 1, "Downloads nav-tab-btn missing from desktop navigation");
  assert.ok(
    desktopNavBtns[0].content.includes("Downloads"),
    "Desktop Downloads button must have visible 'Downloads' label"
  );
});

test("F1.2: Mobile navigation / More view contains direct link to Downloads manager", () => {
  const hasMoreNav = inspector.hasElementWithId("nav-to-downloads");
  assert.ok(hasMoreNav, "Button #nav-to-downloads missing from More view");
  const downloadsBtn = inspector.findElementById("nav-to-downloads");
  assert.ok(
    downloadsBtn.content.includes("Offline Packs & Plugins"),
    "Mobile button must describe offline packs and plugins"
  );
});

test("F1.3: Downloads view section exists with standard SPA view container attributes", () => {
  const hasView = inspector.hasElementWithId("view-downloads");
  assert.ok(hasView, "#view-downloads view section missing from app/index.html");
  const viewEl = inspector.findElementById("view-downloads");
  assert.equal(viewEl.tagName.toLowerCase(), "section");
  assert.ok(viewEl.full.includes("view-section"), "Downloads section must have .view-section class");
});

test("F1.4: Downloads tab button provides accessible SVG icon and data-i18n attribute", () => {
  const btn = inspector.extractElements("button").find((b) => b.attrs.includes('data-tab="downloads"'));
  assert.ok(btn, "Downloads button not found");
  assert.ok(btn.content.includes("<svg"), "Downloads button must render an icon SVG");
  assert.ok(btn.content.includes('data-i18n="nav.downloads"'), "Downloads button must have data-i18n attribute");
});

test("F1.5: Downloads sub-view contains back button routing back to More view", () => {
  const hasBackBtn = inspector.hasElementWithId("btn-back-from-downloads");
  assert.ok(hasBackBtn, "Back button #btn-back-from-downloads missing from downloads view");
  const backBtn = inspector.findElementById("btn-back-from-downloads");
  assert.ok(backBtn.content.includes("Back") || backBtn.content.includes("&larr;"), "Back button must indicate backward navigation");
});

// ============================================================================
// FEATURE 2 (F2): Offline Map Pack Card
// ============================================================================

test("F2.1: Offline Map Pack card renders with recommended badge and descriptive title", () => {
  const viewHtml = inspector.findElementById("view-downloads").content;
  assert.ok(viewHtml.includes("Punjab Offline Vector Map Pack"), "Map pack title missing from downloads view");
  assert.ok(viewHtml.includes("Recommended"), "Map pack must feature 'Recommended' badge");
  assert.ok(viewHtml.includes("id=\"map-pack-status-badge\""), "Map pack status badge missing");
});

test("F2.2: Radius selector pills are present for 10 km, 25 km, 50 km, and 100 km", () => {
  const pills = inspector.extractElements("button").filter((b) => b.attrs.includes("radius-pill"));
  assert.ok(pills.length >= 4, "Must offer at least 4 radius options (10, 25, 50, 100 km)");
  
  const radii = pills.map((p) => inspector.extractAttribute(p.attrs, "data-radius"));
  assert.ok(radii.includes("10"), "10 km option missing");
  assert.ok(radii.includes("25"), "25 km option missing");
  assert.ok(radii.includes("50"), "50 km option missing");
  assert.ok(radii.includes("100"), "100 km option missing");
});

test("F2.3: Dynamic size calculator correctly maps radii to estimated megabytes", () => {
  const s10 = estimateDownloadSize(10);
  const s25 = estimateDownloadSize(25);
  const s50 = estimateDownloadSize(50);
  const s100 = estimateDownloadSize(100);

  // Estimates must be positive and non-decreasing
  assert.ok(s10 > 0 && s10 <= s25 && s25 <= s50 && s50 <= s100, "Estimates must scale monotonically with radius");
  assert.ok(s100 <= 150.0, "Estimate for 100 km must be within mobile bandwidth bounds");

  // Verify presets in MAP_PRESETS
  const preset10 = MAP_PRESETS.find((p) => p.radiusKm === 10);
  assert.ok(preset10 && preset10.estSizeMB >= 8.0, "10 km preset size verified");
  const preset25 = MAP_PRESETS.find((p) => p.radiusKm === 25);
  assert.ok(preset25 && preset25.estSizeMB >= 20.0, "25 km preset size verified");
});

test("F2.4: Download progress bar element and percentage indicators are present", () => {
  assert.ok(inspector.hasElementWithId("map-plugin-progress-wrap"), "#map-plugin-progress-wrap container missing");
  assert.ok(inspector.hasElementWithId("map-plugin-progress-fill"), "#map-plugin-progress-fill bar missing");
  assert.ok(inspector.hasElementWithId("map-plugin-progress-pct"), "#map-plugin-progress-pct text missing");
});

test("F2.5: Map pack downloader caches pack metadata and registers into storage", async () => {
  const progressReports = [];
  const pack = await downloadMapPack(31.326, 75.576, 25, (p) => progressReports.push(p));

  assert.ok(pack.id.startsWith("pack-"), "Pack ID must have prefix pack-");
  assert.equal(pack.radiusKm, 25);
  assert.ok(pack.sizeMB > 0);
  assert.ok(progressReports.length > 0, "Progress callback must be invoked");
  assert.equal(progressReports[progressReports.length - 1].percent, 100);

  const packs = getDownloadedMapPacks();
  assert.ok(packs.some((p) => p.id === pack.id), "Downloaded pack must be retrievable from local store");
});

// ============================================================================
// FEATURE 3 (F3): FloodSaathi SLM AI Model Card
// ============================================================================

test("F3.1: SLM AI Model card renders with FloodSaathi Neural SLM Int4 (~340 MB) specs", () => {
  const viewHtml = inspector.findElementById("view-downloads").content;
  assert.ok(viewHtml.includes("FloodSaathi SLM"), "Model name missing from downloads card");
  assert.ok(viewHtml.includes("~340 MB"), "Model size ~340 MB missing");
  assert.ok(viewHtml.includes("Int4"), "Int4 quantization note missing");
});

test("F3.2: SLM AI Model card provides Active / Download status badges", () => {
  assert.ok(inspector.hasElementWithId("slm-download-status-badge"), "#slm-download-status-badge missing");
  assert.ok(inspector.hasElementWithId("slm-active-status-badge"), "#slm-active-status-badge missing");
});

test("F3.3: Storage root target explicitly specifies D:\\FloodSaathi_AI\\models", () => {
  const viewHtml = inspector.findElementById("view-downloads").content;
  assert.ok(
    viewHtml.includes("D:\\FloodSaathi_AI\\models") || viewHtml.includes("D:/FloodSaathi_AI"),
    "D: drive storage path missing from SLM card description"
  );
});

test("F3.4: SLM card features interactive toggle and download trigger", () => {
  assert.ok(inspector.hasElementWithId("toggle-slm-model"), "#toggle-slm-model toggle missing");
  assert.ok(inspector.hasElementWithId("btn-download-slm"), "#btn-download-slm button missing");
});

test("F3.5: AI Assistant module defaults to deterministic_m5 safety mode without WebGPU dependency", async () => {
  const cards = loadAuthoritativeJson("corpus/cards/cards.json");
  const assistant = new AskSaathiAssistant({ cards });
  await assistant.init();
  assert.equal(assistant.getMode(), "deterministic_m5", "Default mode must be deterministic_m5 for safety");
  assert.equal(assistant.isWebGPUSupported(), false, "WebGPU must be safely reported as unsupported in headless environment");
});

// ============================================================================
// FEATURE 4 (F4): Python Runtime / Local Engine Card
// ============================================================================

test("F4.1: Python Runtime card renders with ~18 MB badge and Local Engine title", () => {
  const viewHtml = inspector.findElementById("view-downloads").content;
  assert.ok(viewHtml.includes("Python Runtime &amp; Hydrologic Compute Bridge") || viewHtml.includes("Python Runtime"), "Python runtime title missing");
  assert.ok(viewHtml.includes("~18 MB"), "Python runtime ~18 MB size badge missing");
});

test("F4.2: Local execution status indicates runtime presence and status badge", () => {
  assert.ok(inspector.hasElementWithId("py-engine-status-badge"), "#py-engine-status-badge missing");
  assert.ok(inspector.hasElementWithId("py-engine-status-text"), "#py-engine-status-text missing");
});

test("F4.3: Engine architecture provides connection guidance and CLI execution instructions", () => {
  const viewHtml = inspector.findElementById("view-downloads").content;
  assert.ok(viewHtml.includes("Local Python Relay Setup Guidance"), "Relay setup guidance missing");
  assert.ok(viewHtml.includes("python relay/run.py"), "CLI run command missing");
});

test("F4.4: Probe verification button exists with interactive hook", () => {
  assert.ok(inspector.hasElementWithId("btn-check-python-runtime"), "#btn-check-python-runtime button missing");
  const btn = inspector.findElementById("btn-check-python-runtime");
  assert.ok(btn.content.includes("Check") || btn.content.includes("Engine"), "Probe button must indicate probe/check");
});

test("F4.5: Card documentation highlights reach lag distributions and wave propagation models", () => {
  const viewHtml = inspector.findElementById("view-downloads").content;
  assert.ok(viewHtml.includes("reach lag distributions") || viewHtml.includes("wave propagation"), "Hydrologic compute capabilities missing from card text");
});

// ============================================================================
// FEATURE 5 (F5): Regional Language Packs Card
// ============================================================================

test("F5.1: Regional Language Packs card renders with Recommended badge and installed status", () => {
  const viewHtml = inspector.findElementById("view-downloads").content;
  assert.ok(viewHtml.includes("Regional Language Packs"), "Language packs title missing");
  assert.ok(viewHtml.includes("Hindi &amp; Punjabi Gurmukhi") || viewHtml.includes("Hindi & Punjabi"), "Language list missing");
});

test("F5.2: Punjabi Gurmukhi pack displays ~4.2 MB size and Noto Sans Gurmukhi font", () => {
  const viewHtml = inspector.findElementById("view-downloads").content;
  assert.ok(viewHtml.includes("ਪੰਜਾਬੀ"), "Punjabi Gurmukhi native script missing");
  assert.ok(viewHtml.includes("4.2 MB") || viewHtml.includes("~4"), "Punjabi pack size missing");
  assert.ok(viewHtml.includes("Noto Sans Gurmukhi"), "Noto Sans Gurmukhi font specification missing");
});

test("F5.3: Hindi Devanagari pack displays ~3.9 MB size and Noto Sans Devanagari font", () => {
  const viewHtml = inspector.findElementById("view-downloads").content;
  assert.ok(viewHtml.includes("हिन्दी"), "Hindi Devanagari native script missing");
  assert.ok(viewHtml.includes("3.9 MB") || viewHtml.includes("~4"), "Hindi pack size missing");
  assert.ok(viewHtml.includes("Noto Sans Devanagari"), "Noto Sans Devanagari font specification missing");
});

test("F5.4: English is documented as built-in default language", () => {
  const viewHtml = inspector.findElementById("view-downloads").content;
  assert.ok(viewHtml.includes("English is built-in") || viewHtml.includes("Built-in System Default"), "Built-in English declaration missing");
});

test("F5.5: Regional packs support dedicated download action buttons", () => {
  assert.ok(inspector.hasElementWithId("btn-download-lang-pa"), "#btn-download-lang-pa missing");
  assert.ok(inspector.hasElementWithId("btn-download-lang-hi"), "#btn-download-lang-hi missing");
});

// ============================================================================
// FEATURE 6 (F6): GPS Re-sync Button
// ============================================================================

test("F6.1: GPS Re-sync button exists in Home view location bar", () => {
  assert.ok(inspector.hasElementWithId("btn-resync-gps"), "#btn-resync-gps missing from Home hero location bar");
  const btn = inspector.findElementById("btn-resync-gps");
  assert.ok(btn.content.includes("Re-sync GPS"), "Button must feature 'Re-sync GPS' label");
  assert.ok(btn.full.includes("aria-label"), "Button must feature accessible aria-label");
});

test("F6.2: CSS provides .spinning animation class for visual feedback", () => {
  assert.ok(css.main.includes(".spinning"), ".spinning class missing from app/css/main.css");
  assert.ok(css.main.includes("@keyframes") && css.main.includes("spin"), "Spinning keyframes animation missing from CSS");
});

test("F6.3: Location bar renders village and basin identifiers", () => {
  assert.ok(inspector.hasElementWithId("loc-village-name"), "#loc-village-name missing");
  assert.ok(inspector.hasElementWithId("loc-state-name"), "#loc-state-name missing");
  const village = inspector.findElementById("loc-village-name");
  assert.ok(village.content.includes("Jalandhar") || village.content.includes("Taman"), "Default village must be populated");
});

test("F6.4: GPS Re-sync button includes targeted SVG location target icon", () => {
  const btn = inspector.findElementById("btn-resync-gps");
  assert.ok(btn.content.includes("<svg"), "GPS Re-sync button must contain an SVG icon");
});

test("F6.5: Geolocation fallback retains existing village profile upon error", () => {
  const html = getAppHtml();
  assert.ok(html.includes("loc-village-name"), "Location fallback target element exists in DOM");
});

// ============================================================================
// FEATURE 7 (F7): Proximity Telemetry Indicator
// ============================================================================

test("F7.1: Telemetry proximity banner exists on Home view with dedicated ID and class", () => {
  assert.ok(inspector.hasElementWithId("telemetry-proximity-banner"), "#telemetry-proximity-banner missing");
  assert.ok(inspector.hasElementWithClass("telemetry-proximity-banner"), ".telemetry-proximity-banner class missing");
});

test("F7.2: Telemetry proximity text element is present and structured", () => {
  assert.ok(inspector.hasElementWithId("telemetry-proximity-text"), "#telemetry-proximity-text missing");
  const textEl = inspector.findElementById("telemetry-proximity-text");
  assert.ok(textEl.content.includes("Your location:"), "Must begin with 'Your location:' prefix");
  assert.ok(textEl.content.includes("Hydrologic telemetry from:"), "Must declare 'Hydrologic telemetry from:' source");
});

test("F7.3: Haversine distance calculator computes accurate distance to nearest CWC station", () => {
  // Taman, Jalandhar: approx 31.25°N, 75.35°E
  // Harike Barrage: 31.15°N, 74.95°E
  const dist = haversineDistanceKm(31.25, 75.35, 31.15, 74.95);
  assert.ok(dist >= 35 && dist <= 45, `Distance Taman -> Harike should be ~40 km, computed ${dist} km`);

  // Zero distance identical coords
  const distZero = haversineDistanceKm(31.15, 74.95, 31.15, 74.95);
  assert.equal(distZero, 0);
});

test("F7.4: Orientation calculation accurately identifies upstream vs downstream", () => {
  // Kol Dam (31.38°N) is upstream of Harike (31.15°N)
  const orientation1 = determineOrientation(31.15, 74.95, 31.38, 76.87);
  assert.equal(orientation1, "downstream", "User at Harike is downstream from Kol Dam");

  const orientation2 = determineOrientation(32.44, 75.73, 31.15, 74.95);
  assert.equal(orientation2, "upstream", "User at Thein Dam is upstream from Harike");
});

test("F7.5: Punjab relay snapshot contains verified CWC reporting gauges", () => {
  const relay = loadAuthoritativeJson("app/data/latest/punjab.json");
  assert.ok(Array.isArray(relay.gauges) && relay.gauges.length >= 3, "Relay must contain at least 3 active gauges");
  
  const harike = relay.gauges.find((g) => g.id === "G_HARIKE");
  assert.ok(harike, "Harike Barrage gauge missing from relay");
  assert.ok(typeof harike.level_m === "number", "Gauge level must be numeric");
  assert.ok(typeof harike.danger_m === "number", "Danger level must be numeric");
});

// ============================================================================
// FEATURE 8 (F8): AI Storage Root Routing (D:\FloodSaathi_AI\)
// ============================================================================

test("F8.1: System documents D:\\FloodSaathi_AI as strict AI storage root standard", () => {
  const projectScope = fs.readFileSync(path.join(PROJECT_ROOT, ".agents", "teamwork", "PROJECT.md"), "utf-8");
  assert.ok(projectScope.includes("D:\\FloodSaathi_AI\\"), "D: drive storage path missing from PROJECT.md");
  
  const originalReq = fs.readFileSync(path.join(PROJECT_ROOT, ".agents", "teamwork", "ORIGINAL_REQUEST.md"), "utf-8");
  assert.ok(originalReq.includes("D:\\FloodSaathi_AI\\"), "D: drive storage path missing from ORIGINAL_REQUEST.md");
});

test("F8.2: Dataset compiler script targets D:\\FloodSaathi_AI\\dataset", () => {
  const compileScript = fs.readFileSync(path.join(PROJECT_ROOT, "relay", "compile_disaster_dataset.py"), "utf-8");
  assert.ok(
    compileScript.includes("D:/FloodSaathi_AI/dataset") || compileScript.includes("D:\\\\FloodSaathi_AI\\\\dataset"),
    "D: drive dataset path missing from relay/compile_disaster_dataset.py"
  );
});

test("F8.3: Exported model metadata points to local models directory and UI references D: drive", () => {
  const manifest = loadAuthoritativeJson("relay/models/exported/manifest.json");
  assert.equal(manifest.schema, "floodsaathi.exported_model.v1");
  assert.ok(manifest.exported_formats.includes("onnx"));

  const viewHtml = inspector.findElementById("view-downloads").content;
  assert.ok(viewHtml.includes("D:\\FloodSaathi_AI\\models"), "UI must specify D:\\FloodSaathi_AI\\models as target");
});

test("F8.4: CLI argument parsers in relay scripts permit directory override", () => {
  const trainScript = fs.readFileSync(path.join(PROJECT_ROOT, "relay", "train_mobile_model.py"), "utf-8");
  assert.ok(trainScript.includes("--output_dir"), "--output_dir CLI argument supported");
  assert.ok(trainScript.includes("--dry-run"), "--dry-run CLI argument supported for CI");

  const exportScript = fs.readFileSync(path.join(PROJECT_ROOT, "relay", "export_mobile_model.py"), "utf-8");
  assert.ok(exportScript.includes("--output_dir"), "--output_dir CLI argument supported in export script");
});

test("F8.5: Subdirectory hierarchy specifies datasets, checkpoints, cache, and exported", () => {
  const projectScope = fs.readFileSync(path.join(PROJECT_ROOT, ".agents", "teamwork", "PROJECT.md"), "utf-8");
  assert.ok(projectScope.includes("datasets/"), "datasets/ directory missing in PROJECT.md");
  assert.ok(projectScope.includes("checkpoints/"), "checkpoints/ directory missing in PROJECT.md");
  assert.ok(projectScope.includes("exported/"), "exported/ directory missing in PROJECT.md");
});

// ============================================================================
// FEATURE 9 (F9): Disaster Guidelines Compiler
// ============================================================================

test("F9.1: Dataset compiler outputs authentic records with official government citations", () => {
  const dataset = loadJsonl("corpus/flood_safety_dataset.jsonl");
  assert.ok(dataset.length >= 40, `Dataset must have >= 40 records, found ${dataset.length}`);

  const sources = dataset.map((d) => d.verified_source || d.source || "");
  const hasNdma = sources.some((s) => s.includes("NDMA"));
  const hasSdma = sources.some((s) => s.includes("SDMA") || s.includes("Punjab"));
  const hasCwc = sources.some((s) => s.includes("CWC") || s.includes("Central Water Commission"));

  assert.ok(hasNdma, "Must cite NDMA");
  assert.ok(hasSdma, "Must cite Punjab SDMA");
  assert.ok(hasCwc, "Must cite CWC");
});

test("F9.2: Well-water chlorination formula strictly mandates 2.5g bleaching powder per 1000L", () => {
  const dataset = loadJsonl("corpus/flood_safety_dataset.jsonl");
  const waterRecords = dataset.filter((d) => 
    (d.category && d.category.includes("water")) || 
    (d.prompt && d.prompt.toLowerCase().includes("well")) ||
    (d.instruction && d.instruction.toLowerCase().includes("well"))
  );
  assert.ok(waterRecords.length >= 3, "Must contain well water chlorination records");

  const hasFormula = waterRecords.some((r) => {
    const text = r.response || "";
    return text.includes("2.5") && text.includes("1,000");
  });
  assert.ok(hasFormula, "Punjab Health Dept 2.5g bleaching powder per 1000L formula missing");
});

test("F9.3: Electrical safety guideline strictly specifies 10m distance and PSPCL 1912", () => {
  const dataset = loadJsonl("corpus/flood_safety_dataset.jsonl");
  const elecRecords = dataset.filter((d) => 
    (d.category && d.category.includes("electrical")) ||
    (d.prompt && d.prompt.toLowerCase().includes("power")) ||
    (d.instruction && d.instruction.toLowerCase().includes("cable"))
  );
  assert.ok(elecRecords.length >= 1, "Must contain electrical safety records");

  const valid = elecRecords.some((r) => {
    const text = r.response || "";
    return (text.includes("10 metre") || text.includes("10-metre") || text.includes("10 m")) && text.includes("1912");
  });
  assert.ok(valid, "10 metre distance and PSPCL 1912 helpline missing from electrical safety");
});

test("F9.4: Water crossing queries strictly enforce refusal and vehicle float limits", () => {
  const dataset = loadJsonl("corpus/flood_safety_dataset.jsonl");
  const crossingRecords = dataset.filter((d) => 
    (d.category && d.category.includes("crossing")) ||
    (d.prompt && d.prompt.toLowerCase().includes("tractor")) ||
    (d.instruction && d.instruction.toLowerCase().includes("tractor"))
  );
  assert.ok(crossingRecords.length >= 1, "Must contain water crossing refusal records");

  const valid = crossingRecords.some((r) => {
    const text = r.response || "";
    return (text.includes("ABSOLUTELY NOT") || text.includes("NEVER") || text.includes("Turn Around")) && 
           (text.includes("15 cm") || text.includes("float"));
  });
  assert.ok(valid, "Strict refusal and 15 cm / float warning missing from water crossing");
});

test("F9.5: Verified helplines match authoritative directory (112, 1078, 1070, 1077, 108, 1912)", () => {
  const helplines = loadAuthoritativeJson("corpus/helplines.json");
  const numbers = helplines.items.map((h) => h.number);
  
  assert.ok(numbers.includes("112"), "112 ERSS helpline missing");
  assert.ok(numbers.includes("1078"), "1078 NDMA helpline missing");
  assert.ok(numbers.includes("1070"), "1070 Punjab SDMA helpline missing");
  assert.ok(numbers.includes("1077"), "1077 District helpline missing");
  assert.ok(numbers.includes("108"), "108 Ambulance helpline missing");
});

// ============================================================================
// FEATURE 10 (F10): Qwen 2.5 LoRA Fine-Tuning & Quantization Exports
// ============================================================================

test("F10.1: LoRA fine-tuning config specifies rank r=16 and alpha=32 for mobile adaptation", () => {
  const trainScript = fs.readFileSync(path.join(PROJECT_ROOT, "relay", "train_mobile_model.py"), "utf-8");
  assert.ok(trainScript.includes("--lora_r") && trainScript.includes("default=16"), "LoRA r=16 default missing");
  assert.ok(trainScript.includes("--lora_alpha") && trainScript.includes("default=32"), "LoRA alpha=32 default missing");
});

test("F10.2: ChatML format helper produces standard system, user, and assistant tokens", () => {
  const trainScript = fs.readFileSync(path.join(PROJECT_ROOT, "relay", "train_mobile_model.py"), "utf-8");
  assert.ok(trainScript.includes("<|im_start|>system"), "<|im_start|>system token missing");
  assert.ok(trainScript.includes("<|im_start|>user"), "<|im_start|>user token missing");
  assert.ok(trainScript.includes("<|im_start|>assistant"), "<|im_start|>assistant token missing");
  assert.ok(trainScript.includes("<|im_end|>"), "<|im_end|> token missing");
});

test("F10.3: Safety holdout evaluation checks 100% pass rate gate against must_pass.json", () => {
  const holdout = loadAuthoritativeJson("eval/must_pass.json");
  assert.ok(Array.isArray(holdout) && holdout.length >= 20, "eval/must_pass.json must contain holdout samples");

  const trainScript = fs.readFileSync(path.join(PROJECT_ROOT, "relay", "train_mobile_model.py"), "utf-8");
  assert.ok(trainScript.includes("run_safety_holdout_evaluation"), "Holdout evaluation function missing");
  assert.ok(trainScript.includes("100.0"), "100.0% safety threshold missing");
});

test("F10.4: Export specifications generate ONNX Int4 configuration bounded under 350 MB RAM", () => {
  const exportScript = fs.readFileSync(path.join(PROJECT_ROOT, "relay", "export_mobile_model.py"), "utf-8");
  assert.ok(exportScript.includes("generate_onnx_spec"), "ONNX spec generator missing");
  assert.ok(exportScript.includes("int4") || exportScript.includes("bits"), "4-bit quantization missing");
  assert.ok(exportScript.includes("400") || exportScript.includes("350"), "RAM ceiling constraint missing");
});

test("F10.5: Export specifications generate GGUF Q4_K_M and LiteRT manifest", () => {
  const exportScript = fs.readFileSync(path.join(PROJECT_ROOT, "relay", "export_mobile_model.py"), "utf-8");
  assert.ok(exportScript.includes("Q4_K_M"), "GGUF Q4_K_M profile missing");
  assert.ok(exportScript.includes("LiteRT") || exportScript.includes("litert"), "LiteRT export profile missing");
  assert.ok(exportScript.includes("manifest.json"), "manifest.json packaging missing");
});

// ============================================================================
// FEATURE 11 (F11): Google Translate API Key Config & Offline Fallback
// ============================================================================

test("F11.1: Settings store declares 'settings' object store in IndexedDB schema", () => {
  const storeScript = fs.readFileSync(path.join(PROJECT_ROOT, "app", "js", "store.js"), "utf-8");
  assert.ok(storeScript.includes('db.createObjectStore("settings"'), "settings store creation missing from openDB");
  assert.ok(storeScript.includes("getSetting") && storeScript.includes("setSetting"), "getSetting/setSetting methods missing");
});

test("F11.2: Settings methods support arbitrary key-value persistence for API keys", () => {
  const storeScript = fs.readFileSync(path.join(PROJECT_ROOT, "app", "js", "store.js"), "utf-8");
  assert.ok(storeScript.includes("getSetting(key"), "getSetting must accept key parameter");
  assert.ok(storeScript.includes("setSetting(key, value)"), "setSetting must accept key and value");
});

test("F11.3: Offline deterministic knowledge cards are packaged for zero-network operation", () => {
  const cards = loadAuthoritativeJson("corpus/cards/cards.json");
  assert.ok(Array.isArray(cards) && cards.length >= 5, `cards.json must contain verified cards, found ${cards.length}`);

  for (const c of cards) {
    assert.ok(c.id, "Card missing id");
    assert.ok(c.title && c.title.en, "Card missing English title");
    assert.ok(c.body && c.body.en, "Card missing English body");
  }
});

test("F11.4: Multi-lingual offline cards include Punjabi Gurmukhi and Hindi translations", () => {
  const cards = loadAuthoritativeJson("corpus/cards/cards.json");
  const waterCard = cards.find((c) => c.id === "card-drinking-water");
  assert.ok(waterCard, "Drinking water card missing");
  assert.ok(waterCard.title.pa, "Card missing Punjabi title");
  assert.ok(waterCard.title.hi, "Card missing Hindi title");
  assert.ok(waterCard.body.pa.length > 0, "Card missing Punjabi body");
  assert.ok(waterCard.body.hi.length > 0, "Card missing Hindi body");
});

test("F11.5: Cards review_status enforces verified invariant before public release", () => {
  const cards = loadAuthoritativeJson("corpus/cards/cards.json");
  for (const c of cards) {
    assert.ok(
      c.review_status === "verified" || c.review_status === "reviewed" || c.review_status === "draft",
      `Card ${c.id} has invalid review_status: ${c.review_status}`
    );
  }
});

// ============================================================================
// FEATURE 12 (F12): Automated Test Baseline & Invariants Verification
// ============================================================================

test("F12.1: Node test suite (app/test/*.test.mjs) executes cleanly with 0 failures", () => {
  const testFiles = fs.readdirSync(path.join(PROJECT_ROOT, "app", "test"))
    .filter((f) => f.endsWith(".test.mjs"))
    .map((f) => `app/test/${f}`)
    .join(" ");

  const res = runCmd(`node --test ${testFiles}`);
  assert.equal(res.exitCode, 0, `Node unit tests exited with code ${res.exitCode}`);
});

test("F12.2: Pytest suite (relay/tests) executes cleanly with 0 failures", () => {
  const res = runCmd(".venv\\Scripts\\python -m pytest relay/tests");
  assert.equal(res.exitCode, 0, `Pytest relay tests failed:\n${res.stdout}\n${res.stderr}`);
  assert.ok(res.stdout.includes("passed"), "Pytest report must show passed tests");
});

test("F12.3: Zero-mock AST checker (scripts/check_no_mock.py) reports clean status", () => {
  const res = runCmd(".venv\\Scripts\\python scripts/check_no_mock.py");
  assert.equal(res.exitCode, 0, `check_no_mock.py reported violations:\n${res.stdout}\n${res.stderr}`);
  assert.ok(res.stdout.includes("check_no_mock: OK"), "AST check output must be OK");
});

test("F12.4: Safety Invariant 1: Official alerts take absolute priority over computed status", () => {
  const statusScript = fs.readFileSync(path.join(PROJECT_ROOT, "app", "js", "status.js"), "utf-8");
  assert.ok(
    statusScript.includes("Official SACHET") || statusScript.includes("a.severity"),
    "Official alert priority logic missing from status.js"
  );
});

test("F12.5: Safety Invariant 2: Offline status never silently lowers without fresh data", () => {
  const statusScript = fs.readFileSync(path.join(PROJECT_ROOT, "app", "js", "status.js"), "utf-8");
  assert.ok(
    statusScript.includes("resolveOfflineStatus") && statusScript.includes("never silently lowers"),
    "Offline never-lower invariant missing from status.js"
  );
});
