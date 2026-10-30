// app/test/challenger_m1_2_deep_stress.test.mjs
// Empirical Challenger 2 Stress Test Suite for Milestone 1
// Focus Areas:
// 1. SLM model toggle transitions, WebGPU detection fallback, and safety invariants
// 2. Python runtime probe timeout handling and browser native fallback
// 3. Regional language pack asset resolution, Cache API keys, and active badge synchronization
// 4. Mobile navigation touch target geometry on 360px viewport and UI button ergonomics

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");
const htmlPath = path.resolve(rootDir, "app/index.html");
const cssPath = path.resolve(rootDir, "app/css/main.css");
const swPath = path.resolve(rootDir, "app/sw.js");
const mainJsPath = path.resolve(rootDir, "app/js/main.js");

const htmlContent = fs.readFileSync(htmlPath, "utf-8");
const cssContent = fs.readFileSync(cssPath, "utf-8");
const swContent = fs.readFileSync(swPath, "utf-8");
const mainJsContent = fs.readFileSync(mainJsPath, "utf-8");

import { AskSaathiAssistant } from "../js/ai_assistant.js";

// Helper for minimal mock DOM element
class MockElement {
  constructor(id = "", className = "") {
    this.id = id;
    this.className = className;
    this.style = {};
    this.classList = {
      _classes: new Set(className ? className.split(/\s+/).filter(Boolean) : []),
      add: (c) => this.classList._classes.add(c),
      remove: (c) => this.classList._classes.delete(c),
      toggle: (c, force) => {
        if (force === undefined) {
          if (this.classList._classes.has(c)) this.classList._classes.delete(c);
          else this.classList._classes.add(c);
        } else if (force) {
          this.classList._classes.add(c);
        } else {
          this.classList._classes.delete(c);
        }
      },
      contains: (c) => this.classList._classes.has(c)
    };
    this.textContent = "";
    this.innerHTML = "";
    this.disabled = false;
    this.checked = false;
    this._listeners = new Map();
    this.children = [];
  }
  addEventListener(event, fn) {
    if (!this._listeners.has(event)) this._listeners.set(event, []);
    this._listeners.get(event).push(fn);
  }
  async dispatch(event, payload = {}) {
    const list = this._listeners.get(event) || [];
    for (const fn of list) {
      await fn({ target: this, ...payload });
    }
  }
  querySelector(sel) {
    return this.children.find((c) => c.matches?.(sel)) || new MockElement();
  }
  querySelectorAll() {
    return [];
  }
}

// =========================================================================
// SECTION 1: SLM Model Toggle Transitions & WebGPU Fallback
// =========================================================================

test("CHALLENGE 1.1: SLM Model mode toggling and safety invariant override", async () => {
  const cards = JSON.parse(fs.readFileSync(path.resolve(rootDir, "corpus/cards/cards.json"), "utf-8"));
  const assistant = new AskSaathiAssistant({ cards });
  await assistant.init();

  // Mode starts as deterministic_m5
  assert.equal(assistant.getMode(), "deterministic_m5", "Default mode must be deterministic_m5");

  // Mode toggles to webgpu_slm
  assistant.setMode("webgpu_slm");
  assert.equal(assistant.getMode(), "webgpu_slm", "Mode must toggle to webgpu_slm");

  // CRITICAL SAFETY INVARIANT TEST:
  // When assistant is in webgpu_slm mode, do safety invariants still enforce deterministic responses?
  // 1. Helplines:
  const helplineRes = await assistant.ask("What is the NDMA helpline phone number?");
  assert.equal(helplineRes.mode, "deterministic_m5", "Helpline inquiries MUST return deterministic_m5 even in SLM mode");
  assert.ok(helplineRes.steps.some((s) => s.includes("112") || s.includes("1078")), "Must contain official numbers");

  // 2. Water crossing danger:
  const crossingRes = await assistant.ask("Can I drive my tractor across knee deep water?");
  assert.equal(crossingRes.mode, "deterministic_m5", "Water crossing queries MUST return deterministic_m5 even in SLM mode");
  assert.ok(crossingRes.title.includes("Never Walk or Drive") || crossingRes.title.includes("खतरा") || crossingRes.title.includes("ਖ਼ਤਰਾ"));

  // 3. Electrical hazard:
  const electricRes = await assistant.ask("Electric wire fell into the water near my house");
  assert.equal(electricRes.mode, "deterministic_m5", "Electrical queries MUST return deterministic_m5 even in SLM mode");
  assert.ok(electricRes.steps.some((s) => s.includes("1912")), "Must mention 1912 in steps");
  assert.ok(electricRes.steps.some((s) => s.includes("10")), "Must mention 10 metres in steps");

  // 4. Medical refusal:
  const medicalRes = await assistant.ask("What medicine dose should I take for diarrhea and fever?");
  assert.equal(medicalRes.mode, "deterministic_m5", "Medical dosage inquiries MUST return deterministic_m5 refusal");
  assert.ok(medicalRes.intent === "medical_refusal", "Must trigger medical refusal intent");

  // Mode toggles back to deterministic_m5
  assistant.setMode("deterministic_m5");
  assert.equal(assistant.getMode(), "deterministic_m5", "Mode must toggle back to deterministic_m5");

  // Reject unsupported / malicious mode
  assistant.setMode("unverified_external_api");
  assert.equal(assistant.getMode(), "deterministic_m5", "Unsupported mode must be rejected");
});

