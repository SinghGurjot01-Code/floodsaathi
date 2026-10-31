/**
 * FloodSaathi - Nearest Safe Shelter Screen (#/shelter)
 * Complete interactive screen matching 10-shelter.html:
 * - Safe route SVG overlay over shelter-map.jpg
 * - Responsive pins (user start, hospitals, destination shelter)
 * - Draggable and expandable bottom sheet with touch & keyboard controls
 * - Interactive layers popover (River, Inundation zone, Safe Route)
 * - "Get Directions" (Google/Apple maps via services.js) and "Call Shelter"
 */
(function() {
  'use strict';

  window.FS = window.FS || {};
  window.FS.screens = window.FS.screens || {};

  let isSheetCollapsed = false;
  let layersState = { river: true, zones: true, route: true };
  let clickOutsideHandler = null;
  let keyHandler = null;

  function render() {
    const { el } = window.FS.ui;
    const { t } = window.FS.i18n;
    const shelter = (window.FS.DATA.shelters && window.FS.DATA.shelters[0]) || {
      id: 'shelter-taman',
      name: 'Government Senior Secondary School, Taman',
      distText: '3.2 km • 8 min walk',
      lat: 31.3310,
      lng: 75.5820,
      capacity: 500,
      phone: '+91 181 2234567',
      features: [
        'Capacity: 500 people',
        'Safe drinking water supply',
        'Medical assistance & First Aid',
        'Elevated & safe from flood zone'
      ]
    };

    const screen = el('div', { className: 'screen-shelter' });

    // 1. Top Map Pane
    const mapPane = el('div', { className: 'shelter-map-pane' });
    const scene = el('div', { className: 'shelter-scene' });

    // Map background image
    const mapImg = el('img', {
      className: 'shelter-map-bg',
      src: 'assets/shelter-map.jpg',
      alt: 'Map showing safe route to the nearest emergency shelter'
    });
    scene.appendChild(mapImg);

    // Subtle flood water overlay (toggleable via layers)
    const floodOverlay = el('div', {
      className: 'shelter-flood-overlay',
      style: {
        position: 'absolute',
        inset: '0',
        background: 'rgba(59, 130, 246, 0.16)',
        pointerEvents: 'none',
        display: layersState.zones ? 'block' : 'none'
      }
    });
    scene.appendChild(floodOverlay);

    // Safe Route SVG Overlay
    const routeSvg = createRouteSvg();
    routeSvg.style.display = layersState.route ? 'block' : 'none';
    scene.appendChild(routeSvg);

    // Safe Route Label Pill
    const routePill = el('div', {
      className: 'shelter-safe-pill',
      textContent: t('safeRoutePill') || 'Safe Route',
      style: {
        display: layersState.route ? 'block' : 'none'
      }
    });
    scene.appendChild(routePill);

    // Map Markers:
    // User Pin (Start point)
    const userPin = el('button', {
      className: 'map-marker marker-user',
      style: { left: '17.7%', top: '77.6%' },
      type: 'button',
      'aria-label': 'Your current location',
      onClick: () => window.FS.ui.toast(t('currentLocation') || 'Your current location')
    });
    scene.appendChild(userPin);

    // Hospital Marker 1: Taman PHC
    const hosp1 = el('button', {
      className: 'map-marker marker-hospital',
      style: { left: '51.5%', top: '25%' },
      type: 'button',
      'aria-label': 'Primary Health Centre Taman',
      onClick: () => window.FS.ui.toast('Primary Health Centre Taman • 1.5 km')
    }, [createHospitalSvg()]);
    scene.appendChild(hosp1);

    // Hospital Marker 2: SDH Phillaur
    const hosp2 = el('button', {
      className: 'map-marker marker-hospital',
      style: { left: '32.6%', top: '39.8%' },
      type: 'button',
      'aria-label': 'Sub-Divisional Hospital Phillaur',
      onClick: () => window.FS.ui.toast('Sub-Divisional Hospital Phillaur • 3.8 km')
    }, [createHospitalSvg()]);
    scene.appendChild(hosp2);

    // Shelter Destination Pin
    const shelterPin = el('button', {
      className: 'map-marker marker-shelter',
      style: { left: '83.7%', top: '76.1%' },
      type: 'button',
      'aria-label': shelter.name,
      onClick: () => window.FS.ui.toast(`${shelter.name} (${shelter.distText})`)
    }, [createShelterIconSvg()]);
    scene.appendChild(shelterPin);

    mapPane.appendChild(scene);

    // Top Navigation Controls:
    // Back Button (Top Left)
    const backBtn = el('button', {
      className: 'shelter-fab-btn left',
      type: 'button',
      'aria-label': 'Back to map',
      onClick: () => {
        if (window.history.length > 1) {
          window.history.back();
        } else {
          window.FS.router.navigate('/map');
        }
      }
    }, [createBackArrowSvg()]);
    mapPane.appendChild(backBtn);

    // Layers Button (Top Right)
    const layersBtn = el('button', {
      className: 'shelter-fab-btn right',
      type: 'button',
      'aria-label': t('layers') || 'Map layers',
      'aria-expanded': 'false',
      onClick: (e) => {
        e.stopPropagation();
        toggleLayersPopover();
      }
    }, [createLayersSvg()]);
    mapPane.appendChild(layersBtn);

    // Layers Popover
    const layersPopover = el('div', {
      className: 'map-layers-popover',
      id: 'shelter-layers-popover',
      style: { top: '64px', right: '14px' }
    }, [
      el('div', { className: 'layers-title', textContent: t('layers') || 'Layers' }),
      createLayerCheckbox('shelter-zones', t('layerZones') || 'Flood zones', layersState.zones, (checked) => {
        layersState.zones = checked;
        floodOverlay.style.display = checked ? 'block' : 'none';
      }),
      createLayerCheckbox('shelter-route', t('safeRoutePill') || 'Safe Route', layersState.route, (checked) => {
        layersState.route = checked;
        routeSvg.style.display = checked ? 'block' : 'none';
        routePill.style.display = checked ? 'block' : 'none';
      })
    ]);
    mapPane.appendChild(layersPopover);

    screen.appendChild(mapPane);

    // 2. Expandable Bottom Sheet
    const sheet = el('section', {
      className: `shelter-sheet ${isSheetCollapsed ? 'collapsed' : ''}`,
      'aria-label': t('nearestShelterTitle') || 'Nearest safe shelter'
    });

    // Grab handle for drag / click toggle
    const grabHandle = el('button', {
      className: 'shelter-grab-handle',
      type: 'button',
      'aria-label': isSheetCollapsed ? 'Expand shelter details' : 'Collapse shelter details',
      'aria-expanded': isSheetCollapsed ? 'false' : 'true',
      onClick: () => toggleSheet()
    });
    sheet.appendChild(grabHandle);

    // Add touch drag gesture to the sheet header / handle
    let touchStartY = 0;
    let touchDiffY = 0;
    sheet.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
      touchDiffY = 0;
    }, { passive: true });

    sheet.addEventListener('touchmove', (e) => {
      touchDiffY = e.touches[0].clientY - touchStartY;
    }, { passive: true });

    sheet.addEventListener('touchend', () => {
      if (touchDiffY > 40 && !isSheetCollapsed) {
        // Swiped down -> collapse
        toggleSheet(true);
      } else if (touchDiffY < -40 && isSheetCollapsed) {
        // Swiped up -> expand
        toggleSheet(false);
      }
    });

    // Sheet Inner Content
    const sheetIn = el('div', { className: 'sheet-inner' });

    // Header info (Tile icon + Titles + Thumbnail)
    const headRow = el('div', { className: 'shelter-head' });

    const tileIcon = el('div', { className: 'shelter-tile-icon' }, [
      createShelterBuildingSvg()
    ]);
    headRow.appendChild(tileIcon);

    const txtBox = el('div', { className: 'shelter-head-txt' }, [
      el('div', { className: 'shelter-badge', textContent: t('nearestShelterTitle') || 'Nearest Safe Shelter' }),
      el('div', { className: 'shelter-name', textContent: shelter.name }),
      el('div', { className: 'shelter-dist', textContent: shelter.distText })
    ]);
    headRow.appendChild(txtBox);

    const thumb = el('div', {
      className: 'shelter-thumb',
      role: 'img',
      'aria-label': 'Government School Shelter Building'
    });
    headRow.appendChild(thumb);

    sheetIn.appendChild(headRow);

    // Features list
    const featGrid = el('div', { className: 'shelter-features' });
    const features = shelter.features || [
      'Capacity: 500 people',
      'Safe drinking water supply',
      'Medical assistance & First Aid',
      'Elevated & safe from flood zone'
    ];
    features.forEach((feat) => {
      featGrid.appendChild(el('div', {
        className: 'shelter-feat-item',
        textContent: feat
      }));
    });
    sheetIn.appendChild(featGrid);

    // Actions: Get Directions + Call Shelter
    const actionsRow = el('div', { className: 'shelter-actions' });

    const dirBtn = el('button', {
      className: 'shelter-dir-btn',
      type: 'button',
      onClick: () => {
        window.FS.services.openDirections(shelter.lat, shelter.lng);
      }
    }, [
      createNavigateSvg(),
      el('span', { textContent: t('getDirections') || 'Get Directions' })
    ]);
    actionsRow.appendChild(dirBtn);

    const callBtn = el('button', {
      className: 'shelter-call-btn',
      type: 'button',
      'aria-label': `${t('callShelter') || 'Call Shelter'} (${shelter.phone})`,
      onClick: () => {
        const cleanPhone = shelter.phone.replace(/[^0-9+]/g, '');
        window.location.href = `tel:${cleanPhone}`;
      }
    }, [
      createPhoneSvg()
    ]);
    actionsRow.appendChild(callBtn);

    sheetIn.appendChild(actionsRow);
    sheet.appendChild(sheetIn);
    screen.appendChild(sheet);

    // Toggle bottom sheet helper
    function toggleSheet(forceCollapsed) {
      if (typeof forceCollapsed === 'boolean') {
        isSheetCollapsed = forceCollapsed;
      } else {
        isSheetCollapsed = !isSheetCollapsed;
      }

      if (isSheetCollapsed) {
        sheet.classList.add('collapsed');
        grabHandle.setAttribute('aria-expanded', 'false');
        grabHandle.setAttribute('aria-label', 'Expand shelter details');
      } else {
        sheet.classList.remove('collapsed');
        grabHandle.setAttribute('aria-expanded', 'true');
        grabHandle.setAttribute('aria-label', 'Collapse shelter details');
      }
    }

    // Toggle layers popover helper
    function toggleLayersPopover() {
      const isVisible = layersPopover.classList.toggle('active');
      layersBtn.setAttribute('aria-expanded', isVisible ? 'true' : 'false');
    }

    // Close layers popover on outside click or escape
    clickOutsideHandler = (e) => {
      if (!layersPopover.contains(e.target) && !layersBtn.contains(e.target)) {
        layersPopover.classList.remove('active');
        layersBtn.setAttribute('aria-expanded', 'false');
      }
    };
    document.addEventListener('click', clickOutsideHandler);

    keyHandler = (e) => {
      if (e.key === 'Escape') {
        layersPopover.classList.remove('active');
        layersBtn.setAttribute('aria-expanded', 'false');
      }
    };
    document.addEventListener('keydown', keyHandler);

    return screen;
  }

  function createLayerCheckbox(id, label, isChecked, onChange) {
    const { el } = window.FS.ui;
    const chk = el('input', {
      type: 'checkbox',
      id: id,
      checked: isChecked,
      onChange: (e) => onChange(e.target.checked)
    });
    return el('label', { className: 'layers-item', htmlFor: id }, [
      chk,
      el('span', { textContent: label })
    ]);
  }

  function createRouteSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'shelter-route-svg');
    svg.setAttribute('viewBox', '0 0 100 72');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');

    svg.innerHTML = `
      <polyline points="24.6,50.8 39.1,49.2 52.9,55 58.7,58.7 63.8,64.9 69.8,63.8 74.7,65.3 77.3,58 79.8,57.2" fill="none" stroke="#7d8799" stroke-width="5.5" stroke-linejoin="round" stroke-linecap="round"/>
      <g stroke-linecap="round" fill="none">
        <path d="M24.6 50.8h.001M39.1 49.2h.001M52.9 55h.001M63.8 64.9h.001M74.7 65.3h.001" stroke="#fff" stroke-width="12"/>
        <path d="M24.6 50.8h.001M39.1 49.2h.001M52.9 55h.001M63.8 64.9h.001M74.7 65.3h.001" stroke="#6c7488" stroke-width="10"/>
      </g>
      <polyline points="23.8,51.1 24.6,44.9 37.3,36.7 51.4,23.8 55,24.6 62.4,38.1 76,43.1 81.8,51.1" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="9.5" stroke-linejoin="round" stroke-linecap="round"/>
      <polyline points="23.8,51.1 24.6,44.9 37.3,36.7 51.4,23.8 55,24.6 62.4,38.1 76,43.1 81.8,51.1" fill="none" stroke="#3b82f6" stroke-width="5.8" stroke-linejoin="round" stroke-linecap="round"/>
      <g stroke-linecap="round" fill="none">
        <path d="M37.3 36.7h.001M76 43.1h.001" stroke="#fff" stroke-width="6"/>
        <path d="M42.1 32.5h.001" stroke="#fff" stroke-width="4.5"/>
        <path d="M51.4 23.8h.001M62.4 38.1h.001" stroke="#fff" stroke-width="16"/>
        <path d="M51.4 23.8h.001M62.4 38.1h.001" stroke="#3b82f6" stroke-width="12"/>
      </g>
    `;
    return svg;
  }

  function createBackArrowSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', '#12172b');
    svg.setAttribute('stroke-width', '2.2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.innerHTML = '<path d="M15 19l-7-7 7-7"/>';
    return svg;
  }

  function createLayersSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', '#12172b');
    svg.setAttribute('stroke-width', '1.8');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.innerHTML = '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 12.5l9 5 9-5M3 16.5l9 5 9-5"/>';
    return svg;
  }

  function createHospitalSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.innerHTML = '<path d="M9.5 4h5v5.5H20v5h-5.5V20h-5v-5.5H4v-5h5.5z" fill="#ef1c24"/>';
    return svg;
  }

  function createShelterIconSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.innerHTML = '<path d="M12 3.5L3 11.5h2.6V20h12.8v-8.5H21z" fill="#fff"/><path d="M10 20v-5h4v5z" fill="#16a05a"/>';
    return svg;
  }

  function createShelterBuildingSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.innerHTML = '<path d="M12 3L3 10.8h2.5V20h13V10.8H21z" fill="#12172b"/><path d="M10 20v-5.2h4V20z" fill="#e4f3e9"/><path d="M8.3 11.5h1.8v1.8H8.3zM13.9 11.5h1.8v1.8h-1.8z" fill="#e4f3e9"/>';
    return svg;
  }

  function createNavigateSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', '#ffffff');
    svg.innerHTML = '<path d="M21 3L3 10.5l7.5 2.2 2.2 7.8z"/>';
    return svg;
  }

  function createPhoneSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', '#16a34a');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.innerHTML = '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>';
    return svg;
  }

  function teardown() {
    if (clickOutsideHandler) {
      document.removeEventListener('click', clickOutsideHandler);
      clickOutsideHandler = null;
    }
    if (keyHandler) {
      document.removeEventListener('keydown', keyHandler);
      keyHandler = null;
    }
  }

  function init() {
    if (window.FS.router) {
      window.FS.router.register('/shelter', {
        title: 'Nearest Safe Shelter',
        showBottomNav: true,
        showSosFab: true,
        render: render,
        teardown: teardown
      });
    }
  }

  window.FS.screens.shelter = {
    init: init,
    render: render,
    teardown: teardown
  };

  init();
})();
