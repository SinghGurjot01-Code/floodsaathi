/* FloodSaathi Browser Services & Fallbacks (Safe Geolocation, Weather, Battery, Speech, Share) */
window.FS = window.FS || {};

(function() {
  /**
   * Geolocation with timeout & fallback handling
   * @param {number} [timeoutMs=8000]
   * @returns {Promise<{lat: number, lng: number}>}
   */
  function getLocation(timeoutMs) {
    timeoutMs = timeoutMs || 8000;
    return new Promise((resolve, reject) => {
      try {
        if (!navigator || !navigator.geolocation) {
          reject(new Error('GEOLOCATION_NOT_SUPPORTED'));
          return;
        }

        let finished = false;
        const timer = setTimeout(() => {
          if (!finished) {
            finished = true;
            reject(new Error('TIMEOUT'));
          }
        }, timeoutMs);

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (finished) return;
            finished = true;
            clearTimeout(timer);
            resolve({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude
            });
          },
          (err) => {
            if (finished) return;
            finished = true;
            clearTimeout(timer);
            let code = 'UNKNOWN';
            if (err.code === 1) code = 'PERMISSION_DENIED';
            else if (err.code === 2) code = 'POSITION_UNAVAILABLE';
            else if (err.code === 3) code = 'TIMEOUT';
            reject(new Error(code));
          },
          {
            enableHighAccuracy: true,
            timeout: timeoutMs,
            maximumAge: 60000
          }
        );
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Haversine formula to find closest place in Punjab
   */
  function findNearestPlace(lat, lng) {
    const places = (window.FS.DATA && window.FS.DATA.places) || [];
    if (!places.length) return null;

    function toRad(x) { return (x * Math.PI) / 180; }
    const R = 6371; // Earth radius in km

    let minDistance = Infinity;
    let closest = places[0];

    for (const place of places) {
      const dLat = toRad(place.lat - lat);
      const dLon = toRad(place.lng - lng);
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(toRad(lat)) * Math.cos(toRad(place.lat)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const dist = R * c;

      if (dist < minDistance) {
        minDistance = dist;
        closest = place;
      }
    }

    return Object.assign({}, closest, { computedDistKm: Math.round(minDistance * 10) / 10 });
  }

  /**
   * Live rain forecast via Open-Meteo with timeout & cache fallback
   */
  const WEATHER_CACHE_KEY = 'fs_weather_cache';

  async function getLiveRainForecast(lat, lng, timeoutMs) {
    timeoutMs = timeoutMs || 4000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=precipitation&forecast_days=1`;

    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error('API_ERROR');
      const data = await response.json();

      if (data && data.hourly && Array.isArray(data.hourly.precipitation)) {
        const totalMm = data.hourly.precipitation
          .slice(0, 24)
          .reduce((sum, val) => sum + (Number(val) || 0), 0);
        const rounded = Math.round(totalMm);

        // Cache response
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({
              rainMm: rounded,
              timestamp: Date.now(),
              lat: lat,
              lng: lng
            }));
          }
        } catch (_) {}

        return { rainMm: rounded, isLive: true };
      }
      throw new Error('INVALID_DATA');
    } catch (err) {
      clearTimeout(timeoutId);
      // Return cached value if available, else null
      try {
        const cachedRaw = typeof localStorage !== 'undefined' ? localStorage.getItem(WEATHER_CACHE_KEY) : null;
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          return { rainMm: cached.rainMm, isLive: false, isCached: true };
        }
      } catch (_) {}
      return { rainMm: null, isLive: false };
    }
  }

  /**
   * Device Battery API wrapper
   */
  async function getBatteryInfo() {
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.getBattery === 'function') {
        const b = await navigator.getBattery();
        return {
          level: Math.round(b.level * 100),
          charging: Boolean(b.charging)
        };
      }
    } catch (_) {}
    return null;
  }

  /**
   * Web Notifications
   */
  async function requestNotificationPermission() {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const res = await Notification.requestPermission();
        return res; // 'granted', 'denied', or 'default'
      }
    } catch (_) {}
    return 'unsupported';
  }

  function showNotification(title, options) {
    options = options || {};
    try {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        return new Notification(title, {
          body: options.body || '',
          icon: options.icon || 'assets/logo.png',
          badge: 'assets/logo.png',
          tag: options.tag || 'floodsaathi'
        });
      }
    } catch (_) {}
    // Fallback in-app toast
    if (window.FS.ui && typeof window.FS.ui.toast === 'function') {
      window.FS.ui.toast(title + (options.body ? ': ' + options.body : ''), { type: 'warning' });
    }
  }

  /**
   * Native Share or Clipboard Fallback
   */
  async function shareData(data) {
    data = data || {};
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share(data);
        return true;
      }
    } catch (err) {
      if (err.name === 'AbortError') return false; // user cancelled share
    }

    // Fallback: Copy to clipboard
    const textToCopy = [data.title, data.text, data.url].filter(Boolean).join('\n');
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(textToCopy);
        if (window.FS.ui && typeof window.FS.ui.toast === 'function') {
          window.FS.ui.toast(window.FS.i18n.t('copiedClipboard', 'Copied to clipboard!'), { type: 'success' });
        }
        return true;
      }
    } catch (_) {}

    // Fallback prompt
    prompt('Copy to share:', textToCopy);
    return true;
  }

  /**
   * Speech Recognition API with language mapping
   */
  function createSpeechRecognizer(options) {
    options = options || {};
    const lang = options.lang || 'en-IN';
    const onResult = options.onResult || (() => {});
    const onError = options.onError || (() => {});
    const onEnd = options.onEnd || (() => {});

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      return null;
    }

    try {
      const recognizer = new SpeechRec();
      recognizer.lang = lang;
      recognizer.interimResults = false;
      recognizer.maxAlternatives = 1;

      recognizer.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        onResult(transcript);
      };

      recognizer.onerror = (event) => {
        onError(event.error || 'speech_error');
      };

      recognizer.onend = () => {
        onEnd();
      };

      return recognizer;
    } catch (err) {
      console.warn('SpeechRecognition creation failed:', err);
      return null;
    }
  }

  /**
   * Build cross-platform SMS URL
   * iOS uses '&body=' while Android/Web uses '?body='
   */
  function buildSmsUrl(phoneNumbers, body) {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const separator = isIOS ? '&' : '?';
    const phones = Array.isArray(phoneNumbers) ? phoneNumbers.join(',') : (phoneNumbers || '');
    return `sms:${phones}${separator}body=${encodeURIComponent(body || '')}`;
  }

  /**
   * Open External Google Maps Walking Directions
   */
  function openDirections(lat, lng, travelmode) {
    travelmode = travelmode || 'walking';
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=${travelmode}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  window.FS.services = {
    getLocation: getLocation,
    findNearestPlace: findNearestPlace,
    getLiveRainForecast: getLiveRainForecast,
    getBatteryInfo: getBatteryInfo,
    requestNotificationPermission: requestNotificationPermission,
    showNotification: showNotification,
    shareData: shareData,
    createSpeechRecognizer: createSpeechRecognizer,
    buildSmsUrl: buildSmsUrl,
    openDirections: openDirections
  };
})();
