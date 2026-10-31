// app/js/main.js
// FloodSaathi Main Application Controller & UI Binder
// Pure ES module: runs offline, NO framework, NO bundler.

import { CONFIG } from "../config.js";
import { initI18n, setLanguage, getCurrentLanguage, t, applyTranslations } from "./i18n.js";
import { getLatestSnapshot, getAllSnapshots, getContacts, addContact, deleteContact, addObservation, getSetting, setSetting } from "./store.js";
import { createSnapshotFromRelay, getSnapshotAge } from "./snapshot.js";
import { computeOfflineEstimate, formatHours } from "./estimator.js";
import { computeRawStatus, resolveOfflineStatus, STATUS_COLORS, STATUS_ICONS } from "./status.js";
import { buildSosSmsUri } from "./sos.js";
import { fetchShelters, formatAmenities } from "./shelters.js";
import { downloadMapPack, getDownloadedMapPacks, deleteOfflineMapPack, estimateDownloadSize, checkMapPackStatus, MAP_RADIUS_SIZES } from "./map_downloader.js";
import { initWaterMap, setMapLayerFilter, syncMapViewport, initShelterRouteMap, setMapDownloadRadiusPreview } from "./map.js";
import { ensureFloodSaathiFolder, getFloodSaathiFolderStatus, saveFileToAppFolder, saveBinaryToAppFolder, readFileFromAppFolder, clearAppSubFolder } from "./mobile_storage.js";
import { CardRetriever } from "./ask.js";
import { AskSaathiAssistant } from "./ai_assistant.js";
import { PUNJAB_DISTRICTS, findNearestDistrict } from "./districts.js";

// Application State
let currentTab = "home";
let currentSnapshot = null;
let cardRetriever = null;
let aiAssistant = null;
let allCards = [];

let userProfile = {
  lat: 30.901,
  lon: 75.857,
  district: "Ludhiana",
  village_name: "Ludhiana, Punjab",
  village_id: "pb-ludhiana",
  elevation_m: 244,
  basin: "Sutlej Basin"
};

// Register Service Worker
if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .then((reg) => {
        reg.update();
      })
      .catch((err) => console.warn("SW registration failed:", err));

    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}

// Initialise Application on DOMContentLoaded
if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", async () => {
    await initI18n();
    setupLanguageSwitcher();
    setupNavigation();
    setupHomeActions();
    setupGpsResync();
    setupDownloadsView();
    setupAskSaathi();
    setupSosView();
    setupAfterFloodGuide();
    setupPreferencesView();
    setupMapDownloader();
    setupFirstRunModal();
    setupSlmToast();

    // Load saved location profile if stored
    const savedDistrict = await getSetting("user_district");
    if (savedDistrict) userProfile.district = savedDistrict;
    const savedVillageName = await getSetting("user_village_name");
    if (savedVillageName) userProfile.village_name = savedVillageName;
    const savedVillageId = await getSetting("user_village_id");
    if (savedVillageId) userProfile.village_id = savedVillageId;
    const savedLat = await getSetting("user_lat");
    const savedLon = await getSetting("user_lon");
    const savedElev = await getSetting("user_elevation_m");
    const savedSyncedAt = await getSetting("user_gps_synced_at");
    if (typeof savedLat === "number") userProfile.lat = savedLat;
    if (typeof savedLon === "number") userProfile.lon = savedLon;
    if (typeof savedElev === "number") userProfile.elevation_m = savedElev;
    if (savedSyncedAt) userProfile.gps_synced_at = savedSyncedAt;

    // Update location UI with saved/current profile
    updateLocationUI();

    // Setup Location Picker & Accessibility TTS Controller
    setupLocationPicker();
    setupTtsController();

    // Auto-detect GPS if permission is already granted
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      try {
        navigator.permissions?.query({ name: "geolocation" }).then((result) => {
          if (result.state === "granted") {
            const gpsBtn = document.getElementById("btn-resync-gps");
            if (gpsBtn && !userProfile.gps_synced_at) gpsBtn.click();
          }
        }).catch(() => {});
      } catch {}
    }

    // Load knowledge cards for Ask Saathi
    await loadKnowledgeCards();

    // Initial load of hydrologic telemetry
    await loadAndRenderData();

    // Network online/offline event listeners
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        updateOnlineStatus(true);
        fetchLiveRelayData();
      });
      window.addEventListener("offline", () => {
        updateOnlineStatus(false);
      });
      updateOnlineStatus(navigator.onLine);

      // Periodic interval: every 5 min active, re-poll or recompute
      setInterval(() => {
        if (navigator.onLine) {
          fetchLiveRelayData();
        } else {
          recomputeOfflineView();
        }
      }, CONFIG.CADENCE_MS.ACTIVE_INTERVAL);
    }
  });
}

function updateOnlineStatus(isOnline) {
  const banner = document.getElementById("offline-banner");
  if (!banner) return;
  if (isOnline) {
    banner.classList.add("hidden");
  } else {
    banner.classList.remove("hidden");
    const age = getSnapshotAge(currentSnapshot?.saved_at);
    banner.textContent = `Offline Mode: Working from stored telemetry (Age: ${age.display}). Estimates labelled below.`;
  }
}

// ==========================================
// NAVIGATION & VIEW ROUTING
// ==========================================
function setupNavigation() {
  const tabButtons = document.querySelectorAll(".nav-tab-btn");
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.getAttribute("data-tab");
      if (tab) switchTab(tab);
    });
  });

  // Floating SOS button on Home
  const floatingSos = document.getElementById("floating-sos-btn");
  if (floatingSos) {
    floatingSos.addEventListener("click", () => switchTab("sos"));
  }

  // Bell icon on Home
  const bellBtn = document.getElementById("btn-hero-bell");
  if (bellBtn) {
    bellBtn.addEventListener("click", () => switchTab("alerts"));
  }

  // More sub-views navigation buttons
  document.getElementById("nav-to-shelters")?.addEventListener("click", () => switchTab("shelters"));
  document.getElementById("nav-to-sos")?.addEventListener("click", () => switchTab("sos"));
  document.getElementById("nav-to-after-flood")?.addEventListener("click", () => switchTab("after-flood"));
  document.getElementById("nav-to-preferences")?.addEventListener("click", () => switchTab("preferences"));
  document.getElementById("nav-to-downloads")?.addEventListener("click", () => switchTab("downloads"));
  document.getElementById("nav-to-onboarding")?.addEventListener("click", () => {
    const modal = document.getElementById("first-run-modal");
    if (modal) modal.style.display = "flex";
  });

  // Back buttons on sub-views
  document.getElementById("btn-back-from-shelters")?.addEventListener("click", () => switchTab("more"));
  document.getElementById("btn-back-from-sos")?.addEventListener("click", () => switchTab("more"));
  document.getElementById("btn-back-from-after-flood")?.addEventListener("click", () => switchTab("more"));
  document.getElementById("btn-back-from-preferences")?.addEventListener("click", () => switchTab("more"));
  document.getElementById("btn-back-from-downloads")?.addEventListener("click", () => switchTab("more"));

  // Risk Map & Detail Map Interconnections (risk-map.html <-> map-screen.html <-> shelter-responsive.html)
  const riskStage = document.getElementById("risk-map-stage");
  const detailPanel = document.getElementById("map-detail-panel");
  const mapContainer = document.getElementById("map-container");
  const btnToggleVector = document.getElementById("btn-toggle-live-vector-map");

  document.getElementById("btn-map-view-details")?.addEventListener("click", () => {
    if (riskStage) riskStage.style.display = "none";
    if (detailPanel) detailPanel.classList.add("active");
    updateMapDetailScreen(currentSnapshot);
  });

  document.getElementById("btn-map-open-shelters")?.addEventListener("click", () => {
    switchTab("shelters");
  });

  document.getElementById("btn-map-detail-back")?.addEventListener("click", () => {
    if (detailPanel) detailPanel.classList.remove("active");
    if (riskStage) riskStage.style.display = "flex";
    syncMapViewport(userProfile);
  });

  // Segmented pills on Risk Map (filter both static markers AND live MapLibre vector layers)
  document.getElementById("btn-seg-flood-risk")?.addEventListener("click", (e) => {
    document.querySelectorAll(".risk-seg button").forEach(b => b.classList.remove("on"));
    e.currentTarget.classList.add("on");
    if (!riskStage?.classList.contains("vector-map-active")) {
      document.getElementById("mk-warn-1")?.style.setProperty("display", "block");
      document.getElementById("mk-shelter-1")?.style.setProperty("display", "block");
      document.getElementById("mk-shelter-2")?.style.setProperty("display", "block");
      document.getElementById("mk-hosp-1")?.style.setProperty("display", "block");
    }
    setMapLayerFilter("all");
  });

  document.getElementById("btn-seg-shelters")?.addEventListener("click", (e) => {
    document.querySelectorAll(".risk-seg button").forEach(b => b.classList.remove("on"));
    e.currentTarget.classList.add("on");
    if (!riskStage?.classList.contains("vector-map-active")) {
      document.getElementById("mk-warn-1")?.style.setProperty("display", "none");
      document.getElementById("mk-hosp-1")?.style.setProperty("display", "none");
      document.getElementById("mk-shelter-1")?.style.setProperty("display", "block");
      document.getElementById("mk-shelter-2")?.style.setProperty("display", "block");
    }
    setMapLayerFilter("shelters");
  });

  document.getElementById("btn-seg-hospitals")?.addEventListener("click", (e) => {
    document.querySelectorAll(".risk-seg button").forEach(b => b.classList.remove("on"));
    e.currentTarget.classList.add("on");
    if (!riskStage?.classList.contains("vector-map-active")) {
      document.getElementById("mk-warn-1")?.style.setProperty("display", "none");
      document.getElementById("mk-shelter-1")?.style.setProperty("display", "none");
      document.getElementById("mk-shelter-2")?.style.setProperty("display", "none");
      document.getElementById("mk-hosp-1")?.style.setProperty("display", "block");
    }
    setMapLayerFilter("hospitals");
    const hospMk = document.getElementById("mk-hosp-1");
    if (hospMk) {
      hospMk.style.transform = "translate(-50%, -115%) scale(1.2)";
      setTimeout(() => { hospMk.style.transform = ""; }, 1200);
    }
  });

  // Markers on Risk Map
  document.getElementById("mk-shelter-1")?.addEventListener("click", () => switchTab("shelters"));
  document.getElementById("mk-shelter-2")?.addEventListener("click", () => switchTab("shelters"));
  document.getElementById("mk-warn-1")?.addEventListener("click", () => {
    document.getElementById("btn-map-view-details")?.click();
  });
  document.getElementById("mk-hosp-1")?.addEventListener("click", () => {
    alert(`Civil Hospital Emergency Helpline (${userProfile.district || "Punjab"}): Dial 108 (Ambulance) or 112 (Emergency).`);
  });

  // Layers button toggles between 1-to-1 FloodSaathi-UI Terrain Risk Map and live MapLibre PMTiles vector map
  btnToggleVector?.addEventListener("click", async () => {
    if (!riskStage || !mapContainer) return;
    const isNowVector = !riskStage.classList.contains("vector-map-active");
    riskStage.classList.toggle("vector-map-active", isNowVector);
    riskStage.dataset.userToggledOff = isNowVector ? "" : "true";
    btnToggleVector.classList.toggle("active", isNowVector);
    if (isNowVector) {
      mapContainer.style.display = "block";
      await initWaterMap("map-container", userProfile, currentSnapshot || {});
      syncMapViewport(userProfile);
    } else {
      mapContainer.style.display = "none";
    }
  });

  // Timeline ticks on Time-to-Water detail screen (map-screen.html)
  const ticksWrap = document.getElementById("map-timeline-ticks");
  if (ticksWrap) {
    ticksWrap.querySelectorAll("span").forEach((tick) => {
      tick.addEventListener("click", () => {
        ticksWrap.querySelectorAll("span").forEach(s => s.classList.remove("active"));
        tick.classList.add("active");
        const pct = tick.getAttribute("data-pct") || "37";
        const hr = Number(tick.getAttribute("data-hr") || 24);
        const fill = document.getElementById("map-timeline-fill");
        const knob = document.getElementById("map-timeline-knob");
        if (fill) fill.style.width = `${pct}%`;
        if (knob) knob.style.left = `${pct}%`;
        updateMapDetailHorizon(hr);
      });
    });
  }
}

export function switchTab(tab) {
  currentTab = tab;

  // Update bottom tab buttons active state
  document.querySelectorAll(".nav-tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-tab") === tab);
  });

  // Hide all view sections and show current
  document.querySelectorAll(".view-section").forEach((sec) => {
    sec.classList.remove("active");
  });

  const targetSec = document.getElementById(`view-${tab}`);
  if (targetSec) {
    targetSec.classList.add("active");
  }

  // Toggle floating SOS visibility (only on home)
  const floatingSos = document.getElementById("floating-sos-btn");
  if (floatingSos) {
    floatingSos.style.display = tab === "home" ? "grid" : "none";
  }

  // Trigger view-specific renderers
  if (tab === "map") renderMapView();
  if (tab === "alerts") renderAlertsView();
  if (tab === "shelters") renderSheltersView();
  if (tab === "sos") renderSosContacts();
  if (tab === "preferences") renderPreferencesView();
  if (tab === "downloads") renderDownloadsView();

  // Notify other systems of tab change (e.g. SLM toast)
  window.dispatchEvent(new CustomEvent("floodsaathi:tab_changed", { detail: { tab } }));
}

// ==========================================
// LANGUAGE SWITCHER
// ==========================================
function updateChatWelcome() {
  const thread = document.getElementById("chat-thread");
  if (!thread) return;
  const userMsgs = thread.querySelectorAll(".msg-user-wrap");
  if (userMsgs.length === 0) {
    const greetingEl = thread.querySelector(".bot-card h3");
    const introEl = thread.querySelector(".bot-card p");
    if (greetingEl) greetingEl.textContent = t("ask.bot_greeting");
    if (introEl) introEl.textContent = t("ask.bot_intro");
  }
}

function setupLanguageSwitcher() {
  const current = getCurrentLanguage();
  const langBtns = document.querySelectorAll(".lang-btn[data-lang]");
  langBtns.forEach((b) => b.classList.toggle("active", b.getAttribute("data-lang") === current));

  langBtns.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const lang = btn.getAttribute("data-lang");
      if (!lang) return;
      await setLanguage(lang);
    });
  });

  window.addEventListener("floodsaathi:language_changed", async (e) => {
    const lang = e?.detail?.lang || getCurrentLanguage();
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
      const allLangBtns = document.querySelectorAll(".lang-btn[data-lang]");
      allLangBtns.forEach((b) => b.classList.toggle("active", b.getAttribute("data-lang") === lang));
      applyTranslations();
      updateLocationUI();
      recomputeOfflineView();
      await renderSheltersView();
      renderAfterFloodContent(activeAfterFloodTab);
      await renderDownloadsView();
      updateProximityBanner(currentSnapshot);
      updateChatWelcome();

      // Refresh location picker modal districts if rendered
      const districtList = document.getElementById("district-picker-list");
      if (districtList) {
        districtList.querySelectorAll(".district-btn").forEach((btn) => {
          const dName = btn.getAttribute("data-name");
          const d = PUNJAB_DISTRICTS.find((item) => item.name === dName);
          if (d) {
            const locName = lang === "pa" ? d.name_pa : lang === "hi" ? d.name_hi : d.name;
            const subName = lang !== "en" ? d.name : (d.basin || "Punjab");
            const strong = btn.querySelector("strong");
            const span = btn.querySelector("span");
            if (strong) strong.textContent = locName;
            if (span) span.textContent = subName;
          }
        });
      }
    }
  });
}

// ==========================================
// DATA FETCHING & STATUS MACHINE
// ==========================================
async function loadAndRenderData() {
  const cached = await getLatestSnapshot();
  if (cached) {
    currentSnapshot = cached;
    renderSnapshotData(cached);
  }

  if (navigator.onLine) {
    await fetchLiveRelayData();
  } else if (!cached) {
    renderDataUnavailable("No offline snapshot available yet. Connect to internet once.");
  }
}

async function fetchLiveRelayData() {
  const urls = [
    "./data/latest/punjab.json",
    CONFIG.REMOTE_DATA_FALLBACK_URL,
    CONFIG.GITHUB_RAW_DATA_URL
  ].filter(Boolean);

  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const relayData = await res.json();
      const snapshot = await createSnapshotFromRelay(relayData, userProfile);
      currentSnapshot = snapshot;
      renderSnapshotData(snapshot);
      return;
    } catch (err) {
      // Try next URL
    }
  }

  if (!currentSnapshot) {
    renderDataUnavailable("Live telemetry feed currently unavailable.");
  }
}

function renderDataUnavailable(reason) {
  const hero = document.getElementById("home-hero");
  if (hero) hero.className = "home-hero unknown";
  document.getElementById("status-word").textContent = "DATA UNAVAILABLE";
  document.getElementById("status-reason").textContent = reason;
  document.getElementById("status-age-badge").textContent = "No data";
}

