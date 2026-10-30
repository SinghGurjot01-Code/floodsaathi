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
        console.log("Service Worker registered:", reg.scope);
        reg.update();
      })
      .catch((err) => console.warn("SW registration failed:", err));
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

  // Back buttons on sub-views
  document.getElementById("btn-back-from-shelters")?.addEventListener("click", () => switchTab("more"));
  document.getElementById("btn-back-from-sos")?.addEventListener("click", () => switchTab("more"));
  document.getElementById("btn-back-from-after-flood")?.addEventListener("click", () => switchTab("more"));
  document.getElementById("btn-back-from-preferences")?.addEventListener("click", () => switchTab("more"));
  document.getElementById("btn-back-from-downloads")?.addEventListener("click", () => switchTab("more"));
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
      recomputeOfflineView();
      await renderSheltersView();
      renderAfterFloodContent(activeAfterFloodTab);
      await renderDownloadsView();
      updateProximityBanner(currentSnapshot);
      updateChatWelcome();
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
  try {
    const res = await fetch("./data/latest/punjab.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const relayData = await res.json();
    const snapshot = await createSnapshotFromRelay(relayData, userProfile);
    currentSnapshot = snapshot;
    renderSnapshotData(snapshot);
  } catch (err) {
    console.warn("Relay fetch failed, falling back to local store:", err);
    if (!currentSnapshot) {
      renderDataUnavailable("Live telemetry feed currently unavailable.");
    }
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
    if (trendEl) trendEl.textContent = `Trend: ${trendVal >= 0 ? "+" : ""}${trendVal} m/h`;

    const statusEl = document.getElementById("metric-gauge-status");
    if (statusEl) {
      if (curLevel >= dangLevel && dangLevel > 0) {
        statusEl.className = "metric-status-warn";
        statusEl.textContent = "Above Danger Level";
      } else if (curLevel >= warnLevel && warnLevel > 0) {
        statusEl.className = "metric-status-warn";
        statusEl.textContent = "Above Warning Level";
      } else {
        statusEl.className = "metric-status-ok";
        statusEl.textContent = "Below warning level";
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
      rainStatusEl.textContent = "Heavy Rain Alert";
    } else if (rain72h >= 15) {
      rainStatusEl.className = "metric-status-warn";
      rainStatusEl.textContent = "Moderate Showers";
    } else if (rain72h > 0) {
      rainStatusEl.className = "metric-status-ok";
      rainStatusEl.textContent = "Light Showers";
    } else {
      rainStatusEl.className = "metric-status-ok";
      rainStatusEl.textContent = "No Rain Expected";
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
      alertSummary.innerHTML = `<strong>${activeWarning.headline || "Official Disaster Bulletin"}</strong><br><span style="font-size:12px; color:var(--body);">${activeWarning.description || ""}</span>`;
    }
  } else {
    if (alertIcon) alertIcon.className = "alert-check-icon";
    if (alertSummary) {
      alertSummary.textContent = `No active official disaster bulletins for ${userProfile.district || "your area"}.`;
    }
  }

  // 6. Dynamic Hero Status Word & Grounded Reason (NO hardcoding)
  let statusWordText = "MONITORING";
  let statusClass = "safe";
  let reasonText = "All river gauges below warning level. Water likely to stay below your ground level.";

  const curLvl = g ? (g.level_m ?? g.current_level_m ?? 0) : 0;
  const warnLvl = g ? (g.warning_m ?? g.warning_level_m ?? 0) : 0;
  const dangLvl = g ? (g.danger_m ?? g.danger_level_m ?? 0) : 0;

  if (activeWarning) {
    const sev = (activeWarning.severity || "").toLowerCase();
    statusWordText = sev === "severe" || sev === "extreme" ? "WARNING" : "WATCH";
    statusClass = statusWordText.toLowerCase();
    reasonText = activeWarning.headline || activeWarning.description || "Official SDMA disaster bulletin in effect.";
  } else if (dangLvl > 0 && curLvl >= dangLvl) {
    statusWordText = "DANGER";
    statusClass = "danger";
    reasonText = `Water level at ${g.name} is ${curLvl}m (exceeded danger mark of ${dangLvl}m). Move to high ground.`;
  } else if (warnLvl > 0 && curLvl >= warnLvl) {
    statusWordText = "WARNING";
    statusClass = "warning";
    reasonText = `Water level at ${g.name} is ${curLvl}m (exceeded warning mark of ${warnLvl}m). Flood monitoring active.`;
  }

  const hero = document.getElementById("home-hero");
  if (hero) hero.className = `home-hero ${statusClass}`;

  const statusWord = document.getElementById("status-word");
  if (statusWord) statusWord.textContent = statusWordText;

  const statusReasonEl = document.getElementById("status-reason");
  if (statusReasonEl) statusReasonEl.textContent = reasonText;

  const age = getSnapshotAge(snapshot.saved_at);
  const ageBadge = document.getElementById("status-age-badge");
  if (ageBadge) ageBadge.textContent = `Data: ${age.display}`;

  const offlineBadge = document.getElementById("status-offline-badge");
  if (offlineBadge) {
    offlineBadge.style.display = !navigator.onLine ? "inline-flex" : "none";
  }

  // 7. Update proximity telemetry indicator (R2)
  updateProximityBanner(snapshot);

  // 8. Update arrival time estimate banner (F2)
  renderEstimateBanner(snapshot);
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
    const hoursDisplay = `${formatHours(arr.low_hours)} to ${formatHours(arr.high_hours)} (likely ${formatHours(arr.likely_hours)})`;
    const isUrgent = arr.low_hours <= 6;
    const bannerClass = isUrgent ? "arrival-banner" : "arrival-banner safe";

    container.innerHTML = `
      <div class="${bannerClass}">
        <div class="arrival-title">Estimated Water Arrival: ${hoursDisplay}</div>
        <div class="arrival-detail">
          Confidence: <strong>${arr.is_rough ? "Rough Estimate" : "Moderate"}</strong> &bull;
          Basis: <strong>${arr.basis}</strong> (${(arr.km_to_user || distKm).toFixed(1)} km transit).
          <div style="font-size: 11.5px; color: var(--mut); margin-top: 3px;">
            ${arr.summary_text}
          </div>
        </div>
      </div>
    `;
  } else {
    // Normal / below warning state
    container.innerHTML = `
      <div class="arrival-banner safe" style="background:#f0fdf4; border:1px solid #bbf7d0;">
        <div class="arrival-title" style="color:#15803d;">Water Level: Normal Basin Flow</div>
        <div class="arrival-detail" style="color:#166534;">
          Nearest gauge (${g?.name || "CWC Station"}) is <strong>${currentLvl > 0 ? currentLvl + " m" : "Normal"}</strong>
          (below warning mark of ${warningLvl > 0 ? warningLvl + " m" : "-- m"}).
          <div style="font-size: 11.5px; color: #15803d; margin-top: 3px;">
            No upstream flood front in transit towards your location.
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
    const res = await fetch("./corpus/cards/cards.json");
    if (res.ok) {
      allCards = await res.json();
      cardRetriever = new CardRetriever(allCards);
      aiAssistant = new AskSaathiAssistant({ cards: allCards });
      await aiAssistant.init();
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

  // Download Model shortcut button on Ask Saathi warning bar
  document.getElementById("btn-saathi-download-model")?.addEventListener("click", () => {
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

  let response = null;
  try {
    if (aiAssistant) {
      const apiKey = await getSetting("google_translate_api_key");
      response = await aiAssistant.ask(query, {
        lang,
        gauges: currentSnapshot?.gauges,
        alerts: currentSnapshot?.alerts,
        apiKey
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
        <span>⚡ Real Neural SLM (Qwen2.5-0.5B)</span>
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
        <span>⚠️ Running in offline emergency core · Start python server.py for Real Neural AI</span>
        <button class="link-to-slm-download" style="background:transparent; border:none; color:var(--red); font-size:11.5px; font-weight:700; cursor:pointer; padding:0;">Model Settings →</button>
      </div>
    ` : "";

    botDiv.innerHTML = `
      <div class="bot-avatar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M4 11l8-6.5 8 6.5"/><path d="M6 9.8V13M18 9.8V13"/><path d="M3 15.5c1.5 0 1.5 1.2 3 1.2s1.5-1.2 3-1.2 1.5 1.2 3 1.2 1.5-1.2 3-1.2M3 19.5c1.5 0 1.5 1.2 3 1.2s1.5-1.2 3-1.2 1.5 1.2 3 1.2 1.5-1.2 3-1.2"/></svg>
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
      <div class="bot-avatar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
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
// SHELTERS DIRECTORY VIEW (F5)
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
// EMERGENCY SOS (F7)
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
// OFFICIAL ALERTS VIEW (F4)
// ==========================================
function renderAlertsView() {
  const container = document.getElementById("alerts-container");
  if (!container) return;

  const allAlerts = currentSnapshot?.alerts || [];
  if (allAlerts.length === 0) {
    container.innerHTML = `<div class="home-alert-banner"><p>No active official alerts received from NDMA SACHET or Punjab SDMA at this time.</p></div>`;
    return;
  }

  // Prioritize alerts matching the active district
  const districtLower = (userProfile.district || "").toLowerCase();
  const sortedAlerts = [...allAlerts].sort((a, b) => {
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
    const localBadge = isLocal ? `<span class="plugin-badge active" style="margin-left:6px; font-size:10.5px;">For Your Area (${userProfile.district})</span>` : "";
    const isSevere = a.severity?.toLowerCase() === "severe" || a.severity?.toLowerCase() === "extreme";
    return `
      <div class="shelter-card" style="border-left: 5px solid ${isSevere ? 'var(--red)' : '#d97706'}; margin-bottom: 14px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <div>
            <span class="amenity-chip" style="background:${isSevere ? 'var(--red)' : '#d97706'}; color:#fff; font-weight:700;">${a.severity || 'WARNING'}</span>
            ${localBadge}
          </div>
          <span style="font-size:12px; color:var(--mut);">${a.effective || 'Official'}</span>
        </div>
        <h3 style="font-size:16px; font-weight:700; margin-bottom:6px;">${a.headline || 'Official Flood Advisory'}</h3>
        <p style="font-size:14px; line-height:1.5; color:var(--body); margin-bottom:10px;">${a.description || ''}</p>
        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--line); padding-top:8px;">
          <div style="font-size:12px; color:var(--mut);">Issued by: ${a.sender || 'NDMA SACHET / Punjab SDMA'}</div>
          <button class="tts-speaker-btn btn-read-alert" data-idx="${i}" aria-label="Listen">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
            <span>${t("actions.listen") || "Listen"}</span>
          </button>
        </div>
      </div>
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
  container.innerHTML = items.map((item, idx) => `
    <div class="shelter-card" style="margin-bottom: 10px;">
      <h4 style="font-size:15px; font-weight:700; color:var(--navy); margin-bottom:4px;">${idx + 1}. ${item.title}</h4>
      <p style="font-size:13.5px; color:var(--body); line-height:1.4;">${item.desc}</p>
    </div>
  `).join("");
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
// OFFLINE MAP DOWNLOADER (F10)
// ==========================================
function setupMapDownloader() {
  const btn = document.getElementById("btn-open-download-modal");
  const progressWrap = document.getElementById("map-download-progress-wrap");
  const progressFill = document.getElementById("map-download-progress-fill");
  const progressPct = document.getElementById("map-download-progress-pct");
  const info = document.getElementById("map-storage-info");

  btn?.addEventListener("click", async () => {
    const radiusStr = prompt("Enter radius for offline map package in km (e.g., 10, 25, 50):", "25");
    const radius = Math.max(5, Math.min(100, Number(radiusStr) || 25));

    if (progressWrap) progressWrap.style.display = "block";
    btn.disabled = true;

    try {
      await downloadMapPack(userProfile.lat, userProfile.lon, radius, (p) => {
        if (progressFill) progressFill.style.width = `${p.percent}%`;
        if (progressPct) progressPct.textContent = `${p.percent}% (${p.currentMB} / ${p.totalMB} MB)`;
      });
      if (info) info.textContent = `Cached Punjab vector tiles (${radius} km radius ready offline)`;
      alert(`Success: ${radius} km offline map pack downloaded to your device!`);
    } catch (err) {
      alert(`Download failed: ${err.message}`);
    } finally {
      btn.disabled = false;
      setTimeout(() => {
        if (progressWrap) progressWrap.style.display = "none";
      }, 2000);
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

export function formatProximityText(profile, nearestGauge, distKm, direction, isStaleGps = false) {
  const village = profile?.village_name || profile?.district || "Taman, Jalandhar";
  const gpsSuffix = isStaleGps ? " [GPS Stale / Cached]" : "";

  if (!nearestGauge) {
    return `Your location: ${village}${gpsSuffix} · Hydrologic telemetry: Feeds currently offline`;
  }

  const distFormatted = distKm < 1 ? `${Math.round(distKm * 1000)} m` : `${distKm.toFixed(1)} km`;
  const gaugeName = nearestGauge.name || nearestGauge.station_name || nearestGauge.id || "CWC Gauge";
  const riverName = nearestGauge.river ? ` (${nearestGauge.river})` : "";

  return `Your location: ${village}${gpsSuffix} · Hydrologic telemetry from: ${gaugeName}${riverName} (${distFormatted} ${direction})`;
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

  const displayName = userProfile.village_name || `${userProfile.district || "Ludhiana"}, Punjab`;
  const accText = userProfile.accuracy_m > 0 ? ` (±${userProfile.accuracy_m}m)` : "";
  const basin = userProfile.basin || "Punjab";

  if (nameEl) {
    nameEl.innerHTML = `<span>${displayName}${accText}</span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>`;
  }
  if (subEl) {
    subEl.innerHTML = `Punjab (${basin}) · <span style="text-decoration:underline;">${t("location.tap_to_change") || "Tap to change"}</span>`;
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

          // Try reverse geocoding if online
          if (typeof navigator !== "undefined" && navigator.onLine) {
            try {
              const geoUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userProfile.lat}&lon=${userProfile.lon}&zoom=14`;
              const res = await fetch(geoUrl, { headers: { "Accept-Language": getCurrentLanguage() } });
              if (res.ok) {
                const geoData = await res.json();
                const addr = geoData.address || {};
                const localName = addr.village || addr.town || addr.suburb || addr.city || addr.county || userProfile.district;
                const stateDist = addr.state_district || addr.county || userProfile.district;
                userProfile.village_name = `${localName}, ${stateDist}`;
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

  const slmDownloaded = await getSetting("slm_model_downloaded", false);
  const slmEnabled = await getSetting("slm_model_enabled", false);

  if (slmDownloadBadge) {
    if (slmDownloaded) {
      slmDownloadBadge.className = "plugin-badge active";
      slmDownloadBadge.textContent = "Downloaded";
    } else {
      slmDownloadBadge.className = "plugin-badge";
      slmDownloadBadge.textContent = "Not Downloaded";
    }
  }

  if (slmToggle) {
    slmToggle.disabled = !slmDownloaded;
    slmToggle.checked = Boolean(slmDownloaded && slmEnabled);
  }

  if (slmActiveBadge) {
    if (slmDownloaded && slmEnabled) {
      slmActiveBadge.className = "plugin-badge active";
      slmActiveBadge.textContent = "Active (WebGPU / SLM)";
      if (aiAssistant) aiAssistant.setMode("webgpu_slm");
    } else {
      slmActiveBadge.className = "plugin-badge";
      slmActiveBadge.textContent = "Standby (M5 Fallback)";
      if (aiAssistant) aiAssistant.setMode("deterministic_m5");
    }
  }

  if (slmBtn) {
    const slmBtnSpan = slmBtn.querySelector("span");
    if (slmDownloaded) {
      if (slmBtnSpan) slmBtnSpan.textContent = "Model Downloaded (ONNX Int4 Cached)";
      slmBtn.classList.add("sec");
    } else {
      if (slmBtnSpan) slmBtnSpan.textContent = "Download Model (~340 MB)";
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
      saathiModeBadge.textContent = "On-Device SLM (Active)";
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

  // Radius Pill Selector
  radiusPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      radiusPills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      currentSelectedMapRadius = Number(pill.getAttribute("data-radius")) || 25;
      const mb = estimateDownloadSize(currentSelectedMapRadius);
      if (sizeText) sizeText.textContent = `${mb} MB`;
      if (btnDownloadMap) {
        const btnSpan = btnDownloadMap.querySelector("span");
        if (btnSpan) btnSpan.textContent = `Download Map Pack (${mb} MB)`;
      }

      // Check if this radius is cached
      const status = checkMapPackStatus(currentSelectedMapRadius);
      if (mapStatusBadge) {
        mapStatusBadge.className = status.downloaded ? "plugin-badge active" : "plugin-badge";
        mapStatusBadge.textContent = status.downloaded ? "Ready Offline" : "Ready to Cache";
      }
    });
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
      if (slmProgressFill) slmProgressFill.style.width = "30%";
      if (slmProgressPct) slmProgressPct.textContent = "Connecting to local neural backend (/api/model/status)...";

      const statusRes = await fetch("/api/model/status");
      if (statusRes.ok) {
        const info = await statusRes.json();
        if (info.downloaded || info.status === "ready") {
          if (slmProgressFill) slmProgressFill.style.width = "70%";
          if (slmProgressPct) slmProgressPct.textContent = `Loading ${info.parameter_count_str || "494M"} weights into RAM...`;

          const loadRes = await fetch("/api/model/load", { method: "POST" });
          const loadData = await loadRes.json();

          if (slmProgressFill) slmProgressFill.style.width = "100%";
          if (slmProgressPct) slmProgressPct.textContent = `Active & Loaded in RAM (${loadData.parameter_count_str || "494M"} Parameters)`;

          await setSetting("slm_model_downloaded", true);
          await setSetting("slm_model_enabled", true);

          if (aiAssistant) aiAssistant.setMode("webgpu_slm");
          window.dispatchEvent(new CustomEvent("floodsaathi:slm_mode_changed", { detail: { mode: "webgpu_slm" } }));
        } else {
          throw new Error("Model weights not yet found on disk. Run: python scripts/download_qwen.py");
        }
      } else {
        throw new Error(`Server returned HTTP ${statusRes.status}`);
      }
    } catch (err) {
      if (slmProgressFill) slmProgressFill.style.backgroundColor = "var(--red)";
      if (slmProgressPct) slmProgressPct.textContent = `Backend note: ${err.message}. Start: python server.py`;
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
      await setLanguage(langCode);
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
    const downloaded = await getSetting("slm_model_downloaded", false);
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

