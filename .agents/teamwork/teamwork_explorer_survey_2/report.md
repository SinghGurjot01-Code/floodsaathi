# Technical Architecture Report: Web Frontend, Navigation, Downloads, GPS Re-Sync & Telemetry Proximity

**Author**: Survey Explorer 2 (`teamwork_explorer_survey_2`)  
**Date**: 2026-10-30  
**Target Milestone**: Downloads & Plugins Interface, GPS Re-Sync & Proximity Telemetry, Testing Patterns  
**Repository Path**: `app/`  

---

## Executive Summary

This investigation analyzed the frontend architecture of the FloodSaathi web application (`app/`), covering navigation routing across desktop and mobile, the complete design for the Downloads/Plugins tab with its four component cards (Offline Maps, SLM AI Model, Python Runtime, Regional Language Packs), the GPS re-sync interaction with error/stale visual feedback, the transparent hydrologic telemetry proximity indicator on the Home view, and the native Node.js ES module test suites.

All existing automated test suites (`node --test app/test/*.test.mjs`, 34 tests) and no-mock verification (`python scripts/check_no_mock.py`) currently pass with 100% compliance. The application strictly follows a zero-bundler, vanilla ES module, plain CSS architecture.

---

## 1. Navigation Architecture & View Routing

### 1.1 Existing Layout & Elements
The application shell is defined in `app/index.html` and styled in `app/css/main.css`. Two distinct navigation structures exist:

1. **Desktop Header Navigation (`.desktop-nav`)**:
   - Location: `app/index.html`, lines 45–81.
   - Visibility: Displayed only on screens $\ge 768\text{ px}$ (`display: flex;` in `app/css/main.css`, line 147). Hidden on mobile viewports.
   - Tabs present: `home`, `map`, `saathi`, `alerts`, `shelters`, `after-flood`, `preferences`, `downloads` (line 74), `sos`.
   - Observation: `<button class="nav-tab-btn" data-tab="downloads">` is **already defined** in the desktop header nav, but lacks an active view section (`#view-downloads`) and event wiring in `main.js`.

2. **Mobile Bottom Navigation Bar (`.nav-tab-bar`)**:
   - Location: `app/index.html`, lines 634–655.
   - Visibility: Displayed on mobile viewports $< 768\text{ px}$ as a 5-column grid (`grid-template-columns: repeat(5, 1fr);` in `app/css/main.css`, line 1060). Hidden on desktop (`display: none !important;` at line 1123).
   - Tabs present: `home`, `map`, `saathi`, `alerts`, `more`.
   - Secondary entry point: Inside the "More" hub (`#view-more`, lines 508–516), there is an action card `<button class="action-report-btn" id="nav-to-downloads">` titled "Offline Packs & Plugins".

### 1.2 Routing Mechanism (`app/js/main.js`)
View switching is handled imperatively in `app/js/main.js`:
- `setupNavigation()` (lines 101–133):
  - Iterates over all `.nav-tab-btn` buttons and binds `click` to `switchTab(tab)`.
  - Binds sub-view triggers (`#nav-to-shelters`, `#nav-to-sos`, `#nav-to-after-flood`, `#nav-to-preferences`).
  - Currently **missing** event binding for `#nav-to-downloads`!
- `switchTab(tab)` (lines 135–164):
  ```javascript
  export function switchTab(tab) {
    currentTab = tab;
    // Toggles .active class on all buttons matching data-tab
    document.querySelectorAll(".nav-tab-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-tab") === tab);
    });
    // Hides all view sections
    document.querySelectorAll(".view-section").forEach((sec) => {
      sec.classList.remove("active");
    });
    // Activates target view section
    const targetSec = document.getElementById(`view-${tab}`);
    if (targetSec) {
      targetSec.classList.add("active");
    }
    // Toggles floating SOS on Home
    const floatingSos = document.getElementById("floating-sos-btn");
    if (floatingSos) {
      floatingSos.style.display = tab === "home" ? "grid" : "none";
    }
    // Trigger view-specific renderers
    if (tab === "alerts") renderAlertsView();
    if (tab === "shelters") renderSheltersView();
    if (tab === "sos") renderSosContacts();
    if (tab === "preferences") renderPreferencesView();
  }
  ```