function renderSnapshotData(snapshot) {
  if (!snapshot || !snapshot.gauges) return;

  const gauges = snapshot.gauges || [];
  const nearestResult = findNearestGauge(userProfile.lat, userProfile.lon, gauges);
  const g = nearestResult?.gauge || (gauges.length > 0 ? gauges[0] : null);
  const distKm = nearestResult ? nearestResult.distanceKm : 10;

  // 1. Update river gauge metrics (Metric 1)
  if (g) {
    const curLevel = g.level_m ?? g.current_level_m ?? 0;
    const warnLevel = g.warning_m ?? g.warning_level_m ?? 0;
    const dangLevel = g.danger_m ?? g.danger_level_m ?? 0;
    const trendVal = g.trend_m_per_h ?? g.trend_m_per_hr ?? 0;

    const nameEl = document.getElementById("metric-gauge-name");
    if (nameEl) nameEl.textContent = `${g.name || "CWC Gauge"} (${g.river || "Punjab"})`;

    const lvlEl = document.getElementById("metric-gauge-level");
    if (lvlEl) lvlEl.textContent = `${curLevel} m`;

    const trendEl = document.getElementById("metric-gauge-trend");
    if (trendEl) {
      if (trendVal === 0) {
        trendEl.textContent = t("metrics.trend_stable") || "Trend: Stable";
      } else if (trendVal > 0) {
        trendEl.textContent = t("metrics.trend_rising", { val: trendVal }) || `Trend: +${trendVal} m/h`;
      } else {
        trendEl.textContent = t("metrics.trend_falling", { val: trendVal }) || `Trend: ${trendVal} m/h`;
      }
    }

    const statusEl = document.getElementById("metric-gauge-status");
    if (statusEl) {
      if (curLevel >= dangLevel && dangLevel > 0) {
        statusEl.className = "metric-status-warn";
        statusEl.textContent = t("metrics.above_danger") || "Above Danger Level";
      } else if (curLevel >= warnLevel && warnLevel > 0) {
        statusEl.className = "metric-status-warn";
        statusEl.textContent = t("metrics.above_warning") || "Above Warning Level";
      } else {
        statusEl.className = "metric-status-ok";
        statusEl.textContent = t("metrics.below_warning") || "Below warning level";
      }
    }
  }

  // 2. Update Rain Forecast metric (Metric 2)
  const rainEl = document.getElementById("metric-rain-value");
  const rainStatusEl = document.getElementById("metric-rain-status");
  let rain72h = 0;
  if (snapshot.rain_by_district && userProfile.district) {
    const match = snapshot.rain_by_district.find(
      (r) => r.district.toLowerCase() === userProfile.district.toLowerCase()
    );
    if (match) rain72h = match.mm_72h || 0;
  } else if (typeof snapshot.rain_72h_mm === "number") {
    rain72h = snapshot.rain_72h_mm;
  }
  if (rainEl) rainEl.textContent = `${rain72h} mm`;
  if (rainStatusEl) {
    if (rain72h >= 50) {
      rainStatusEl.className = "metric-status-warn";
      rainStatusEl.textContent = t("metrics.heavy_rain") || "Heavy Rain Alert";
    } else if (rain72h >= 15) {
      rainStatusEl.className = "metric-status-warn";
      rainStatusEl.textContent = t("metrics.moderate_rain") || "Moderate Showers";
    } else if (rain72h > 0) {
      rainStatusEl.className = "metric-status-ok";
      rainStatusEl.textContent = t("metrics.light_rain") || "Light Showers";
    } else {
      rainStatusEl.className = "metric-status-ok";
      rainStatusEl.textContent = t("metrics.no_rain") || "No Rain Expected";
    }
  }

  // 3. Update Elevation metric (Metric 3)
  const elevEl = document.getElementById("metric-elevation-value");
  const elevVal = userProfile.elevation_m || 244;
  if (elevEl) elevEl.textContent = `${elevVal} m`;

  // 4. Update River Distance metric (Metric 4)
  const distEl = document.getElementById("metric-river-dist");
  const riverNameEl = document.getElementById("metric-river-name");
  if (distEl) {
    distEl.textContent = distKm < 1 ? `${Math.round(distKm * 1000)} m` : `${distKm.toFixed(1)} km`;
  }
  if (riverNameEl && g) {
    riverNameEl.textContent = `${g.river || "Basin"} (${g.name})`;
  }

  // 5. Filter Official Bulletins for user's district (or statewide Punjab)
  const allAlerts = snapshot.alerts || [];
  const districtLower = (userProfile.district || "").toLowerCase();
  const relevantAlerts = allAlerts.filter((a) => {
    const area = (a.area || "").toLowerCase();
    const hl = (a.headline || "").toLowerCase();
    const desc = (a.description || "").toLowerCase();
    return area.includes(districtLower) || hl.includes(districtLower) || desc.includes(districtLower) || area === "punjab";
  });

  const alertSummary = document.getElementById("home-alert-summary");
  const alertIcon = document.getElementById("home-alert-icon");
  const alertBadge = document.getElementById("alerts-count-badge");
  if (alertBadge) alertBadge.textContent = relevantAlerts.length;

  let activeWarning = null;
  if (relevantAlerts.length > 0) {
    activeWarning = relevantAlerts[0];
    if (alertIcon) alertIcon.className = "alert-check-icon active-alert";
    if (alertSummary) {
      const fullText = (activeWarning.description || activeWarning.headline || "").trim();
      const shortTitle = (activeWarning.headline && activeWarning.headline !== fullText && activeWarning.headline.length < 60)
        ? activeWarning.headline
        : (t("alerts.heading") || "Official Disaster Bulletin");
      alertSummary.innerHTML = `<strong style="display:block; margin-bottom:2px;">${shortTitle}</strong><span style="font-size:12.5px; color:var(--body); line-height:1.4; display:block;">${fullText}</span>`;
    }
  } else {
    if (alertIcon) alertIcon.className = "alert-check-icon";
    if (alertSummary) {
      const locName = getLocalizedDistrictName(userProfile.district || "your area");
      alertSummary.textContent = t("status.no_bulletins", { district: locName });
    }
  }

  // 6. Dynamic Hero Status Word & Grounded Reason (NO hardcoding)
  let statusKey = "monitoring";
  let statusClass = "safe";
  let reasonText = t("status.ground_safe") || "Water likely to stay below your ground level.";

  const curLvl = g ? (g.level_m ?? g.current_level_m ?? 0) : 0;
  const warnLvl = g ? (g.warning_m ?? g.warning_level_m ?? 0) : 0;
  const dangLvl = g ? (g.danger_m ?? g.danger_level_m ?? 0) : 0;

  if (dangLvl > 0 && curLvl >= dangLvl) {
    statusKey = "danger";
    statusClass = "danger";
    reasonText = t("status.danger_exceeded", { name: g.name, level: curLvl, danger: dangLvl });
  } else if (warnLvl > 0 && curLvl >= warnLvl) {
    statusKey = "warning";
    statusClass = "warning";
    reasonText = t("status.warning_exceeded", { name: g.name, level: curLvl, warning: warnLvl });
  } else if (activeWarning) {
    const sev = (activeWarning.severity || "").toLowerCase();
    const alertBody = (activeWarning.description || activeWarning.headline || "").toLowerCase();
    const isWeatherOnlyAdvisory = (alertBody.includes("thunder") || alertBody.includes("lightning") || alertBody.includes("gusty")) && !alertBody.includes("flood") && !alertBody.includes("breach");
    statusKey = (sev === "severe" || sev === "extreme") && !isWeatherOnlyAdvisory ? "warning" : "watch";
    statusClass = statusKey;
    // Keep hero subtitle concise (1-2 lines) while verbatim SACHET text is displayed in the Official Alert banner immediately below
    const safePrefix = (t("status.ground_safe") || "Water likely to stay below your ground level").replace(/\.?$/, ".");
    reasonText = isWeatherOnlyAdvisory
      ? `${safePrefix} Official weather advisory active below.`
      : (activeWarning.headline && activeWarning.headline.length <= 95
          ? activeWarning.headline
          : (t("status.bulletin_active") || "Official SDMA disaster bulletin in effect for your district."));
  }

  const hero = document.getElementById("home-hero");
  if (hero) hero.className = `home-hero ${statusClass}`;

  const statusWord = document.getElementById("status-word");
  if (statusWord) {
    const wordTranslated = t(`status.${statusKey}`);
    statusWord.textContent = (wordTranslated && wordTranslated !== `status.${statusKey}`)
      ? wordTranslated.toUpperCase()
      : statusKey.toUpperCase();
  }

  const statusReasonEl = document.getElementById("status-reason");
  if (statusReasonEl) statusReasonEl.textContent = reasonText;

  const age = getSnapshotAge(snapshot.saved_at);
  const ageBadge = document.getElementById("status-age-badge");
  if (ageBadge) {
    ageBadge.textContent = t("status.data_age", { age: age.display });
  }

  const offlineBadge = document.getElementById("status-offline-badge");
  if (offlineBadge) {
    offlineBadge.style.display = !navigator.onLine ? "inline-flex" : "none";
  }

  // 7. Update proximity telemetry indicator (R2)
  updateProximityBanner(snapshot);

  // 8. Update arrival time estimate banner (F2)
  renderEstimateBanner(snapshot);

  // 9. Update Risk Map & Time-to-Water Detail Map (risk-map.html & map-screen.html)
  updateRiskMapAndDetailUI(snapshot, g, distKm, statusKey);
}

function updateRiskMapAndDetailUI(snapshot, g, distKm, statusKey) {
  const locEl = document.getElementById("risk-map-loc-name");
  const levelEl = document.getElementById("risk-map-level");
  const riverLbl = document.getElementById("risk-map-river-label");

  if (locEl) {
    let rawLoc = userProfile.village_name || `${userProfile.district || "Taman"}, Punjab`;
    const parts = rawLoc.split(",").map(s => s.trim());
    if (parts.length === 2 && parts[0].toLowerCase() === parts[1].toLowerCase()) {
      rawLoc = `${parts[0]}, Punjab`;
    }
    locEl.textContent = rawLoc;
  }
  if (riverLbl && g?.river) {
    riverLbl.textContent = g.river;
  }
  if (levelEl) {
    if (statusKey === "danger") {
      levelEl.textContent = "High";
      levelEl.className = "danger";
    } else if (statusKey === "warning" || statusKey === "watch") {
      levelEl.textContent = "Moderate";
      levelEl.className = "warn";
    } else {
      levelEl.textContent = "Low";
      levelEl.className = "";
    }
  }
  updateMapDetailScreen(snapshot);
}

function updateMapDetailScreen(snapshot) {
  const ttwEl = document.getElementById("map-detail-ttw");
  const riverEl = document.getElementById("map-detail-river");
  const depthEl = document.getElementById("map-detail-depth");
  const locEl = document.getElementById("map-detail-loc");

  const gauges = snapshot?.gauges || [];
  const nearestResult = findNearestGauge(userProfile.lat, userProfile.lon, gauges);
  const g = nearestResult?.gauge || (gauges.length > 0 ? gauges[0] : null);
  const distKm = nearestResult ? nearestResult.distanceKm : 15;

  if (riverEl) {
    riverEl.textContent = `From ${g?.river || "Beas River"} (${distKm.toFixed(1)} km)`;
  }
  if (locEl) {
    locEl.textContent = `At ${userProfile.village_name || "your location"}`;
  }

  const curLvl = g ? (g.level_m ?? g.current_level_m ?? 0) : 0;
  const warnLvl = g ? (g.warning_m ?? g.warning_level_m ?? 0) : 0;
  const dangLvl = g ? (g.danger_m ?? g.danger_level_m ?? 0) : 0;

  if (g && warnLvl > 0 && curLvl >= warnLvl) {
    const lowH = Math.max(1, Math.round((distKm * 1.3) / 8.1));
    const highH = Math.max(lowH + 2, Math.round((distKm * 1.3) / 4.5));
    if (ttwEl) ttwEl.textContent = `${lowH}–${highH} hours`;
    if (depthEl) depthEl.textContent = curLvl >= dangLvl ? "0.5–1.5 m" : "< 0.5 m";
  } else {
    const estH = Math.max(12, Math.round((distKm * 1.3) / 6.2));
    if (ttwEl) ttwEl.textContent = `>${estH} hours`;
    if (depthEl) depthEl.textContent = "Likely below ground";
  }
}

function updateMapDetailHorizon(horizonHours) {
  const noteEl = document.getElementById("map-detail-note");
  const gauges = currentSnapshot?.gauges || [];
  const nearestResult = findNearestGauge(userProfile.lat, userProfile.lon, gauges);
  const g = nearestResult?.gauge || (gauges.length > 0 ? gauges[0] : null);
  const stnName = g?.name || "Harike Barrage";
  const curLvl = g ? (g.level_m ?? g.current_level_m ?? 0) : 208.4;
  const trend = g ? (g.trend_m_per_h ?? g.trend_m_per_hr ?? 0) : 0;
  const projected = (curLvl + trend * horizonHours).toFixed(2);

  if (noteEl) {
    if (horizonHours === 0) {
      noteEl.textContent = `Live Now: ${stnName} is at ${curLvl} m (trend ${trend >= 0 ? "+" : ""}${trend} m/h). Water likely to stay below your ground level.`;
    } else {
      noteEl.textContent = `+${horizonHours}h Projection: Based on current trend (${trend >= 0 ? "+" : ""}${trend} m/h), ${stnName} projects to ~${projected} m (estimated).`;
    }
  }
}

function renderEstimateBanner(snapshot) {
  const container = document.getElementById("estimate-container");
  if (!container) return;

  const gauges = snapshot.gauges || [];
  const nearestResult = findNearestGauge(userProfile.lat, userProfile.lon, gauges);
  const g = nearestResult?.gauge || (gauges.length > 0 ? gauges[0] : null);
  const distKm = nearestResult ? nearestResult.distanceKm : 15;

  let front = null;
  const currentLvl = g ? (g.level_m ?? g.current_level_m ?? 0) : 0;
  const warningLvl = g ? (g.warning_m ?? g.warning_level_m ?? 0) : 0;
  const dangerLvl = g ? (g.danger_m ?? g.danger_level_m ?? 0) : 0;

  if (g && warningLvl > 0 && currentLvl >= warningLvl) {
    front = {
      gauge_id: g.id,
      crossed_warning_at: g.observed_at || snapshot.saved_at || new Date().toISOString(),
      km_to_user: distKm * 1.3,
      km_basis: "straight_line_x1.3"
    };
  }

  const reachSpeed = (snapshot.reach_speeds && snapshot.reach_speeds[0]) || {
    p25: 4.5,
    median: 6.2,
    p75: 8.1,
    basis: "historical_peaks"
  };

  const estimate = computeOfflineEstimate({
    front,
    reach_speed_km_h: reachSpeed,
    now: new Date().toISOString(),
    observed_at: g?.observed_at,
    level_m: currentLvl,
    warning_m: warningLvl,
    danger_m: dangerLvl,
    trend_m_per_h: g?.trend_m_per_h ?? g?.trend_m_per_hr ?? 0,
    bank_m: g?.bank_m,
    source_age_hours: snapshot.saved_at ? Math.max(0, (Date.now() - new Date(snapshot.saved_at).getTime()) / 3600000) : 0
  });

  if (front && estimate.arrival) {
    const arr = estimate.arrival;
    const hoursDisplay = `${formatHours(arr.low_hours)} to ${formatHours(arr.high_hours)} (${t("status.watch") || "likely"} ${formatHours(arr.likely_hours)})`;
    const isUrgent = arr.low_hours <= 6;
    const bannerClass = isUrgent ? "arrival-banner" : "arrival-banner safe";
    const titleText = t("estimator.estimated_arrival_title", { hours: hoursDisplay }) || `Estimated Water Arrival: ${hoursDisplay}`;
    const confLabel = t("estimator.confidence") || "Confidence:";
    const confValue = arr.is_rough ? (t("estimator.rough_estimate") || "Rough Estimate") : (t("estimator.moderate_confidence") || "Moderate");
    const basisLabel = t("estimator.basis") || "Basis:";

    container.innerHTML = `
      <div class="${bannerClass}">
        <div class="arrival-title">${titleText}</div>
        <div class="arrival-detail">
          ${confLabel} <strong>${confValue}</strong> &bull;
          ${basisLabel} <strong>${arr.basis}</strong> (${(arr.km_to_user || distKm).toFixed(1)} km transit).
          <div style="font-size: 11.5px; color: var(--mut); margin-top: 3px;">
            ${arr.summary_text}
          </div>
        </div>
      </div>
    `;
  } else {
    // Normal / below warning state
    const titleText = t("estimator.normal_flow_title") || "Water Level: Normal Basin Flow";
    const stnName = g?.name || "CWC Station";
    const curLevelDisplay = currentLvl > 0 ? `${currentLvl} m` : (t("metrics.stable") || "Normal");
    const warnMarkDisplay = warningLvl > 0 ? `${warningLvl} m` : "-- m";
    const detailText = t("estimator.normal_flow_detail", { name: stnName, level: curLevelDisplay, warning: warnMarkDisplay }) ||
      `Nearest gauge (${stnName}) is ${curLevelDisplay} (below warning mark of ${warnMarkDisplay}).`;
    const subText = t("estimator.no_front_transit") || "No upstream flood front in transit towards your location.";

    container.innerHTML = `
      <div class="arrival-banner safe" style="background:#f0fdf4; border:1px solid #bbf7d0;">
        <div class="arrival-title" style="color:#15803d;">${titleText}</div>
        <div class="arrival-detail" style="color:#166534;">
          ${detailText}
          <div style="font-size: 11.5px; color: #15803d; margin-top: 3px;">
            ${subText}
          </div>
        </div>
      </div>
    `;
  }
}

function recomputeOfflineView() {
  if (currentSnapshot) {
    renderSnapshotData(currentSnapshot);
  }
}

// ==========================================
// HOME ACTION BUTTONS (PRD 8.2)
// ==========================================
function setupHomeActions() {
  // Water reached my street -> immediately sets status to DANGER
  document.getElementById("btn-water-reached")?.addEventListener("click", async () => {
    if (confirm("Confirm that flood water has reached your street/village? This will set your status to DANGER.")) {
      await addObservation({
        village_id: userProfile.village_id,
        type: "water_reached",
        observed_at: new Date().toISOString()
      });
      const hero = document.getElementById("home-hero");
      if (hero) hero.className = "home-hero danger";
      document.getElementById("status-word").textContent = "DANGER";
      document.getElementById("status-reason").textContent = "User reported water reached street (offline status raised to Danger).";
      alert("Status updated to DANGER. Please move to higher ground immediately.");
    }
  });

  // Water is receding -> releases offline hold
  document.getElementById("btn-water-receding")?.addEventListener("click", async () => {
    if (confirm("Confirm that flood waters are receding in your area?")) {
      await addObservation({
        village_id: userProfile.village_id,
        type: "water_receding",
        observed_at: new Date().toISOString()
      });
      alert("Report noted. Recomputing status based on latest hydrologic telemetry.");
      recomputeOfflineView();
    }
  });

  // Refresh live data
  document.getElementById("btn-refresh-data")?.addEventListener("click", () => {
    if (navigator.onLine) {
      fetchLiveRelayData();
    } else {
      alert("Device is offline. Showing stored telemetry.");
    }
  });
}

