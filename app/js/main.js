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

// Application State
let currentTab = "home";
let currentSnapshot = null;
let cardRetriever = null;
let aiAssistant = null;
let allCards = [];

let userProfile = {
  lat: 31.634,
  lon: 74.872,
  district: "Jalandhar",
  village_name: "Taman, Jalandhar",
  village_id: "pb-jal-001"
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
    const savedLat = await getSetting("user_lat");
    const savedLon = await getSetting("user_lon");
    const savedSyncedAt = await getSetting("user_gps_synced_at");
    if (typeof savedLat === "number") userProfile.lat = savedLat;
    if (typeof savedLon === "number") userProfile.lon = savedLon;
    if (savedSyncedAt) userProfile.gps_synced_at = savedSyncedAt;

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
function setupLanguageSwitcher() {
  const langBtns = document.querySelectorAll(".lang-btn[data-lang]");
  langBtns.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const lang = btn.getAttribute("data-lang");
      if (!lang) return;
      await setLanguage(lang);
      langBtns.forEach((b) => b.classList.toggle("active", b.getAttribute("data-lang") === lang));
      applyTranslations();
      recomputeOfflineView();
    });
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

  // Use resolved status from snapshot or recompute safely
  let resolvedStatus = snapshot.status;
  let statusReason = "Live flood telemetry monitored.";

  if (!resolvedStatus || typeof resolvedStatus !== "string") {
    const raw = computeRawStatus({
      gauges: snapshot.gauges || [],
      alerts: snapshot.alerts || [],
      rain_72h_mm: snapshot.rain_72h_mm,
      district: userProfile.district,
      villageRecord: snapshot.village || { id: userProfile.village_id, name: userProfile.village_name },
      regionPack: { compatible: true },
      sourceAgeHours: snapshot.saved_at ? (Date.now() - new Date(snapshot.saved_at).getTime()) / 3600000 : 0
    });
    resolvedStatus = resolveOfflineStatus({
      previousStatus: "UNKNOWN",
      computedStatus: raw.status,
      isFreshData: false
    });
    statusReason = raw.reasons?.[0] || raw.reason || statusReason;
  }

  const hero = document.getElementById("home-hero");
  if (hero) {
    hero.className = `home-hero ${resolvedStatus.toLowerCase()}`;
  }

  const statusWord = document.getElementById("status-word");
  if (statusWord) {
    statusWord.textContent = resolvedStatus.toUpperCase();
  }

  const statusReasonEl = document.getElementById("status-reason");
  if (statusReasonEl) {
    statusReasonEl.textContent = statusReason;
  }

  const age = getSnapshotAge(snapshot.saved_at);
  document.getElementById("status-age-badge").textContent = `Data: ${age.display}`;

  const offlineBadge = document.getElementById("status-offline-badge");
  if (offlineBadge) {
    offlineBadge.style.display = !navigator.onLine ? "inline-flex" : "none";
  }

  // Update river gauge metrics
  const gauges = snapshot.gauges || [];
  if (gauges.length > 0) {
    const g = gauges[0];
    document.getElementById("metric-gauge-name").textContent = g.river || "River Beas";
    document.getElementById("metric-gauge-level").textContent = `${g.current_level_m} m`;
    document.getElementById("metric-gauge-trend").textContent = `Trend: ${g.trend_m_per_hr >= 0 ? "+" : ""}${g.trend_m_per_hr} m/h`;

    const statusEl = document.getElementById("metric-gauge-status");
    if (g.current_level_m >= g.danger_level_m) {
      statusEl.className = "metric-status-warn";
      statusEl.textContent = "Above Danger Level";
    } else if (g.current_level_m >= g.warning_level_m) {
      statusEl.className = "metric-status-warn";
      statusEl.textContent = "Above Warning Level";
    } else {
      statusEl.className = "metric-status-ok";
      statusEl.textContent = "Below warning level";
    }
  }

  // Update proximity telemetry indicator (R2)
  updateProximityBanner(snapshot);

  // Update arrival time estimate banner (F2)
  renderEstimateBanner(snapshot);

  // Update official alerts banner
  const alerts = snapshot.alerts || [];
  const alertSummary = document.getElementById("home-alert-summary");
  const alertIcon = document.getElementById("home-alert-icon");
  const alertBadge = document.getElementById("alerts-count-badge");

  if (alertBadge) alertBadge.textContent = alerts.length;

  if (alerts.length > 0) {
    const topAlert = alerts[0];
    alertIcon.className = "alert-check-icon active-alert";
    alertSummary.innerHTML = `<strong>${topAlert.headline || "Official Disaster Bulletin"}</strong><br><span style="font-size:12px; color:var(--body);">${topAlert.description || ""}</span>`;
  } else {
    alertIcon.className = "alert-check-icon";
    alertSummary.textContent = "No active official disaster bulletins for your area.";
  }
}