### 1.3 Recommended Additions for Navigation
1. **Mobile Bottom Navigation**:
   - To make Downloads accessible on mobile, add `<button class="nav-tab-btn" data-tab="downloads">` into `.nav-tab-bar` in `app/index.html`.
   - Update `.nav-tab-bar` CSS in `app/css/main.css` to `grid-template-columns: repeat(6, 1fr);` with `font-size: 11px;` so touch targets remain $\ge 48\text{ px}$.
   - Retain `#nav-to-downloads` in `#view-more` as an alternative pathway.
2. **Main Controller Wiring (`app/js/main.js`)**:
   - In `setupNavigation()`: Add `document.getElementById("nav-to-downloads")?.addEventListener("click", () => switchTab("downloads"));` and `document.getElementById("btn-back-from-downloads")?.addEventListener("click", () => switchTab("more"));`.
   - In `switchTab(tab)`: Add `if (tab === "downloads") renderDownloadsView();`.

---

## 2. "Downloads & Plugins" Tab Implementation

### 2.1 Pre-existing CSS Stylesheet
Remarkably, complete responsive CSS for the Downloads view has already been authored in `app/css/main.css` (lines 1452–1653), including:
- `.downloads-container`, `.downloads-header-intro`
- `.plugins-grid` (1-column mobile, 2-column on desktop $\ge 768\text{ px}$)
- `.plugin-card`, `.plugin-card.recommended`, `.plugin-card-top`, `.plugin-icon`, `.plugin-meta`
- `.plugin-badge-row`, `.plugin-badge`, `.plugin-badge.rec`, `.plugin-badge.active`, `.plugin-badge.size`
- `.plugin-title`, `.plugin-desc`, `.plugin-config-box`
- `.radius-selector-row`, `.radius-pill`, `.radius-pill.active`
- `.plugin-stat-row`, `.plugin-actions`, `.btn-plugin-download`, `.btn-plugin-download.sec`
- `.plugin-progress-wrap`, `.progress-bar-bg`, `.progress-bar-fill`, `.progress-info-row`

### 2.2 View DOM Structure (`#view-downloads`)
The HTML markup to be placed inside `app/index.html` after `#view-preferences`:

```html
<!-- =========================================
     TAB: DOWNLOADS & PLUGINS (R1)
     ========================================= -->
<section class="view-section" id="view-downloads">
  <div style="padding: 16px 20px 8px 20px; border-bottom: 1px solid var(--line); display:flex; align-items:center; gap:12px;">
    <button class="lang-btn" id="btn-back-from-downloads" style="width: auto; padding: 0 10px;">&larr; Back</button>
    <h2 style="font-size: 18px; font-weight: 700;">Offline Packs & Plugins</h2>
  </div>

  <div class="downloads-container">
    <div class="downloads-header-intro">
      <h3 style="font-size: 20px; font-weight: 800; color: var(--navy);">Local Storage & Plugins</h3>
      <p style="font-size: 13.5px; color: var(--mut); margin-top: 4px;">
        Enhance offline resilience. Download vector maps, on-device SLM models, and regional language packs directly to device cache.
      </p>
    </div>

    <div class="plugins-grid">
      <!-- Card 1: Offline Map Pack (Recommended) -->
      <!-- Card 2: FloodSaathi SLM AI Model -->
      <!-- Card 3: Python Runtime / Local Engine -->
      <!-- Card 4: Regional Language Packs (Recommended) -->
    </div>
  </div>
</section>
```

---

### 2.3 Detailed Card Specifications & Logic

#### Card 1: Offline Map Pack (Recommended)
- **Requirements**:
  - Area radius selection: 10 km, 25 km, 50 km, 100 km.
  - Dynamic size calculation: 10 km $\rightarrow 12\text{ MB}$, 25 km $\rightarrow 28\text{ MB}$, 50 km $\rightarrow 65\text{ MB}$, 100 km $\rightarrow 140\text{ MB}$.
  - Progress bar with percentage and byte/MB readout.
  - Caching in Cache API (`caches.open("floodsaathi-offline-maps-v1")`).
