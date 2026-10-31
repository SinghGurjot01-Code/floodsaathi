/* Screen 8: Alert Preferences (#/prefs) */
window.FS = window.FS || {};
window.FS.screens = window.FS.screens || {};

window.FS.screens.prefs = (function() {
  const { el } = window.FS.ui;
  const { t } = window.FS.i18n;

  function render() {
    const prefs = Object.assign({}, window.FS.store.get('prefs') || {});

    const screen = el('div', { className: 'screen-prefs' });

    screen.appendChild(el('h1', { className: 'prefs-title', textContent: t('alertPrefsTitle') }));
    screen.appendChild(el('p', { className: 'prefs-sub', textContent: t('alertPrefsSub') }));

    const list = el('div', { className: 'prefs-list' });

    // 1. Four Alert Type Switches
    const switchDefs = [
      { key: 'flood', titleKey: 'prefFlood', subKey: 'prefFloodSub', icon: createWaveSvg() },
      { key: 'dam', titleKey: 'prefDam', subKey: 'prefDamSub', icon: createDamSvg() },
      { key: 'rain', titleKey: 'prefRain', subKey: 'prefRainSub', icon: createCloudRainSvg() },
      { key: 'weather', titleKey: 'prefWeather', subKey: 'prefWeatherSub', icon: createSunCloudSvg() }
    ];

    switchDefs.forEach((def) => {
      const isChecked = Boolean(prefs[def.key]);

      const switchBtn = el('button', {
        className: 'toggle-switch',
        type: 'button',
        role: 'switch',
        'aria-checked': isChecked ? 'true' : 'false',
        'aria-label': t(def.titleKey),
        onClick: () => handleToggleSwitch(def.key, switchBtn),
        onKeyDown: (e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            handleToggleSwitch(def.key, switchBtn);
          }
        }
      });

      const row = el('div', { className: 'pref-row' }, [
        el('div', { className: 'pref-left' }, [
          el('div', { className: 'pref-icon' }, [def.icon]),
          el('div', { className: 'pref-text' }, [
            el('b', { textContent: t(def.titleKey) }),
            el('span', { textContent: t(def.subKey) })
          ])
        ]),
        switchBtn
      ]);

      list.appendChild(row);
    });

    // 2. Alert Radius Slider (5, 10, 20 km)
    const radiusCard = el('div', { className: 'pref-radius-card' });
    const radiusHeader = el('div', { className: 'radius-header' }, [
      el('span', { className: 'radius-title', textContent: t('prefRadius') }),
      el('span', {
        className: 'radius-val-label',
        id: 'radius-label',
        textContent: `${t('notifyWithin')} ${prefs.radius || 10} km`
      })
    ]);

    const radiusInput = el('input', {
      type: 'range',
      className: 'radius-range-input',
      min: '5',
      max: '20',
      step: '5',
      value: String(prefs.radius || 10),
      'aria-label': t('prefRadius'),
      onInput: (e) => {
        const val = parseInt(e.target.value, 10);
        updateRadius(val);
      }
    });

    const ticksWrap = el('div', { className: 'radius-ticks' });
    const tickValues = [5, 10, 20];
    const tickBtns = [];

    tickValues.forEach((val) => {
      const isAct = (prefs.radius || 10) === val;
      const tBtn = el('button', {
        className: `radius-tick-btn ${isAct ? 'active' : ''}`,
        type: 'button',
        textContent: `${val} km`,
        onClick: () => {
          radiusInput.value = String(val);
          updateRadius(val);
        }
      });
      tickBtns.push(tBtn);
      ticksWrap.appendChild(tBtn);
    });

    function updateRadius(val) {
      prefs.radius = val;
      window.FS.store.set('prefs', prefs);
      const lbl = document.getElementById('radius-label');
      if (lbl) lbl.textContent = `${t('notifyWithin')} ${val} km`;

      tickValues.forEach((tv, idx) => {
        if (tickBtns[idx]) {
          if (tv === val) tickBtns[idx].classList.add('active');
          else tickBtns[idx].classList.remove('active');
        }
      });
    }

    radiusCard.appendChild(radiusHeader);
    radiusCard.appendChild(radiusInput);
    radiusCard.appendChild(ticksWrap);
    list.appendChild(radiusCard);

    // 3. Quiet Hours Toggle & Time Pickers
    const quietCard = el('div', { className: 'quiet-hours-card' });

    const quietSwitchBtn = el('button', {
      className: 'toggle-switch',
      type: 'button',
      role: 'switch',
      'aria-checked': prefs.quietHours ? 'true' : 'false',
      'aria-label': t('prefQuiet'),
      onClick: () => {
        prefs.quietHours = !prefs.quietHours;
        quietSwitchBtn.setAttribute('aria-checked', prefs.quietHours ? 'true' : 'false');
        window.FS.store.set('prefs', prefs);
        updateQuietSubtitle();
      }
    });

    const quietRow = el('div', { className: 'pref-row', style: { borderBottom: 'none', padding: '0' } }, [
      el('div', { className: 'pref-left' }, [
        el('div', { className: 'pref-icon' }, [createMoonSvg()]),
        el('div', { className: 'pref-text' }, [
          el('b', { textContent: t('prefQuiet') }),
          el('span', { id: 'quiet-sub-label', textContent: formatQuietWindow(prefs) })
        ])
      ]),
      quietSwitchBtn
    ]);

    const timePickers = el('div', { className: 'quiet-time-pickers' }, [
      el('span', { style: { fontSize: '13px', color: 'var(--muted)' }, textContent: 'From:' }),
      el('input', {
        type: 'time',
        value: prefs.quietStart || '22:00',
        'aria-label': 'Quiet hours start time',
        onChange: (e) => {
          prefs.quietStart = e.target.value;
          window.FS.store.set('prefs', prefs);
          updateQuietSubtitle();
        }
      }),
      el('span', { style: { fontSize: '13px', color: 'var(--muted)' }, textContent: 'To:' }),
      el('input', {
        type: 'time',
        value: prefs.quietEnd || '06:00',
        'aria-label': 'Quiet hours end time',
        onChange: (e) => {
          prefs.quietEnd = e.target.value;
          window.FS.store.set('prefs', prefs);
          updateQuietSubtitle();
        }
      })
    ]);

    function updateQuietSubtitle() {
      const lbl = document.getElementById('quiet-sub-label');
      if (lbl) lbl.textContent = formatQuietWindow(prefs);
    }

    quietCard.appendChild(quietRow);
    quietCard.appendChild(timePickers);
    list.appendChild(quietCard);

    // 4. Send Test Alert Button
    const testBtn = el('button', {
      className: 'pref-test-btn',
      type: 'button',
      onClick: handleSendTestAlert
    }, [
      createBellSmallSvg(),
      document.createTextNode(t('sendTestAlert'))
    ]);
    list.appendChild(testBtn);

    screen.appendChild(list);

    async function handleToggleSwitch(key, buttonEl) {
      const willTurnOn = buttonEl.getAttribute('aria-checked') !== 'true';

      if (willTurnOn) {
        // Request Notification permission
        const perm = await window.FS.services.requestNotificationPermission();
        if (perm === 'denied') {
          window.FS.ui.toast('Notifications are blocked by your browser settings. Please enable them to receive flood alerts.', { type: 'warning', duration: 4500 });
          buttonEl.setAttribute('aria-checked', 'false');
          prefs[key] = false;
          window.FS.store.set('prefs', prefs);
          return;
        }
      }

      prefs[key] = willTurnOn;
      buttonEl.setAttribute('aria-checked', willTurnOn ? 'true' : 'false');
      window.FS.store.set('prefs', prefs);
    }

    function handleSendTestAlert() {
      window.FS.services.showNotification('FloodSaathi Test Alert', {
        body: 'Alerts are working properly! You will receive critical flood warnings.',
        icon: 'assets/logo.png'
      });
      window.FS.ui.toast(t('testAlertSuccess'), { type: 'success' });
    }

    return screen;
  }

  function formatQuietWindow(prefs) {
    if (!prefs.quietHours) return 'Mute non-urgent alerts during sleeping hours';
    const s = prefs.quietStart || '22:00';
    const e = prefs.quietEnd || '06:00';
    return `Muted between ${s} and ${e}`;
  }

  /**
   * Helper that checks if current time is within quiet hours (handles crossing midnight)
   */
  function isQuietHoursActive(now, startStr, endStr) {
    if (!startStr || !endStr) return false;
    const [sH, sM] = startStr.split(':').map(Number);
    const [eH, eM] = endStr.split(':').map(Number);
    const curMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = sH * 60 + sM;
    const endMinutes = eH * 60 + eM;

    if (startMinutes <= endMinutes) {
      return curMinutes >= startMinutes && curMinutes <= endMinutes;
    }
    // Window crosses midnight (e.g. 22:00 to 06:00)
    return curMinutes >= startMinutes || curMinutes <= endMinutes;
  }

  function createWaveSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', '#ef1c24');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.innerHTML = '<path d="M3 12c3-2 3-2 6 0s3 2 6 0 3-2 6 0M3 16c3-2 3-2 6 0s3 2 6 0 3-2 6 0"/>';
    return svg;
  }

  function createDamSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', '#3b82f6');
    svg.innerHTML = '<path d="M4 6h16v3H4zM4 11h16v7H4zM8 11v7M16 11v7"/>';
    return svg;
  }

  function createCloudRainSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', '#16a34a');
    svg.innerHTML = '<path d="M7 16a4 4 0 01-.5-8 5 5 0 019.5 1.5 3.5 3.5 0 010 6.5z"/><path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3" stroke="#16a34a" stroke-width="2" stroke-linecap="round"/>';
    return svg;
  }

  function createSunCloudSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', '#f58a2b');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.innerHTML = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>';
    return svg;
  }

  function createMoonSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', '#12172b');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.innerHTML = '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>';
    return svg;
  }

  function createBellSmallSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '18');
    svg.setAttribute('height', '18');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.innerHTML = '<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>';
    return svg;
  }

  return {
    render: render,
    teardown: () => {},
    isQuietHoursActive: isQuietHoursActive
  };
})();

window.FS.router.register('/prefs', window.FS.screens.prefs);