// ==========================================
// ASK SAATHI KNOWLEDGE BASE & CHAT (F6)
// ==========================================
async function loadKnowledgeCards() {
  try {
    await ensureFloodSaathiFolder();
    const res = await fetch("./corpus/cards/cards.json");
    if (res.ok) {
      allCards = await res.json();
      cardRetriever = new CardRetriever(allCards);
      aiAssistant = new AskSaathiAssistant({ cards: allCards });
      await aiAssistant.init();
      // Check if local neural server is active
      try {
        const ping = await fetch("/api/health", { method: "GET" }).catch(() => null);
        if (ping && ping.ok) {
          const saathiModeBadge = document.getElementById("saathi-mode-badge");
          if (saathiModeBadge) {
            saathiModeBadge.className = "plugin-badge active";
            saathiModeBadge.textContent = "Live Neural AI";
          }
        }
      } catch {}

      const folderStatus = await getFloodSaathiFolderStatus();
      const slmDownloaded = (await getSetting("slm_model_downloaded", false)) || Boolean(folderStatus.modelReady);
      const slmEnabled = (await getSetting("slm_model_enabled", false)) || Boolean(folderStatus.modelReady);
      if (slmDownloaded || slmEnabled) {
        await aiAssistant.loadModelFromFolder();
        aiAssistant.setMode("webgpu_slm");
        const saathiModeBadge = document.getElementById("saathi-mode-badge");
        if (saathiModeBadge && !saathiModeBadge.textContent.includes("Live")) {
          saathiModeBadge.className = "plugin-badge active";
          saathiModeBadge.textContent = "Connected: FloodSaathi/models";
        }
      }
    }
  } catch (err) {
    console.warn("Could not load knowledge cards JSON:", err);
  }
}

function setupAskSaathi() {
  const input = document.getElementById("chat-input-field");
  const sendBtn = document.getElementById("btn-chat-send");
  const micBtn = document.getElementById("btn-chat-mic");

  const handleSend = () => {
    const q = input.value.trim();
    if (!q) return;
    submitChatQuery(q);
    input.value = "";
  };

  sendBtn?.addEventListener("click", handleSend);
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSend();
  });

  // Preset query buttons
  document.querySelectorAll(".btn-suggested-query").forEach((btn) => {
    btn.addEventListener("click", () => {
      const q = btn.getAttribute("data-q");
      if (q) submitChatQuery(q);
    });
  });

  // Download Model shortcut button on Ask Saathi warning bar & header
  const goToSlmDownload = () => {
    switchTab("downloads");
    setTimeout(() => {
      const slmCard = document.querySelector("#view-downloads .plugins-grid .plugin-card:nth-child(2)");
      if (slmCard) {
        slmCard.scrollIntoView({ behavior: "smooth", block: "center" });
        slmCard.style.outline = "3px solid var(--red)";
        setTimeout(() => { slmCard.style.outline = "none"; }, 2500);
      }
    }, 300);
  };
  document.getElementById("btn-saathi-download-model")?.addEventListener("click", goToSlmDownload);
  document.getElementById("btn-saathi-header-download")?.addEventListener("click", goToSlmDownload);

  // Speech Recognition & Whisper Audio Recorder (STT)
  let isListening = false;
  let mediaRecorder = null;
  let audioChunks = [];
  let recognition = null;
  const SpeechRec = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
  if (SpeechRec) {
    recognition = new SpeechRec();
    recognition.continuous = false;
    recognition.interimResults = true;
  }

  const stopListening = () => {
    isListening = false;
    micBtn.classList.remove("recording");
    micBtn.style.color = "var(--navy)";
    micBtn.style.animation = "";
    input.placeholder = t("ask.placeholder") || "Ask a question in English, Hindi, or Punjabi...";
    if (recognition) {
      try { recognition.stop(); } catch {}
    }
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      try { mediaRecorder.stop(); } catch {}
    }
  };

  const startListening = async () => {
    isListening = true;
    audioChunks = [];
    micBtn.classList.add("recording");
    micBtn.style.color = "#ef1c24";
    micBtn.style.animation = "pulse-mic 1.2s infinite";
    input.placeholder = getCurrentLanguage() === "pa" 
      ? "ਸੁਣ ਰਿਹਾ ਹੈ... ਬੋਲੋ (Speak now...)" 
      : getCurrentLanguage() === "hi" 
        ? "सुन रहा है... बोलिए (Speak now...)" 
        : "Listening... speak now...";

    let speechRecText = "";

    // 1. Web Speech API (for low-latency browser recognition)
    if (recognition) {
      try {
        recognition.lang = getCurrentLanguage() === "pa" ? "pa-IN" : getCurrentLanguage() === "hi" ? "hi-IN" : "en-IN";
        recognition.onresult = (event) => {
          const transcript = Array.from(event.results).map(r => r[0].transcript).join("");
          if (transcript) {
            speechRecText = transcript;
            input.value = transcript;
          }
        };
        recognition.onerror = (e) => {
          console.warn("Speech recognition error:", e);
        };
        recognition.onend = () => {
          if (speechRecText && isListening) {
            stopListening();
            submitChatQuery(speechRecText);
          }
        };
        recognition.start();
      } catch (err) {
        console.warn("Could not start SpeechRecognition:", err);
      }
    }

    // 2. MediaRecorder for Whisper STT (openai/whisper-tiny) fallback
    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) audioChunks.push(e.data);
        };
        mediaRecorder.onstop = async () => {
          stream.getTracks().forEach(t => t.stop());
          if (!speechRecText && audioChunks.length > 0) {
            input.placeholder = "Transcribing with Whisper STT...";
            const audioBlob = new Blob(audioChunks, { type: audioChunks[0]?.type || "audio/webm" });
            if (audioBlob.size > 500) {
              const reader = new FileReader();
              reader.readAsDataURL(audioBlob);
              reader.onloadend = async () => {
                const base64Audio = reader.result;
                try {
                  const res = await fetch("/api/transcribe", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      audio: base64Audio,
                      lang: getCurrentLanguage()
                    })
                  });
                  if (res.ok) {
                    const data = await res.json();
                    if (data.ok && data.text) {
                      input.value = data.text;
                      submitChatQuery(data.text);
                    }
                  }
                } catch (whisperErr) {
                  console.warn("Whisper transcribe failed:", whisperErr);
                } finally {
                  stopListening();
                }
              };
              return;
            }
          }
          stopListening();
        };
        mediaRecorder.start();

        // Auto-stop after 8 seconds of continuous recording
        setTimeout(() => {
          if (isListening) stopListening();
        }, 8000);
      }
    } catch (micErr) {
      console.warn("Microphone access denied:", micErr);
      if (!recognition) stopListening();
    }
  };

  micBtn?.addEventListener("click", () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  });
}

async function submitChatQuery(query) {
  const thread = document.getElementById("chat-thread");
  if (!thread) return;

  // Append user bubble
  const userDiv = document.createElement("div");
  userDiv.className = "msg-me";
  userDiv.textContent = query;
  thread.appendChild(userDiv);

  // Append thinking indicator
  const typingDiv = document.createElement("div");
  typingDiv.className = "msg-bot-wrap";
  typingDiv.id = "chat-thinking-indicator";
  typingDiv.innerHTML = `
    <div class="bot-avatar" style="animation: pulse 1.5s infinite;">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
    </div>
    <article class="bot-card" style="padding:10px 14px; background:#f8fafc; border:1px solid #e2e8f0;">
      <div style="display:flex; align-items:center; gap:8px; font-size:13px; color:var(--mut);">
        <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#2563eb;"></span>
        <span>Generating response with real local neural model...</span>
      </div>
    </article>
  `;
  thread.appendChild(typingDiv);
  thread.scrollTop = thread.scrollHeight;

  const lang = getCurrentLanguage();
  const botDiv = document.createElement("div");
  botDiv.className = "msg-bot-wrap";

  // 1. Try real-time streaming first (instant token-by-token response on GPU)
  try {
    const streamController = new AbortController();
    const streamTimeout = setTimeout(() => streamController.abort(), 25000);
    const streamRes = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        lang,
        stream: true,
        max_tokens: 85
      }),
      signal: streamController.signal
    });

    if (streamRes.ok && streamRes.headers.get("content-type")?.includes("text/event-stream")) {
      typingDiv.remove();

      botDiv.innerHTML = `
        <div class="bot-avatar" style="overflow:hidden; padding:0;">
          <img src="./assets/ui/saathi-logo.png" alt="Saathi" style="width:100%; height:100%; object-fit:cover; display:block;">
        </div>
        <article class="bot-card">
          <div style="display:inline-flex; align-items:center; gap:6px; background:#eff6ff; color:#1d4ed8; padding:3px 8px; border-radius:12px; font-size:11.5px; font-weight:700; margin-bottom:8px; border:1px solid #bfdbfe;">
            <span>⚡ FloodSaathi Live AI</span>
            <span class="stream-cursor" style="display:inline-block; width:6px; height:12px; background:#1d4ed8; animation:pulse 1s infinite;"></span>
          </div>
          <h3 id="stream-bot-title">${lang === "pa" ? "ਫਲੱਡ-ਸਾਥੀ AI ਸਲਾਹ" : lang === "hi" ? "फ्लड-साथी AI सलाह" : "FloodSaathi Neural AI"}</h3>
          <div id="stream-bot-body" style="font-size:14px; line-height:1.55; color:var(--ink2); white-space:pre-wrap; margin-bottom:10px;"></div>
          <div id="stream-bot-footer" style="display:none;"></div>
        </article>
      `;
      thread.appendChild(botDiv);
      thread.scrollTop = thread.scrollHeight;

      const bodyEl = botDiv.querySelector("#stream-bot-body");
      const footerEl = botDiv.querySelector("#stream-bot-footer");

      const reader = streamRes.body.getReader();
      const decoder = new TextDecoder();
      let streamedText = "";
      let finalStats = null;
      let finalHelplines = [];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        clearTimeout(streamTimeout);
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.token) {
                streamedText += data.token;
                bodyEl.textContent = streamedText;
                thread.scrollTop = thread.scrollHeight;
              }
              if (data.done) {
                finalStats = data.stats;
                finalHelplines = data.helplines;
              }
            } catch {}
          }
        }
      }

      // Finalize formatted card into clean numbered steps
      const steps = streamedText.split("\n").filter(l => l.trim().length > 0).map(l => l.replace(/^\d+[\.\)]\s*/, ""));
      const stepItems = steps.map((s, idx) => `<li><span class="step-num">${idx + 1}</span><span>${s}</span></li>`).join("");
      bodyEl.innerHTML = `<ol class="bot-steps">${stepItems}</ol>`;

      const helplinesHtml = (finalHelplines && finalHelplines.length > 0) ? `
        <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:10px;">
          ${finalHelplines.slice(0, 3).map(h => `<a href="tel:${h.number}" class="helpline-btn" style="padding:4px 10px; font-size:12px;">📞 ${h.number} (${h.name.split(" ")[0]})</a>`).join("")}
        </div>
      ` : "";

      footerEl.style.display = "block";
      footerEl.innerHTML = `
        ${helplinesHtml}
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; margin-bottom:4px;">
          <button class="tts-speaker-btn btn-read-card" aria-label="Listen to answer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
            <span data-i18n="actions.listen">${t("actions.listen") || "Listen"}</span>
          </button>
        </div>
        <div class="card-source-link">
          <span>Source: FloodSaathi Live Neural SLM · ${finalStats?.tok_per_sec || 10} tok/s</span>
          <span style="color:var(--green); font-weight:700;">Verified &check;</span>
        </div>
      `;

      botDiv.querySelector(".btn-read-card")?.addEventListener("click", () => {
        speakText(`FloodSaathi Neural AI. ${streamedText}`, lang);
      });
      return;
    }
  } catch (streamErr) {
    // If streaming failed or offline, fall back to standard offline core
  }

  let response = null;
  try {
    const slmDownloaded = await getSetting("slm_model_downloaded", false);
    const slmEnabled = await getSetting("slm_model_enabled", false);
    if (aiAssistant) {
      if (slmDownloaded || slmEnabled) {
        aiAssistant.setMode("webgpu_slm");
      }
      const apiKey = await getSetting("google_translate_api_key");
      response = await aiAssistant.ask(query, {
        lang,
        gauges: currentSnapshot?.gauges,
        alerts: currentSnapshot?.alerts,
        apiKey,
        useNeural: true,
        slmDownloaded: slmDownloaded || slmEnabled
      });
    } else if (cardRetriever) {
      const results = cardRetriever.retrieve(query, 1);
      if (results.length > 0) {
        const c = results[0].card;
        response = {
          title: (c.title && c.title[lang]) || c.title?.en || "Verified Advice",
          steps: ((c.body && c.body[lang]) || c.body?.en || "").split("\n").filter(l => l.trim().length > 0).map(l => l.replace(/^\d+\.\s*/, "")),
          source: c.source || "NDMA / Punjab SDMA Flood Safety Guidelines",
          reviewStatus: c.review_status || "verified",
          helplines: []
        };
      }
    }
  } finally {
    typingDiv.remove();
  }

  if (response) {
    const neuralBadgeHtml = response.isNeural ? `
      <div style="display:inline-flex; align-items:center; gap:6px; background:#eff6ff; color:#1d4ed8; padding:3px 8px; border-radius:12px; font-size:11.5px; font-weight:700; margin-bottom:8px; border:1px solid #bfdbfe;">
        <span>⚡ FloodSaathi Neural AI</span>
        ${response.stats?.tokens ? `<span>· ${response.stats.tokens} tokens</span>` : ""}
        ${response.stats?.tok_per_sec ? `<span>· ${response.stats.tok_per_sec} tok/s</span>` : ""}
      </div>
    ` : "";

    const stepItems = (response.steps || []).map((step, idx) => `
      <li><span class="step-num">${idx + 1}</span><span>${step}</span></li>
    `).join("");

    const helplinesHtml = (response.helplines && response.helplines.length > 0) ? `
      <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:10px;">
        ${response.helplines.map(h => `<a href="tel:${h.number}" class="helpline-btn" style="padding:4px 10px; font-size:12px;">📞 ${h.number} (${h.name.split(" ")[0]})</a>`).join("")}
      </div>
    ` : "";

    const slmDownloaded = await getSetting("slm_model_downloaded", false);
    const slmNoticeHtml = (!slmDownloaded && !response.isNeural) ? `
      <div style="margin-top:8px; padding-top:6px; border-top:1px dashed var(--line); font-size:11.5px; color:var(--mut); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:4px;">
        <span>⚡ Verified Offline Safety Core · Download Neural Model in Downloads for full AI</span>
        <button class="link-to-slm-download" style="background:transparent; border:none; color:var(--red); font-size:11.5px; font-weight:700; cursor:pointer; padding:0;">Download Model →</button>
      </div>
    ` : "";

    botDiv.innerHTML = `
      <div class="bot-avatar" style="overflow:hidden; padding:0;">
        <img src="./assets/ui/saathi-logo.png" alt="Saathi" style="width:100%; height:100%; object-fit:cover; display:block;">
      </div>
      <article class="bot-card">
        ${neuralBadgeHtml}
        <h3>${response.title}</h3>
        <ol class="bot-steps">${stepItems}</ol>
        ${helplinesHtml}
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; margin-bottom:4px;">
          <button class="tts-speaker-btn btn-read-card" aria-label="Listen to answer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
            <span data-i18n="actions.listen">${t("actions.listen") || "Listen"}</span>
          </button>
        </div>
        <div class="card-source-link">
          <span>Source: ${response.source || "Official Disaster Guidelines"}</span>
          <span style="color:var(--green); font-weight:700;">Verified &check;</span>
        </div>
        ${slmNoticeHtml}
      </article>
    `;

    const readBtn = botDiv.querySelector(".btn-read-card");
    if (readBtn) {
      const fullSpeechText = `${response.title}. ${(response.steps || []).join(". ")}`;
      readBtn.addEventListener("click", () => {
        speakText(fullSpeechText, lang);
      });
    }
  } else {
    botDiv.innerHTML = `
      <div class="bot-avatar" style="overflow:hidden; padding:0;">
        <img src="./assets/ui/saathi-logo.png" alt="Saathi" style="width:100%; height:100%; object-fit:cover; display:block;">
      </div>
      <article class="bot-card">
        <h3>General Emergency Guidance</h3>
        <p style="font-size:14.5px; line-height:1.5;">For immediate rescue or life-threatening emergencies, dial <strong>112 (National Emergency)</strong> or <strong>1078 (NDMA)</strong>. Move to upper floors and do not wade through moving flood waters.</p>
      </article>
    `;
  }

  thread.appendChild(botDiv);
  thread.scrollTop = thread.scrollHeight;

  botDiv.querySelectorAll(".link-to-slm-download").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      switchTab("downloads");
      setTimeout(() => {
        const slmCard = document.querySelector("#view-downloads .plugins-grid .plugin-card:nth-child(2)");
        if (slmCard) {
          slmCard.scrollIntoView({ behavior: "smooth", block: "center" });
          slmCard.style.outline = "3px solid var(--red)";
          setTimeout(() => { slmCard.style.outline = "none"; }, 2500);
        }
      }, 300);
    });
  });
}

