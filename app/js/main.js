// FloodSaathi Main Application Entrypoint
import { CONFIG } from "../config.js";
import { initI18n, setLanguage, getCurrentLanguage, t, applyTranslations } from "./i18n.js";
import { getLatestSnapshot, getAllSnapshots, getContacts, addContact, deleteContact, addObservation, getSetting, setSetting } from "./store.js";
import { createSnapshotFromRelay, getSnapshotAge } from "./snapshot.js";
import { computeOfflineEstimate, formatHours } from "./estimator.js";
import { computeRawStatus, resolveOfflineStatus, STATUS_COLORS, STATUS_ICONS } from "./status.js";
import { buildSosSmsUri } from "./sos.js";

// App state
let currentTab = "status";
let currentSnapshot = null;
let userProfile = {
  lat: 31.634,
  lon: 74.872,
  district: "Amritsar",
  village_id: "pb-asr-001"
};

// Register Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .then((reg) => console.log("Service Worker registered:", reg.scope))
      .catch((err) => console.warn("SW registration failed:", err));
  });
}

// Initialise Application
document.addEventListener("DOMContentLoaded", async () => {
  await initI18n();
  setupLanguageSwitcher();
  setupNavigation();
  setupHelplines();
  setupUserActions();
  setupSosView();
  setupSettingsView();

  // Load saved location profile
  const savedDistrict = await getSetting("user_district");
  if (savedDistrict) userProfile.district = savedDistrict;

  // Initial load
  await loadAndRenderData();

  // Network status listeners
  window.addEventListener("online", () => {
    updateOnlineStatus(true);
    fetchLiveRelayData();
  });
  window.addEventListener("offline", () => {
    updateOnlineStatus(false);
  });
  updateOnlineStatus(navigator.onLine);

  // Periodic active interval while open (PRD 9.2: every 5 min)
  setInterval(() => {
    if (navigator.onLine) {
      fetchLiveRelayData();
    } else {
      recomputeOfflineView();
    }
  }, CONFIG.CADENCE_MS.ACTIVE_INTERVAL);
});

function updateOnlineStatus(isOnline) {
  const banner = document.getElementById("offline-banner");
  if (!banner) return;
  if (isOnline) {
    banner.classList.add("hidden");
  } else {
    banner.classList.remove("hidden");
    const age = getSnapshotAge(currentSnapshot?.saved_at);
    banner.textContent = t("status.offline_notice", { age: age.display });
  }
}

// Navigation
function setupNavigation() {
  const tabButtons = document.querySelectorAll(".tab-btn");
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.getAttribute("data-tab");
      if (!tab) return;
      switchTab(tab);
    });
  });
}

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-tab") === tab);
  });
  document.querySelectorAll(".view-section").forEach((sec) => {
    sec.classList.toggle("active", sec.id === `view-${tab}`);
  });

  if (tab === "alerts") renderAlertsView();
  if (tab === "sos") renderSosContacts();
  if (tab === "settings") updateStorageUsage();
}

// Language Switcher
function setupLanguageSwitcher() {
  const buttons = document.querySelectorAll(".lang-btn");
  const current = getCurrentLanguage();
  buttons.forEach((btn) => {
    const lang = btn.getAttribute("data-lang");
    btn.classList.toggle("active", lang === current);
    btn.addEventListener("click", async () => {
      await setLanguage(lang);
      buttons.forEach(b => b.classList.toggle("active", b.getAttribute("data-lang") === lang));
      recomputeOfflineView();
      renderAlertsView();
      renderSosContacts();
    });
  });
}

// Helplines Bar setup
function setupHelplines() {
  const container = document.getElementById("helpline-bar");
  if (!container) return;
  container.innerHTML = `
    <a href="tel:112" class="helpline-link" aria-label="Call 112">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
      <span>112</span>
    </a>
    <a href="tel:1078" class="helpline-link secondary" aria-label="Call 1078 NDMA">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      <span>1078 (NDMA)</span>
    </a>
  `;
}

// Setup User Actions: "Water reached my street" / "Water is receding"
function setupUserActions() {
  const btnReached = document.getElementById("btn-water-reached");
  const btnReceding = document.getElementById("btn-water-receding");
  const btnRefresh = document.getElementById("btn-refresh-data");

  btnReached?.addEventListener("click", async () => {
    if (confirm(t("actions.water_reached") + "?")) {
      await addObservation("reached");
      await recomputeOfflineView();
    }
  });

  btnReceding?.addEventListener("click", async () => {
    if (confirm(t("actions.water_receding") + "?")) {
      await addObservation("receding");
      await recomputeOfflineView(true); // allow lower
    }
  });

  btnRefresh?.addEventListener("click", () => {
    fetchLiveRelayData();
  });
}

