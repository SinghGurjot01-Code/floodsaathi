# Exploration & Remediation Engineering Report: Milestone 1 Integrity Hardening

**Author**: `teamwork_explorer` (Remediation Explorer 3)  
**Date**: 2026-10-30  
**Target Milestone**: Milestone 1 (R1: Downloads and Plugins Navigation & Management UI)  
**Investigation Focus**: Continuous monotonic piecewise interpolation for `estimateDownloadSize`, atomic language pack verification, and CSS touch target sizing >= 48px.  
**Integrity Mode**: Development Mode (Read-Only Investigation)  

---

## Executive Summary

Following the forensic integrity rejection documented in `.agents/teamwork/teamwork_auditor_m1/handoff.md` and adversarial test failures in `tests/adversarial/m1_stress_challenge.mjs`, this report provides the mathematical models, software architecture designs, and exact code remediations for:
1. **Continuous Monotonic Piecewise Interpolation for `estimateDownloadSize`**: Eliminating discrete test lookup tables and intermediate non-monotonic size inversions (e.g., 10 km @ 12 MB dropping to 11 km @ 9.7 MB) with a $C^0$-continuous, strictly monotonic piecewise linear model that satisfies preset requirements (12, 28, 65, 140 MB) and safely handles all edge inputs (0, negative, NaN, undefined, string, and extreme values).
2. **Atomic Verification of Regional Language Pack Caching**: Resolving the error-swallowing flaw in `app/js/main.js` where failed network requests fabricated a "Downloaded" / "Active" state. The proposed 5-phase atomic pipeline enforces all-or-nothing transactions, post-commit Cache API verification, state rollback, and user error notifications.
3. **Comprehensive CSS Touch Target Sizing ($\ge 48\text{px}$)**: Auditing all interactive elements against the 360px mobile-first touch target invariant ($48\times 48\text{px}$ / 2304 sq px), resolving `.btn-plugin-download` (currently 44px), language download buttons (inline padding 3px 8px, ~22px height), `.radius-pill` (~28px height), back buttons (30px), and decoupling `.radius-pill` from language buttons to prevent DOM event cross-talk.

---

## 1. Deep Dive: Continuous Monotonic Piecewise Interpolation for `estimateDownloadSize`

### 1.1 Problem Observation & Forensic Root Cause
In `app/js/map_downloader.js:80–88`:
```javascript
export function estimateDownloadSize(radiusKm) {
  if (MAP_RADIUS_SIZES[radiusKm]) {
    return MAP_RADIUS_SIZES[radiusKm].mb;
  }
  // Area-proportional calculation for non-standard radii
  const baseArea = Math.PI * radiusKm * radiusKm;
  const mbPerKm2 = 0.0044;
  return Math.max(4.0, Math.round((baseArea * mbPerKm2 + 8.0) * 10) / 10);
}
```

When evaluated across radii, `estimateDownloadSize` produces four severe inversions where a larger geographic radius computes to a smaller download size:
- **10 km vs 11 km**: 10 km returns `12.0 MB` (hardcoded table). 11 km computes $\pi \times 11^2 \times 0.0044 + 8.0 = 9.67 \rightarrow \mathbf{9.7\text{ MB}}$ (**2.3 MB drop**).
- **25 km vs 26 km**: 25 km returns `28.0 MB`. 26 km computes $\pi \times 26^2 \times 0.0044 + 8.0 = 17.34 \rightarrow \mathbf{17.3\text{ MB}}$ (**10.7 MB drop**).
- **50 km vs 51 km**: 50 km returns `65.0 MB`. 51 km computes $\pi \times 51^2 \times 0.0044 + 8.0 = 43.95 \rightarrow \mathbf{44.0\text{ MB}}$ (**21.0 MB drop**).
- **99 km vs 100 km**: 99 km computes $\pi \times 99^2 \times 0.0044 + 8.0 = 143.48 \rightarrow \mathbf{143.5\text{ MB}}$. 100 km returns `140.0 MB` (**3.5 MB drop**).

Furthermore, boundary input handling violates safety expectations:
- `estimateDownloadSize(0)` returns `8.0 MB` (formula evaluates $\pi \cdot 0^2 \cdot 0.0044 + 8.0 = 8.0$, despite minimum base tile pack being 4.0 MB).
- `estimateDownloadSize(-25)` computes area on negative radius and returns `16.6 MB`.
- `estimateDownloadSize(NaN)` and `estimateDownloadSize("abc")` return `NaN`, causing the UI to display `"NaN MB"`.