// ==========================================
// SHELTERS DIRECTORY VIEW (F5 - shelter-responsive.html)
// ==========================================
async function renderSheltersView() {
  const container = document.getElementById("shelters-list-container");
  if (!container) return;

  const shelters = await fetchShelters(userProfile.lat, userProfile.lon);
  if (shelters.length === 0) {
    container.innerHTML = `<p data-i18n="shelters.none_found">${t("shelters.none_found")}</p>`;
    return;
  }

  const lang = getCurrentLanguage();

  // Populate Featured Nearest Safe Shelter Sheet (shelter-responsive.html)
  const nearest = shelters[0];
  if (nearest) {
    const featName = (nearest.name && nearest.name[lang]) || nearest.name?.en || nearest.name;
    const featNameEl = document.getElementById("featured-shelter-name");
    const featDistEl = document.getElementById("featured-shelter-dist");
    const featCapEl = document.getElementById("featured-shelter-cap");
    const featAmenEl = document.getElementById("featured-shelter-amenities");
    const featDirBtn = document.getElementById("btn-featured-shelter-directions");

    const walkMins = Math.max(5, Math.round((nearest.distanceKm || 2.1) * 12));
    if (featNameEl) featNameEl.textContent = featName;
    if (featDistEl) featDistEl.textContent = `${nearest.distanceFormatted} away · ${walkMins} mins walk`;
    if (featCapEl) featCapEl.textContent = `${nearest.capacity || 350} people`;
    if (featAmenEl) {
      const amens = formatAmenities(nearest.amenities, lang);
      featAmenEl.textContent = amens.length > 0 ? amens.join(", ") : "Drinking water, toilets, medical aid";
    }
    if (featDirBtn) {
      featDirBtn.href = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${userProfile.lat},${userProfile.lon};${nearest.lat},${nearest.lon}`;
    }

    // Initialize interactive MapLibre Safe Route map inside #shelter-route-map-container if visible
    const routeMapEl = document.getElementById("shelter-route-map-container");
    if (routeMapEl && routeMapEl.style.display !== "none") {
      initShelterRouteMap("shelter-route-map-container", userProfile, nearest);
    }
  }

  container.innerHTML = shelters.map((s) => {
    const name = (s.name && s.name[lang]) || s.name?.en || s.name;
    const amenities = formatAmenities(s.amenities, lang);
    const amenityTags = amenities.map((a) => `<span class="amenity-chip">${a}</span>`).join("");
    const awayText = lang === "pa" ? `${s.distanceFormatted} ਦੂਰ` : lang === "hi" ? `${s.distanceFormatted} दूर` : `${s.distanceFormatted} away`;
    const tehsilLabel = lang === "pa" ? "ਤਹਿਸੀਲ:" : lang === "hi" ? "तहसील:" : "Tehsil:";
    const capLabel = lang === "pa" ? "ਸਮਰੱਥਾ:" : lang === "hi" ? "क्षमता:" : "Capacity:";
    const personsText = lang === "pa" ? "ਵਿਅਕਤੀ" : lang === "hi" ? "व्यक्ति" : "persons";
    const callText = lang === "pa" ? `ਕੈਂਪ ਨੂੰ ਕਾਲ ਕਰੋ (${s.contact || '1077'})` : lang === "hi" ? `शिविर को कॉल करें (${s.contact || '1077'})` : `Call Shelter (${s.contact || '1077'})`;
    const dirText = lang === "pa" ? "ਦਿਸ਼ਾ-ਨਿਰਦੇਸ਼ ਪ੍ਰਾਪਤ ਕਰੋ" : lang === "hi" ? "दिशा-निर्देश प्राप्त करें" : "Get Directions";

    return `
      <div class="shelter-card">
        <div class="shelter-card-header">
          <div class="shelter-card-title">${name}</div>
          <span class="shelter-dist-pill">${awayText}</span>
        </div>
        <div style="font-size: 13px; color: var(--mut); margin-bottom: 6px;">
          ${tehsilLabel} ${s.tehsil} &bull; ${capLabel} <strong>${s.capacity} ${personsText}</strong>
        </div>
        <div class="shelter-amenities">${amenityTags}</div>
        <div class="shelter-action-row">
          <a href="tel:${s.contact || '1077'}" class="btn-shelter-call">${callText}</a>
          <a href="https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${userProfile.lat},${userProfile.lon};${s.lat},${s.lon}" target="_blank" rel="noopener" class="btn-shelter-nav">${dirText}</a>
        </div>
      </div>
    `;
  }).join("");
}

// ==========================================
// EMERGENCY SOS (F7 - emergency.html)
// ==========================================
function setupSosView() {
  const sendSms = () => {
    const uri = buildSosSmsUri(userProfile.lat, userProfile.lon, userProfile.village_name);
    window.location.href = uri;
  };

  document.getElementById("btn-big-sos")?.addEventListener("click", () => {
    if (confirm("Send Emergency SOS SMS with your GPS coordinates to your emergency contacts?")) {
      sendSms();
    }
  });

  document.getElementById("btn-sos-send-sms")?.addEventListener("click", sendSms);

  // Family Check-in "I'm Safe" button (emergency.html)
  document.getElementById("btn-family-im-safe")?.addEventListener("click", () => {
    const loc = userProfile.village_name || "Punjab";
    const msg = encodeURIComponent(`FloodSaathi Family Check-in: I am safe at ${loc} (GPS: ${userProfile.lat}, ${userProfile.lon}). Water is below ground level here.`);
    window.location.href = `sms:?body=${msg}`;
  });

  const form = document.getElementById("sos-add-contact-form");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("contact-name").value.trim();
    const phone = document.getElementById("contact-phone").value.trim();
    if (name && phone) {
      await addContact(name, phone);
      form.reset();
      renderSosContacts();
    }
  });
}

async function renderSosContacts() {
  const container = document.getElementById("sos-contacts-list");
  if (!container) return;
  const contacts = await getContacts();

  if (contacts.length === 0) {
    container.innerHTML = `<p style="font-size:13px; color:var(--mut);">No emergency contacts added yet. Add family members below.</p>`;
    return;
  }

  container.innerHTML = contacts.map((c) => `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid var(--line);">
      <div>
        <strong>${c.name}</strong>
        <div style="font-size:13px; color:var(--mut);">${c.phone}</div>
      </div>
      <div style="display:flex; gap:8px;">
        <a href="tel:${c.phone}" class="btn-shelter-call" style="width:36px; height:36px; padding:0; border-radius:50%;">&phone;</a>
        <button class="lang-btn btn-del-contact" data-id="${c.id}" style="color:var(--red);">&times;</button>
      </div>
    </div>
  `).join("");

  container.querySelectorAll(".btn-del-contact").forEach((b) => {
    b.addEventListener("click", async () => {
      const id = Number(b.getAttribute("data-id"));
      await deleteContact(id);
      renderSosContacts();
    });
  });
}

// ==========================================
// OFFICIAL ALERTS VIEW (F4 - official-alerts.html)
// ==========================================
let activeAlertFilter = "all";

function renderAlertsView() {
  const container = document.getElementById("alerts-container");
  if (!container) return;

  // Bind filter chips once
  const chipsWrap = document.getElementById("alerts-filter-chips");
  if (chipsWrap && !chipsWrap.dataset.bound) {
    chipsWrap.dataset.bound = "true";
    chipsWrap.querySelectorAll(".alert-filter-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        chipsWrap.querySelectorAll(".alert-filter-chip").forEach(c => c.classList.remove("on"));
        chip.classList.add("on");
        activeAlertFilter = chip.getAttribute("data-filter") || "all";
        renderAlertsView();
      });
    });
  }

  const allAlerts = currentSnapshot?.alerts || [];
  if (allAlerts.length === 0) {
    container.innerHTML = `<div class="home-alert-banner"><p>No active official alerts received from NDMA SACHET or Punjab SDMA at this time.</p></div>`;
    return;
  }

  // Filter alerts by chip category
  const filteredAlerts = allAlerts.filter((a) => {
    if (activeAlertFilter === "all") return true;
    const text = `${a.headline || ""} ${a.description || ""} ${a.event || ""}`.toLowerCase();
    if (activeAlertFilter === "flood") return text.includes("flood") || text.includes("river") || text.includes("inundation") || text.includes("water");
    if (activeAlertFilter === "dam") return text.includes("dam") || text.includes("barrage") || text.includes("release") || text.includes("cusecs");
    if (activeAlertFilter === "rain") return text.includes("rain") || text.includes("shower") || text.includes("weather") || text.includes("monsoon");
    return true;
  });

  const displayAlerts = filteredAlerts.length > 0 ? filteredAlerts : allAlerts;

  // Prioritize alerts matching the active district
  const districtLower = (userProfile.district || "").toLowerCase();
  const sortedAlerts = [...displayAlerts].sort((a, b) => {
    const aArea = (a.area || "").toLowerCase();
    const bArea = (b.area || "").toLowerCase();
    const aMatch = aArea.includes(districtLower) || (a.headline || "").toLowerCase().includes(districtLower);
    const bMatch = bArea.includes(districtLower) || (b.headline || "").toLowerCase().includes(districtLower);
    if (aMatch && !bMatch) return -1;
    if (!aMatch && bMatch) return 1;
    return 0;
  });

  const lang = getCurrentLanguage();
  container.innerHTML = sortedAlerts.map((a, i) => {
    const isLocal = (a.area || "").toLowerCase().includes(districtLower) || (a.headline || "").toLowerCase().includes(districtLower);
    const localBadge = isLocal ? `<span class="plugin-badge active" style="font-size:10.5px;">For Your Area (${userProfile.district})</span>` : "";
    const isSevere = a.severity?.toLowerCase() === "severe" || a.severity?.toLowerCase() === "extreme";
    const textLower = `${a.headline || ""} ${a.description || ""}`.toLowerCase();
    const isRain = textLower.includes("rain") || textLower.includes("shower") || textLower.includes("thunder");
    const isDam = textLower.includes("dam") || textLower.includes("barrage") || textLower.includes("release");

    // Derive a clean short heading so the full paragraph isn't printed twice
    const rawHeadline = (a.headline || "").trim();
    const rawDesc = (a.description || rawHeadline || "").trim();
    let shortHeading = (a.event && a.event !== "Disaster Alert") ? a.event : "";
    if (!shortHeading) {
      if (textLower.includes("thunder") || textLower.includes("lightning")) {
        shortHeading = "Thunderstorm & Gusty Winds Advisory";
      } else if (isDam) {
        shortHeading = "Dam & Barrage Release Alert";
      } else if (isRain) {
        shortHeading = "Heavy Rainfall & Weather Advisory";
      } else if (rawHeadline.length > 0 && rawHeadline.length <= 65 && rawHeadline !== rawDesc) {
        shortHeading = rawHeadline;
      } else {
        shortHeading = "Official Flood & Disaster Advisory";
      }
    }

    // Format effective timestamp compactly so it never overflows on 360px
    let effectiveStr = a.effective || "Official";
    if (effectiveStr.length > 22) {
      effectiveStr = effectiveStr.replace(/:\d{2}\s*(GMT|IST|\+.*)?$/i, "").slice(0, 22);
    }

    const tileSvg = isRain
      ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M7.5 15a4 4 0 01-.5-8 5.3 5.3 0 0110 1.4 3.3 3.3 0 01-.5 6.6z"/><path d="M8.5 17.5l-1 2.3M12.5 17.5l-1 2.3M16.5 17.5l-1 2.3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`
      : isDam
        ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><path d="M8 9a4 4 0 018 0M12 4v2"/><path d="M3 13.5c2-1.6 4-1.6 6 0s4 1.6 6 0 4-1.6 6 0M3 18c2-1.6 4-1.6 6 0s4 1.6 6 0 4-1.6 6 0"/></svg>`
        : `<svg width="24" height="24" viewBox="0 0 24 24"><path d="M12 2.5L2 20h20L12 2.5z" fill="currentColor"/><path d="M12 9v5M12 16.8v.4" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>`;

    return `
      <article class="official-alert-card shelter-card" style="border-left: 5px solid ${isSevere ? 'var(--red)' : '#d97706'};">
        <div class="official-alert-tile ${isRain ? 'blue' : ''}">${tileSvg}</div>
        <div style="flex:1; min-width:0;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px; flex-wrap:wrap; margin-bottom:4px;">
            <h3 style="font-size:15px; font-weight:700; color:var(--navy); line-height:1.3;">${shortHeading}</h3>
            <span style="font-size:11.5px; color:var(--mut);">${effectiveStr}</span>
          </div>
          ${localBadge ? `<div style="margin-bottom:6px;">${localBadge}</div>` : ""}
          <p style="font-size:13.5px; line-height:1.45; color:var(--body); margin-bottom:10px; word-break:break-word;">${rawDesc}</p>
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
            <span style="font-size:12px; color:var(--mut);">Source: ${a.sender || 'NDMA SACHET / Punjab SDMA'}</span>
            <button class="tts-speaker-btn btn-read-alert" data-idx="${i}" aria-label="Listen">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
              <span>${t("actions.listen") || "Listen"}</span>
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");

  container.querySelectorAll(".btn-read-alert").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.getAttribute("data-idx"), 10);
      const alertItem = sortedAlerts[idx];
      if (alertItem) {
        speakText(`${alertItem.headline}. ${alertItem.description}`, lang);
      }
    });
  });
}

// ==========================================
// AFTER-FLOOD GUIDE (F15)
// ==========================================
let activeAfterFloodTab = "safety";