// Fetch live data or fallback to offline snapshot
async function loadAndRenderData() {
  const snapshot = await getLatestSnapshot();
  if (snapshot) {
    currentSnapshot = snapshot;
    renderStatusView(snapshot);
  }

  if (navigator.onLine) {
    await fetchLiveRelayData();
  } else if (!snapshot) {
    renderEmptyOfflineState();
  }
}

async function fetchLiveRelayData() {
  const refreshBtn = document.getElementById("btn-refresh-data");
  if (refreshBtn) refreshBtn.textContent = t("actions.refreshing");

  try {
    const res = await fetch(`${CONFIG.DATA_BASE_URL}/latest/punjab.json`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const relayData = await res.json();
    const newSnapshot = await createSnapshotFromRelay(relayData, userProfile);
    currentSnapshot = newSnapshot;
    renderStatusView(newSnapshot);
    updateOnlineStatus(true);
  } catch (err) {
    console.warn("Live fetch unavailable; using saved offline snapshot:", err);
    updateOnlineStatus(false);
    recomputeOfflineView();
  } finally {
    if (refreshBtn) refreshBtn.textContent = t("actions.refresh");
  }
}

// Recompute offline view using estimator & status rules
async function recomputeOfflineView(allowLower = false) {
  if (!currentSnapshot) {
    currentSnapshot = await getLatestSnapshot();
    if (!currentSnapshot) {
      renderEmptyOfflineState();
      return;
    }
  }

  const age = getSnapshotAge(currentSnapshot.saved_at);
  const estimate = computeOfflineEstimate({
    front: currentSnapshot.front,
    reach_speed_km_h: currentSnapshot.reach_speed_km_h,
    now: new Date(),
    observed_at: currentSnapshot.gauges?.[0]?.observed_at,
    level_m: currentSnapshot.gauges?.[0]?.level_m,
    warning_m: currentSnapshot.gauges?.[0]?.warning_m,
    danger_m: currentSnapshot.gauges?.[0]?.danger_m,
    trend_m_per_h: currentSnapshot.gauges?.[0]?.trend_m_per_h,
    bank_m: currentSnapshot.gauges?.[0]?.bank_m,
    village: currentSnapshot.village,
    observations: currentSnapshot.observations,
    source_age_hours: age.hours
  });

  const raw = computeRawStatus({
    gauges: currentSnapshot.gauges,
    alerts: currentSnapshot.alerts,
    rain_72h_mm: currentSnapshot.rain_72h_mm,
    estimate,
    district: userProfile.district,
    villageRecord: currentSnapshot.village || { id: currentSnapshot.user?.village_id || "default", name: "Punjab" },
    regionPack: { compatible: true },
    sourceAgeHours: age.hours
  });

  const finalStatus = resolveOfflineStatus({
    previousStatus: currentSnapshot.status,
    computedStatus: raw.status,
    isFreshData: false,
    userReportedReceding: allowLower
  });

  currentSnapshot.status = finalStatus;
  renderStatusView(currentSnapshot, estimate);
  updateOnlineStatus(navigator.onLine);
}

// Render My Status Screen
function renderStatusView(snapshot, precomputedEstimate = null) {
  if (!snapshot) return;

  const age = getSnapshotAge(snapshot.saved_at);
  const status = snapshot.status || "UNKNOWN";
  const statusCard = document.getElementById("status-card");
  const statusWord = document.getElementById("status-word");
  const statusReason = document.getElementById("status-reason");
  const statusAgeBadge = document.getElementById("status-age-badge");
  const statusOfflineBadge = document.getElementById("status-offline-badge");

  // Status Styling
  statusCard.className = `status-card ${status.toLowerCase()}`;
  statusWord.textContent = t(`status.${status.toLowerCase()}`) || status;

  // Badges
  statusAgeBadge.textContent = t("status.data_age", { age: age.display });
  if (statusOfflineBadge) {
    statusOfflineBadge.style.display = (!navigator.onLine || age.hours >= 1) ? "inline-flex" : "none";
  }

  // Estimator computation
  const estimate = precomputedEstimate || computeOfflineEstimate({
    front: snapshot.front,
    reach_speed_km_h: snapshot.reach_speed_km_h,
    now: new Date(),
    observed_at: snapshot.gauges?.[0]?.observed_at,
    level_m: snapshot.gauges?.[0]?.level_m,
    warning_m: snapshot.gauges?.[0]?.warning_m,
    danger_m: snapshot.gauges?.[0]?.danger_m,
    trend_m_per_h: snapshot.gauges?.[0]?.trend_m_per_h,
    bank_m: snapshot.gauges?.[0]?.bank_m,
    village: snapshot.village,
    observations: snapshot.observations,
    source_age_hours: age.hours
  });

  const estimateBox = document.getElementById("estimate-container");

  // If status is DATA_UNAVAILABLE or UNKNOWN
  if (status === "DATA_UNAVAILABLE") {
    statusReason.textContent = t("status.numbers_hidden");
    estimateBox.innerHTML = `
      <div class="estimate-box" style="border-left-color: #64748b;">
        <div class="estimate-headline">${t("status.data_unavailable")}</div>
        <div class="estimate-sub">${t("helplines.always_available")}</div>
      </div>
    `;
    return;
  }

  if (status === "UNKNOWN") {
    statusReason.textContent = "Location or hydrological data incomplete. Confirm with local authorities.";
    estimateBox.innerHTML = `
      <div class="estimate-box" style="border-left-color: #94a3b8;">
        <div class="estimate-headline">${t("status.unknown")}</div>
        <div class="estimate-sub">${t("helplines.always_available")}</div>
      </div>
    `;
    return;
  }

  // Age > 24 hours: numbers hidden
  if (estimate.numbers_hidden) {
    statusReason.textContent = t("status.numbers_hidden");
    estimateBox.innerHTML = `
      <div class="estimate-box" style="border-left-color: #ef4444;">
        <div class="estimate-headline">${t("status.numbers_hidden")}</div>
        <div class="estimate-sub">${t("helplines.always_available")}</div>
      </div>
    `;
    return;
  }

  // Plain-language reason
  if (estimate.reached_reported) {
    statusReason.textContent = t("status.reached_reported");
  } else if (estimate.projection?.ground_check === "likely_below_ground") {
    statusReason.textContent = t("status.ground_safe");
  } else if (status === "Danger") {
    statusReason.textContent = "Urgent: river levels or flood front indicate imminent danger.";
  } else if (status === "Warning") {
    statusReason.textContent = "Warning: flood levels elevated. Prepare for evacuation.";
  } else if (status === "Watch") {
    statusReason.textContent = "River levels rising or heavy rainfall detected. Stay alert.";
  } else {
    statusReason.textContent = t("status.ground_safe");
  }

  // Render Time-to-Water box
  if (estimate.arrival) {
    let headline = estimate.arrival.summary_text;
    if (estimate.arrival.status_tag === "likely_reached") {
      headline = t("estimator.likely_already_reach");
    } else if (estimate.arrival.status_tag === "may_reach_now") {
      headline = t("estimator.may_already_reach");
    } else {
      headline = t("estimator.arrival_range", {
        low: formatHours(estimate.arrival.low_hours),
        high: formatHours(estimate.arrival.high_hours),
        likely: formatHours(estimate.arrival.likely_hours)
      });
    }

    let depthText = "";
    if (estimate.projection?.depth_band) {
      depthText = `<div class="estimate-sub">${t("estimator.depth_band", { band: estimate.projection.depth_band })}</div>`;
    }

    estimateBox.innerHTML = `
      <div class="estimate-box">
        <div class="estimate-headline">${headline}</div>
        ${depthText}
        <div class="estimate-sub" style="margin-top: 4px;">
          ${t("estimator.nearest_gauge", { 
            name: snapshot.gauges?.[0]?.name || "Harike", 
            river: snapshot.gauges?.[0]?.river || "Sutlej" 
          })}
        </div>
      </div>
    `;
  } else {
    estimateBox.innerHTML = "";
  }

  // Render River Gauge Grid
  const gaugeGrid = document.getElementById("gauge-grid");
  if (gaugeGrid && snapshot.gauges && snapshot.gauges.length > 0) {
    const g = snapshot.gauges[0];
    gaugeGrid.innerHTML = `
      <div class="gauge-stat">
        <div class="gauge-stat-label">${t("estimator.current_level", { level: "" })}</div>
        <div class="gauge-stat-value">${g.level_m !== null ? g.level_m + " m" : t("common.unknown")}</div>
      </div>
      <div class="gauge-stat">
        <div class="gauge-stat-label">${t("estimator.warning_mark", { level: "" })}</div>
        <div class="gauge-stat-value">${g.warning_m !== null ? g.warning_m + " m" : t("common.unknown")}</div>
      </div>
      <div class="gauge-stat">
        <div class="gauge-stat-label">${t("estimator.danger_mark", { level: "" })}</div>
        <div class="gauge-stat-value">${g.danger_m !== null ? g.danger_m + " m" : t("common.unknown")}</div>
      </div>
      <div class="gauge-stat">
        <div class="gauge-stat-label">${t("estimator.trend", { trend: "" })}</div>
        <div class="gauge-stat-value">${g.trend_m_per_h !== null ? (g.trend_m_per_h > 0 ? "+" : "") + g.trend_m_per_h + " m/h" : "0 m/h"}</div>
      </div>
    `;
  }
}

function renderEmptyOfflineState() {
  const statusCard = document.getElementById("status-card");
  const statusWord = document.getElementById("status-word");
  const statusReason = document.getElementById("status-reason");
  if (statusCard) statusCard.className = "status-card data_unavailable";
  if (statusWord) statusWord.textContent = t("status.data_unavailable");
  if (statusReason) {
    statusReason.textContent = "No offline snapshot found. Connect to internet to fetch live data.";
  }
}

// Render Official Alerts View (NDMA SACHET verbatim)
function renderAlertsView() {
  const container = document.getElementById("alerts-container");
  if (!container) return;

  const alerts = currentSnapshot?.alerts || [];
  if (alerts.length === 0) {
    container.innerHTML = `<div class="card"><p>${t("alerts.no_alerts")}</p></div>`;
    return;
  }

  let html = `<p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 12px;">${t("alerts.verbatim_note")}</p>`;
  for (const a of alerts) {
    const sevClass = (a.severity || "").toLowerCase();
    html += `
      <div class="alert-item ${sevClass}">
        <div class="alert-header">
          <div class="alert-headline">${a.headline || a.event || "Flood Alert"}</div>
          <span class="badge badge-official">${a.source || "NDMA SACHET"}</span>
        </div>
        <div class="alert-body">${a.description || a.headline}</div>
        <div class="alert-meta">
          <div>${t("alerts.severity", { sev: a.severity || "Standard" })}</div>
          <div>${t("alerts.area", { area: a.area || "Punjab" })}</div>
          <div>${t("alerts.effective", { time: a.issued_at || a.effective || "" })}</div>
        </div>
      </div>
    `;
  }
  container.innerHTML = html;
}

// Render SOS View
async function setupSosView() {
  const btnSms = document.getElementById("sos-btn-sms");
  const formAdd = document.getElementById("sos-add-contact-form");

  btnSms?.addEventListener("click", async () => {
    const contacts = await getContacts();
    const age = getSnapshotAge(currentSnapshot?.saved_at);
    const uri = await buildSosSmsUri({
      contacts,
      lat: userProfile.lat,
      lon: userProfile.lon,
      status: currentSnapshot?.status || "Unknown",
      statusAge: age.display
    });
    window.location.href = uri;
  });

  formAdd?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nameInput = document.getElementById("contact-name");
    const phoneInput = document.getElementById("contact-phone");
    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    if (name && phone) {
      try {
        await addContact({ name, phone });
        nameInput.value = "";
        phoneInput.value = "";
        renderSosContacts();
      } catch (err) {
        alert(err.message);
      }
    }
  });

  renderSosContacts();
}