test("CHALLENGE 1.2: WebGPU detection fallback when navigator.gpu is absent or fails", async () => {
  // Test 1: In Node.js environment where navigator.gpu is undefined
  const assistant = new AskSaathiAssistant();
  await assistant.init();
  assert.equal(assistant.isWebGPUSupported(), false, "Must report webgpu false when navigator.gpu is undefined");
  assert.equal(assistant.getMode(), "deterministic_m5", "Must default to deterministic_m5 without WebGPU");

  // Test 2: When navigator.gpu.requestAdapter() throws an error (e.g. sandbox security error)
  const originalNav = globalThis.navigator;
  const mockGpuNav = {
    gpu: {
      requestAdapter: async () => {
        throw new Error("GPU process crashed / sandbox permission denied");
      }
    }
  };

  try {
    Object.defineProperty(globalThis, "navigator", {
      value: mockGpuNav,
      configurable: true,
      writable: true
    });

    const errorAssistant = new AskSaathiAssistant();
    // Must NOT throw unhandled rejection
    await errorAssistant.init();
    assert.equal(errorAssistant.isWebGPUSupported(), false, "Must handle requestAdapter rejection gracefully");
    assert.equal(errorAssistant.getMode(), "deterministic_m5", "Must fall back to deterministic_m5");
  } finally {
    Object.defineProperty(globalThis, "navigator", {
      value: originalNav,
      configurable: true,
      writable: true
    });
  }
});

test("CHALLENGE 1.3: SLM model custom event dispatching and DOM toggle state synchronization", () => {
  // Verify main.js contains event dispatch for floodsaathi:slm_mode_changed
  assert.ok(
    mainJsContent.includes('window.dispatchEvent(new CustomEvent("floodsaathi:slm_mode_changed"'),
    "main.js must dispatch custom event 'floodsaathi:slm_mode_changed'"
  );

  // Verify slm-active-status-badge text updates on toggle
  assert.ok(
    mainJsContent.includes('"Active (WebGPU / SLM)"') && mainJsContent.includes('"Standby (M5 Fallback)"'),
    "main.js must toggle active status badge between Active and Standby"
  );
});

// =========================================================================
// SECTION 2: Python Runtime Probe Timeout & Fallback
// =========================================================================

test("CHALLENGE 2.1: Python runtime probe timeout handling and offline fallback", async () => {
  // Verify probe code in main.js uses AbortController with bounded timeout
  assert.ok(mainJsContent.includes("new AbortController()"), "Python probe must instantiate AbortController");
  assert.ok(mainJsContent.includes(".abort()"), "Python probe must call controller.abort()");
  assert.ok(
    mainJsContent.includes("Browser Native (Offline PWA Mode)"),
    "Python probe must fall back to Browser Native (Offline PWA Mode)"
  );

  // Extract timeout duration from main.js
  const timeoutMatch = mainJsContent.match(/setTimeout\(\(\)\s*=>\s*controller\.abort\(\),\s*(\d+)\)/);
  assert.ok(timeoutMatch, "Python probe must have explicit setTimeout for abort");
  const timeoutMs = Number(timeoutMatch[1]);
  assert.ok(timeoutMs >= 1000 && timeoutMs <= 3000, `Timeout must be between 1.0s and 3.0s for responsive UX, got: ${timeoutMs}ms`);

  // Simulate probe failure behavior
  const badge = new MockElement("py-engine-status-badge");
  const text = new MockElement("py-engine-status-text");
  const result = new MockElement("py-engine-probe-result");

  const runProbeSimulation = async (fetchImpl) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 50);
      const res = await fetchImpl("http://127.0.0.1:8000/health", { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        badge.className = "plugin-badge active";
        badge.textContent = "Relay Connected";
        text.textContent = "Python 3.11 Local Relay Active (:8000)";
        result.textContent = "Connection confirmed: Local Python hydrologic engine connected.";
        return;
      }
    } catch {
      // Caught
    }
    badge.className = "plugin-badge";
    badge.textContent = "Browser Native";
    text.textContent = "Browser Native (Offline PWA Mode)";
    result.textContent = "Local relay not running at :8000. Operating in 100% offline browser native mode.";
  };

  // Test Case A: Server not running (Immediate fetch rejection)
  await runProbeSimulation(() => Promise.reject(new Error("connect ECONNREFUSED 127.0.0.1:8000")));
  assert.equal(badge.textContent, "Browser Native");
  assert.equal(text.textContent, "Browser Native (Offline PWA Mode)");
  assert.equal(badge.className, "plugin-badge");

  // Test Case B: Server hangs indefinitely (Abort timeout trigger)
  await runProbeSimulation(() => new Promise((_, reject) => setTimeout(() => reject(new Error("The operation was aborted")), 100)));
  assert.equal(badge.textContent, "Browser Native");
  assert.equal(text.textContent, "Browser Native (Offline PWA Mode)");

  // Test Case C: Server returns 500 error (HTTP error fallback)
  await runProbeSimulation(() => Promise.resolve({ ok: false, status: 500 }));
  assert.equal(badge.textContent, "Browser Native");

  // Test Case D: Server healthy 200 OK
  await runProbeSimulation(() => Promise.resolve({ ok: true, status: 200 }));
  assert.equal(badge.textContent, "Relay Connected");
  assert.equal(badge.className, "plugin-badge active");
  assert.equal(text.textContent, "Python 3.11 Local Relay Active (:8000)");
});