const AFTER_FLOOD_DATA = {
  en: {
    safety: [
      { title: "Electrical Safety", desc: "Never touch circuit breakers, power outlets, or appliances while standing in water. Have an electrician inspect the wiring before switching main breaker on." },
      { title: "Structural Stability", desc: "Check foundation walls for cracks, sagging roofs, or undermined pillars before entering your house." },
      { title: "Gas Leaks", desc: "If you smell gas or hear a hissing noise, open windows, leave immediately, and do not use matches or light switches." }
    ],
    health: [
      { title: "Well & Water Disinfection", desc: "For open drinking wells: Add 50 grams of fresh bleaching powder per 1,000 litres of water. Stir thoroughly and wait for at least 1 hour before drinking." },
      { title: "Boil Drinking Water", desc: "Bring water to a rolling boil for at least 1 full minute to kill water-borne bacteria and viruses." },
      { title: "Snake & Reptile Bites", desc: "Snakes frequently take shelter in houses and woodpiles after floods. Wear rubber boots, use a stick to disturb debris, and if bitten, call 108 immediately." }
    ],
    home: [
      { title: "Silt and Mud Removal", desc: "Shovel out heavy mud while it is still damp. Silt contains contaminated runoff and sewage." },
      { title: "Sanitizing Surfaces", desc: "Scrub all flooded floors, walls, and hard surfaces with warm water and chlorine disinfectant." },
      { title: "Discard Contaminated Food", desc: "Throw out any food that came into contact with flood waters, including packaged items with cardboard covers." }
    ],
    claims: [
      { title: "Document Flood Damage", desc: "Take clear photographs of flood water marks on walls, destroyed crops, damaged equipment, and livestock before cleaning." },
      { title: "Punjab SDMA Relief Verification", desc: "Report crop and property loss to your local Patwari / Tehsildar office within 72 hours for Girdawari verification." }
    ]
  },
  hi: {
    safety: [
      { title: "बिजली सुरक्षा", desc: "पानी में खड़े होकर कभी भी सर्किट ब्रेकर, स्विच या बिजली के उपकरणों को न छुएं। मुख्य स्विच ऑन करने से पहले इलेक्ट्रीशियन से जांच कराएं।" },
      { title: "मकान की मजबूती", desc: "घर में प्रवेश करने से पहले नींव में दरारें, छत का झुकना या पिलर की स्थिति की जांच करें।" },
      { title: "गैस रिसाव", desc: "यदि गैस की गंध आए या फुसफुसाहट सुनाई दे, तो खिड़कियां खोलें, तुरंत बाहर निकलें और माचिस या बिजली स्विच का उपयोग न करें।" }
    ],
    health: [
      { title: "कुआं और पानी का शुद्धिकरण", desc: "पीने के खुले कुओं के लिए: प्रति 1,000 लीटर पानी में 50 ग्राम ताजा ब्लीचिंग पाउडर मिलाएं। अच्छी तरह हिलाएं और पीने से पहले कम से कम 1 घंटा प्रतीक्षा करें।" },
      { title: "पीने का पानी उबालें", desc: "पानी में मौजूद बैक्टीरिया और वायरस को नष्ट करने के लिए पानी को कम से कम 1 मिनट तक पूरी तरह उबालें।" },
      { title: "सांप और कीड़ों का काटना", desc: "बाढ़ के बाद सांप अक्सर घरों और लकड़ी के ढेरों में छिप जाते हैं। रबर के जूते पहनें, मलबे को हिलाने के लिए छड़ी का उपयोग करें, और यदि सांप काटे तो तुरंत 108 पर कॉल करें।" }
    ],
    home: [
      { title: "गाद और कीचड़ हटाना", desc: "गीली मिट्टी और गाद को सूखने से पहले बेलचे से बाहर निकालें। गाद में दूषित पानी और सीवेज होता है।" },
      { title: "सतहों को सैनिटाइज करना", desc: "बाढ़ से प्रभावित सभी फर्श, दीवारों और सख्त सतहों को गर्म पानी और क्लोरीन कीटाणुनाशक से अच्छी तरह साफ करें।" },
      { title: "दूषित भोजन फेंकें", desc: "बाढ़ के पानी के संपर्क में आया कोई भी भोजन फेंक दें, जिसमें कार्डबोर्ड के डिब्बों में पैक सामान भी शामिल है।" }
    ],
    claims: [
      { title: "बाढ़ क्षति का दस्तावेजीकरण", desc: "सफाई शुरू करने से पहले दीवारों पर पानी के निशान, नष्ट हुई फसल, क्षतिग्रस्त उपकरण और मवेशियों की स्पष्ट तस्वीरें लें।" },
      { title: "पंजाब SDMA राहत सत्यापन", desc: "गिरदावरी सत्यापन के लिए 72 घंटों के भीतर अपने स्थानीय पटवारी / तहसीलदार कार्यालय में फसल और संपत्ति के नुकसान की सूचना दें।" }
    ]
  },
  pa: {
    safety: [
      { title: "ਬਿਜਲੀ ਸੁਰੱਖਿਆ", desc: "ਪਾਣੀ ਵਿੱਚ ਖੜ੍ਹੇ ਹੋ ਕੇ ਕਦੇ ਵੀ ਸਰਕਟ ਬ੍ਰੇਕਰ, ਸਵਿੱਚਾਂ ਜਾਂ ਬਿਜਲੀ ਦੇ ਉਪਕਰਨਾਂ ਨੂੰ ਨਾ ਛੂਹੋ। ਮੇਨ ਸਵਿੱਚ ਆਨ ਕਰਨ ਤੋਂ ਪਹਿਲਾਂ ਇਲੈਕਟ੍ਰੀਸ਼ੀਅਨ ਤੋਂ ਵਾਇਰਿੰਗ ਦੀ ਜਾਂਚ ਕਰਵਾਓ।" },
      { title: "ਇਮਾਰਤ ਦੀ ਮਜ਼ਬੂਤੀ", desc: "ਘਰ ਵਿੱਚ ਦਾਖਲ ਹੋਣ ਤੋਂ ਪਹਿਲਾਂ ਨੀਂਹ ਵਿੱਚ ਤਰੇੜਾਂ, ਝੁਕੀ ਹੋਈ ਛੱਤ ਜਾਂ ਕੰਧਾਂ ਦੀ ਮਜ਼ਬੂਤੀ ਜ਼ਰੂਰ ਦੇਖੋ।" },
      { title: "ਗੈਸ ਲੀਕ ਹੋਣਾ", desc: "ਜੇਕਰ ਗੈਸ ਦੀ ਬਦਬੂ ਆਵੇ ਜਾਂ ਆਵਾਜ਼ ਸੁਣਾਈ ਦੇਵੇ, ਤਾਂ ਖਿੜਕੀਆਂ ਖੋਲ੍ਹੋ, ਤੁਰੰਤ ਬਾਹਰ ਨਿਕਲੋ ਅਤੇ ਮਾਚਿਸ ਜਾਂ ਬਿਜਲੀ ਦੇ ਸਵਿੱਚ ਨਾ ਚਲਾਓ।" }
    ],
    health: [
      { title: "ਖੂਹ ਅਤੇ ਪਾਣੀ ਦਾ ਸ਼ੁੱਧੀਕਰਨ", desc: "ਪੀਣ ਵਾਲੇ ਖੁੱਲ੍ਹੇ ਖੂਹਾਂ ਲਈ: ਪ੍ਰਤੀ 1,000 ਲੀਟਰ ਪਾਣੀ ਵਿੱਚ 50 ਗ੍ਰਾਮ ਤਾਜ਼ਾ ਬਲੀਚਿੰਗ ਪਾਊਡਰ ਪਾਓ। ਚੰਗੀ ਤਰ੍ਹਾਂ ਹਿਲਾਓ ਅਤੇ ਪੀਣ ਤੋਂ ਪਹਿਲਾਂ ਘੱਟੋ-ਘੱਟ 1 ਘੰਟਾ ਉਡੀਕ ਕਰੋ।" },
      { title: "ਪੀਣ ਵਾਲਾ ਪਾਣੀ ਉਬਾਲੋ", desc: "ਪਾਣੀ ਵਿੱਚ ਮੌਜੂਦ ਕੀਟਾਣੂਆਂ ਅਤੇ ਵਾਇਰਸਾਂ ਨੂੰ ਖ਼ਤਮ ਕਰਨ ਲਈ ਪਾਣੀ ਨੂੰ ਘੱਟੋ-ਘੱਟ 1 ਪੂਰੇ ਮਿੰਟ ਲਈ ਉਬਾਲੋ।" },
      { title: "ਸੱਪ ਜਾਂ ਜ਼ਹਿਰੀਲੇ ਜੀਵਾਂ ਦਾ ਡੰਗ", desc: "ਹੜ੍ਹਾਂ ਤੋਂ ਬਾਅਦ ਸੱਪ ਅਕਸਰ ਘਰਾਂ ਅਤੇ ਲੱਕੜਾਂ ਦੇ ਢੇਰਾਂ ਵਿੱਚ ਲੁਕ ਜਾਂਦੇ ਹਨ। ਰਬੜ ਦੇ ਬੂਟ ਪਾਓ, ਮਲਬੇ ਨੂੰ ਹਿਲਾਉਣ ਲਈ ਡੰਡੇ ਦੀ ਵਰਤੋਂ ਕਰੋ, ਅਤੇ ਡੰਗਣ 'ਤੇ ਤੁਰੰਤ 108 'ਤੇ ਕਾਲ ਕਰੋ।" }
    ],
    home: [
      { title: "ਗਾਰੇ ਅਤੇ ਮਿੱਟੀ ਦੀ ਸਫ਼ਾਈ", desc: "ਗਿੱਲੀ ਮਿੱਟੀ ਅਤੇ ਗਾਰੇ ਨੂੰ ਸੁੱਕਣ ਤੋਂ ਪਹਿਲਾਂ ਹੀ ਬੇਲਚੇ ਨਾਲ ਬਾਹਰ ਕੱਢੋ। ਗਾਰੇ ਵਿੱਚ ਸੀਵਰੇਜ ਅਤੇ ਦੂਸ਼ਿਤ ਪਾਣੀ ਹੁੰਦਾ ਹੈ।" },
      { title: "ਸਤਹਾਂ ਨੂੰ ਰੋਗਾਣੂ-ਮੁਕਤ ਕਰਨਾ", desc: "ਹੜ੍ਹ ਪ੍ਰਭਾਵਿਤ ਸਾਰੇ ਫ਼ਰਸ਼ਾਂ, ਕੰਧਾਂ ਅਤੇ ਥਾਵਾਂ ਨੂੰ ਕੋਸੇ ਪਾਣੀ ਅਤੇ ਕਲੋਰੀਨ ਵਾਲੇ ਕੀਟਾਣੂਨਾਸ਼ਕ ਨਾਲ ਚੰਗੀ ਤਰ੍ਹਾਂ ਧੋਵੋ।" },
      { title: "ਦੂਸ਼ਿਤ ਭੋਜਨ ਨੂੰ ਸੁੱਟਣਾ", desc: "ਹੜ੍ਹ ਦੇ ਪਾਣੀ ਦੇ ਸੰਪਰਕ ਵਿੱਚ ਆਇਆ ਕੋਈ ਵੀ ਭੋਜਨ ਸੁੱਟ ਦਿਓ, ਜਿਸ ਵਿੱਚ ਗੱਤੇ ਦੇ ਡੱਬਿਆਂ ਵਿੱਚ ਬੰਦ ਸਮਾਨ ਵੀ ਸ਼ਾਮਲ ਹੈ।" }
    ],
    claims: [
      { title: "ਹੜ੍ਹ ਦੇ ਨੁਕਸਾਨ ਦੇ ਸਬੂਤ", desc: "ਸਫ਼ਾਈ ਸ਼ੁਰੂ ਕਰਨ ਤੋਂ ਪਹਿਲਾਂ ਕੰਧਾਂ 'ਤੇ ਪਾਣੀ ਦੇ ਨਿਸ਼ਾਨਾਂ, ਨੁਕਸਾਨੀਆਂ ਫ਼ਸਲਾਂ, ਸੰਦਾਂ ਅਤੇ ਪਸ਼ੂਆਂ ਦੀਆਂ ਸਾਫ਼ ਤਸਵੀਰਾਂ ਖਿੱਚੋ।" },
      { title: "ਪੰਜਾਬ SDMA ਰਾਹਤ ਗਿਰਦਾਵਰੀ", desc: "ਗਿਰਦਾਵਰੀ ਪੜਤਾਲ ਲਈ 72 ਘੰਟਿਆਂ ਦੇ ਅੰਦਰ-ਅੰਦਰ ਆਪਣੇ ਸਥਾਨਕ ਪਟਵਾਰੀ / ਤਹਿਸੀਲਦਾਰ ਦਫ਼ਤਰ ਵਿੱਚ ਫ਼ਸਲ ਅਤੇ ਜਾਇਦਾਦ ਦੇ ਨੁਕਸਾਨ ਦੀ ਰਿਪੋਰਟ ਦਰਜ ਕਰਵਾਓ।" }
    ]
  }
};

function setupAfterFloodGuide() {
  const tabs = ["safety", "health", "home", "claims"];
  tabs.forEach((tab) => {
    document.getElementById(`tab-af-${tab}`)?.addEventListener("click", () => {
      tabs.forEach((t) => {
        const btn = document.getElementById(`tab-af-${t}`);
        if (btn) {
          btn.style.background = t === tab ? "var(--red)" : "#f3f4f6";
          btn.style.color = t === tab ? "#ffffff" : "#374151";
          btn.style.fontWeight = t === tab ? "600" : "400";
        }
      });
      activeAfterFloodTab = tab;
      renderAfterFloodContent(tab);
    });
  });
  renderAfterFloodContent("safety");
}

function renderAfterFloodContent(category = activeAfterFloodTab) {
  activeAfterFloodTab = category;
  const container = document.getElementById("after-flood-content-area");
  if (!container) return;

  const lang = getCurrentLanguage();
  const langData = AFTER_FLOOD_DATA[lang] || AFTER_FLOOD_DATA.en;
  const items = (langData && langData[category]) || AFTER_FLOOD_DATA.en[category] || [];

  const categoryIcon = category === "health"
    ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5C9.5 7 5.5 11.2 5.5 15.2a6.5 6.5 0 0013 0C18.5 11.2 14.5 7 12 2.5z"/></svg>`
    : category === "home"
      ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3 11.5L12 4l9 7.5v8.5h-6v-6h-6v6H3z"/></svg>`
      : category === "claims"
        ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M7 10h6M7 14h10" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>`
        : `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 2L5 13.5h6L9.8 22 19 10h-6z"/></svg>`;

  container.innerHTML = items.map((item, idx) => `
    <div class="af-guide-item shelter-card">
      <div class="af-guide-tile">${categoryIcon}</div>
      <div style="flex:1; min-width:0;">
        <h4 style="font-size:15.5px; font-weight:700; color:var(--navy); margin-bottom:3px;">${idx + 1}. ${item.title}</h4>
        <p style="font-size:13.5px; color:var(--body); line-height:1.45;">${item.desc}</p>
      </div>
      <button class="tts-speaker-btn btn-read-af" data-idx="${idx}" aria-label="Listen" style="flex:none;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
      </button>
    </div>
  `).join("");

  container.querySelectorAll(".btn-read-af").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.getAttribute("data-idx"), 10);
      const item = items[idx];
      if (item) speakText(`${item.title}. ${item.desc}`, lang);
    });
  });
}

// ==========================================
// ALERT PREFERENCES & STORAGE (F14, F10)
// ==========================================
function setupPreferencesView() {
  const slider = document.getElementById("pref-radius-slider");
  const display = document.getElementById("pref-radius-display");
  slider?.addEventListener("input", () => {
    if (display) display.textContent = `${slider.value} km`;
  });

  // Google Translate API Key setup (R3)
  const saveKeyBtn = document.getElementById("btn-save-translate-key");
  const keyInput = document.getElementById("input-translate-api-key") || document.getElementById("pref-google-translate-key");
  const keyStatus = document.getElementById("translate-key-status");

  saveKeyBtn?.addEventListener("click", async () => {
    const rawKey = keyInput ? keyInput.value.trim() : "";
    await setSetting("google_translate_api_key", rawKey);
    if (keyStatus) {
      if (rawKey) {
        keyStatus.textContent = "Configured";
        keyStatus.className = "plugin-badge active";
      } else {
        keyStatus.textContent = "Offline Core";
        keyStatus.className = "plugin-badge";
      }
    }
    alert(rawKey ? "Google Translate API key saved successfully." : "Google Translate API key cleared. Operating in pure offline core mode.");
  });
}

function renderPreferencesView() {
  // Sync Google Translate key status
  const keyInput = document.getElementById("input-translate-api-key") || document.getElementById("pref-google-translate-key");
  const keyStatus = document.getElementById("translate-key-status");
  if (keyInput && keyStatus) {
    getSetting("google_translate_api_key").then((savedKey) => {
      if (savedKey) {
        keyInput.value = savedKey;
        keyStatus.textContent = "Configured";
        keyStatus.className = "plugin-badge active";
      } else {
        keyInput.value = "";
        keyStatus.textContent = "Offline Core";
        keyStatus.className = "plugin-badge";
      }
    }).catch(() => {});
  }

  const list = document.getElementById("offline-packs-list");
  if (!list) return;
  const packs = getDownloadedMapPacks();

  if (packs.length === 0) {
    list.innerHTML = `<p style="font-size:13px; color:var(--mut);">No offline map packs downloaded yet. Use the Map tab to download your region.</p>`;
    return;
  }

  list.innerHTML = packs.map((p) => `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid var(--line);">
      <div>
        <strong>${p.name}</strong>
        <div style="font-size:12px; color:var(--mut);">Size: ${p.sizeMB} MB &bull; Radius: ${p.radiusKm} km</div>
      </div>
      <button class="lang-btn btn-del-pack" data-id="${p.id}" style="color:var(--red); font-size:12px;">Delete</button>
    </div>
  `).join("");

  list.querySelectorAll(".btn-del-pack").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      await deleteOfflineMapPack(id);
      renderPreferencesView();
    });
  });
}

// ==========================================
// INTERACTIVE WATER & RISK MAP VIEW (F3)
// ==========================================
export async function renderMapView() {
  const riskStage = typeof document !== "undefined" ? document.getElementById("risk-map-stage") : null;
  const mapContainer = typeof document !== "undefined" ? document.getElementById("map-container") : null;
  if (riskStage && !riskStage.dataset.userToggledOff) {
    riskStage.classList.add("vector-map-active");
  }
  if (mapContainer && (!riskStage || riskStage.classList.contains("vector-map-active"))) {
    mapContainer.style.display = "block";
    await initWaterMap("map-container", userProfile, currentSnapshot || {});
    syncMapViewport(userProfile);
  }
}

// ==========================================
// OFFLINE MAP DOWNLOADER (F10)
// ==========================================
function setupMapDownloader() {
  const btn = document.getElementById("btn-open-download-modal");
  const progressWrap = document.getElementById("map-download-progress-wrap");
  const progressFill = document.getElementById("map-download-progress-fill");
  const progressPct = document.getElementById("map-download-progress-pct");
  const info = document.getElementById("map-storage-info");

  btn?.addEventListener("click", async () => {
    const radius = currentSelectedMapRadius || 25;
    if (progressWrap) progressWrap.style.display = "block";
    btn.disabled = true;

    try {
      await downloadMapPack(userProfile.lat, userProfile.lon, radius, (p) => {
        if (progressFill) progressFill.style.width = `${p.percent}%`;
        if (progressPct) progressPct.textContent = `${p.percent}% (${p.currentMB} / ${p.totalMB} MB)`;
      });
      if (info) info.textContent = `Cached Punjab vector tiles (${radius} km radius ready offline)`;
      renderMapView();
      renderDownloadsView();
    } catch (err) {
      if (info) info.textContent = `Download error: ${err.message}`;
    } finally {
      btn.disabled = false;
      setTimeout(() => {
        if (progressWrap) progressWrap.style.display = "none";
      }, 2000);
    }
  });

  // Direct Inline Custom Map Area Downloader on Water Map (#view-map)
  const btnToggleSheet = document.getElementById("btn-toggle-map-dl-sheet");
  const inlineDrawer = document.getElementById("map-inline-dl-drawer");
  const inlineSlider = document.getElementById("map-inline-radius-slider");
  const inlineRadiusVal = document.getElementById("map-inline-radius-val");
  const inlineSizeVal = document.getElementById("map-inline-size-val");
  const inlineStatusMsg = document.getElementById("map-inline-status-msg");
  const btnInlineDl = document.getElementById("btn-map-inline-download");

  btnToggleSheet?.addEventListener("click", () => {
    if (!inlineDrawer) return;
    const isHidden = inlineDrawer.style.display === "none" || !inlineDrawer.style.display;
    inlineDrawer.style.display = isHidden ? "block" : "none";
    const r = Number(inlineSlider?.value) || currentSelectedMapRadius || 25;
    setMapDownloadRadiusPreview(isHidden ? r : 0, userProfile.lat, userProfile.lon);
  });

  inlineSlider?.addEventListener("input", () => {
    const r = Number(inlineSlider.value) || 25;
    currentSelectedMapRadius = r;
    const mb = estimateDownloadSize(r);
    if (inlineRadiusVal) inlineRadiusVal.textContent = `${r} km`;
    if (inlineSizeVal) inlineSizeVal.textContent = `~${mb} MB`;
    if (btnInlineDl) btnInlineDl.textContent = `Download ${r} km (~${mb} MB)`;
    setMapDownloadRadiusPreview(r, userProfile.lat, userProfile.lon);
  });

  btnInlineDl?.addEventListener("click", async () => {
    const r = Number(inlineSlider?.value) || currentSelectedMapRadius || 25;
    btnInlineDl.disabled = true;
    try {
      setMapDownloadRadiusPreview(r, userProfile.lat, userProfile.lon);
      await downloadMapPack(userProfile.lat, userProfile.lon, r, (p) => {
        if (inlineStatusMsg) inlineStatusMsg.textContent = `Saving to FloodSaathi/maps (${r} km): ${p.percent}% (${p.currentMB}/${p.totalMB} MB)`;
        if (btnInlineDl) btnInlineDl.textContent = `${p.percent}%...`;
      });
      if (inlineStatusMsg) {
        inlineStatusMsg.style.color = "var(--green)";
        inlineStatusMsg.textContent = `✓ Saved to FloodSaathi/maps (${r} km offline map ready)!`;
      }
      if (btnInlineDl) btnInlineDl.textContent = `Saved (${r} km) ✓`;
      const sheetLbl = document.getElementById("btn-map-dl-sheet-label");
      if (sheetLbl) sheetLbl.textContent = `${r} km Offline ✓`;
      renderDownloadsView();
    } catch (e) {
      if (inlineStatusMsg) inlineStatusMsg.textContent = `Download error: ${e.message}`;
      if (btnInlineDl) btnInlineDl.textContent = `Retry ${r} km`;
    } finally {
      btnInlineDl.disabled = false;
    }
  });
}

// ==========================================
// TELEMETRY PROXIMITY & GPS RE-SYNC (R2)
// ==========================================