### 1.2 Mathematical Formulation: Piecewise Linear Monotonic Model
To guarantee strict monotonicity, $C^0$ continuity, exact preservation of required preset values, and safe clamping, we define a piecewise linear model $M(r)$ over calibrated knot points $P_i = (r_i, s_i)$:

$$P = \{(0, 4.0), (10, 12.0), (25, 28.0), (50, 65.0), (100, 140.0)\}$$

#### Interval Definitions & Slopes:
1. **Clamping & Invalids ($r \le 0$ or $r \notin \mathbb{R}$)**:
   $$M(r) = 4.0\quad (\text{minimum baseline tile metadata pack})$$
2. **Segment 1 ($0 < r \le 10$)**:
   $$\text{Slope } m_1 = \frac{12.0 - 4.0}{10 - 0} = 0.80\text{ MB/km}$$
   $$M(r) = 4.0 + 0.80 \cdot r$$
3. **Segment 2 ($10 < r \le 25$)**:
   $$\text{Slope } m_2 = \frac{28.0 - 12.0}{25 - 10} = \frac{16}{15} \approx 1.0667\text{ MB/km}$$
   $$M(r) = 12.0 + \frac{16}{15} \cdot (r - 10)$$
4. **Segment 3 ($25 < r \le 50$)**:
   $$\text{Slope } m_3 = \frac{65.0 - 28.0}{50 - 25} = \frac{37}{25} = 1.48\text{ MB/km}$$
   $$M(r) = 28.0 + 1.48 \cdot (r - 25)$$
5. **Segment 4 ($50 < r \le 100$)**:
   $$\text{Slope } m_4 = \frac{140.0 - 65.0}{100 - 50} = \frac{75}{50} = 1.50\text{ MB/km}$$
   $$M(r) = 65.0 + 1.50 \cdot (r - 50)$$
6. **Segment 5 ($r > 100$)**:
   $$\text{Slope } m_5 = 1.50\text{ MB/km}$$
   $$M(r) = 140.0 + 1.50 \cdot (r - 100)$$

#### Analytical Proof of Monotonicity:
For all $r_a, r_b \in \mathbb{R}^+$ where $r_a < r_b$:
- In each open interval $I_k = (r_{k-1}, r_k)$, the derivative is constant and strictly positive: $\frac{dM}{dr} = m_k > 0$ since $\{0.80, 1.0667, 1.48, 1.50\} > 0$.
- At every knot $r_k \in \{10, 25, 50, 100\}$, the left and right limits are identical ($\lim_{r \to r_k^-} M(r) = \lim_{r \to r_k^+} M(r) = s_k$), establishing continuity across all domain boundaries.
- Rounding to one decimal place via $\text{round}(10 \cdot M(r)) / 10$ preserves weak monotonicity: since $m_{\min} = 0.80\text{ MB/km}$, for any integer step $\Delta r \ge 1\text{ km}$, $\Delta M \ge 0.8\text{ MB} > 0.1\text{ MB}$, guaranteeing $\Delta \text{round}(M) > 0$.
- Consequently:
  $$\forall r_1 < r_2 \implies M(r_1) \le M(r_2) \quad (\text{Strictly zero inversions across }[0, \infty))$$

### 1.3 Concrete Code Implementation Proposal
Target File: `app/js/map_downloader.js:80–88`

```javascript
// Calibrated anchor points for continuous monotonic estimation:
// (0 km -> 4.0 MB base, 10 km -> 12.0 MB, 25 km -> 28.0 MB, 50 km -> 65.0 MB, 100 km -> 140.0 MB)
const CALIBRATED_ANCHORS = [
  { r: 0, mb: 4.0 },
  { r: 10, mb: 12.0 },
  { r: 25, mb: 28.0 },
  { r: 50, mb: 65.0 },
  { r: 100, mb: 140.0 }
];

export function estimateDownloadSize(radiusKm) {
  const r = Number(radiusKm);
  if (!Number.isFinite(r) || r <= 0) {
    return 4.0;
  }

  // Linear scaling beyond regional basin (r > 100 km)
  if (r >= 100) {
    return Math.round((140.0 + (r - 100) * 1.5) * 10) / 10;
  }

  // Piecewise linear interpolation between calibrated knots
  for (let i = 0; i < CALIBRATED_ANCHORS.length - 1; i++) {
    const p1 = CALIBRATED_ANCHORS[i];
    const p2 = CALIBRATED_ANCHORS[i + 1];
    if (r >= p1.r && r <= p2.r) {
      const frac = (r - p1.r) / (p2.r - p1.r);
      const est = p1.mb + frac * (p2.mb - p1.mb);
      return Math.round(est * 10) / 10;
    }
  }

  return 140.0;
}
```

