/* FloodSaathi Safe LocalStorage & Pub/Sub State Management (Versioned Schema v1) */
window.FS = window.FS || {};

(function() {
  const STORAGE_KEY = 'floodsaathi_state_v1';
  const CURRENT_VERSION = 1;

  function getDefaultState() {
    const defaultPlace = (window.FS.DATA && window.FS.DATA.places && window.FS.DATA.places[0])
      ? window.FS.DATA.places[0]
      : {
          id: "taman",
          name: "Taman, Jalandhar",
          region: "Punjab",
          lat: 31.3260,
          lng: 75.5762,
          river: "River Beas",
          riverLevel: 3.2,
          warningLevel: 3.8,
          delta: -0.4,
          rainForecast: 12,
          elevation: 246,
          riverDistance: 3.8,
          risk: "Moderate"
        };

    return {
      version: CURRENT_VERSION,
      lang: 'en',
      place: defaultPlace,
      alertsRead: [],
      prefs: {
        flood: true,
        dam: true,
        rain: true,
        weather: true,
        radius: 10,
        quietHours: false,
        quietStart: '22:00',
        quietEnd: '06:00'
      },
      contacts: [],
      lastSafeAt: null,
      chat: [],
      onboarded: false,
      checklistTicks: {}
    };
  }

  // Memory fallback in case localStorage is disabled or corrupted
  let memoryState = getDefaultState();
  let subscribers = [];

  function loadState() {
    try {
      if (typeof window.localStorage === 'undefined') {
        return getDefaultState();
      }
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return getDefaultState();
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || parsed.version !== CURRENT_VERSION) {
        // Schema mismatch or corrupt: initialize clean state
        return getDefaultState();
      }
      // Ensure all required fields exist
      const defaults = getDefaultState();
      return Object.assign({}, defaults, parsed, {
        prefs: Object.assign({}, defaults.prefs, parsed.prefs || {}),
        checklistTicks: Object.assign({}, defaults.checklistTicks, parsed.checklistTicks || {})
      });
    } catch (e) {
      console.warn('FloodSaathi Store load error (recovering with defaults):', e);
      return getDefaultState();
    }
  }

  function saveState() {
    try {
      if (typeof window.localStorage !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryState));
      }
    } catch (e) {
      console.warn('FloodSaathi Store save error:', e);
    }
  }

  // Initialize
  memoryState = loadState();

  function get(key) {
    if (!key) return Object.assign({}, memoryState);
    return memoryState[key];
  }

  function set(key, value) {
    if (!key) return;
    const prev = memoryState[key];
    memoryState[key] = value;
    saveState();
    notifySubscribers(key, value, prev);
  }

  function update(key, updaterFn) {
    if (typeof updaterFn !== 'function') return;
    const current = get(key);
    const updated = updaterFn(current);
    set(key, updated);
  }

  function subscribe(listener) {
    if (typeof listener === 'function') {
      subscribers.push(listener);
      return function unsubscribe() {
        subscribers = subscribers.filter(s => s !== listener);
      };
    }
    return () => {};
  }

  function notifySubscribers(key, newVal, oldVal) {
    subscribers.forEach(fn => {
      try {
        fn(key, newVal, oldVal);
      } catch (err) {
        console.error('Store subscriber error:', err);
      }
    });
  }

  function reset() {
    memoryState = getDefaultState();
    try {
      if (typeof window.localStorage !== 'undefined') {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch (_) {}
    saveState();
    notifySubscribers('*', memoryState, null);
  }

  window.FS.store = {
    get: get,
    set: set,
    update: update,
    subscribe: subscribe,
    reset: reset,
    getDefaultState: getDefaultState
  };
})();