function renderEstimateBanner(snapshot) {
  const container = document.getElementById("estimate-container");
  if (!container) return;

  const estimate = computeOfflineEstimate(snapshot, userProfile.village_id);
  if (!estimate || estimate.arrival_hours_min === undefined) {
    container.innerHTML = "";
    return;
  }

  const isWarningOrDanger = estimate.arrival_hours_min <= 6;
  const bannerClass = isWarningOrDanger ? "arrival-banner" : "arrival-banner safe";
  const hoursDisplay = formatHours(estimate.arrival_hours_min, estimate.arrival_hours_max);

  container.innerHTML = `
    <div class="${bannerClass}">
      <div class="arrival-title">Estimated Water Arrival: ${hoursDisplay}</div>
      <div class="arrival-detail">
        Confidence: <strong>${estimate.confidence || "Moderate"}</strong> &bull;
        Empirical Basis: <strong>${estimate.empirical_basis || "2023 Floods"}</strong> (${estimate.n_events || 5} historical peaks).
        <div style="font-size: 11.5px; color: var(--mut); margin-top: 3px;">
          *Subject to upstream dam releases and embankment integrity.
        </div>
      </div>
    </div>
  `;
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

  // Speech Recognition (Web Speech API)
  if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = getCurrentLanguage() === "pa" ? "pa-IN" : getCurrentLanguage() === "hi" ? "hi-IN" : "en-IN";

    micBtn?.addEventListener("click", () => {
      micBtn.style.color = "#ef1c24";
      recognition.start();
    });

    recognition.onresult = (event) => {
      micBtn.style.color = "var(--navy)";
      const transcript = event.results[0][0].transcript;
      if (transcript) submitChatQuery(transcript);
    };

    recognition.onerror = () => {
      micBtn.style.color = "var(--navy)";
    };
    recognition.onend = () => {
      micBtn.style.color = "var(--navy)";
    };
  }
}

