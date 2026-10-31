/* Screen 5: Official Alerts List & Detail View (#/alerts & #/alert/:id) */
window.FS = window.FS || {};
window.FS.screens = window.FS.screens || {};

window.FS.screens.alerts = (function() {
  const { el, formatTimeAgo } = window.FS.ui;
  const { t } = window.FS.i18n;

  let activeFilter = 'all'; // 'all', 'flood', 'dam', 'rain'
  let refreshTimer = null;

  function render(params) {
    // If params has :id, render detail view
    if (params && params.id) {
      return renderAlertDetail(params.id);
    }
    return renderAlertsList();
  }

  function renderAlertsList() {
    const alerts = window.FS.DATA.alerts || [];
    const readAlertIds = window.FS.store.get('alertsRead') || [];

    const screen = el('div', { className: 'screen-alerts' });

    // Header with Title and Prefs Gear
    const header = el('div', { className: 'alerts-header' });
    header.appendChild(el('h1', { className: 'alerts-title', textContent: t('officialAlertsTitle') }));

    const prefsBtn = el('button', {
      className: 'alerts-prefs-btn',
      type: 'button',
      'aria-label': t('alertPrefsTitle'),
      onClick: () => window.FS.router.navigate('/prefs')
    }, [
      createGearSvg()
    ]);
    header.appendChild(prefsBtn);
    screen.appendChild(header);

    screen.appendChild(el('p', { className: 'alerts-sub', textContent: t('officialAlertsSub') }));

    // Category Filter Chips
    const chipsWrap = el('div', { className: 'alerts-chips', role: 'tablist', 'aria-label': 'Alert filters' });
    const filters = [
      { id: 'all', key: 'filterAll' },
      { id: 'flood', key: 'filterFlood' },
      { id: 'dam', key: 'filterDam' },
      { id: 'rain', key: 'filterRain' }
    ];

    filters.forEach((f) => {
      const isSelected = activeFilter === f.id;
      const chip = el('button', {
        className: `alert-chip-btn ${isSelected ? 'active' : ''}`,
        type: 'button',
        role: 'tab',
        'aria-selected': isSelected ? 'true' : 'false',
        textContent: t(f.key),
        onClick: () => {
          activeFilter = f.id;
          window.FS.router.renderCurrent();
        }
      });
      chipsWrap.appendChild(chip);
    });
    screen.appendChild(chipsWrap);

    // Filter Alerts
    const filtered = alerts.filter((a) => {
      if (activeFilter === 'all') return true;
      return a.type === activeFilter;
    });

    const listContainer = el('div', { className: 'alerts-list' });

    if (!filtered.length) {
      listContainer.appendChild(el('div', {
        className: 'alerts-empty',
        textContent: t('noAlertsCategory')
      }));
    } else {
      filtered.forEach((alert) => {
        const isUnread = !readAlertIds.includes(alert.id);
        const card = el('article', {
          className: `alert-card ${isUnread ? 'unread' : ''}`,
          tabIndex: 0,
          role: 'button',
          'aria-label': `${alert.title}, ${alert.timeAgo}`,
          onClick: () => {
            window.FS.router.navigate(`/alert/${alert.id}`);
          },
          onKeyDown: (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              window.FS.router.navigate(`/alert/${alert.id}`);
            }
          }
        });

        // Icon tile
        const iconCls = alert.type === 'dam' ? 'dam' : (alert.type === 'rain' ? 'rain' : '');
        const iconTile = el('div', { className: `alert-card-icon ${iconCls}` }, [
          createAlertIconSvg(alert.type)
        ]);

        // Content
        const content = el('div', { className: 'alert-card-content' });
        const cardHeader = el('div', { className: 'alert-card-header' }, [
          el('h3', { className: 'alert-card-title', textContent: alert.title }),
          el('span', { className: 'alert-card-time', textContent: formatTimeAgo(alert.timestamp) })
        ]);

        const desc = el('p', { className: 'alert-card-desc', textContent: alert.description });
        const source = el('span', { className: 'alert-card-source', textContent: alert.source });

        content.appendChild(cardHeader);
        content.appendChild(desc);
        content.appendChild(source);

        const chev = createChevronSvg();

        card.appendChild(iconTile);
        card.appendChild(content);
        card.appendChild(chev);
        listContainer.appendChild(card);
      });
    }

    screen.appendChild(listContainer);

    // Interval to refresh time-ago strings
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(() => {
      listContainer.querySelectorAll('.alert-card-time').forEach((elTime, idx) => {
        if (filtered[idx]) {
          elTime.textContent = formatTimeAgo(filtered[idx].timestamp);
        }
      });
    }, 60000);

    return screen;
  }

  function renderAlertDetail(alertId) {
    const alerts = window.FS.DATA.alerts || [];
    const alert = alerts.find(a => a.id === alertId) || alerts[0];

    // Mark as read immediately, updating store
    const readIds = window.FS.store.get('alertsRead') || [];
    if (!readIds.includes(alert.id)) {
      readIds.push(alert.id);
      window.FS.store.set('alertsRead', readIds);
    }

    const screen = el('div', { className: 'screen-alert-detail' });

    // Top Navigation: Back Button & Share Button
    const navBar = el('div', { className: 'detail-nav-bar' }, [
      el('button', {
        className: 'detail-back-btn',
        type: 'button',
        'aria-label': 'Back to alerts',
        onClick: () => window.FS.router.navigate('/alerts')
      }, [createBackSvg()]),
      el('button', {
        className: 'detail-share-btn',
        type: 'button',
        'aria-label': t('shareAlert'),
        onClick: () => {
          window.FS.services.shareData({
            title: `FloodSaathi: ${alert.title}`,
            text: `${alert.title}\n\n${alert.description}\n\nAffected areas: ${alert.affectedAreas}\nSource: ${alert.source}`,
            url: window.location.href
          });
        }
      }, [createShareSvg()])
    ]);
    screen.appendChild(navBar);

    // Severity Badge
    const sevCls = alert.severity === 'danger' ? 'danger' : 'warning';
    const sevLabel = alert.severity === 'danger' ? 'HIGH SEVERITY ALERT' : 'OFFICIAL ADVISORY';
    const badge = el('div', { className: `detail-severity-badge ${sevCls}`, textContent: sevLabel });
    screen.appendChild(badge);

    // Title & Metadata
    const title = el('h1', { className: 'detail-title', textContent: alert.title });
    const meta = el('div', {
      className: 'detail-meta',
      textContent: `Issued ${formatTimeAgo(alert.timestamp)} by ${alert.source}`
    });
    screen.appendChild(title);
    screen.appendChild(meta);

    // Affected Areas Card
    const affectedCard = el('div', {
      style: {
        background: '#eef4ff',
        padding: '12px 16px',
        borderRadius: 'var(--radius-sm)',
        marginBottom: '16px',
        fontSize: '14px',
        color: '#1e40af'
      }
    }, [
      el('b', { textContent: `${t('affectedAreasLabel')}: ` }),
      document.createTextNode(alert.affectedAreas)
    ]);
    screen.appendChild(affectedCard);

    // Description Card
    const bodyCard = el('div', { className: 'detail-body-card' }, [
      el('p', { textContent: alert.description })
    ]);
    screen.appendChild(bodyCard);

    // Recommended Actions Card
    if (Array.isArray(alert.actions) && alert.actions.length) {
      const actionsCard = el('div', { className: 'detail-actions-card' }, [
        el('h3', { textContent: t('recommendedActions') })
      ]);
      const ul = el('ul', { className: 'detail-actions-list' });
      alert.actions.forEach((act) => {
        ul.appendChild(el('li', { textContent: act }));
      });
      actionsCard.appendChild(ul);
      screen.appendChild(actionsCard);
    }

    return screen;
  }

  function teardown() {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }

  function createAlertIconSvg(type) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    if (type === 'dam') {
      svg.innerHTML = '<path d="M4 6h16v3H4zM4 11h16v7H4zM8 11v7M16 11v7" fill="currentColor"/>';
    } else if (type === 'rain') {
      svg.innerHTML = '<path d="M7 16a4 4 0 01-.5-8 5 5 0 019.5 1.5 3.5 3.5 0 010 6.5z" fill="currentColor"/><path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';
    } else {
      svg.innerHTML = '<path d="M4 5h16v3H4z"/><path d="M5.2 9h13.6L20 20h-4.2l-.6-8.5h-6.4l-.6 8.5H4z"/><path d="M10.2 12.5a1.8 1.8 0 013.6 0V20h-3.6z" fill="currentColor"/>';
    }
    return svg;
  }

  function createGearSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', '#12172b');
    svg.setAttribute('stroke-width', '1.8');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.innerHTML = '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>';
    return svg;
  }

  function createChevronSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '20');
    svg.setAttribute('height', '20');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', '#8c94a6');
    svg.setAttribute('stroke-width', '2.2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.innerHTML = '<path d="M9 5l7 7-7 7"/>';
    return svg;
  }

  function createBackSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '22');
    svg.setAttribute('height', '22');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', '#12172b');
    svg.setAttribute('stroke-width', '2.2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.innerHTML = '<path d="M15 19l-7-7 7-7"/>';
    return svg;
  }

  function createShareSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '20');
    svg.setAttribute('height', '20');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', '#12172b');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.innerHTML = '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/>';
    return svg;
  }

  return {
    render: render,
    teardown: teardown
  };
})();

window.FS.router.register('/alerts', window.FS.screens.alerts);
window.FS.router.register('/alert/:id', window.FS.screens.alerts);
