/* FloodSaathi Internationalization (i18n) Engine */
window.FS = window.FS || {};

(function() {
  const DEFAULT_LANG = 'en';
  const SUPPORTED_LANGS = ['en', 'pa', 'hi'];

  function getLang() {
    try {
      if (window.FS.store && typeof window.FS.store.get === 'function') {
        const stored = window.FS.store.get('lang');
        if (SUPPORTED_LANGS.includes(stored)) return stored;
      }
    } catch (_) {}
    return DEFAULT_LANG;
  }

  function t(key, fallback) {
    const lang = getLang();
    const dict = window.FS.DATA?.translations?.[lang] || window.FS.DATA?.translations?.['en'];
    if (dict && dict[key] !== undefined) {
      return dict[key];
    }
    // Fallback to English dictionary
    const enDict = window.FS.DATA?.translations?.['en'];
    if (enDict && enDict[key] !== undefined) {
      return enDict[key];
    }
    return fallback !== undefined ? fallback : key;
  }

  function setLang(lang) {
    if (!SUPPORTED_LANGS.includes(lang)) return;
    try {
      if (window.FS.store && typeof window.FS.store.set === 'function') {
        window.FS.store.set('lang', lang);
      }
    } catch (_) {}

    if (document.documentElement) {
      document.documentElement.lang = lang;
    }

    // Apply i18n font stack class defensively if body is present
    if (document.body) {
      document.body.classList.remove('font-pa', 'font-hi');
      if (lang === 'pa') document.body.classList.add('font-pa');
      else if (lang === 'hi') document.body.classList.add('font-hi');
    }

    // Re-render current screen
    if (window.FS.router && typeof window.FS.router.renderCurrent === 'function') {
      window.FS.router.renderCurrent();
    }

    // Update static shell elements (bottom nav labels)
    updateStaticStrings();
  }

  function updateStaticStrings() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key) el.textContent = t(key);
    });
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      const key = el.getAttribute('data-i18n-aria');
      if (key) el.setAttribute('aria-label', t(key));
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) el.setAttribute('placeholder', t(key));
    });
  }

  window.FS.i18n = {
    t: t,
    getLang: getLang,
    setLang: setLang,
    updateStaticStrings: updateStaticStrings,
    SUPPORTED_LANGS: SUPPORTED_LANGS
  };
})();
