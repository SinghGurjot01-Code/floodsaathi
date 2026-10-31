/**
 * FloodSaathi - Application Bootstrapper & Shell Manager
 * Zero-framework, fully self-contained offline architecture.
 *
 * Responsibilities:
 * 1. Global Error Boundary & Promise Rejection Handlers
 * 2. Network connectivity detection (Online/Offline events & banner)
 * 3. Bottom navigation event delegation and dynamic i18n label synchronization
 * 4. Floating SOS button binding
 * 5. PWA Service Worker safe registration (bypasses file:// silently)
 * 6. App initialization sequence with saved state hydration
 */
(function() {
  'use strict';

  window.FS = window.FS || {};

  // 1. Global Error Boundary
  function setupErrorBoundary() {
    window.addEventListener('error', function(event) {
      console.error('[FloodSaathi Global Error]:', event.error || event.message);
      if (window.FS.ui && typeof window.FS.ui.toast === 'function') {
        const errorMsg = event.message ? `Notice: ${event.message.slice(0, 80)}` : 'A temporary issue occurred.';
        // Non-blocking toast with 4s timeout
        window.FS.ui.toast(errorMsg, { duration: 4000 });
      }
    });

    window.addEventListener('unhandledrejection', function(event) {
      console.warn('[FloodSaathi Unhandled Rejection]:', event.reason);
      // Suppress noisy network or permission rejections gracefully
      event.preventDefault();
    });
  }

  // 2. Network Connectivity Monitor & Offline Banner
  function setupNetworkMonitor() {
    const banner = document.getElementById('offline-banner');
    const bannerText = document.getElementById('offline-banner-text');

    function updateStatus(isOnline) {
      if (!banner) return;
      if (isOnline) {
        banner.classList.remove('visible');
        if (window.FS.ui && typeof window.FS.ui.toast === 'function') {
          window.FS.ui.toast('Back online. Synchronizing data...', { duration: 2500 });
        }
      } else {
        banner.classList.add('visible');
        if (bannerText) {
          bannerText.textContent = 'Working Offline — Cached Punjab Flood Safety Data Active';
        }
        if (window.FS.ui && typeof window.FS.ui.toast === 'function') {
          window.FS.ui.toast('No internet connection. FloodSaathi is running offline.', { duration: 3500 });
        }
      }
    }

    window.addEventListener('online', function() { updateStatus(true); });
    window.addEventListener('offline', function() { updateStatus(false); });

    // Initial check
    if (!navigator.onLine && banner) {
      banner.classList.add('visible');
    }
  }

  // 3. Bottom Navigation & Floating SOS FAB
  function setupShellControls() {
    const nav = document.getElementById('bottom-nav');
    const fab = document.getElementById('sos-fab');

    if (nav) {
      nav.addEventListener('click', function(e) {
        const link = e.target.closest('.nav-tab');
        if (!link) return;

        e.preventDefault();
        const href = link.getAttribute('href');
        if (href && window.FS.router) {
          window.FS.router.navigate(href);
        }
      });
    }

    if (fab) {
      fab.addEventListener('click', function(e) {
        e.preventDefault();
        if (window.FS.router) {
          window.FS.router.navigate('/emergency');
        }
      });
    }

    // Dynamic i18n label synchronization for the bottom nav
    function updateNavLabels() {
      if (!nav || !window.FS.i18n || !window.FS.i18n.t) return;
      const { t } = window.FS.i18n;

      const tabMap = {
        home: t('home') || 'Home',
        map: t('map') || 'Map',
        saathi: t('saathi') || 'Saathi',
        alerts: t('alerts') || 'Alerts',
        more: t('more') || 'More'
      };

      nav.querySelectorAll('.nav-tab').forEach(function(tab) {
        const tabKey = tab.getAttribute('data-tab');
        const labelEl = tab.querySelector('.nav-label');
        if (labelEl && tabMap[tabKey]) {
          labelEl.textContent = tabMap[tabKey];
        }
      });
    }

    // Subscribe to language changes in store
    if (window.FS.store && typeof window.FS.store.subscribe === 'function') {
      window.FS.store.subscribe('lang', function() {
        updateNavLabels();
      });
    }

    // Initial label sync
    updateNavLabels();
  }

  // 4. PWA Service Worker Safe Registration
  function registerServiceWorker() {
    // Only register service worker on HTTPS or localhost/127.0.0.1
    // Silently skip on file:// protocol to avoid browser security rejections
    const isLocalOrHttps = window.location.protocol === 'https:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    if (isLocalOrHttps && 'serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('./sw.js')
          .then(function(registration) {
            console.log('[FloodSaathi SW] Registered with scope:', registration.scope);
          })
          .catch(function(err) {
            console.warn('[FloodSaathi SW] Registration skipped or failed:', err);
          });
      });
    }
  }

  // 5. App Bootstrap Sequence
  function boot() {
    setupErrorBoundary();
    setupNetworkMonitor();

    // Hydrate saved language
    const savedLang = (window.FS.store && window.FS.store.get('lang')) || 'en';
    if (window.FS.i18n && typeof window.FS.i18n.setLang === 'function') {
      window.FS.i18n.setLang(savedLang);
    }

    // Setup persistent shell UI
    setupShellControls();

    // Safe PWA registration
    registerServiceWorker();

    // Start router
    if (window.FS.router && typeof window.FS.router.init === 'function') {
      window.FS.router.init();
    }
  }

  // Execute boot when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
