/* Screen 2: Home Dashboard (#/home) */
window.FS = window.FS || {};
window.FS.screens = window.FS.screens || {};

window.FS.screens.home = (function() {
  const { el, formatTimeAgo } = window.FS.ui;
  const { t } = window.FS.i18n;

  let updateTimer = null;
  let renderTimestamp = Date.now();

  function render() {
    renderTimestamp = Date.now();
    const place = window.FS.store.get('place') || window.FS.DATA.places[0];
    const alerts = window.FS.DATA.alerts || [];
    const readAlertIds = window.FS.store.get('alertsRead') || [];
    const unreadCount = alerts.filter(a => !readAlertIds.includes(a.id)).length;

    // Determine flood status based on place river level vs warning level
    let statusKey = 'safeStatus';
    let subKey = 'noThreatSub';
    let statusCls = 'safe';

    if (place.riverLevel >= place.warningLevel + 0.3) {
      statusKey = 'dangerStatus';
      subKey = 'dangerSub';
      statusCls = 'danger';
    } else if (place.riverLevel >= place.warningLevel) {
      statusKey = 'watchStatus';
      subKey = 'watchSub';
      statusCls = 'watch';
    }

    const screen = el('div', { className: 'screen-home' });

    // 1. Hero Section with Misty Hills Background
    const hero = el('div', { className: 'home-hero' });

    // Top Bar: Location Chip & Notification Bell
    const topBar = el('div', { className: 'home-top-bar' });

    const locChip = el('button', {
      className: 'home-loc-chip',
      type: 'button',
      'aria-label': 'Change location',
      onClick: () => {
        window.FS.screens.onboarding.openManualPlacePicker((newPlace) => {
          window.FS.store.set('place', newPlace);
          window.FS.router.renderCurrent();
        });
      }
    }, [
      createPinSvg(),
      el('span', { className: 'loc-name', textContent: place.name.split(',')[0] }),
      el('span', { className: 'loc-reg', textContent: place.region })
    ]);

    const bellBtn = el('button', {
      className: 'home-bell-btn',
      type: 'button',
      'aria-label': `Notifications, ${unreadCount} unread`,
      onClick: () => window.FS.router.navigate('/alerts')
    }, [
      createBellSvg()
    ]);

    if (unreadCount > 0) {
      bellBtn.appendChild(el('span', { className: 'home-bell-badge', textContent: String(unreadCount) }));
    }

    topBar.appendChild(locChip);
    topBar.appendChild(bellBtn);
    hero.appendChild(topBar);

    // Hero Status Heading
    const statusCard = el('div', { className: 'home-status-card' });
    const statusVal = el('h1', { className: `home-status-val ${statusCls}`, textContent: t(statusKey) });
    const statusSub = el('div', { className: 'home-status-sub', textContent: t(subKey) });

    statusCard.appendChild(statusVal);
    statusCard.appendChild(statusSub);
    hero.appendChild(statusCard);
    screen.appendChild(hero);

    // 2. White Sheet with 4 Data Metric Tiles
    const sheet = el('section', { className: 'home-sheet', 'aria-label': 'Flood and weather metrics' });
    const grid = el('div', { className: 'home-grid' });

    // River Level Tile
    const deltaStr = place.delta >= 0 ? `+${place.delta} m` : `${place.delta} m`;
    const isBelowWarning = place.riverLevel < place.warningLevel;
    const riverTile = el('div', { className: 'home-stat-tile' }, [
      el('div', { className: 'stat-header' }, [
        el('div', { className: 'stat-icon' }, [createWaveSvg()]),
        el('span', { className: 'stat-label', textContent: place.river })
      ]),
      el('div', { className: 'stat-val', textContent: `${place.riverLevel} m` }),
      el('div', { className: 'stat-sub', textContent: `( ${deltaStr} )` }),
      el('div', {
        className: `stat-status ${isBelowWarning ? '' : 'warn'}`,
        textContent: t(isBelowWarning ? 'belowWarning' : 'aboveWarning')
      })
    ]);

    // Rain Forecast Tile
    const rainValEl = el('div', { className: 'stat-val', textContent: `${place.rainForecast} mm` });
    const rainSubEl = el('div', { className: 'stat-sub', textContent: t('next24h') });
    const rainTile = el('div', { className: 'home-stat-tile' }, [
      el('div', { className: 'stat-header' }, [
        el('div', { className: 'stat-icon' }, [createCloudRainSvg()]),
        el('span', { className: 'stat-label', textContent: t('rainForecast') })
      ]),
      rainValEl,
      rainSubEl
    ]);

    // Fetch live rain forecast asynchronously
    window.FS.services.getLiveRainForecast(place.lat, place.lng, 4000).then((res) => {
      if (res && res.rainMm !== null && res.rainMm !== undefined) {
        rainValEl.textContent = `${res.rainMm} mm`;
        if (!res.isLive) {
          rainSubEl.textContent = `${t('next24h')} (${t('offlineDataPill')})`;
        }
      }
    });

    // Elevation Tile
    const elevTile = el('div', { className: 'home-stat-tile' }, [
      el('div', { className: 'stat-header' }, [
        el('div', { className: 'stat-icon grey' }, [createMountainSvg()]),
        el('span', { className: 'stat-label', textContent: t('elevation') })
      ]),
      el('div', { className: 'stat-val', textContent: `${place.elevation} m` }),
      el('div', { className: 'stat-sub', textContent: t('aboveSea') })
    ]);

    // Distance to River Tile
    const distTile = el('div', { className: 'home-stat-tile' }, [
      el('div', { className: 'stat-header' }, [
        el('div', { className: 'stat-icon grey' }, [createRiverPinSvg()]),
        el('span', { className: 'stat-label', textContent: t('distToRiver') })
      ]),
      el('div', { className: 'stat-val', textContent: `${place.riverDistance} km` }),
      el('div', { className: 'stat-sub', textContent: place.river })
    ]);

    grid.appendChild(riverTile);
    grid.appendChild(rainTile);
    grid.appendChild(elevTile);
    grid.appendChild(distTile);
    sheet.appendChild(grid);

    // Divider
    sheet.appendChild(el('div', { className: 'home-divider' }));

    // Official Alert Summary Strip
    const topAlert = alerts[0];
    const hasActiveDanger = topAlert && (statusCls === 'danger' || statusCls === 'watch');

    const alertStrip = el('div', {
      className: `home-alert-strip ${hasActiveDanger ? 'has-alert' : ''}`,
      role: 'button',
      tabIndex: 0,
      'aria-label': 'View official alerts',
      onClick: () => window.FS.router.navigate('/alerts'),
      onKeyDown: (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          window.FS.router.navigate('/alerts');
        }
      }
    }, [
      el('div', { className: 'alert-strip-badge' }, [
        hasActiveDanger ? createAlertExclamationSvg() : createCheckSvg()
      ]),
      el('div', { className: 'alert-strip-txt' }, [
        el('b', { textContent: hasActiveDanger ? topAlert.title : t('noAlertsActive') }),
        el('span', { textContent: hasActiveDanger ? `${topAlert.source} • ${topAlert.timeAgo}` : `${place.name} • CWC` })
      ])
    ]);

    sheet.appendChild(alertStrip);

    // Updated Time Stamp Label
    const updatedEl = el('div', { className: 'home-updated-time', textContent: t('updatedAgo') });
    sheet.appendChild(updatedEl);

    screen.appendChild(sheet);

    // Setup 60s timer to refresh relative timestamp
    if (updateTimer) clearInterval(updateTimer);
    updateTimer = setInterval(() => {
      const minutesAgo = Math.floor((Date.now() - renderTimestamp) / 60000);
      if (minutesAgo <= 0) {
        updatedEl.textContent = t('updatedAgo');
      } else {
        updatedEl.textContent = `Updated ${minutesAgo} min ago`;
      }
    }, 60000);

    return screen;
  }

  function teardown() {
    if (updateTimer) {
      clearInterval(updateTimer);
      updateTimer = null;
    }
  }

  function createPinSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 28');
    svg.innerHTML = '<path d="M12 1C6.5 1 3 5 3 9.8 3 16 12 27 12 27s9-11 9-17.2C21 5 17.5 1 12 1z" fill="#ef1c24"/><circle cx="12" cy="10" r="3.6" fill="#fff"/>';
    return svg;
  }

  function createBellSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', '#12172b');
    svg.setAttribute('stroke-width', '1.8');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.innerHTML = '<path d="M6 17V11a6 6 0 0112 0v6l1.5 2h-15zM10 21h4"/>';
    return svg;
  }

  function createWaveSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.8');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.innerHTML = '<path d="M8.5 9.5a4 4 0 017 0M12 4.5v2.5"/><path d="M3.5 13.5c2-1.5 3.5-1.5 5.5 0s3.5 1.5 5.5 0 3.5-1.5 5.5 0M3.5 18c2-1.5 3.5-1.5 5.5 0s3.5 1.5 5.5 0 3.5-1.5 5.5 0"/>';
    return svg;
  }

  function createCloudRainSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.innerHTML = '<path d="M7.5 15.5a4.5 4.5 0 01-.6-8.9 6 6 0 0111.3 1.6 3.7 3.7 0 01-.9 7.3z" fill="#3b82f6"/><path d="M8.5 18.5l-1 2.5M12.5 18.5l-1 2.5M16.5 18.5l-1 2.5" stroke="#3b82f6" stroke-width="1.8" stroke-linecap="round"/>';
    return svg;
  }

  function createMountainSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.innerHTML = '<path d="M2.5 20L9.5 7.5l3.7 6.5 2.3-3.5L21.5 20z" fill="#2b3347"/><path d="M9.5 7.5l1.8 3.2-1.8-.9-1.8.9z" fill="#fff"/>';
    return svg;
  }

  function createRiverPinSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 28');
    svg.innerHTML = '<path d="M12 1C6.5 1 3 5 3 9.8 3 16 12 27 12 27s9-11 9-17.2C21 5 17.5 1 12 1z" fill="#2b3347"/><circle cx="12" cy="10" r="3.6" fill="#eff0f3"/>';
    return svg;
  }

  function createCheckSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', '#fff');
    svg.setAttribute('stroke-width', '3');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.innerHTML = '<path d="M5 12.5l4.5 4.5L19 7.5"/>';
    return svg;
  }

  function createAlertExclamationSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', '#fff');
    svg.setAttribute('stroke-width', '2.2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.innerHTML = '<path d="M12 4L21 20H3zM12 10v4.5M12 17.3v.2"/>';
    return svg;
  }

  return {
    render: render,
    teardown: teardown
  };
})();

window.FS.router.register('/home', window.FS.screens.home);