- **Existing Support**: `app/js/map_downloader.js` has `downloadMapPack()`, `getDownloadedMapPacks()`, and `checkStorageQuota()`.
- **Refinement Required**:
  Update `estimateDownloadSize(radiusKm)` in `app/js/map_downloader.js`:
  ```javascript
  export const MAP_RADIUS_SIZES = {
    10: { mb: 12, label: "Village & Surroundings (10 km)" },
    25: { mb: 28, label: "Tehsil Level (25 km)" },
    50: { mb: 65, label: "Full District (50 km)" },
    100: { mb: 140, label: "River Basin Region (100 km)" }
  };

  export function estimateDownloadSize(radiusKm) {
    if (MAP_RADIUS_SIZES[radiusKm]) {
      return MAP_RADIUS_SIZES[radiusKm].mb;
    }
    // Proportional fallback
    return Math.round((Math.PI * radiusKm * radiusKm * 0.0044 + 8) * 10) / 10;
  }
  ```
- **UI Interaction**:
  Clicking `.radius-pill` updates the active pill, sets `#map-pack-size-badge` and button text (`Download Map Pack (XX MB)`), and displays coverage details. Initiating download triggers `downloadMapPack(userProfile.lat, userProfile.lon, radius, onProgress)` with live updates on `#map-pack-progress-fill` and `#map-pack-progress-pct`.

---

#### Card 2: FloodSaathi SLM AI Model (Qwen2.5-0.5B-Instruct Int4 ~340 MB)
- **Requirements**:
  - Status indicator: Download status ("Not Downloaded" / "Downloaded") and active indicator ("Active / WebGPU" vs "Standby / M5 Fallback").
  - On/Off Toggle: Controls whether Ask Saathi routes non-refusal queries to the local SLM or deterministic M5 safety cards.
  - Connection hook: Listens to model state and connects to client-side inference worker or local WebGPU runner.
- **Existing Support**: `app/js/ai_assistant.js` has `AskSaathiAssistant` with `hardwareCapabilities.webgpu`, `mode` (`deterministic_m5` vs `webgpu_slm`), and methods `setMode()` and `getMode()`.
- **UI Elements**:
  - Icon: SVG Neural Network / Chip.
  - Badges: `<span class="plugin-badge" style="background:#f3e8ff; color:#7c3aed;">On-Device SLM</span>`, `<span class="plugin-badge size">~340 MB</span>`, `<span class="plugin-badge" id="slm-status-badge">Not Downloaded</span>`.
  - Config box:
    - WebGPU detection readout: `navigator.gpu ? "Supported (Direct Acceleration)" : "Unsupported (Wasm/CPU Fallback)"`.
    - Active mode toggle: `<input type="checkbox" id="toggle-slm-model" disabled>`.
    - Safety note: "Strict NDMA invariant verification applies to all outputs."
  - Action button: `<button class="btn-plugin-download" id="btn-download-slm">Download Model (340 MB)</button>`.
- **State Persistence & Connection Hook**:
  - State saved in `store.js` via `setSetting("slm_model_downloaded", true)` and `setSetting("slm_model_enabled", bool)`.
  - On toggle change: dispatches custom event `floodsaathi:slm_mode_changed` and calls `aiAssistant.setMode(enabled ? "webgpu_slm" : "deterministic_m5")`.

---

#### Card 3: Python Runtime / Local Engine
- **Requirements**:
  - Status display of local execution engine.
  - Download and setup guidance for users/developers running local sidecars or Python backends.
- **Engine Description**:
  - FloodSaathi Local Python Engine runs Python 3.11 with FastAPI / local CLI relay (`relay/run.py`).
  - Probes connection to `http://127.0.0.1:8000/health` or `http://localhost:8080/data/latest/punjab.json`.
- **UI Elements**:
  - Badges: `<span class="plugin-badge" style="background:#e0f2fe; color:#0369a1;">Local Sidecar</span>`, `<span class="plugin-badge" id="py-engine-status-badge">Standalone Browser</span>`.
  - Status line: "Engine Status: <strong id="py-engine-status-text">Browser Native (Offline PWA)</strong>".
  - Expandable setup modal / instructions box:
    ```bash
    # Run local FloodSaathi Python Relay & Engine
    git clone https://github.com/floodsaathi/relay
    cd FloodSaathi
    pip install -r relay/requirements.txt
    python relay/run.py --out app/data/latest/
    ```
  - Button: `<button class="btn-plugin-download sec" id="btn-ping-engine">Check Engine Connection</button>`.

