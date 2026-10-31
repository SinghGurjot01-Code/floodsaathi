/* Screen 1: Onboarding & Location Selection (#/welcome) */
window.FS = window.FS || {};
window.FS.screens = window.FS.screens || {};

window.FS.screens.onboarding = (function() {
  const { el } = window.FS.ui;
  const { t } = window.FS.i18n;

  function render() {
    const currentLang = window.FS.i18n.getLang();
    const storedPlace = window.FS.store.get('place');
    let selectedPlace = storedPlace || window.FS.DATA.places[0];

    const screen = el('div', { className: 'screen-welcome' });

    // Background & Gradient Wash
    const bg = el('div', { className: 'welcome-bg', role: 'img', 'aria-label': 'Misty river valley at sunrise' });
    const wash = el('div', { className: 'welcome-wash' });
    screen.appendChild(bg);
    screen.appendChild(wash);

    // Header with Logo & Brand
    const header = el('div', { className: 'welcome-header' });
    const logoWrap = el('div', { className: 'welcome-logo' }, [
      el('img', { src: 'assets/logo.png', alt: 'FloodSaathi logo' })
    ]);
    const title = el('h1', { className: 'welcome-title' });
    title.appendChild(document.createTextNode('Flood'));
    title.appendChild(el('span', { textContent: 'Saathi' }));

    const tag = el('p', { className: 'welcome-tag', textContent: t('brandTag') });

    header.appendChild(logoWrap);
    header.appendChild(title);
    header.appendChild(tag);
    screen.appendChild(header);

    // Body with Language Chips and Location Card
    const body = el('div', { className: 'welcome-body' });
    const card = el('section', { className: 'welcome-card', 'aria-label': 'Language and location' });

    // Language Chips
    const langsRow = el('div', { className: 'welcome-langs', role: 'radiogroup', 'aria-label': 'Select language' });

    const langDefs = [
      { code: 'en', label: 'English', cls: '' },
      { code: 'pa', label: 'ਪੰਜਾਬੀ', cls: 'pa' },
      { code: 'hi', label: 'हिन्दी', cls: 'hi' }
    ];

    langDefs.forEach((l) => {
      const isSelected = currentLang === l.code;
      const btn = el('button', {
        className: `welcome-lang-btn ${l.cls}`,
        type: 'button',
        role: 'radio',
        'aria-checked': isSelected ? 'true' : 'false',
        'aria-pressed': isSelected ? 'true' : 'false',
        onClick: () => {
          window.FS.i18n.setLang(l.code);
        }
      });

      if (isSelected) {
        btn.appendChild(el('span', { className: 'welcome-radio' }));
      }
      btn.appendChild(document.createTextNode(l.label));
      langsRow.appendChild(btn);
    });

    // Use current location button
    const locBtn = el('button', {
      className: 'welcome-loc-btn',
      type: 'button',
      onClick: handleUseLocation
    });

    const pinIcon = el('span', { className: 'welcome-loc-pin' }, [
      createGpsSvg()
    ]);

    const locTxt = el('span', { className: 'welcome-loc-txt' }, [
      el('b', { id: 'loc-btn-title', textContent: t('useLocation') }),
      el('small', { id: 'loc-btn-sub', textContent: t('locationSub') })
    ]);

    const chevIcon = createChevronSvg();

    locBtn.appendChild(pinIcon);
    locBtn.appendChild(locTxt);
    locBtn.appendChild(chevIcon);

    card.appendChild(langsRow);
    card.appendChild(locBtn);
    body.appendChild(card);
    screen.appendChild(body);

    // Footer with Manual Select & Continue Arrow
    const footer = el('div', { className: 'welcome-footer' });
    const manualBtn = el('button', {
      className: 'welcome-manual-btn',
      type: 'button',
      onClick: () => openManualPlacePicker((p) => {
        selectedPlace = p;
        window.FS.store.set('place', p);
        goBtn.disabled = false;
        locTxt.querySelector('b').textContent = p.name;
        locTxt.querySelector('small').textContent = `${p.river} • ${p.riskLabel}`;
      })
    }, [
      document.createTextNode(t('selectManually') + ' '),
      createArrowSvg()
    ]);

    const goBtn = el('button', {
      className: 'welcome-go-btn',
      type: 'button',
      'aria-label': t('continueBtn'),
      onClick: () => {
        window.FS.store.set('onboarded', true);
        window.FS.router.navigate('/home');
      }
    }, [
      createArrowSvg(28)
    ]);

    footer.appendChild(manualBtn);
    footer.appendChild(goBtn);
    screen.appendChild(footer);

    // Geolocation handler
    async function handleUseLocation() {
      const titleEl = locBtn.querySelector('b');
      const subEl = locBtn.querySelector('small');
      const origTitle = titleEl.textContent;
      const origSub = subEl.textContent;

      titleEl.textContent = 'Detecting location...';
      subEl.textContent = 'Contacting GPS satellites (timeout 8s)...';
      locBtn.disabled = true;

      try {
        const coords = await window.FS.services.getLocation(8000);
        const nearest = window.FS.services.findNearestPlace(coords.lat, coords.lng);
        if (nearest) {
          window.FS.store.set('place', nearest);
          window.FS.store.set('onboarded', true);
          window.FS.ui.toast(`Located near ${nearest.name}!`, { type: 'success' });
          window.FS.router.navigate('/home');
        } else {
          throw new Error('NO_MATCHING_PLACE');
        }
      } catch (err) {
        let msg = 'Could not get GPS location.';
        if (err.message === 'PERMISSION_DENIED') {
          msg = 'Location permission was denied. Please select your town manually.';
        } else if (err.message === 'TIMEOUT') {
          msg = 'Location request timed out. Please choose manually.';
        }
        window.FS.ui.toast(msg, { type: 'warning' });

        titleEl.textContent = origTitle;
        subEl.textContent = origSub;
        locBtn.disabled = false;

        // Automatically open the manual picker as requested in specs
        openManualPlacePicker((p) => {
          selectedPlace = p;
          window.FS.store.set('place', p);
          window.FS.store.set('onboarded', true);
          window.FS.router.navigate('/home');
        });
      }
    }

    return screen;
  }

  function openManualPlacePicker(onSelect) {
    const { el } = window.FS.ui;
    const { t } = window.FS.i18n;
    const places = window.FS.DATA.places || [];

    const pickerContainer = el('div', { style: { display: 'flex', flexDirection: 'column', gap: '14px' } });

    // Search bar
    const searchInput = el('input', {
      type: 'search',
      className: 'saathi-input',
      placeholder: t('searchLocationPlaceholder'),
      'aria-label': t('searchLocationPlaceholder'),
      style: { height: '46px', width: '100%', marginBottom: '4px' }
    });

    const listEl = el('div', {
      style: {
        maxHeight: '50dvh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }
    });

    function renderList(filtered) {
      listEl.replaceChildren();
      if (!filtered.length) {
        listEl.appendChild(el('div', {
          style: { padding: '20px', textAlign: 'center', color: 'var(--muted)' },
          textContent: 'No matching place found in Punjab database.'
        }));
        return;
      }

      filtered.forEach((p) => {
        const item = el('button', {
          type: 'button',
          className: 'contact-item',
          style: { width: '100%', textAlign: 'left', cursor: 'pointer', border: '1px solid var(--line)' },
          onClick: () => {
            window.FS.ui.closeModal();
            if (typeof onSelect === 'function') onSelect(p);
          }
        }, [
          el('div', { className: 'contact-info' }, [
            el('b', { textContent: p.name }),
            el('span', { textContent: `${p.river} • Elevation ${p.elevation}m • ${p.riskLabel}` })
          ]),
          createChevronSvg()
        ]);
        listEl.appendChild(item);
      });
    }

    renderList(places);

    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const filtered = places.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.river.toLowerCase().includes(q) ||
        p.region.toLowerCase().includes(q)
      );
      renderList(filtered);
    });

    pickerContainer.appendChild(searchInput);
    pickerContainer.appendChild(listEl);

    window.FS.ui.openModal({
      title: t('selectLocationTitle'),
      contentEl: pickerContainer
    });
  }

  function createGpsSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', '#0c1130');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.innerHTML = '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7.2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>';
    return svg;
  }

  function createChevronSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '20');
    svg.setAttribute('height', '20');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', '#6b7488');
    svg.setAttribute('stroke-width', '2.2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.innerHTML = '<path d="M9 5l7 7-7 7"/>';
    return svg;
  }

  function createArrowSvg(size) {
    size = size || 18;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', String(size));
    svg.setAttribute('height', String(size));
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2.2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.innerHTML = '<path d="M4 12h15M13 6l6 6-6 6"/>';
    return svg;
  }

  return {
    render: render,
    teardown: () => {},
    openManualPlacePicker: openManualPlacePicker
  };
})();

window.FS.router.register('/welcome', window.FS.screens.onboarding);