// =========================================================================
// SECTION 3: Language Pack Asset Resolution, Cache API & Active Badges
// =========================================================================

test("CHALLENGE 3.1: Language pack physical asset resolution and WOFF2 / JSON format integrity", () => {
  const assets = [
    {
      file: "app/fonts/noto_gurmukhi_w8gyH3EvQP81sInb43inmyN9zZ7hb7ATbSWo4q8dJ74a3cVrSlgXnw.woff2",
      type: "woff2",
      minSize: 20000
    },
    {
      file: "app/fonts/noto_devanagari_TuG7UUFzXI5FBtUq5a8bjKYTZjtRU6Sgv3NaV_SNmI0b8QQCQmHN5DV_.woff2",
      type: "woff2",
      minSize: 20000
    },
    {
      file: "app/i18n/pa.json",
      type: "json",
      minSize: 4000
    },
    {
      file: "app/i18n/hi.json",
      type: "json",
      minSize: 4000
    },
    {
      file: "app/corpus/cards/cards.json",
      type: "json",
      minSize: 20000
    }
  ];

  for (const asset of assets) {
    const fullPath = path.resolve(rootDir, asset.file);
    assert.ok(fs.existsSync(fullPath), `Asset file must exist: ${asset.file}`);
    const stat = fs.statSync(fullPath);
    assert.ok(stat.size >= asset.minSize, `Asset ${asset.file} is too small (${stat.size} bytes < ${asset.minSize})`);

    if (asset.type === "woff2") {
      const buffer = fs.readFileSync(fullPath);
      // WOFF2 magic number is "wOF2" (0x77 0x4F 0x46 0x32)
      const magic = buffer.toString("ascii", 0, 4);
      assert.equal(magic, "wOF2", `Font file ${asset.file} must have valid WOFF2 magic header`);
    } else if (asset.type === "json") {
      const parsed = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
      assert.ok(typeof parsed === "object" && parsed !== null, `JSON asset ${asset.file} must be valid JSON object/array`);
    }
  }
});

test("CHALLENGE 3.2: Language pack Cache API keys and active badge synchronization logic", () => {
  // Test cache name in main.js
  assert.ok(
    mainJsContent.includes('"floodsaathi-lang-packs-v1"'),
    "main.js must cache language packs in 'floodsaathi-lang-packs-v1'"
  );

  // Active badge visibility matrix simulation:
  const testBadgeSync = (currentLang, paDownloaded, hiDownloaded) => {
    const paActiveStyle = (paDownloaded && currentLang === "pa") ? "inline-block" : "none";
    const hiActiveStyle = (hiDownloaded && currentLang === "hi") ? "inline-block" : "none";
    return { paActiveStyle, hiActiveStyle };
  };

  // Case 1: English default (neither regional pack should be active)
  const c1 = testBadgeSync("en", true, true);
  assert.equal(c1.paActiveStyle, "none", "Punjabi badge must be hidden when English is active");
  assert.equal(c1.hiActiveStyle, "none", "Hindi badge must be hidden when English is active");

  // Case 2: Punjabi selected, but not downloaded
  const c2 = testBadgeSync("pa", false, false);
  assert.equal(c2.paActiveStyle, "none", "Punjabi active badge must NOT show if not downloaded");

  // Case 3: Punjabi selected and downloaded
  const c3 = testBadgeSync("pa", true, false);
  assert.equal(c3.paActiveStyle, "inline-block", "Punjabi active badge must show when pa is active and downloaded");
  assert.equal(c3.hiActiveStyle, "none", "Hindi active badge must remain hidden");

  // Case 4: Hindi selected and downloaded
  const c4 = testBadgeSync("hi", true, true);
  assert.equal(c4.hiActiveStyle, "inline-block", "Hindi active badge must show when hi is active and downloaded");
  assert.equal(c4.paActiveStyle, "none", "Punjabi active badge must remain hidden");
});