---

#### Card 4: Regional Language Packs (Hindi & Punjabi Gurmukhi ~4 MB each)
- **Requirements**:
  - English default: "Built-in / Active".
  - Hindi Pack (~4 MB): Noto Sans Devanagari fonts (`app/fonts/`), Hindi dictionary (`app/i18n/hi.json`), and Hindi cards in `app/corpus/cards/cards.json`.
  - Punjabi Gurmukhi Pack (~4 MB): Noto Sans Gurmukhi fonts (`app/fonts/`), Punjabi dictionary (`app/i18n/pa.json`), and Punjabi cards in `app/corpus/cards/cards.json`.
  - Download badges & active badges.
- **UI Elements**:
  - English row: `<span class="plugin-badge active">Built-in (Active)</span>`.
  - Hindi row: `<span class="plugin-badge" id="badge-lang-hi">Not Downloaded</span>` + `<button class="radius-pill" id="btn-download-lang-hi">Download Hindi Pack (4 MB)</button>`.
  - Punjabi row: `<span class="plugin-badge" id="badge-lang-pa">Not Downloaded</span>` + `<button class="radius-pill" id="btn-download-lang-pa">Download Punjabi Pack (4 MB)</button>`.
- **Implementation Mechanism**:
  - When user clicks "Download Hindi/Punjabi Pack", loads asset files into Cache API `floodsaathi-lang-packs-v1`:
    - Hindi: `./fonts/noto_devanagari_*.woff2`, `./i18n/hi.json`, `./corpus/cards/cards.json`.
    - Punjabi: `./fonts/noto_gurmukhi_*.woff2`, `./i18n/pa.json`, `./corpus/cards/cards.json`.
  - Sets `setSetting("lang_pack_hi_downloaded", true)` and `setSetting("lang_pack_pa_downloaded", true)`.
  - If current language (`getCurrentLanguage()`) matches, badge updates to `<span class="plugin-badge active">Downloaded & Active</span>`.

---

## 3. GPS Re-Sync & Visual Feedback Mechanism

### 3.1 Current Status & Existing Assets
- In `app/index.html` (lines 129–132):
  ```html
  <button class="btn-resync-gps" id="btn-resync-gps" title="Re-sync device GPS location" aria-label="Re-sync GPS">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
      <path d="M23 12a11.05 11.05 0 0 0-22 0zm-5 0a6 6 0 1 1-12 0 6 6 0 0 1 12 0z"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
    <span>Re-sync GPS</span>
  </button>
  ```
- In `app/css/main.css` (lines 337–364):
  - `.btn-resync-gps`: styled with light background and rounded borders.
  - `.btn-resync-gps.spinning svg`: triggers `@keyframes spin` (1s continuous 360° rotation).
- Problem Identified: **There is currently zero JavaScript event handling attached to `#btn-resync-gps` in `app/js/main.js`**.

### 3.2 Complete Implementation Design
Create `setupGpsResync()` in `app/js/main.js` and call it during `DOMContentLoaded`:

```javascript
function setupGpsResync() {
  const btn = document.getElementById("btn-resync-gps");
  if (!btn) return;

  btn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      showGpsFeedback("unsupported", "GPS not supported on this device. Using stored location.");
      return;
    }

    // 1. Enter acquiring state: add spinning animation
    btn.classList.add("spinning");
    btn.disabled = true;
    const label = btn.querySelector("span");
    if (label) label.textContent = "Acquiring...";

    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        // 2. Success state
        btn.classList.remove("spinning");
        btn.disabled = false;
        const { latitude, longitude, accuracy } = pos.coords;

        userProfile.lat = latitude;
        userProfile.lon = longitude;
        userProfile.gps_synced_at = new Date().toISOString();
        userProfile.accuracy_m = Math.round(accuracy);

        // Persist coordinates
        await setSetting("user_lat", latitude);
        await setSetting("user_lon", longitude);
        await setSetting("user_gps_synced_at", userProfile.gps_synced_at);

        // Update UI location label
        const villageEl = document.getElementById("loc-village-name");
        if (villageEl) {
          villageEl.textContent = `${userProfile.village_name} (GPS ±${userProfile.accuracy_m}m)`;
        }

        // Recompute proximity indicator and snapshot metrics
        if (currentSnapshot) {
          renderSnapshotData(currentSnapshot);
        }

        // Success visual feedback: green badge text for 3 seconds
        if (label) label.textContent = "GPS Synced";
        btn.style.borderColor = "#16a34a";
        btn.style.color = "#16a34a";
        setTimeout(() => {
          if (label) label.textContent = "Re-sync GPS";
          btn.style.borderColor = "";
          btn.style.color = "";
        }, 3000);
      },
      (err) => {
        // 3. Error / Stale state
        btn.classList.remove("spinning");
        btn.disabled = false;

        let errMsg = "GPS acquisition timed out. Showing last-known coordinates.";
        if (err.code === 1) errMsg = "Location permission denied. Showing stored village.";
        else if (err.code === 2) errMsg = "GPS position unavailable. Showing stored village.";

        // Visual error indication on button
        if (label) label.textContent = "GPS Stale";
        btn.style.borderColor = "#ef1c24";
        btn.style.color = "#ef1c24";

        // Mark proximity banner with stale warning
        const proxText = document.getElementById("telemetry-proximity-text");
        if (proxText && currentSnapshot) {
          updateProximityBanner(currentSnapshot, true);
        }

        setTimeout(() => {
          if (label) label.textContent = "Re-sync GPS";
          btn.style.borderColor = "";
          btn.style.color = "";
        }, 4000);
      },
      geoOptions
    );
  });
}
```

---

## 4. Home View Transparent Telemetry Proximity Indicator

### 4.1 DOM Element & Current Style
- Element: `app/index.html` lines 137–141:
  ```html
  <div class="telemetry-proximity-banner" id="telemetry-proximity-banner">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2">
      <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
    </svg>
    <span id="telemetry-proximity-text">Your location: Taman, Jalandhar · Hydrologic telemetry from: CWC Beas Gauge (3.8 km away)</span>
  </div>
  ```
- Style: `app/css/main.css` lines 366–382:
  Semi-transparent background (`rgba(255, 255, 255, 0.9)`), subtle blue outline (`border: 1px solid rgba(37, 99, 235, 0.15);`), rounded corners (`border-radius: 12px;`), and responsive flex layout.

### 4.2 Calculation Algorithm
The live telemetry feed (`app/data/latest/punjab.json`) contains active CWC monitoring stations:
- Harike Barrage (`G_HARIKE`, Sutlej-Beas, lat: 31.15, lon: 74.95)
- Kol Dam (`G_KOLDAM`, Sutlej, lat: 31.3824, lon: 76.87199)
- Ranjit Sagar Dam (`G_RSD`, Ravi, lat: 32.444, lon: 75.734)

To calculate geodesic distance between the user's location and each gauge, use Haversine distance:
$$d = 2 R \arcsin \left( \sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos\phi_1 \cos\phi_2 \sin^2\left(\frac{\Delta\lambda}{2}\right)} \right)$$
where $R = 6371\text{ km}$.

### 4.3 Upstream vs Downstream Direction
In the Punjab river system (Indus basin), main rivers (Ravi, Beas, Sutlej) flow from the northeast (Himalayan foothills) toward the southwest (Harike / confluence toward the Indus).
Therefore:
- If `gauge.lat > userProfile.lat`: gauge is **upstream** of user.
- If `gauge.lat < userProfile.lat`: gauge is **downstream** of user.