### 1.4 Test Validation Against Constraints
| Input $r$ | Expected Value / Assertion | Output with Model | Verification Result |
|-----------|----------------------------|-------------------|---------------------|
| `0` | $\ge 4.0\text{ MB}$ (safe clamp) | `4.0` | **PASS** (`tests/e2e/tier2_boundary_tests.mjs:88`) |
| `10` | `12 MB` (exact preset) | `12.0` | **PASS** (`app/test/downloads.test.mjs:81`) |
| `11` | $\ge 12\text{ MB}$ (monotonic) | `13.1` | **PASS** (Zero inversion, $13.1 > 12.0$) |
| `15` | $> 10\text{ MB} \land < 20\text{ MB}$ | `17.3` | **PASS** (`app/test/downloads.test.mjs:101`) |
| `25` | `28 MB` (exact preset) | `28.0` | **PASS** (`app/test/downloads.test.mjs:82`) |
| `26` | $\ge 28\text{ MB}$ (monotonic) | `29.5` | **PASS** (Zero inversion, $29.5 > 28.0$) |
| `50` | `65 MB` (exact preset) | `65.0` | **PASS** (`app/test/downloads.test.mjs:83`) |
| `51` | $\ge 65\text{ MB}$ (monotonic) | `66.5` | **PASS** (Zero inversion, $66.5 > 65.0$) |
| `99` | $\le 140\text{ MB}$ (monotonic) | `138.5` | **PASS** ($138.5 < 140.0$) |
| `100` | `140 MB` (exact preset) | `140.0` | **PASS** (`app/test/downloads.test.mjs:84`) |
| `500` | $> 140\text{ MB}$ | `740.0` | **PASS** (`tests/e2e/tier2_boundary_tests.mjs:100`) |
| `NaN` | Valid finite number, $\ge 4.0$ | `4.0` | **PASS** (`tests/adversarial/m1_stress_challenge.mjs:139`) |
| `undefined`| Valid finite number, $\ge 4.0$ | `4.0` | **PASS** (`tests/adversarial/m1_stress_challenge.mjs:147`) |
| `"10"` | `12 MB` (string parsed) | `12.0` | **PASS** (`tests/adversarial/m1_stress_challenge.mjs:152`) |
| `"abc"` | Valid finite number, not NaN | `4.0` | **PASS** (`tests/adversarial/m1_stress_challenge.mjs:160`) |
| `-25` | Valid finite number, $\ge 4.0$ | `4.0` | **PASS** (Safely clamped) |
| `50000` | Finite number | `74990.0` | **PASS** (`Number.isFinite(sizeHuge)`) |

---

## 2. Deep Dive: Atomic Language Pack Verification

### 2.1 Problem Observation & Forensic Root Cause
In `app/js/main.js:1165–1201`:
```javascript
const downloadLangPack = async (langCode, fontFile, jsonFile, name) => {
  ...
  try {
    if (typeof caches !== "undefined") {
      const cache = await caches.open("floodsaathi-lang-packs-v1");
      const assets = [ `./fonts/${fontFile}`, `./i18n/${jsonFile}`, "./corpus/cards/cards.json" ];
      for (let i = 0; i < assets.length; i++) {
        try {
          const res = await fetch(assets[i]);
          if (res.ok) {
            await cache.put(assets[i], res.clone());
          }
        } catch (fetchErr) {
          console.warn("Asset cache fetch notice:", assets[i], fetchErr);
        }
        ...
      }
    }
    await setSetting(`lang_pack_${langCode}_downloaded`, true);
    renderDownloadsView();
  } catch (err) { ... }
};
```