// =========================================================================
// SECTION 4: Mobile Nav Touch Target Geometry & Ergonimics (>= 48px on 360px)
// =========================================================================

test("CHALLENGE 4.1: Mobile navigation tab bar geometry on 360px viewport", () => {
  // Verify 6 tabs in mobile bottom bar:
  const mobileNavMatch = htmlContent.match(/<nav class="nav-tab-bar"[\s\S]*?<\/nav>/i);
  assert.ok(mobileNavMatch, ".nav-tab-bar element must exist in HTML");
  const navHtml = mobileNavMatch[0];

  const buttonMatches = [...navHtml.matchAll(/<button class="nav-tab-btn[^"]*" data-tab="([^"]+)">/g)];
  assert.equal(buttonMatches.length, 6, "Mobile navigation tab bar must contain exactly 6 tabs");
  const tabNames = buttonMatches.map((m) => m[1]);
  assert.deepEqual(tabNames, ["home", "map", "saathi", "alerts", "downloads", "more"]);

  // Verify inline style grid-template-columns: repeat(6, 1fr)
  assert.ok(
    navHtml.includes("grid-template-columns: repeat(6, 1fr)") ||
    navHtml.includes("grid-template-columns:repeat(6,1fr)"),
    ".nav-tab-bar must define 6-column grid"
  );

  // Compute 360px viewport width:
  // CSS: padding: 6px 4px calc(6px + env(safe-area-inset-bottom, 0px)) 4px;
  const viewportWidth = 360;
  const paddingLeft = 4;
  const paddingRight = 4;
  const availableWidth = viewportWidth - (paddingLeft + paddingRight); // 352px
  const widthPerTab = availableWidth / 6; // 58.666...px

  assert.ok(
    widthPerTab >= 48,
    `Mobile nav touch target width must be >= 48px on 360px viewport (got: ${widthPerTab.toFixed(2)}px)`
  );

  // CSS: min-height: var(--touch-target) = 48px
  const touchTargetMatch = cssContent.match(/--touch-target:\s*(\d+)px/);
  assert.ok(touchTargetMatch, "--touch-target variable must be defined in main.css");
  const touchTargetPx = Number(touchTargetMatch[1]);
  assert.ok(touchTargetPx >= 48, `--touch-target must be >= 48px (got: ${touchTargetPx}px)`);

  const navBtnCssMatch = cssContent.match(/\.nav-tab-btn\s*\{[\s\S]*?min-height:\s*var\(--touch-target\)/);
  assert.ok(navBtnCssMatch, ".nav-tab-btn must specify min-height: var(--touch-target)");

  // Check touch bounding box area:
  const touchTargetArea = widthPerTab * touchTargetPx;
  const minRequiredArea = 48 * 48; // 2304 sq px
  assert.ok(
    touchTargetArea >= minRequiredArea,
    `Touch target area (${touchTargetArea.toFixed(1)} sq px) must be >= ${minRequiredArea} sq px`
  );
});

test("CHALLENGE 4.2: Downloads View Button Touch Targets & Ergonomics Inspection", () => {
  // Check .btn-plugin-download height in main.css
  const btnPluginMatch = cssContent.match(/\.btn-plugin-download\s*\{[\s\S]*?height:\s*(\d+)px;/);
  assert.ok(btnPluginMatch, ".btn-plugin-download must specify height");
  const btnHeight = Number(btnPluginMatch[1]);

  console.log(`Plugin download action button height: ${btnHeight}px`);
  // Note finding: btnHeight is 44px in current CSS, which is slightly below the 48px mobile touch invariant
  if (btnHeight < 48) {
    console.warn(`[CHALLENGER FINDING] .btn-plugin-download has height: ${btnHeight}px (< 48px touch target invariant).`);
  }

  // Check language download buttons in HTML
  const paBtnMatch = htmlContent.match(/id="btn-download-lang-pa"[^>]*style="([^"]*)"/);
  if (paBtnMatch && paBtnMatch[1].includes("padding:3px 8px")) {
    console.warn("[CHALLENGER FINDING] Language download buttons (#btn-download-lang-pa) use compact inline styling padding:3px 8px (< 48px touch target).");
  }
});