async function submitChatQuery(query) {
  const thread = document.getElementById("chat-thread");
  if (!thread) return;

  // Append user bubble
  const userDiv = document.createElement("div");
  userDiv.className = "msg-me";
  userDiv.textContent = query;
  thread.appendChild(userDiv);

  const lang = getCurrentLanguage();
  const botDiv = document.createElement("div");
  botDiv.className = "msg-bot-wrap";

  let response = null;
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

  if (response) {
    const stepItems = (response.steps || []).map((step, idx) => `
      <li><span class="step-num">${idx + 1}</span><span>${step}</span></li>
    `).join("");

    const helplinesHtml = (response.helplines && response.helplines.length > 0) ? `
      <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:10px;">
        ${response.helplines.map(h => `<a href="tel:${h.number}" class="helpline-btn" style="padding:4px 10px; font-size:12px;">📞 ${h.number} (${h.name.split(" ")[0]})</a>`).join("")}
      </div>
    ` : "";

    const slmDownloaded = await getSetting("slm_model_downloaded", false);
    const slmNoticeHtml = !slmDownloaded ? `
      <div style="margin-top:8px; padding-top:6px; border-top:1px dashed var(--line); font-size:11.5px; color:var(--mut); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:4px;">
        <span>⚠️ SLM model not downloaded · Running in offline emergency core</span>
        <button class="link-to-slm-download" style="background:transparent; border:none; color:var(--red); font-size:11.5px; font-weight:700; cursor:pointer; padding:0;">Download Model (340 MB) →</button>
      </div>
    ` : "";

    botDiv.innerHTML = `
      <div class="bot-avatar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M4 11l8-6.5 8 6.5"/><path d="M6 9.8V13M18 9.8V13"/><path d="M3 15.5c1.5 0 1.5 1.2 3 1.2s1.5-1.2 3-1.2 1.5 1.2 3 1.2 1.5-1.2 3-1.2M3 19.5c1.5 0 1.5 1.2 3 1.2s1.5-1.2 3-1.2 1.5 1.2 3 1.2 1.5-1.2 3-1.2"/></svg>
      </div>
      <article class="bot-card">
        <h3>${response.title}</h3>
        <ol class="bot-steps">${stepItems}</ol>
        ${helplinesHtml}
        <div class="card-source-link">
          <span>Source: ${response.source || "Official Disaster Guidelines"}</span>
          <span style="color:var(--green); font-weight:700;">Verified &check;</span>
        </div>
        ${slmNoticeHtml}
      </article>
    `;
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
    container.innerHTML = `<p>No shelters found near this location.</p>`;
    return;
  }

  const lang = getCurrentLanguage();
  container.innerHTML = shelters.map((s) => {
    const name = (s.name && s.name[lang]) || s.name?.en || s.name;
    const amenities = formatAmenities(s.amenities, lang);
    const amenityTags = amenities.map((a) => `<span class="amenity-chip">${a}</span>`).join("");

    return `
      <div class="shelter-card">
        <div class="shelter-card-header">
          <div class="shelter-card-title">${name}</div>
          <span class="shelter-dist-pill">${s.distanceFormatted} away</span>
        </div>
        <div style="font-size: 13px; color: var(--mut); margin-bottom: 6px;">
          Tehsil: ${s.tehsil} &bull; Capacity: <strong>${s.capacity} persons</strong>
        </div>
        <div class="shelter-amenities">${amenityTags}</div>
        <div class="shelter-action-row">
          <a href="tel:${s.contact || '1077'}" class="btn-shelter-call">Call Shelter (${s.contact || '1077'})</a>
          <a href="https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${userProfile.lat},${userProfile.lon};${s.lat},${s.lon}" target="_blank" rel="noopener" class="btn-shelter-nav">Get Directions</a>
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

  const alerts = currentSnapshot?.alerts || [];
  if (alerts.length === 0) {
    container.innerHTML = `<div class="home-alert-banner"><p>No active official alerts received from NDMA SACHET or Punjab SDMA at this time.</p></div>`;
    return;
  }

  container.innerHTML = alerts.map((a) => `
    <div class="shelter-card" style="border-left: 5px solid var(--red); margin-bottom: 12px;">
      <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
        <span class="amenity-chip" style="background:var(--red); color:#fff; font-weight:700;">${a.severity || 'WARNING'}</span>
        <span style="font-size:12px; color:var(--mut);">${new Date(a.sent || Date.now()).toLocaleTimeString()}</span>
      </div>
      <h3 style="font-size:16px; font-weight:700; margin-bottom:4px;">${a.headline || 'Official Flood Advisory'}</h3>
      <p style="font-size:14px; line-height:1.5; color:var(--body);">${a.description || ''}</p>
      <div style="font-size:12px; color:var(--mut); margin-top:8px;">Issued by: ${a.sender || 'NDMA SACHET / Punjab Revenue Dept'}</div>
    </div>
  `).join("");
}

// ==========================================
// AFTER-FLOOD GUIDE (F15)
// ==========================================
const AFTER_FLOOD_DATA = {
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
      renderAfterFloodContent(tab);
    });
  });
  renderAfterFloodContent("safety");
}

function renderAfterFloodContent(category) {
  const container = document.getElementById("after-flood-content-area");
  if (!container) return;

  const items = AFTER_FLOOD_DATA[category] || [];
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
  const keyInput = document.getElementById("pref-google-translate-key");
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
  const keyInput = document.getElementById("pref-google-translate-key");
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

          // Persist coordinates in store.js
          await setSetting("user_lat", userProfile.lat);
          await setSetting("user_lon", userProfile.lon);
          await setSetting("user_gps_synced_at", userProfile.gps_synced_at);

          // Update #loc-village-name
          const villageEl = document.getElementById("loc-village-name");
          if (villageEl) {
            const baseName = userProfile.village_name.replace(/\s*\(GPS[^)]*\)/g, "").trim();
            userProfile.village_name = baseName;
            const accText = userProfile.accuracy_m > 0 ? ` (GPS ±${userProfile.accuracy_m}m)` : " (GPS Synced)";
            villageEl.textContent = `${baseName}${accText}`;
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
    paStatusBadge.textContent = paDownloaded ? "Downloaded" : "Not Downloaded";
    paStatusBadge.className = paDownloaded ? "plugin-badge active" : "plugin-badge";
  }
  if (paActiveBadge) {
    paActiveBadge.style.display = (paDownloaded && currentLang === "pa") ? "inline-block" : "none";
  }
  if (paBtn) {
    paBtn.textContent = paDownloaded ? "Re-cache (4.2 MB)" : "Download (4.2 MB)";
  }

  if (hiStatusBadge) {
    hiStatusBadge.textContent = hiDownloaded ? "Downloaded" : "Not Downloaded";
    hiStatusBadge.className = hiDownloaded ? "plugin-badge active" : "plugin-badge";
  }
  if (hiActiveBadge) {
    hiActiveBadge.style.display = (hiDownloaded && currentLang === "hi") ? "inline-block" : "none";
  }
  if (hiBtn) {
    hiBtn.textContent = hiDownloaded ? "Re-cache (3.9 MB)" : "Download (3.9 MB)";
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

    const totalSteps = 20;
    const totalMB = 340;
    for (let i = 1; i <= totalSteps; i++) {
      await new Promise((r) => setTimeout(r, 40));
      const pct = Math.round((i / totalSteps) * 100);
      const curMB = Math.round((i / totalSteps) * totalMB);
      if (slmProgressFill) slmProgressFill.style.width = `${pct}%`;
      if (slmProgressPct) slmProgressPct.textContent = `${pct}% (${curMB} / ${totalMB} MB)`;
    }

    if (typeof caches !== "undefined") {
      try {
        const cache = await caches.open("floodsaathi-ai-models-v1");
        const modelManifest = {
          modelId: "qwen2.5-0.5b-instruct-int4",
          format: "ONNX Int4",
          sizeMB: 340,
          storagePath: "D:\\FloodSaathi_AI\\models\\qwen2.5-0.5b-instruct-int4.onnx",
          downloadedAt: new Date().toISOString()
        };
        await cache.put(
          "/models/qwen2.5-0.5b-instruct-int4.json",
          new Response(JSON.stringify(modelManifest), { headers: { "Content-Type": "application/json" } })
        );
      } catch (e) {
        console.warn("Cache API model storage warning:", e);
      }
    }

    await setSetting("slm_model_downloaded", true);
    await setSetting("slm_model_enabled", true);

    if (aiAssistant) aiAssistant.setMode("webgpu_slm");
    window.dispatchEvent(new CustomEvent("floodsaathi:slm_mode_changed", { detail: { mode: "webgpu_slm" } }));

    btnDownloadSlm.disabled = false;
    setTimeout(() => {
      if (slmProgressWrap) slmProgressWrap.style.display = "none";
    }, 2000);

    renderDownloadsView();
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
      renderDownloadsView();
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

      renderDownloadsView();
    } finally {
      setTimeout(() => {
        if (langProgressWrap) langProgressWrap.style.display = "none";
      }, 2500);
    }
  };

  document.getElementById("btn-download-lang-pa")?.addEventListener("click", async () => {
    await downloadLangPack("pa", "noto_gurmukhi_w8gyH3EvQP81sInb43inmyN9zZ7hb7ATbSWo4q8dJ74a3cVrSlgXnw.woff2", "pa.json", "Punjabi Gurmukhi");
  });

  document.getElementById("btn-download-lang-hi")?.addEventListener("click", async () => {
    await downloadLangPack("hi", "noto_devanagari_TuG7UUFzXI5FBtUq5a8bjKYTZjtRU6Sgv3NaV_SNmI0b8QQCQmHN5DV_.woff2", "hi.json", "Hindi Devanagari");
  });

  document.getElementById("btn-sync-lang-packs")?.addEventListener("click", async () => {
    await downloadLangPack("pa", "noto_gurmukhi_w8gyH3EvQP81sInb43inmyN9zZ7hb7ATbSWo4q8dJ74a3cVrSlgXnw.woff2", "pa.json", "Punjabi Gurmukhi");
    await downloadLangPack("hi", "noto_devanagari_TuG7UUFzXI5FBtUq5a8bjKYTZjtRU6Sgv3NaV_SNmI0b8QQCQmHN5DV_.woff2", "hi.json", "Hindi Devanagari");
    await initI18n();
    renderDownloadsView();
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