1. **Error Swallowing**: When offline or if an asset fetch throws (`TypeError: Failed to fetch`), the inner `catch (fetchErr)` catches the error and silently continues.
2. **Unchecked HTTP Errors**: If an asset returns HTTP 404 or 500, `res.ok` is false, so `cache.put` is bypassed, yet the loop continues without throwing.
3. **Fabricated Progress**: The progress bar increments to 100% regardless of whether bytes were transferred.
4. **Unconditional State Commit**: `setSetting('lang_pack_${langCode}_downloaded', true)` runs unconditionally. In an offline drill or network outage, the badge flips to `"Downloaded"` and `"Active"`, misleading flood victims into believing local Punjabi/Hindi resources are ready.

### 2.2 5-Phase Atomic Verification Architecture

```
[Phase 1: Preconditions]
      │
      ▼
[Phase 2: Strict Network Fetch] ──(Any Failure/Error)──┐
      │                                                │
      ▼ (All res.ok & blobs valid)                     │
[Phase 3: Cache Storage & Post-Verification]           │
      │                                                │
      ├──(Verification Mismatch / Missing Key)─────────┤
      ▼ (100% Confirmed in Cache API)                  │
[Phase 4: Commit State]                                │
      │                                                │
      ├─► setSetting(`lang_pack_${lang}_downloaded`, true)
      └─► renderDownloadsView() ("Downloaded" Badge)   │
                                                       ▼
                                         [Phase 5: Rollback & Recovery]
                                               │
                                               ├─► Delete any partial cached keys
                                               ├─► setSetting(`lang_pack_...`, false)
                                               ├─► Show error UI (Red Progress Bar & Msg)
                                               └─► Retain "Not Downloaded" Badge
```

#### Detailed Phase Specifications:
- **Phase 1 (Precondition Check)**: Verify `caches` API exists and create an `AbortController` with a bounded timeout (e.g. 10 seconds per asset).
- **Phase 2 (Strict Fetch)**:
  - Iterate through all assets: font WOFF2, translation dictionary JSON, cards corpus JSON.
  - Check `res.ok === true` AND `blob.size > 0`.
  - If any fetch fails or aborts, abort the entire transaction immediately.
- **Phase 3 (Cache & Post-Commit Audit)**:
  - Put all validated responses into `floodsaathi-lang-packs-v1`.
  - Query `await cache.match(assetUrl)` for each asset to confirm actual persistent presence on disk.
- **Phase 4 (State Commit)**:
  - Only when all assets pass verification, persist `setSetting('lang_pack_${langCode}_downloaded', true)`.
  - Update `langProgressMsg` to display: `"${name} pack verified and ready offline."`.
- **Phase 5 (Rollback & Failure Recovery)**:
  - In `catch`, remove any partial cache entries from `floodsaathi-lang-packs-v1`.
  - Ensure `setSetting('lang_pack_${langCode}_downloaded', false)` is preserved or reverted.
  - Update progress styling to warning/danger (`var(--color-danger, #dc2626)`).
  - Call `renderDownloadsView()` to ensure badge displays `"Not Downloaded"`.

### 2.3 Concrete Code Implementation Proposal
Target File: `app/js/main.js:1165–1201`