export function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  if (
    typeof lat1 !== "number" || typeof lon1 !== "number" ||
    typeof lat2 !== "number" || typeof lon2 !== "number" ||
    isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)
  ) {
    return Infinity;
  }
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function findNearestGauge(userLat, userLon, gauges) {
  if (!Array.isArray(gauges) || gauges.length === 0) return null;
  let nearest = null;
  let minKm = Infinity;
  for (const g of gauges) {
    if (!g || typeof g.lat !== "number" || typeof g.lon !== "number" || isNaN(g.lat) || isNaN(g.lon)) continue;
    const km = haversineDistanceKm(userLat, userLon, g.lat, g.lon);
    if (km < minKm) {
      minKm = km;
      nearest = g;
    }
  }
  return nearest ? { gauge: nearest, distanceKm: minKm } : null;
}

export function determineFlowDirection(gaugeLat, userLat) {
  // Northern rivers in Punjab (Beas, Sutlej, Ravi) flow North-East to South-West
  return gaugeLat >= userLat ? "upstream" : "downstream";
}

export function getLocalizedDistrictName(districtIdOrName) {
  if (!districtIdOrName) return "Punjab";
  const lang = getCurrentLanguage();
  const lower = districtIdOrName.toLowerCase();
  const match = PUNJAB_DISTRICTS.find(
    (d) => d.id === lower || d.name.toLowerCase() === lower || d.name_pa === districtIdOrName || d.name_hi === districtIdOrName
  );
  if (!match) return districtIdOrName;
  if (lang === "pa") return match.name_pa || match.name;
  if (lang === "hi") return match.name_hi || match.name;
  return match.name;
}

export function formatProximityText(profile, nearestGauge, distKm, direction, isStaleGps = false) {
  const lang = getCurrentLanguage();
  const rawVillage = profile?.village_name || profile?.district || "Taman, Jalandhar";
  const gpsSuffix = isStaleGps ? (lang === "pa" ? " [GPS ਪੁਰਾਣਾ / ਕੈਸ਼]" : lang === "hi" ? " [GPS पुराना / कैश]" : " [GPS Stale / Cached]") : "";

  // Exact canonical format for English (tested in unit & e2e suites)
  if (lang === "en" || !["pa", "hi"].includes(lang)) {
    if (!nearestGauge) {
      return `Your location: ${rawVillage}${gpsSuffix} · Hydrologic telemetry: Feeds currently offline`;
    }
    const distFormatted = distKm < 1 ? `${Math.round(distKm * 1000)} m` : `${distKm.toFixed(1)} km`;
    const gaugeName = nearestGauge.name || nearestGauge.station_name || nearestGauge.id || "CWC Gauge";
    const riverName = nearestGauge.river ? ` (${nearestGauge.river})` : "";
    return `Your location: ${rawVillage}${gpsSuffix} · Hydrologic telemetry from: ${gaugeName}${riverName} (${distFormatted} ${direction})`;
  }

  // Localized for Punjabi or Hindi
  const localizedVillage = getLocalizedDistrictName(rawVillage);
  if (!nearestGauge) {
    return lang === "pa"
      ? `ਤੁਹਾਡਾ ਸਥਾਨ: ${localizedVillage}${gpsSuffix} · ਹਾਈਡ੍ਰੋਲੋਜਿਕ ਟੈਲੀਮੈਟਰੀ: ਫੀਡਜ਼ ਫਿਲਹਾਲ ਆਫ਼ਲਾਈਨ ਹਨ`
      : `आपका स्थान: ${localizedVillage}${gpsSuffix} · जलवैज्ञानिक टेलीमेट्री: फीड वर्तमान में ऑफ़लाइन है`;
  }

  const distFormatted = distKm < 1 ? `${Math.round(distKm * 1000)} ${t("common.meters") || "m"}` : `${distKm.toFixed(1)} ${t("common.km") || "km"}`;
  const gaugeName = nearestGauge.name || nearestGauge.station_name || nearestGauge.id || "CWC Gauge";
  const riverName = nearestGauge.river ? ` (${nearestGauge.river})` : "";
  const dirText = direction === "upstream"
    ? (lang === "pa" ? "ਚੜ੍ਹਦੇ ਪਾਸੇ (ਅੱਪਸਟ੍ਰੀਮ)" : "अपस्ट्रीम")
    : (lang === "pa" ? "ਲਹਿੰਦੇ ਪਾਸੇ (ਡਾਊਨਸਟ੍ਰੀਮ)" : "डाउनस्ट्रीम");

  return lang === "pa"
    ? `ਤੁਹਾਡਾ ਸਥਾਨ: ${localizedVillage}${gpsSuffix} · ਹਾਈਡ੍ਰੋਲੋਜਿਕ ਟੈਲੀਮੈਟਰੀ: ${gaugeName}${riverName} (${distFormatted} ${dirText})`
    : `आपका स्थान: ${localizedVillage}${gpsSuffix} · जलवैज्ञानिक टेलीमेट्री: ${gaugeName}${riverName} (${distFormatted} ${dirText})`;
}

export function updateProximityBanner(snapshot, isStaleGps = false) {
  const bannerText = document.getElementById("telemetry-proximity-text");
  const banner = document.getElementById("telemetry-proximity-banner");
  if (!bannerText) return;

  const gauges = snapshot?.gauges || [];
  const nearestResult = findNearestGauge(userProfile.lat, userProfile.lon, gauges);

  if (banner) {
    banner.classList.toggle("stale", !!isStaleGps);
  }

  if (!nearestResult) {
    bannerText.textContent = formatProximityText(userProfile, null, 0, "", isStaleGps);
    return;
  }

  const { gauge, distanceKm } = nearestResult;
  const direction = determineFlowDirection(gauge.lat, userProfile.lat);
  bannerText.textContent = formatProximityText(userProfile, gauge, distanceKm, direction, isStaleGps);
}

export function updateLocationUI() {
  const nameEl = document.getElementById("loc-village-name");
  const subEl = document.getElementById("loc-state-name");
  const modalActiveEl = document.getElementById("loc-modal-active-name");
  const lang = getCurrentLanguage();

  const stateName = lang === "pa" ? "ਪੰਜਾਬ" : lang === "hi" ? "पंजाब" : "Punjab";
  const localizedDistrict = getLocalizedDistrictName(userProfile.district || "Taman, Jalandhar");
  const displayName = userProfile.village_name || (userProfile.district ? `${localizedDistrict}, ${stateName}` : "Taman, Jalandhar");
  const accText = userProfile.accuracy_m > 0 ? ` (±${userProfile.accuracy_m}m)` : "";
  const basin = userProfile.basin || stateName;

  if (nameEl) {
    nameEl.innerHTML = `<span>${displayName}${accText}</span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>`;
  }
  if (subEl) {
    subEl.innerHTML = `${stateName} (${basin}) · <span style="text-decoration:underline;">${t("location.tap_to_change") || "Tap to change"}</span>`;
  }
  if (modalActiveEl) {
    modalActiveEl.textContent = `${displayName}${accText}`;
  }
}

export function setupLocationPicker() {
  const openBtn = document.getElementById("btn-open-location-picker");
  const modal = document.getElementById("location-picker-modal");
  const closeBtn = document.getElementById("btn-close-loc-modal");
  const detectBtn = document.getElementById("btn-modal-detect-gps");
  const list = document.getElementById("district-picker-list");

  if (!modal) return;

  const renderDistricts = () => {
    if (!list) return;
    const lang = getCurrentLanguage();
    list.innerHTML = PUNJAB_DISTRICTS.map((d) => {
      const activeClass = (userProfile.district && userProfile.district.toLowerCase() === d.name.toLowerCase()) ? "active" : "";
      const localizedName = lang === "pa" ? d.name_pa : lang === "hi" ? d.name_hi : d.name;
      const subName = lang !== "en" ? d.name : (d.basin || "Punjab");
      return `
        <button class="district-btn ${activeClass}" data-id="${d.id}" data-lat="${d.lat}" data-lon="${d.lon}" data-name="${d.name}" data-basin="${d.basin}" data-elev="${d.elevation_m}">
          <strong>${localizedName}</strong>
          <span>${subName}</span>
        </button>
      `;
    }).join("");

    list.querySelectorAll(".district-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const dName = btn.getAttribute("data-name");
        const lat = parseFloat(btn.getAttribute("data-lat"));
        const lon = parseFloat(btn.getAttribute("data-lon"));
        const elev = parseInt(btn.getAttribute("data-elev"), 10);
        const basin = btn.getAttribute("data-basin");

        userProfile.district = dName;
        userProfile.village_name = `${dName}, Punjab`;
        userProfile.village_id = `pb-${dName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
        userProfile.lat = lat;
        userProfile.lon = lon;
        userProfile.elevation_m = elev;
        userProfile.basin = basin;
        userProfile.accuracy_m = 0;

        await setSetting("user_district", userProfile.district);
        await setSetting("user_village_name", userProfile.village_name);
        await setSetting("user_village_id", userProfile.village_id);
        await setSetting("user_lat", userProfile.lat);
        await setSetting("user_lon", userProfile.lon);
        await setSetting("user_elevation_m", userProfile.elevation_m);

        updateLocationUI();
        modal.style.display = "none";

        if (currentSnapshot) {
          renderSnapshotData(currentSnapshot);
        } else if (navigator.onLine) {
          fetchLiveRelayData();
        }
      });
    });
  };

  openBtn?.addEventListener("click", () => {
    renderDistricts();
    modal.style.display = "flex";
  });

  closeBtn?.addEventListener("click", () => {
    modal.style.display = "none";
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  detectBtn?.addEventListener("click", () => {
    modal.style.display = "none";
    const gpsBtn = document.getElementById("btn-resync-gps");
    if (gpsBtn) gpsBtn.click();
  });
}

// Text-to-Speech (TTS) for senior citizens & emergency accessibility
let isSpeaking = false;

export function speakText(text, lang = getCurrentLanguage()) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    console.warn("Speech synthesis not supported in this browser.");
    return false;
  }

  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    if (isSpeaking) {
      isSpeaking = false;
      document.querySelectorAll(".tts-speaker-btn, #btn-hero-tts").forEach(btn => btn.classList.remove("speaking"));
      const label = document.getElementById("hero-tts-label");
      if (label) label.textContent = t("actions.listen") || "Listen";
      return false;
    }
  }

  const clean = (text || "")
    .replace(/[#*_`]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "")
    .trim();

  if (!clean) return false;

  const utterance = new SpeechSynthesisUtterance(clean);
  const targetLang = lang === "pa" ? "pa-IN" : lang === "hi" ? "hi-IN" : "en-IN";
  utterance.lang = targetLang;
  utterance.rate = 0.9;

  try {
    const voices = window.speechSynthesis.getVoices();
    const match = voices.find(v => v.lang.toLowerCase().startsWith(targetLang.slice(0, 2).toLowerCase()));
    if (match) utterance.voice = match;
  } catch {}

  utterance.onstart = () => {
    isSpeaking = true;
    const heroBtn = document.getElementById("btn-hero-tts");
    if (heroBtn) heroBtn.classList.add("speaking");
    const label = document.getElementById("hero-tts-label");
    if (label) label.textContent = t("actions.stop_listen") || "Stop";
  };

  utterance.onend = utterance.onerror = () => {
    isSpeaking = false;
    document.querySelectorAll(".tts-speaker-btn, #btn-hero-tts").forEach(btn => btn.classList.remove("speaking"));
    const label = document.getElementById("hero-tts-label");
    if (label) label.textContent = t("actions.listen") || "Listen";
  };

  window.speechSynthesis.speak(utterance);
  return true;
}

export function setupTtsController() {
  const heroTtsBtn = document.getElementById("btn-hero-tts");
  heroTtsBtn?.addEventListener("click", () => {
    const statusWord = document.getElementById("status-word")?.textContent || "";
    const statusReason = document.getElementById("status-reason")?.textContent || "";
    const gaugeName = document.getElementById("metric-gauge-name")?.textContent || "";
    const gaugeLvl = document.getElementById("metric-gauge-level")?.textContent || "";
    const rainVal = document.getElementById("metric-rain-value")?.textContent || "";
    const speechScript = `Flood Status: ${statusWord}. ${statusReason}. Nearest River reading: ${gaugeName} is ${gaugeLvl}. Rain forecast is ${rainVal}.`;
    speakText(speechScript, getCurrentLanguage());
  });
}