async function renderSosContacts() {
  const container = document.getElementById("sos-contacts-list");
  if (!container) return;

  const contacts = await getContacts();
  if (contacts.length === 0) {
    container.innerHTML = `<p style="font-size: 0.9rem; color: var(--text-secondary);">${t("sos.no_contacts")}</p>`;
    return;
  }

  let html = `<ul style="list-style: none; margin-top: 8px;">`;
  for (const c of contacts) {
    html += `
      <li style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border-subtle);">
        <div>
          <div style="font-weight: 700;">${c.name}</div>
          <div style="font-size: 0.85rem; color: var(--text-secondary);">${c.phone}</div>
        </div>
        <button class="btn-outline" style="min-height: 36px; padding: 4px 10px; border-radius: 4px; cursor: pointer;" data-delete-id="${c.id}">Remove</button>
      </li>
    `;
  }
  html += `</ul>`;
  container.innerHTML = html;

  container.querySelectorAll("[data-delete-id]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = Number(btn.getAttribute("data-delete-id"));
      await deleteContact(id);
      renderSosContacts();
    });
  });
}

// Render Settings View
function setupSettingsView() {
  const exportBtn = document.getElementById("btn-export-json");
  exportBtn?.addEventListener("click", async () => {
    const all = await getAllSnapshots();
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `floodsaathi_debug_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

async function updateStorageUsage() {
  const el = document.getElementById("storage-used-display");
  if (!el) return;
  if (navigator.storage && navigator.storage.estimate) {
    const est = await navigator.storage.estimate();
    const usedMb = ((est.usage || 0) / (1024 * 1024)).toFixed(2);
    el.textContent = `${usedMb} MB`;
  } else {
    el.textContent = "Supported";
  }
}