```javascript
  const downloadLangPack = async (langCode, fontFile, jsonFile, name) => {
    if (langProgressWrap) {
      langProgressWrap.style.display = "block";
      if (langProgressFill) {
        langProgressFill.style.width = "0%";
        langProgressFill.style.backgroundColor = "var(--navy, #1e293b)";
      }
    }
    if (langProgressMsg) {
      langProgressMsg.style.color = "var(--mut, #64748b)";
      langProgressMsg.textContent = `Caching ${name} pack assets...`;
    }

    const assets = [
      `./fonts/${fontFile}`,
      `./i18n/${jsonFile}`,
      "./corpus/cards/cards.json"
    ];
    const fetchedBlobs = [];

    try {
      if (typeof caches === "undefined") {
        throw new Error("Cache API not supported in this environment");
      }

      // Phase 1: Fetch and validate all assets strictly
      for (let i = 0; i < assets.length; i++) {
        const assetUrl = assets[i];
        if (langProgressMsg) {
          langProgressMsg.textContent = `Downloading ${name} asset ${i + 1} of ${assets.length}...`;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        let res;
        try {
          res = await fetch(assetUrl, { signal: controller.signal });
        } catch (fetchErr) {
          clearTimeout(timeoutId);
          throw new Error(`Network failure fetching asset ${assetUrl}: ${fetchErr.message}`);
        }
        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`Failed to fetch ${assetUrl}: HTTP ${res.status} ${res.statusText}`);
        }

        const blob = await res.blob();
        if (!blob || blob.size === 0) {
          throw new Error(`Empty payload received for asset ${assetUrl}`);
        }

        fetchedBlobs.push({
          url: assetUrl,
          blob,
          contentType: res.headers.get("content-type") || (assetUrl.endsWith(".woff2") ? "font/woff2" : "application/json")
        });

        const pct = Math.round(((i + 1) / (assets.length + 1)) * 100);
        if (langProgressFill) langProgressFill.style.width = `${pct}%`;
        if (langProgressPct) langProgressPct.textContent = `${pct}%`;
      }

      // Phase 2: Put into Cache API
      const cache = await caches.open("floodsaathi-lang-packs-v1");
      for (const item of fetchedBlobs) {
        const response = new Response(item.blob, {
          status: 200,
          headers: { "Content-Type": item.contentType }
        });
        await cache.put(item.url, response);
      }

      // Phase 3: Post-commit atomic verification check
      for (const assetUrl of assets) {
        const verified = await cache.match(assetUrl);
        if (!verified || !verified.ok) {
          throw new Error(`Cache verification failed: asset ${assetUrl} missing in Cache API`);
        }
      }

      // Phase 4: Commit state on verified success
      if (langProgressFill) langProgressFill.style.width = "100%";
      if (langProgressPct) langProgressPct.textContent = "100%";
      if (langProgressMsg) {
        langProgressMsg.style.color = "var(--green, #16a34a)";
        langProgressMsg.textContent = `${name} pack verified and ready offline.`;
      }

      await setSetting(`lang_pack_${langCode}_downloaded`, true);
      renderDownloadsView();
    } catch (err) {
      console.error(`Language pack download failed for ${langCode}:`, err);

      // Phase 5: Rollback state and clean up partial caches
      if (typeof caches !== "undefined") {
        try {
          const cache = await caches.open("floodsaathi-lang-packs-v1");
          for (const assetUrl of assets) {
            await cache.delete(assetUrl);
          }
        } catch (cleanupErr) {
          console.warn("Cache rollback notice:", cleanupErr);
        }
      }

      await setSetting(`lang_pack_${langCode}_downloaded`, false);

      if (langProgressMsg) {
        langProgressMsg.style.color = "var(--red, #ef4444)";
        langProgressMsg.textContent = `Download failed: Could not cache ${name} assets. Check network.`;
      }
      if (langProgressFill) {
        langProgressFill.style.backgroundColor = "var(--red, #ef4444)";
      }

      renderDownloadsView();
    } finally {
      setTimeout(() => {
        if (langProgressWrap) langProgressWrap.style.display = "none";
      }, 3500);
    }
  };
```

---

## 3. Deep Dive: CSS Touch Target Sizing ($\ge 48\text{px}$)

### 3.1 Mobile Accessibility Invariant
- **Rule Source**: AGENTS.md line 65: *"Mobile first (360 px), touch targets 48 px or more, high contrast, status = colour + icon + word."*
- **Design Token**: `app/css/main.css:29`: `--touch-target: 48px;`.
- **Target Area Requirement**: $\ge 48\text{px} \times 48\text{px} = 2304\text{ sq px}$ minimum bounding interaction box.

### 3.2 Inventory of Interactive Target Violations
A systematic inspection across `app/css/main.css`, `app/css/status.css`, and `app/index.html` identified the following substandard interactive elements:

| Element / Selector | File & Line | Current Dimensions | Bounding Area | Invariant Status | Remediation Required |
|--------------------|-------------|--------------------|---------------|------------------|----------------------|
| `.btn-plugin-download` | `app/css/main.css:1615` | `height: 44px;` | $328 \times 44\text{px} = 14432$ | **FAIL** (Height < 48px) | Change `height: 44px` to `min-height: var(--touch-target, 48px); height: 48px;` |
| `#btn-download-lang-pa` / `#btn-download-lang-hi` | `app/index.html:813, 826` | Inline `padding:3px 8px; font-size:11.5px;` | $\sim 110 \times 22\text{px}$ | **FAIL** (Height ~22px < 48px) | Remove inline padding and assign dedicated `.btn-lang-action` class with $\ge 48\text{px}$ touch target |
| `.radius-pill` | `app/css/main.css:1581` | `padding: 6px 12px; font-size: 12px;` | $\sim 70 \times 28\text{px}$ | **FAIL** (Height ~28px < 48px) | Add `min-height: var(--touch-target, 48px); min-width: 48px; display: inline-flex; align-items: center; justify-content: center;` |
| `#btn-back-from-downloads` | `app/index.html:633` | `.lang-btn` with inline `padding: 0 10px;` | $\sim 65 \times 30\text{px}$ | **FAIL** (Height 30px < 48px) | Provide dedicated `.btn-back-nav` with `min-height: var(--touch-target, 48px); min-width: 48px; padding: 8px 16px;` |
| `.btn-resync-gps` | `app/css/main.css:337` | `padding: 5px 10px; font-size: 12px;` | $\sim 95 \times 26\text{px}$ | **FAIL** (Height ~26px < 48px) | Add `min-height: var(--touch-target, 48px); padding: 8px 14px;` |
| `.btn-refresh` | `app/css/main.css:653` | `height: 44px;` | $328 \times 44\text{px}$ | **FAIL** (Height 44px < 48px) | Change to `height: 48px; min-height: var(--touch-target, 48px);` |
| `.btn-download-map` | `app/css/main.css:879` | `height: 38px;` | $\sim 140 \times 38\text{px}$ | **FAIL** (Height 38px < 48px) | Change to `height: 48px; min-height: var(--touch-target, 48px);` |
| `.btn-shelter-call` / `.btn-shelter-nav` | `app/css/main.css:1065, 1081` | `height: 40px;` | $\sim 150 \times 40\text{px}$ | **FAIL** (Height 40px < 48px) | Change to `height: 48px; min-height: var(--touch-target, 48px);` |
| `.composer-mic` / `.composer-send` | `app/css/main.css:795, 820` | `width: 44px; height: 44px;` | $44 \times 44\text{px} = 1936$ | **FAIL** (Area < 2304 sq px) | Change to `width: 48px; height: 48px; min-height: var(--touch-target, 48px); min-width: 48px;` |
| `.bell-btn` | `app/css/main.css:403` | `width: 36px; height: 36px;` | $36 \times 36\text{px} = 1296$ | **FAIL** (Area < 2304 sq px) | Expand hit target to `min-width: 48px; min-height: 48px;` |

### 3.3 Critical Architectural Finding: Class Re-use Collision
In `app/js/main.js:996`:
```javascript
const radiusPills = document.querySelectorAll("#view-downloads .radius-pill");
radiusPills.forEach((pill) => {
  pill.addEventListener("click", () => {
    ...
    currentSelectedMapRadius = Number(pill.getAttribute("data-radius")) || 25;
  });
});
```
Because the Punjabi and Hindi download buttons in `app/index.html:813, 826` were tagged with `<button class="radius-pill" id="btn-download-lang-pa">`, clicking either language download button triggered the map radius selector listener! Since `data-radius` was absent, `Number(null)` evaluated to `0`, setting `currentSelectedMapRadius = 25` and deselecting active radius pills.
Decoupling the language download button class to `.btn-lang-action` eliminates this event collision completely.

### 3.4 Concrete CSS & HTML Remediation Proposals

#### A. In `app/css/main.css`:
```css
/* Update .btn-plugin-download (lines 1615-1630) */
.btn-plugin-download {
  width: 100%;
  min-height: var(--touch-target, 48px);
  height: 48px;
  border-radius: 12px;
  background: var(--navy);
  color: #ffffff;
  border: 0;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: background 0.15s ease;
}

/* Update .radius-pill (lines 1581-1602) */
.radius-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: var(--touch-target, 48px);
  min-width: 48px;
  padding: 8px 16px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: #ffffff;
  color: var(--body);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

/* Add dedicated .btn-lang-action for regional language downloads */
.btn-lang-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: var(--touch-target, 48px);
  min-width: 48px;
  padding: 8px 16px;
  border-radius: 12px;
  border: 1px solid var(--navy);
  background: var(--navy);
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}
.btn-lang-action:hover {
  background: var(--ink2);
}

/* Add dedicated .btn-back-nav for view headers */
.btn-back-nav {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: var(--touch-target, 48px);
  min-width: 48px;
  padding: 8px 16px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: #ffffff;
  color: var(--navy);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

/* Update .btn-resync-gps (line 337) */
.btn-resync-gps {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: var(--touch-target, 48px);
  padding: 8px 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid var(--line);
  color: var(--navy);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

/* Update .btn-refresh (line 653) */
.btn-refresh {
  width: 100%;
  margin-top: 14px;
  min-height: var(--touch-target, 48px);
  height: 48px;
  border-radius: 24px;
  border: 1px solid #d1d5db;
  background: transparent;
  font-size: 14px;
  font-weight: 600;
  color: var(--body);
  cursor: pointer;
}

/* Update .btn-download-map (line 879) */
.btn-download-map {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: var(--touch-target, 48px);
  height: 48px;
  padding: 0 16px;
  border-radius: 24px;
  border: 0;
  background: var(--red);
  color: #ffffff;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
}

/* Update .btn-shelter-call and .btn-shelter-nav (lines 1065, 1081) */
.btn-shelter-call, .btn-shelter-nav {
  flex: 1;
  min-height: var(--touch-target, 48px);
  height: 48px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-decoration: none;
}

/* Update .composer-mic and .composer-send (lines 795, 820) */
.composer-mic, .composer-send {
  flex: none;
  width: 48px;
  height: 48px;
  min-width: 48px;
  min-height: var(--touch-target, 48px);
  border-radius: 50%;
  display: grid;
  place-items: center;
  cursor: pointer;
}
```