### 4.4 Render Function (`app/js/main.js`)
In `renderSnapshotData(snapshot)`:
```javascript
export function updateProximityBanner(snapshot, isStaleGps = false) {
  const bannerText = document.getElementById("telemetry-proximity-text");
  if (!bannerText) return;

  const gauges = snapshot.gauges || [];
  if (gauges.length === 0) {
    bannerText.textContent = `Your location: ${userProfile.village_name} · Hydrologic telemetry: Feeds currently offline`;
    return;
  }

  // Calculate nearest gauge
  let nearest = null;
  let minKm = Infinity;
  for (const g of gauges) {
    if (typeof g.lat !== "number" || typeof g.lon !== "number") continue;
    const dLat = ((g.lat - userProfile.lat) * Math.PI) / 180;
    const dLon = ((g.lon - userProfile.lon) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((userProfile.lat * Math.PI) / 180) *
      Math.cos((g.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
    const km = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    if (km < minKm) {
      minKm = km;
      nearest = g;
    }
  }

  const distFormatted = minKm < 1 ? `${Math.round(minKm * 1000)} m` : `${minKm.toFixed(1)} km`;
  const direction = nearest && nearest.lat >= userProfile.lat ? "upstream" : "downstream";
  const gaugeName = nearest ? (nearest.name || nearest.id) : "CWC Gauge";
  const riverName = nearest && nearest.river ? ` (${nearest.river})` : "";
  const gpsSuffix = isStaleGps ? " [GPS Stale / Cached]" : "";

  bannerText.textContent = `Your location: ${userProfile.village_name}${gpsSuffix} · Hydrologic telemetry from: ${gaugeName}${riverName} (${distFormatted} ${direction})`;
}
```

---

## 5. Automated Test Suites & Plain ES Module Testing

### 5.1 Verification Commands
- **Frontend test suite**:
  ```bash
  node --test app/test/*.test.mjs
  ```
  Result: 34 tests passing in 264ms.
- **No-mock data verification**:
  ```bash
  python scripts/check_no_mock.py
  ```
  Result: `check_no_mock: OK` (0 violations).

### 5.2 Architectural Principles for New Tests
1. **Zero Bundlers / Zero Transpilation**:
   Node.js built-in test runner (`node:test` + `node:assert/strict`) runs pure `.test.mjs` files directly.
2. **Decoupled Pure Logic**:
   Functions that compute download sizes, calculate Haversine distances, or format proximity text must be isolated from the DOM so they can be imported and verified directly in `app/test/downloads_proximity.test.mjs`.
3. **Proposed Test Suite**:
   Create `app/test/downloads_proximity.test.mjs` testing:
   - Dynamic map pack size calculation for 10, 25, 50, and 100 km radii.
   - Haversine distance and nearest gauge selection from `punjab.json`.
   - Upstream vs downstream determination based on coordinates.
   - SLM toggle state transitions and fallback to M5 safety invariant.
   - Language pack asset manifest integrity.

---

## Conclusion & Integration Roadmap

| Component | Files Affected | Changes Required |
|---|---|---|
| **Downloads Tab** | `app/index.html`<br>`app/js/main.js` | Add `<section id="view-downloads">` containing the 4 plugin cards. Add mobile tab button in `.nav-tab-bar`. Bind navigation triggers in `setupNavigation()` and `switchTab()`. |
| **Offline Map Pack** | `app/js/map_downloader.js`<br>`app/js/main.js` | Update `estimateDownloadSize()` for 10/25/50/100 km radii. Bind radius pills and progress fill. |
| **SLM AI Model Card** | `app/js/ai_assistant.js`<br>`app/js/main.js` | Connect toggle to `aiAssistant.setMode()`, persist preference in `store.js`, and wire WebGPU detection. |
| **Python Runtime Card**| `app/js/main.js` | Render status badge, add connection check button, and provide terminal commands snippet. |
| **Language Packs Card**| `app/js/i18n.js`<br>`app/js/main.js` | Implement font & dictionary caching into Cache API, sync badges with `getCurrentLanguage()`. |
| **GPS Re-Sync Button** | `app/js/main.js` | Implement `setupGpsResync()` with `.spinning` visual feedback and error fallback handling. |
| **Proximity Indicator**| `app/js/main.js` | Implement `updateProximityBanner()` computing live nearest CWC gauge distance and upstream/downstream flow. |
| **Test Verification** | `app/test/downloads_proximity.test.mjs` | Write pure unit tests for sizes, distances, and modes. Verify with `node --test app/test/*.test.mjs`. |