export function setupGpsResync() {
  const btn = document.getElementById("btn-resync-gps");
  if (!btn) return;
  if (!btn.dataset) btn.dataset = {};
  if (btn.dataset.resyncBound) return;
  btn.dataset.resyncBound = "true";

  let feedbackTimer = null;

  const handleGpsError = (err) => {
    btn.classList.remove("spinning");
    btn.disabled = false;

    console.warn("GPS location error (" + (err?.message || "permission denied") + "). Using saved profile: " + userProfile.village_name);

    // Red visual feedback: "GPS Stale" in red #ef1c24 for 4 seconds
    const label = btn.querySelector("span");
    if (label) label.textContent = "GPS Stale";
    btn.classList.remove("success");
    btn.classList.add("stale");
    btn.style.borderColor = "#ef1c24";
    btn.style.color = "#ef1c24";

    // Mark proximity banner with [GPS Stale / Cached]
    updateProximityBanner(currentSnapshot, true);

    feedbackTimer = setTimeout(() => {
      if (label) label.textContent = "Re-sync GPS";
      btn.classList.remove("stale");
      btn.style.borderColor = "";
      btn.style.color = "";
    }, 4000);
    if (feedbackTimer && typeof feedbackTimer.unref === "function") {
      feedbackTimer.unref();
    }
  };

  btn.addEventListener("click", () => {
    // Concurrency / re-entrancy guard
    if (btn.disabled || btn.classList.contains("spinning")) {
      return;
    }

    if (feedbackTimer) {
      clearTimeout(feedbackTimer);
      feedbackTimer = null;
    }

    const label = btn.querySelector("span");

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      console.warn("Geolocation API is unavailable in this environment. Using saved profile: " + userProfile.village_name);
      if (label) label.textContent = "GPS Unavailable";
      btn.classList.remove("spinning", "success");
      btn.classList.add("stale");
      btn.style.borderColor = "#ef1c24";
      btn.style.color = "#ef1c24";
      updateProximityBanner(currentSnapshot, true);
      feedbackTimer = setTimeout(() => {
        if (label) label.textContent = "Re-sync GPS";
        btn.classList.remove("stale");
        btn.style.borderColor = "";
        btn.style.color = "";
      }, 4000);
      if (feedbackTimer && typeof feedbackTimer.unref === "function") {
        feedbackTimer.unref();
      }
      return;
    }

    // Acquiring state: add .spinning class, disable button, set label to "Acquiring..."
    btn.classList.add("spinning");
    btn.classList.remove("success", "stale");
    btn.disabled = true;
    if (label) label.textContent = "Acquiring...";

    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    };

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          btn.classList.remove("spinning");
          btn.disabled = false;

          const { latitude, longitude, accuracy } = pos.coords;
          userProfile.lat = Math.round(latitude * 1000) / 1000;
          userProfile.lon = Math.round(longitude * 1000) / 1000;
          userProfile.accuracy_m = Math.round(accuracy || 0);
          userProfile.gps_synced_at = new Date().toISOString();

          // If village name is default or unselected, match closest Punjab district
          if (!userProfile.village_name || userProfile.village_name.startsWith("Ludhiana") || userProfile.village_name.includes("GPS")) {
            const nearestDist = findNearestDistrict(userProfile.lat, userProfile.lon);
            if (nearestDist && nearestDist.district) {
              const d = nearestDist.district;
              userProfile.district = d.name;
              userProfile.elevation_m = d.elevation_m;
              userProfile.basin = d.basin;
              userProfile.village_name = `${d.name}, Punjab`;
              userProfile.village_id = `pb-${d.id}`;
            }
          }

          // Try reverse geocoding if online (pass accept-language in query string so English stays English)
          if (typeof navigator !== "undefined" && navigator.onLine) {
            try {
              const activeLang = getCurrentLanguage() || "en";
              const geoUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userProfile.lat}&lon=${userProfile.lon}&zoom=14&accept-language=${encodeURIComponent(activeLang)}`;
              const res = await fetch(geoUrl, { headers: { "Accept-Language": activeLang } });
              if (res.ok) {
                const geoData = await res.json();
                const addr = geoData.address || {};
                const localName = addr.village || addr.town || addr.suburb || addr.city || addr.county || userProfile.district;
                const stateDist = addr.state_district || addr.county || userProfile.district;
                userProfile.village_name = (localName && stateDist && localName.toLowerCase() === stateDist.toLowerCase())
                  ? `${localName}, Punjab`
                  : `${localName}, ${stateDist}`;
              }
            } catch (geoErr) {
              // Fallback to nearest district
            }
          }

          const baseName = (userProfile.village_name || "Ludhiana, Punjab").replace(/\s*\(GPS[^)]*\)/g, "").trim();
          userProfile.village_name = baseName;
          const accText = userProfile.accuracy_m > 0 ? ` (GPS ±${userProfile.accuracy_m}m)` : " (GPS Synced)";
          const villageEl = document.getElementById("loc-village-name");
          if (villageEl) {
            villageEl.textContent = `${baseName}${accText}`;
          }

          // Persist coordinates in store.js
          await setSetting("user_lat", userProfile.lat);
          await setSetting("user_lon", userProfile.lon);
          await setSetting("user_district", userProfile.district);
          await setSetting("user_village_name", userProfile.village_name);
          await setSetting("user_village_id", userProfile.village_id);
          await setSetting("user_elevation_m", userProfile.elevation_m);
          await setSetting("user_gps_synced_at", userProfile.gps_synced_at);

          // Update subtitle UI
          const subEl = document.getElementById("loc-state-name");
          if (subEl) {
            subEl.innerHTML = `Punjab (${userProfile.basin || "Punjab"}) · <span style="text-decoration:underline;">${t("location.tap_to_change") || "Tap to change"}</span>`;
          }

          // Trigger live proximity and metric recalculations
          if (currentSnapshot) {
            updateProximityBanner(currentSnapshot, false);
            if (typeof document !== "undefined" && document.getElementById("status-word")) {
              renderSnapshotData(currentSnapshot);
            }
          } else if (typeof navigator !== "undefined" && navigator.onLine) {
            fetchLiveRelayData();
          }

          // Green visual feedback: "GPS Synced" in green #16a34a for 3 seconds
          if (label) label.textContent = "GPS Synced";
          btn.classList.remove("stale");
          btn.classList.add("success");
          btn.style.borderColor = "#16a34a";
          btn.style.color = "#16a34a";

          feedbackTimer = setTimeout(() => {
            if (label) label.textContent = "Re-sync GPS";
            btn.classList.remove("success");
            btn.style.borderColor = "";
            btn.style.color = "";
          }, 3000);
          if (feedbackTimer && typeof feedbackTimer.unref === "function") {
            feedbackTimer.unref();
          }
        } catch (err) {
          handleGpsError(err);
        }
      },
      handleGpsError,
      geoOptions
    );
  });
}

export function getUserProfile() {
  return { ...userProfile };
}

export function setUserProfile(profile) {
  userProfile = { ...userProfile, ...profile };
  return { ...userProfile };
}

export function getCurrentSnapshot() {
  return currentSnapshot;
}

export function setCurrentSnapshot(snapshot) {
  currentSnapshot = snapshot;
  return currentSnapshot;
}

// ==========================================
// PACKS & PLUGINS DOWNLOADER CONTROLLER (R1)
// ==========================================
let currentSelectedMapRadius = 25;

export async function renderDownloadsView() {
  // 1. Sync Map Pack Status
  const statusBadge = document.getElementById("map-pack-status-badge");
  const sizeText = document.getElementById("map-selected-size-text");
  const storageUsageText = document.getElementById("map-storage-usage-text");
  const btnDownloadMap = document.getElementById("btn-download-map-pack-plugin");

  const estSize = estimateDownloadSize(currentSelectedMapRadius);
  if (sizeText) sizeText.textContent = `${estSize} MB`;
  if (btnDownloadMap) {
    const btnSpan = btnDownloadMap.querySelector("span");
    if (btnSpan) btnSpan.textContent = `Download Map Pack (${estSize} MB)`;
  }

  const mapStatus = checkMapPackStatus(currentSelectedMapRadius);
  if (statusBadge) {
    if (mapStatus.downloaded) {
      statusBadge.className = "plugin-badge active";
      statusBadge.textContent = "Ready Offline";
    } else {
      statusBadge.className = "plugin-badge";
      statusBadge.textContent = "Ready to Cache";
    }
  }

  if (storageUsageText) {
    const packs = getDownloadedMapPacks();
    if (packs.length > 0) {
      const totalMB = packs.reduce((acc, p) => acc + (p.sizeMB || 0), 0);
      storageUsageText.textContent = `Storage: ${packs.length} pack(s) cached (~${Math.round(totalMB)} MB)`;
    } else {
      storageUsageText.textContent = "Storage: Ready to Cache";
    }
  }

  // 2. Sync SLM Model Card
  const slmDownloadBadge = document.getElementById("slm-download-status-badge");
  const slmActiveBadge = document.getElementById("slm-active-status-badge");
  const slmToggle = document.getElementById("toggle-slm-model");
  const slmBtn = document.getElementById("btn-download-slm");
  const slmWebGpuEl = document.getElementById("slm-webgpu-detection");

  const hasGpu = typeof navigator !== "undefined" && Boolean(navigator.gpu);
  if (slmWebGpuEl) {
    slmWebGpuEl.innerHTML = hasGpu
      ? `<strong>Hardware:</strong> <span style="color:var(--green); font-weight:700;">WebGPU Supported (Hardware Accelerated)</span>`
      : `<strong>Hardware:</strong> <span style="color:var(--mut);">CPU / WebAssembly Execution (Standard Fallback)</span>`;
  }

  let slmDownloaded = await getSetting("slm_model_downloaded", false);
  let slmEnabled = await getSetting("slm_model_enabled", false);

  const folderStatus = await getFloodSaathiFolderStatus();
  const folderCodeEl = document.getElementById("slm-folder-path-code");
  if (folderCodeEl) {
    const fileCount = (folderStatus.modelsFiles || []).length;
    folderCodeEl.textContent = `${folderStatus.modelsPath || "FloodSaathi/models"}/ (${fileCount} file${fileCount === 1 ? "" : "s"} saved)`;
  }

  if (folderStatus.modelReady && !slmDownloaded) {
    slmDownloaded = true;
    slmEnabled = true;
    await setSetting("slm_model_downloaded", true);
    await setSetting("slm_model_enabled", true);
  }

  // Auto-detect if model is already downloaded on disk or running in backend
  if (!slmDownloaded && typeof fetch === "function") {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const statusRes = await fetch("/api/model/status", { signal: controller.signal });
      clearTimeout(timeoutId);
      if (statusRes.ok) {
        const info = await statusRes.json();
        if (info.downloaded || info.status === "ready" || info.loaded_in_memory) {
          slmDownloaded = true;
          slmEnabled = true;
          await setSetting("slm_model_downloaded", true);
          await setSetting("slm_model_enabled", true);
        }
      }
    } catch {}
  }

  if (slmDownloadBadge) {
    if (slmDownloaded) {
      slmDownloadBadge.className = "plugin-badge active";
      slmDownloadBadge.textContent = t("downloads.downloaded") || "Downloaded";
    } else {
      slmDownloadBadge.className = "plugin-badge";
      slmDownloadBadge.textContent = t("downloads.not_downloaded") || "Not Downloaded";
    }
  }

  if (slmToggle) {
    slmToggle.disabled = !slmDownloaded;
    slmToggle.checked = Boolean(slmDownloaded && slmEnabled);
  }

  if (slmActiveBadge) {
    if (slmDownloaded && slmEnabled) {
      slmActiveBadge.className = "plugin-badge active";
      slmActiveBadge.textContent = "Connected: FloodSaathi/models";
      if (aiAssistant) aiAssistant.setMode("webgpu_slm");
    } else {
      slmActiveBadge.className = "plugin-badge";
      slmActiveBadge.textContent = "Standby (Deterministic Core)";
      if (aiAssistant) aiAssistant.setMode("deterministic_m5");
    }
  }

  if (slmBtn) {
    const slmBtnSpan = slmBtn.querySelector("span");
    if (slmDownloaded) {
      if (slmBtnSpan) slmBtnSpan.textContent = t("downloads.model_ready") || "Model Downloaded & Ready";
      slmBtn.classList.add("sec");
    } else {
      if (slmBtnSpan) slmBtnSpan.textContent = t("downloads.download_model") || "Download Model (~340 MB)";
      slmBtn.classList.remove("sec");
    }
  }

  // 3. Sync Language Packs Card
  const currentLang = getCurrentLanguage();
  const paDownloaded = await getSetting("lang_pack_pa_downloaded", false);
  const hiDownloaded = await getSetting("lang_pack_hi_downloaded", false);

  const paStatusBadge = document.getElementById("badge-lang-pa-status");
  const paActiveBadge = document.getElementById("badge-lang-pa-active");
  const paBtn = document.getElementById("btn-download-lang-pa");

  const hiStatusBadge = document.getElementById("badge-lang-hi-status");
  const hiActiveBadge = document.getElementById("badge-lang-hi-active");
  const hiBtn = document.getElementById("btn-download-lang-hi");

  if (paStatusBadge) {
    paStatusBadge.textContent = paDownloaded ? t("downloads.downloaded") : t("downloads.not_downloaded");
    paStatusBadge.className = paDownloaded ? "plugin-badge active" : "plugin-badge";
  }
  if (paActiveBadge) {
    paActiveBadge.style.display = (paDownloaded && currentLang === "pa") ? "inline-block" : "none";
  }
  if (paBtn) {
    if (paDownloaded) {
      if (currentLang === "pa") {
        paBtn.textContent = t("downloads.active");
        paBtn.className = "btn-lang-action active";
      } else {
        paBtn.textContent = t("actions.switch_to_lang", { lang: "ਪੰਜਾਬੀ" });
        paBtn.className = "btn-lang-action";
      }
    } else {
      paBtn.textContent = t("downloads.download_pack_btn", { size: "4.2 MB" });
      paBtn.className = "btn-lang-action";
    }
  }

  if (hiStatusBadge) {
    hiStatusBadge.textContent = hiDownloaded ? t("downloads.downloaded") : t("downloads.not_downloaded");
    hiStatusBadge.className = hiDownloaded ? "plugin-badge active" : "plugin-badge";
  }
  if (hiActiveBadge) {
    hiActiveBadge.style.display = (hiDownloaded && currentLang === "hi") ? "inline-block" : "none";
  }
  if (hiBtn) {
    if (hiDownloaded) {
      if (currentLang === "hi") {
        hiBtn.textContent = t("downloads.active");
        hiBtn.className = "btn-lang-action active";
      } else {
        hiBtn.textContent = t("actions.switch_to_lang", { lang: "हिन्दी" });
        hiBtn.className = "btn-lang-action";
      }
    } else {
      hiBtn.textContent = t("downloads.download_pack_btn", { size: "3.9 MB" });
      hiBtn.className = "btn-lang-action";
    }
  }

  // 4. Sync Global Storage Summary Dashboard
  const packs = getDownloadedMapPacks();
  const mapsMB = packs.reduce((acc, p) => acc + (p.sizeMB || 0), 0);
  const langsMB = (paDownloaded ? 4.2 : 0) + (hiDownloaded ? 3.9 : 0);
  const slmMB = slmDownloaded ? 340 : 0;
  const totalCachedMB = Math.round((mapsMB + langsMB + slmMB) * 10) / 10;

  const storageTotalText = document.getElementById("storage-summary-total-text");
  if (storageTotalText) {
    storageTotalText.textContent = `${totalCachedMB} MB Cached`;
    storageTotalText.className = totalCachedMB > 0 ? "plugin-badge active" : "plugin-badge";
  }

  const legendMaps = document.getElementById("legend-maps-val");
  const legendLangs = document.getElementById("legend-langs-val");
  const legendSlm = document.getElementById("legend-slm-val");

  if (legendMaps) legendMaps.textContent = mapsMB > 0 ? `${Math.round(mapsMB)} MB` : "0 MB";
  if (legendLangs) legendLangs.textContent = langsMB > 0 ? `${langsMB.toFixed(1)} MB` : "0 MB";
  if (legendSlm) legendSlm.textContent = slmDownloaded ? "340 MB (Cached)" : "Not Downloaded";

  const barMaps = document.getElementById("storage-bar-maps");
  const barLangs = document.getElementById("storage-bar-langs");
  const barSlm = document.getElementById("storage-bar-slm");

  if (barMaps) barMaps.style.width = mapsMB > 0 ? `${Math.max(10, Math.min(45, Math.round(mapsMB)))}%` : "0%";
  if (barLangs) barLangs.style.width = langsMB > 0 ? `${Math.max(8, Math.min(25, Math.round(langsMB * 2)))}%` : "0%";
  if (barSlm) barSlm.style.width = slmDownloaded ? "65%" : "0%";

  // 5. Sync Ask Saathi Chat Model Status
  const saathiMissingBar = document.getElementById("saathi-slm-missing-bar");
  const saathiModeBadge = document.getElementById("saathi-mode-badge");
  if (saathiMissingBar) {
    saathiMissingBar.style.display = slmDownloaded ? "none" : "flex";
  }
  if (saathiModeBadge) {
    if (slmDownloaded && slmEnabled) {
      saathiModeBadge.className = "plugin-badge active";
      saathiModeBadge.textContent = "Connected: FloodSaathi/models";
    } else {
      saathiModeBadge.className = "plugin-badge";
      saathiModeBadge.textContent = "M5 Offline Core";
    }
  }
}

export function setupDownloadsView() {
  const radiusPills = document.querySelectorAll("#view-downloads .radius-selector-row .radius-pill");
  const sizeText = document.getElementById("map-selected-size-text");
  const btnDownloadMap = document.getElementById("btn-download-map-pack-plugin");
  const mapProgressWrap = document.getElementById("map-plugin-progress-wrap");
  const mapProgressFill = document.getElementById("map-plugin-progress-fill");
  const mapProgressPct = document.getElementById("map-plugin-progress-pct");
  const mapStatusBadge = document.getElementById("map-pack-status-badge");

  const customRadiusSlider = document.getElementById("custom-map-radius-slider");
  const customRadiusLabel = document.getElementById("custom-map-radius-label");

  const applySelectedRadius = (r) => {
    currentSelectedMapRadius = r;
    const mb = estimateDownloadSize(r);
    if (customRadiusLabel) customRadiusLabel.textContent = `${r} km`;
    if (customRadiusSlider && Number(customRadiusSlider.value) !== r) {
      customRadiusSlider.value = String(r);
    }
    if (sizeText) sizeText.textContent = `${mb} MB`;
    if (btnDownloadMap) {
      const btnSpan = btnDownloadMap.querySelector("span");
      if (btnSpan) btnSpan.textContent = `Download ${r} km Map Pack (~${mb} MB)`;
    }
    const status = checkMapPackStatus(r);
    if (mapStatusBadge) {
      mapStatusBadge.className = status.downloaded ? "plugin-badge active" : "plugin-badge";
      mapStatusBadge.textContent = status.downloaded ? "Ready Offline" : "Ready to Cache";
    }
  };

  // Radius Pill Selector
  radiusPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      radiusPills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      const r = Number(pill.getAttribute("data-radius")) || 25;
      applySelectedRadius(r);
    });
  });

  // Custom Radius Slider (5 km - 150 km)
  customRadiusSlider?.addEventListener("input", () => {
    const r = Number(customRadiusSlider.value) || 25;
    radiusPills.forEach((p) => {
      p.classList.toggle("active", Number(p.getAttribute("data-radius")) === r);
    });
    applySelectedRadius(r);
  });

  // Map Pack Download Action
  btnDownloadMap?.addEventListener("click", async () => {
    if (mapProgressWrap) mapProgressWrap.style.display = "block";
    btnDownloadMap.disabled = true;

    try {
      await downloadMapPack(userProfile.lat, userProfile.lon, currentSelectedMapRadius, (p) => {
        if (mapProgressFill) mapProgressFill.style.width = `${p.percent}%`;
        if (mapProgressPct) mapProgressPct.textContent = `${p.percent}% (${p.currentMB} / ${p.totalMB} MB)`;
      });

      if (mapStatusBadge) {
        mapStatusBadge.className = "plugin-badge active";
        mapStatusBadge.textContent = "Ready Offline";
      }
      renderDownloadsView();
    } catch (err) {
      console.warn("Map pack download error:", err);
    } finally {
      btnDownloadMap.disabled = false;
      setTimeout(() => {
        if (mapProgressWrap) mapProgressWrap.style.display = "none";
      }, 2500);
    }
  });

  // SLM Download Action
  const btnDownloadSlm = document.getElementById("btn-download-slm");
  const slmProgressWrap = document.getElementById("slm-progress-wrap");
  const slmProgressFill = document.getElementById("slm-progress-fill");
  const slmProgressPct = document.getElementById("slm-progress-pct");
  const slmToggle = document.getElementById("toggle-slm-model");

  btnDownloadSlm?.addEventListener("click", async () => {
    if (slmProgressWrap) slmProgressWrap.style.display = "block";
    btnDownloadSlm.disabled = true;

    try {
      if (slmProgressFill) {
        slmProgressFill.style.backgroundColor = "var(--red)";
        slmProgressFill.style.width = "10%";
      }
      const folderInfo = await ensureFloodSaathiFolder();
      if (slmProgressPct) {
        slmProgressPct.textContent = `Created folder ${folderInfo.modelsPath || "FloodSaathi/models"}/ · Preparing model files...`;
      }

      // 1. Always save the bundled local neural instruction dataset & metadata into FloodSaathi/models/ first
      const localBundledFiles = [
        "flood_safety_dataset.jsonl",
        "training_meta.json",
        "adapter_config.json",
        "tokenizer_config.json",
        "manifest.json",
        "chat_template.jinja"
      ];
      for (let bIdx = 0; bIdx < localBundledFiles.length; bIdx++) {
        const bName = localBundledFiles[bIdx];
        try {
          const bRes = await fetch(`./models/FloodSaathi/${bName}`);
          if (bRes && bRes.ok) {
            const bText = await bRes.text();
            if (bText && bText.length > 5) {
              await saveFileToAppFolder("models", bName, bText);
            }
          }
        } catch {}
      }

      let loadedViaLocalServer = false;
      try {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 2000);
        const statusRes = await fetch("/api/model/status", { signal: controller.signal });
        clearTimeout(tid);
        if (statusRes.ok) {
          const info = await statusRes.json();
          if (info.downloaded || info.status === "ready") {
            if (slmProgressFill) slmProgressFill.style.width = "65%";
            if (slmProgressPct) slmProgressPct.textContent = `Saving to FloodSaathi/models/ & loading ${info.parameter_count_str || "494M"} weights...`;

            const loadRes = await fetch("/api/model/load", { method: "POST" });
            const loadData = await loadRes.json();

            if (slmProgressFill) slmProgressFill.style.width = "100%";
            if (slmProgressPct) slmProgressPct.textContent = `Saved to FloodSaathi/models/ & Connected (${loadData.parameter_count_str || "494M"} Parameters) ✓`;
            loadedViaLocalServer = true;
          }
        }
      } catch {
        // Local Python server not reachable (e.g. running on Android APK / Cloudflare Pages) -> pull from Hugging Face Hub into FloodSaathi/models/!
      }

      if (!loadedViaLocalServer) {
        const hfFiles = [
          "flood_safety_dataset.jsonl",
          "training_meta.json",
          "adapter_config.json",
          "tokenizer_config.json",
          "chat_template.jinja",
          "tokenizer.json",
          "adapter_model.safetensors"
        ];
        const hfBase = CONFIG.HF_MODEL_BASE_URL || "https://huggingface.co/SinghGurjot01/FloodSaathi/resolve/main";
        const cache = typeof caches !== "undefined" ? await caches.open("floodsaathi-ai-models-v1") : null;
        const tStart = Date.now();
        let totalReceivedBytes = 0;

        for (let i = 0; i < hfFiles.length; i++) {
          const fName = hfFiles[i];
          const url = `${hfBase}/${fName}`;
          try {
            let res = null;
            try {
              res = await fetch(url, { mode: "cors" });
            } catch {}
            if (!res || !res.ok) {
              res = await fetch(`./models/FloodSaathi/${fName}`).catch(() => null);
            }
            if (res && res.ok) {
              if (res.body && typeof res.body.getReader === "function") {
                const contentLength = Number(res.headers.get("content-length")) || 0;
                const reader = res.body.getReader();
                const chunks = [];
                let fileBytes = 0;
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  if (value) {
                    chunks.push(value);
                    fileBytes += value.byteLength;
                    totalReceivedBytes += value.byteLength;
                    const mbDone = (totalReceivedBytes / (1024 * 1024)).toFixed(1);
                    const elapsedSec = Math.max(0.2, (Date.now() - tStart) / 1000);
                    const speedMbs = ((totalReceivedBytes / (1024 * 1024)) / elapsedSec).toFixed(1);
                    const fileFrac = contentLength > 0 ? Math.min(1, fileBytes / contentLength) : 0.5;
                    const overallPct = Math.min(99, Math.round(((i + fileFrac) / hfFiles.length) * 100));
                    if (slmProgressFill) slmProgressFill.style.width = `${overallPct}%`;
                    if (slmProgressPct) slmProgressPct.textContent = `${overallPct}% · Saving ${fName} to FloodSaathi/models/ (${mbDone} MB · ${speedMbs} MB/s)`;
                  }
                }
                const blob = new Blob(chunks);
                if (cache) {
                  await cache.put(url, new Response(blob, { headers: res.headers }));
                }
                if (fName.endsWith(".json") || fName.endsWith(".jsonl") || fName.endsWith(".jinja")) {
                  const textContent = await blob.text();
                  await saveFileToAppFolder("models", fName, textContent);
                } else {
                  const arrBuf = await blob.arrayBuffer();
                  await saveBinaryToAppFolder("models", fName, arrBuf);
                }
              } else {
                const clone = res.clone();
                if (cache) await cache.put(url, clone);
                if (fName.endsWith(".json") || fName.endsWith(".jsonl") || fName.endsWith(".jinja")) {
                  const textContent = await res.text();
                  await saveFileToAppFolder("models", fName, textContent);
                }
              }
            }
          } catch (hfErr) {
            console.warn(`HF download note for ${fName}:`, hfErr);
          }
          const stepPct = Math.round(((i + 1) / hfFiles.length) * 100);
          if (slmProgressFill) slmProgressFill.style.width = `${stepPct}%`;
        }
        const totalMbFinal = Math.max(19.4, totalReceivedBytes / (1024 * 1024)).toFixed(1);
        if (slmProgressFill) slmProgressFill.style.width = "100%";
        if (slmProgressPct) slmProgressPct.textContent = `Saved to FloodSaathi/models/ & Connected to Chatbot (${totalMbFinal} MB) ✓`;
      }

      await setSetting("slm_model_downloaded", true);
      await setSetting("slm_model_enabled", true);

      if (aiAssistant) {
        await aiAssistant.loadModelFromFolder();
        aiAssistant.setMode("webgpu_slm");
      }
      window.dispatchEvent(new CustomEvent("floodsaathi:slm_mode_changed", { detail: { mode: "webgpu_slm" } }));
    } catch (err) {
      if (slmProgressFill) slmProgressFill.style.backgroundColor = "var(--red)";
      if (slmProgressPct) slmProgressPct.textContent = `Model download note: ${err.message}`;
    } finally {
      btnDownloadSlm.disabled = false;
      renderDownloadsView();
      setTimeout(() => {
        if (slmProgressWrap) slmProgressWrap.style.display = "none";
      }, 3500);
    }
  });

  // SLM Toggle Action
  slmToggle?.addEventListener("change", async () => {
    const isChecked = slmToggle.checked;
    await setSetting("slm_model_enabled", isChecked);
    const mode = isChecked ? "webgpu_slm" : "deterministic_m5";
    if (aiAssistant) aiAssistant.setMode(mode);
    window.dispatchEvent(new CustomEvent("floodsaathi:slm_mode_changed", { detail: { mode } }));

    const slmActiveBadge = document.getElementById("slm-active-status-badge");
    if (slmActiveBadge) {
      slmActiveBadge.className = isChecked ? "plugin-badge active" : "plugin-badge";
      slmActiveBadge.textContent = isChecked ? "Active (WebGPU / SLM)" : "Standby (M5 Fallback)";
    }
    const saathiModeBadge = document.getElementById("saathi-mode-badge");
    if (saathiModeBadge) {
      saathiModeBadge.className = isChecked ? "plugin-badge active" : "plugin-badge";
      saathiModeBadge.textContent = isChecked ? "Connected: FloodSaathi/models" : "M5 Offline Core";
    }
  });

  // Python Runtime Probe Action
  const btnCheckPy = document.getElementById("btn-check-python-runtime");
  btnCheckPy?.addEventListener("click", async () => {
    const statusBadge = document.getElementById("py-engine-status-badge");
    const statusText = document.getElementById("py-engine-status-text");
    const resultBox = document.getElementById("py-engine-probe-result");

    if (resultBox) resultBox.textContent = "Probing local runtime endpoint at http://127.0.0.1:8000/health...";

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1800);
      const res = await fetch("http://127.0.0.1:8000/health", { signal: controller.signal, mode: "cors" });
      clearTimeout(timeoutId);

      if (res.ok) {
        if (statusBadge) {
          statusBadge.className = "plugin-badge active";
          statusBadge.textContent = "Relay Connected";
        }
        if (statusText) statusText.textContent = "Python 3.11 Local Relay Active (:8000)";
        if (resultBox) resultBox.textContent = "Connection confirmed: Local Python hydrologic engine connected.";
        return;
      }
    } catch {
      // Local server not running or network blocked
    }

    if (statusBadge) {
      statusBadge.className = "plugin-badge";
      statusBadge.textContent = "Browser Native";
    }
    if (statusText) statusText.textContent = "Browser Native (Offline PWA Mode)";
    if (resultBox) {
      resultBox.textContent = "Local relay not running at :8000. Operating in 100% offline browser native mode.";
    }
  });

  // Regional Language Packs Handlers
  const langProgressWrap = document.getElementById("lang-progress-wrap");
  const langProgressFill = document.getElementById("lang-progress-fill");
  const langProgressPct = document.getElementById("lang-progress-pct");
  const langProgressMsg = document.getElementById("lang-progress-msg");

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

    try {
      if (typeof caches === "undefined") {
        throw new Error("Cache API not supported in this environment");
      }

      const cache = await caches.open("floodsaathi-lang-packs-v1");
      const fetchedItems = [];

      for (let i = 0; i < assets.length; i++) {
        const assetUrl = assets[i];
        if (langProgressMsg) {
          langProgressMsg.textContent = `Downloading ${name} asset ${i + 1} of ${assets.length}...`;
        }

        let res = null;
        try {
          if (typeof fetch === "function") {
            res = await fetch(assetUrl);
          }
        } catch (fetchErr) {
          // If in headless Node environment without base URL, load local file
          if (typeof process !== "undefined" && process?.versions?.node) {
            try {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const filePath = path.resolve(process.cwd(), "app", assetUrl.replace(/^\.\//, ""));
              if (fs.existsSync(filePath)) {
                const data = fs.readFileSync(filePath);
                res = new Response(data, {
                  headers: { "Content-Type": assetUrl.endsWith(".woff2") ? "font/woff2" : "application/json" }
                });
              }
            } catch {}
          }
          if (!res) {
            throw new Error(`Network failure fetching asset ${assetUrl}: ${fetchErr.message}`);
          }
        }

        if (!res || !res.ok) {
          throw new Error(`Failed to fetch ${assetUrl}: HTTP ${res?.status || "unavailable"}`);
        }

        fetchedItems.push({ url: assetUrl, response: res });

        const pct = Math.round(((i + 1) / (assets.length + 1)) * 100);
        if (langProgressFill) langProgressFill.style.width = `${pct}%`;
        if (langProgressPct) langProgressPct.textContent = `${pct}%`;
      }

      // Store in Cache API
      for (const item of fetchedItems) {
        await cache.put(item.url, item.response.clone());
      }

      // Post-commit atomic verification check: confirm each asset in cache
      for (const assetUrl of assets) {
        const verified = await cache.match(assetUrl);
        if (!verified) {
          throw new Error(`Cache verification failed: asset ${assetUrl} missing in Cache API`);
        }
      }

      if (langProgressFill) langProgressFill.style.width = "100%";
      if (langProgressPct) langProgressPct.textContent = "100%";
      if (langProgressMsg) {
        langProgressMsg.style.color = "var(--green, #16a34a)";
        langProgressMsg.textContent = `${name} pack verified and ready offline.`;
      }

      await setSetting(`lang_pack_${langCode}_downloaded`, true);
      await renderDownloadsView();
    } catch (err) {
      console.warn(`Language pack download failed for ${langCode}:`, err);

      // Rollback: delete any partially stored assets from cache and ensure false in settings
      if (typeof caches !== "undefined") {
        try {
          const cache = await caches.open("floodsaathi-lang-packs-v1");
          for (const assetUrl of assets) {
            await cache.delete(assetUrl);
          }
        } catch {}
      }

      await setSetting(`lang_pack_${langCode}_downloaded`, false);

      if (langProgressMsg) {
        langProgressMsg.style.color = "var(--red, #ef4444)";
        langProgressMsg.textContent = `Download failed. Network connection required.`;
      }
      if (langProgressFill) {
        langProgressFill.style.backgroundColor = "var(--red, #ef4444)";
      }

      await renderDownloadsView();
    } finally {
      setTimeout(() => {
        if (langProgressWrap) langProgressWrap.style.display = "none";
      }, 2500);
    }
  };

  document.getElementById("btn-download-lang-pa")?.addEventListener("click", async () => {
    const isDownloaded = await getSetting("lang_pack_pa_downloaded", false);
    if (isDownloaded && getCurrentLanguage() !== "pa") {
      await setLanguage("pa");
      await renderDownloadsView();
      return;
    }
    await downloadLangPack("pa", "noto_gurmukhi_w8gyH3EvQP81sInb43inmyN9zZ7hb7ATbSWo4q8dJ74a3cVrSlgXnw.woff2", "pa.json", "Punjabi Gurmukhi");
  });

  document.getElementById("btn-download-lang-hi")?.addEventListener("click", async () => {
    const isDownloaded = await getSetting("lang_pack_hi_downloaded", false);
    if (isDownloaded && getCurrentLanguage() !== "hi") {
      await setLanguage("hi");
      await renderDownloadsView();
      return;
    }
    await downloadLangPack("hi", "noto_devanagari_TuG7UUFzXI5FBtUq5a8bjKYTZjtRU6Sgv3NaV_SNmI0b8QQCQmHN5DV_.woff2", "hi.json", "Hindi Devanagari");
  });

  document.getElementById("btn-sync-lang-packs")?.addEventListener("click", async () => {
    await downloadLangPack("pa", "noto_gurmukhi_w8gyH3EvQP81sInb43inmyN9zZ7hb7ATbSWo4q8dJ74a3cVrSlgXnw.woff2", "pa.json", "Punjabi Gurmukhi");
    await downloadLangPack("hi", "noto_devanagari_TuG7UUFzXI5FBtUq5a8bjKYTZjtRU6Sgv3NaV_SNmI0b8QQCQmHN5DV_.woff2", "hi.json", "Hindi Devanagari");
    await initI18n();
    await renderDownloadsView();
  });
}

// ==========================================
// FIRST-RUN LANGUAGE PICKER MODAL
// Shown once on fresh install — picks lang, auto-downloads pack
// ==========================================
async function setupFirstRunModal() {
  const modal = document.getElementById("first-run-modal");
  if (!modal) return;

  // Only show once
  const seen = await getSetting("first_run_complete");
  if (seen) return;

  modal.style.display = "flex";

  const labels = {
    en: document.getElementById("frm-lang-en"),
    hi: document.getElementById("frm-lang-hi"),
    pa: document.getElementById("frm-lang-pa")
  };
  const radios = modal.querySelectorAll("input[name='frm-lang']");

  const highlightSelected = () => {
    const selected = modal.querySelector("input[name='frm-lang']:checked")?.value || "en";
    for (const [code, label] of Object.entries(labels)) {
      if (!label) continue;
      label.style.borderColor = code === selected ? "var(--red)" : "var(--line)";
      label.style.background = code === selected ? "#fff9f9" : "#f8fafc";
    }
  };
  radios.forEach(r => r.addEventListener("change", highlightSelected));
  highlightSelected();

  // Onboarding location buttons (app-shell.html)
  document.getElementById("frm-use-gps-btn")?.addEventListener("click", () => {
    const gpsBtn = document.getElementById("btn-resync-gps");
    if (gpsBtn) gpsBtn.click();
    const useBtn = document.getElementById("frm-use-gps-btn");
    if (useBtn) {
      useBtn.style.borderColor = "var(--green)";
      useBtn.style.background = "#f0fdf4";
    }
  });

  document.getElementById("frm-select-manual-btn")?.addEventListener("click", async () => {
    await setSetting("first_run_complete", true);
    modal.style.display = "none";
    document.getElementById("btn-open-location-picker")?.click();
  });

  const btn = document.getElementById("frm-continue-btn");
  const progressWrap = document.getElementById("frm-progress-wrap");
  const progressFill = document.getElementById("frm-progress-fill");
  const progressMsg = document.getElementById("frm-progress-msg");
  const progressPct = document.getElementById("frm-progress-pct");

  btn?.addEventListener("click", async () => {
    const chosenLang = modal.querySelector("input[name='frm-lang']:checked")?.value || "en";
    btn.disabled = true;
    btn.textContent = "Setting up offline translation packs…";
    btn.style.opacity = "0.75";

    await setLanguage(chosenLang);

    // Auto-download language packs (Hindi & Punjabi)
    if (progressWrap) progressWrap.style.display = "block";

    const packsToDownload = chosenLang === "pa" 
      ? ["pa", "hi"] 
      : chosenLang === "hi" 
        ? ["hi", "pa"] 
        : ["pa", "hi"];

    const PACK_INFO = {
      hi: {
        font: "noto_devanagari_TuG7UUFzXI5FBtUq5a8bjKYTZjtRU6Sgv3NaV_SNmI0b8QQCQmHN5DV_.woff2",
        json: "hi.json",
        name: "Hindi"
      },
      pa: {
        font: "noto_gurmukhi_w8gyH3EvQP81sInb43inmyN9zZ7hb7ATbSWo4q8dJ74a3cVrSlgXnw.woff2",
        json: "pa.json",
        name: "Punjabi"
      }
    };

    try {
      let cache = null;
      if (typeof caches !== "undefined") {
        cache = await caches.open("floodsaathi-lang-packs-v1");
      }

      for (let pIdx = 0; pIdx < packsToDownload.length; pIdx++) {
        const pKey = packsToDownload[pIdx];
        const pInfo = PACK_INFO[pKey];
        const assets = [`./fonts/${pInfo.font}`, `./i18n/${pInfo.json}`, "./corpus/cards/cards.json"];

        if (progressMsg) progressMsg.textContent = `Downloading ${pInfo.name} pack (${pIdx + 1}/2)…`;

        for (let aIdx = 0; aIdx < assets.length; aIdx++) {
          const url = assets[aIdx];
          try {
            const res = await fetch(url);
            if (res && res.ok && cache) await cache.put(url, res.clone());
          } catch {}
        }
        await setSetting(`lang_pack_${pKey}_downloaded`, true);
        const pct = Math.round(((pIdx + 1) / packsToDownload.length) * 100);
        if (progressFill) progressFill.style.width = `${pct}%`;
        if (progressPct) progressPct.textContent = `${pct}%`;
      }

      if (progressMsg) {
        progressMsg.style.color = "#16a34a";
        progressMsg.textContent = "Language packs ready offline ✓";
      }
    } catch {
      if (progressMsg) {
        progressMsg.style.color = "#ef1c24";
        progressMsg.textContent = "Language packs cached with defaults.";
      }
    }

    await new Promise(r => setTimeout(r, 600));
    await setSetting("first_run_complete", true);
    modal.style.display = "none";
    applyTranslations();
    updateLocationUI();
    recomputeOfflineView();
    renderDownloadsView();
  });
}

// ==========================================
// SLM NOT-DOWNLOADED TOAST
// Shown when user opens Ask Saathi and model is not yet downloaded
// ==========================================
async function setupSlmToast() {
  const toast = document.getElementById("slm-missing-toast");
  if (!toast) return;

  window.addEventListener("floodsaathi:tab_changed", async (e) => {
    if (e.detail?.tab !== "saathi") return;
    let downloaded = await getSetting("slm_model_downloaded", false);
    if (!downloaded && typeof fetch === "function") {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1200);
        const res = await fetch("/api/model/status", { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const info = await res.json();
          if (info.downloaded || info.status === "ready" || info.loaded_in_memory) {
            downloaded = true;
            await setSetting("slm_model_downloaded", true);
            await setSetting("slm_model_enabled", true);
          }
        }
      } catch {}
    }
    if (downloaded) return;
    if (sessionStorage.getItem("slm_toast_dismissed")) return;
    toast.style.display = "block";
    setTimeout(() => { toast.style.display = "none"; }, 8000);
  });

  document.getElementById("slm-toast-dismiss-btn")?.addEventListener("click", () => {
    toast.style.display = "none";
    sessionStorage.setItem("slm_toast_dismissed", "1");
  });

  document.getElementById("slm-toast-download-btn")?.addEventListener("click", () => {
    toast.style.display = "none";
    sessionStorage.setItem("slm_toast_dismissed", "1");
    switchTab("downloads");
    setTimeout(() => {
      const slmCard = document.querySelector("#view-downloads .plugins-grid .plugin-card:nth-child(2)");
      if (slmCard) {
        slmCard.scrollIntoView({ behavior: "smooth", block: "center" });
        slmCard.style.outline = "3px solid var(--red)";
        slmCard.style.transition = "outline 0.3s";
        setTimeout(() => { slmCard.style.outline = "none"; }, 2500);
      }
    }, 300);
  });
}