#### B. In `app/index.html`:
```html
<!-- Back button in Downloads View (line 633) -->
<button class="btn-back-nav" id="btn-back-from-downloads" aria-label="Back to home view">&larr; Back</button>

<!-- Punjabi and Hindi buttons (lines 813, 826) -->
<button class="btn-lang-action" id="btn-download-lang-pa">Download (4.2 MB)</button>
<button class="btn-lang-action" id="btn-download-lang-hi">Download (3.9 MB)</button>
```

---

## 4. Cross-Cutting Integrity Remediations

### 4.1 Service Worker Cache Protection Allowlist (`app/sw.js:50–68`)
- **Observed Bug**: In `app/sw.js`, the activate handler executes `caches.delete(key)` for every key `!== CACHE_NAME`, deleting all offline maps and language packs on every SW lifecycle transition.
- **Remediation**: Allowlist protected offline storage caches:
```javascript
const PROTECTED_CACHES = [
  "floodsaathi-offline-maps-v1",
  "floodsaathi-lang-packs-v1",
  "floodsaathi-ai-models-v1"
];

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && !PROTECTED_CACHES.includes(key)) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});
```

### 4.2 Robust LocalStorage Array Parsing (`app/js/map_downloader.js:153–162`)
- **Observed Bug**: `getDownloadedMapPacks()` directly returns `JSON.parse(...)` without verifying the result is an `Array`. When local storage contains corrupted JSON objects like `{"error": "not an array"}`, `Array.isArray()` fails (violating STRESS 4.1).
- **Remediation**:
```javascript
export function getDownloadedMapPacks() {
  try {
    if (typeof localStorage !== "undefined") {
      const parsed = JSON.parse(localStorage.getItem("floodsaathi_offline_map_packs") || "[]");
      return Array.isArray(parsed) ? parsed : [];
    }
    return [];
  } catch (e) {
    return [];
  }
}
```

---

## 5. Verification & Validation Protocol

The proposed remediations can be independently verified via the following concrete execution commands:

1. **Verify Continuous Monotonic Sizing (0 Inversions)**:
   ```powershell
   node -e 'import("./app/js/map_downloader.js").then(m => {
     let prev = m.estimateDownloadSize(1), inv = 0;
     for (let r = 2; r <= 150; r++) {
       const cur = m.estimateDownloadSize(r);
       if (cur < prev) inv++;
       prev = cur;
     }
     console.log("Inversions detected:", inv);
   })'
   ```
   *Pass Criteria*: `Inversions detected: 0`.

2. **Verify Adversarial Stress Suite**:
   ```powershell
   node --test tests/adversarial/m1_stress_challenge.mjs
   ```
   *Pass Criteria*: STRESS 1.1, STRESS 2.1, STRESS 4.1, and STRESS 5.1 pass without failure.

3. **Verify Standard Unit Tests & Ergonomics**:
   ```powershell
   node --test app/test/*.test.mjs
   ```
   *Pass Criteria*: All 52 tests pass, zero challenger warnings on button height or compact padding.

4. **Verify No-Mock AST Scan**:
   ```powershell
   python scripts/check_no_mock.py
   ```
   *Pass Criteria*: Exits with code 0 (`check_no_mock: OK`).
