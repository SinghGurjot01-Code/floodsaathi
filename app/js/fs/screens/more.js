/* Screen 6: More Menu & Helplines (#/more) */
window.FS = window.FS || {};
window.FS.screens = window.FS.screens || {};

window.FS.screens.more = (function() {
  const { el } = window.FS.ui;
  const { t, getLang, setLang } = window.FS.i18n;

  function render() {
    const currentLang = getLang();
    const currentPlace = window.FS.store.get('place') || window.FS.DATA.places[0];

    const screen = el('div', { className: 'screen-more' });

    screen.appendChild(el('h1', { className: 'more-title', textContent: t('more') }));
    screen.appendChild(el('p', { className: 'more-sub', textContent: 'Safety tools, settings & helplines' }));

    // 1. Navigation Shortcuts Group
    const navGroup = el('div', { className: 'more-group' });

    // Emergency Row
    navGroup.appendChild(createMoreRow({
      iconCls: 'red',
      iconSvg: createSosIconSvg(),
      title: t('moreEmergency'),
      sub: 'One-touch SOS & family check-in',
      onClick: () => window.FS.router.navigate('/emergency')
    }));

    // After-flood Guide Row
    navGroup.appendChild(createMoreRow({
      iconCls: 'green',
      iconSvg: createBookSvg(),
      title: t('moreAfterFlood'),
      sub: 'Clean-up, health & relief claims',
      onClick: () => window.FS.router.navigate('/afterflood')
    }));

    // Alert Preferences Row
    navGroup.appendChild(createMoreRow({
      iconCls: '',
      iconSvg: createBellSvg(),
      title: t('moreAlertPrefs'),
      sub: 'Radius, quiet hours & alert types',
      onClick: () => window.FS.router.navigate('/prefs')
    }));

    // Change Location Row
    navGroup.appendChild(createMoreRow({
      iconCls: '',
      iconSvg: createPinSvg(),
      title: t('moreChangeLoc'),
      sub: currentPlace.name,
      onClick: () => {
        window.FS.screens.onboarding.openManualPlacePicker((newPlace) => {
          window.FS.store.set('place', newPlace);
          window.FS.router.renderCurrent();
        });
      }
    }));

    screen.appendChild(navGroup);

    // 2. Language Switcher Group
    const langGroup = el('div', { className: 'more-group' });
    langGroup.appendChild(el('div', { className: 'more-group-title', textContent: t('moreLanguage') }));

    const langsRow = el('div', {
      style: { display: 'flex', gap: '8px', padding: '12px 16px' }
    });

    const langOptions = [
      { code: 'en', label: 'English', cls: '' },
      { code: 'pa', label: 'ਪੰਜਾਬੀ', cls: 'pa' },
      { code: 'hi', label: 'हिन्दी', cls: 'hi' }
    ];

    langOptions.forEach((opt) => {
      const isSelected = currentLang === opt.code;
      const btn = el('button', {
        className: `welcome-lang-btn ${opt.cls}`,
        style: {
          border: isSelected ? '2px solid var(--red)' : '1px solid var(--line)',
          background: isSelected ? '#fde4e4' : '#f8f9fc',
          fontWeight: isSelected ? '700' : '500'
        },
        type: 'button',
        onClick: () => {
          setLang(opt.code);
        }
      }, [
        document.createTextNode(opt.label)
      ]);
      langsRow.appendChild(btn);
    });

    langGroup.appendChild(langsRow);
    screen.appendChild(langGroup);

    // 3. Official Helplines Group
    const helpGroup = el('div', { className: 'more-group' });
    helpGroup.appendChild(el('div', { className: 'more-group-title', textContent: t('moreHelplines') }));

    const helplines = [
      { name: 'National Emergency', desc: 'Police, Fire, Ambulance', phone: '112' },
      { name: 'State Disaster Helpline', desc: 'Punjab SDMA 24/7', phone: '1070' },
      { name: 'District Emergency Center', desc: 'Jalandhar & Kapurthala', phone: '1077' },
      { name: 'Medical Ambulance', desc: 'Free emergency transport', phone: '108' },
      { name: 'Punjab Flood Control HQ', desc: 'Chandigarh Central Room', phone: '0172-2740397' }
    ];

    helplines.forEach((h) => {
      const row = el('div', { className: 'helpline-item' }, [
        el('div', {}, [
          el('div', { className: 'helpline-name', textContent: h.name }),
          el('div', { className: 'helpline-desc', textContent: h.desc })
        ]),
        el('a', {
          className: 'helpline-call-btn',
          href: `tel:${h.phone.replace(/[^0-9]/g, '')}`,
          'aria-label': `Call ${h.name} at ${h.phone}`
        }, [
          createPhoneSvg(),
          document.createTextNode(` ${h.phone}`)
        ])
      ]);
      helpGroup.appendChild(row);
    });

    screen.appendChild(helpGroup);

    // 4. Reset App Data Action
    const resetGroup = el('div', { className: 'more-group' }, [
      createMoreRow({
        iconCls: 'red',
        iconSvg: createTrashSvg(),
        title: t('moreResetApp'),
        sub: 'Clear all saved data and restart setup',
        onClick: handleResetApp
      })
    ]);
    screen.appendChild(resetGroup);

    return screen;
  }

  function createMoreRow(opts) {
    return el('div', {
      className: 'more-row',
      role: 'button',
      tabIndex: 0,
      'aria-label': opts.title,
      onClick: opts.onClick,
      onKeyDown: (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          opts.onClick();
        }
      }
    }, [
      el('div', { className: `more-row-icon ${opts.iconCls || ''}` }, [opts.iconSvg]),
      el('div', { className: 'more-row-txt' }, [
        el('b', { textContent: opts.title }),
        el('span', { textContent: opts.sub })
      ]),
      el('div', { className: 'more-chevron' }, [createChevronSvg()])
    ]);
  }

  function handleResetApp() {
    const content = el('div', { style: { display: 'flex', flexDirection: 'column', gap: '16px' } }, [
      el('p', {
        style: { fontSize: '15px', color: '#4a5268', lineHeight: '1.5' },
        textContent: t('resetConfirmMsg')
      }),
      el('div', { style: { display: 'flex', gap: '10px', marginTop: '8px' } }, [
        el('button', {
          className: 'quick-action-btn',
          style: { flex: '1', height: '48px', background: 'var(--red)', color: '#fff' },
          type: 'button',
          textContent: t('confirmResetBtn'),
          onClick: () => {
            window.FS.store.reset();
            window.FS.ui.closeModal();
            window.FS.ui.toast(t('appResetToast'), { type: 'info' });
            window.FS.router.navigate('/welcome');
          }
        }),
        el('button', {
          className: 'quick-action-btn',
          style: { flex: '1', height: '48px', background: 'var(--card-grey)', color: 'var(--navy)' },
          type: 'button',
          textContent: t('cancelBtn'),
          onClick: () => window.FS.ui.closeModal()
        })
      ])
    ]);

    window.FS.ui.openModal({
      title: t('resetConfirmTitle'),
      contentEl: content
    });
  }

  function createSosIconSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'currentColor');
    svg.innerHTML = '<circle cx="12" cy="12" r="10"/><path d="M12 7v6M12 16h.01" stroke="#fff" stroke-width="2" stroke-linecap="round"/>';
    return svg;
  }

  function createBookSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.innerHTML = '<path d="M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 006.5 22H20V2H6.5A2.5 2.5 0 004 4.5z"/>';
    return svg;
  }

  function createBellSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.innerHTML = '<path d="M6 17V11a6 6 0 0112 0v6l1.5 2h-15zM10 21h4"/>';
    return svg;
  }

  function createPinSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.innerHTML = '<path d="M12 2C8 2 5 5 5 9c0 6 7 13 7 13s7-7 7-13c0-4-3-7-7-7z"/><circle cx="12" cy="9" r="2.5"/>';
    return svg;
  }

  function createTrashSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.innerHTML = '<path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>';
    return svg;
  }

  function createChevronSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2.2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.innerHTML = '<path d="M9 5l7 7-7 7"/>';
    return svg;
  }

  function createPhoneSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '16');
    svg.setAttribute('height', '16');
    svg.setAttribute('fill', 'currentColor');
    svg.innerHTML = '<path d="M6.6 3.5l2.4-.5c.5-.1 1 .2 1.2.7l1.1 2.8c.2.5 0 1-.4 1.3L9.3 9.1a12 12 0 0 0 5.6 5.6l1.3-1.6c.3-.4.8-.6 1.3-.4l2.8 1.1c.5.2.8.7.7 1.2l-.5 2.4c-.1.7-.7 1.2-1.4 1.2C10.8 18.6 5.4 13.2 5.4 4.9c0-.7.5-1.3 1.2-1.4z"/>';
    return svg;
  }

  return {
    render: render,
    teardown: () => {}
  };
})();

window.FS.router.register('/more', window.FS.screens.more);
