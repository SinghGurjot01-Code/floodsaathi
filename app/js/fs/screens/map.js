/* Screen 3: Map & Risk Analysis (#/map) - Merges Map & Risk Map mockups */
window.FS = window.FS || {};
window.FS.screens = window.FS.screens || {};

window.FS.screens.map = (function() {
  const { el } = window.FS.ui;
  const { t } = window.FS.i18n;

  let activeTab = 'flood'; // 'flood', 'shelters', 'hospitals'
  let layersState = { river: true, zones: true, roads: true };
  let selectedSliderStep = 0;
  let clickOutsideHandler = null;

  function render() {
    const place = window.FS.store.get('place') || window.FS.DATA.places[0];
    const timeSteps = window.FS.DATA.timeToWater || [];
    const currentStepData = timeSteps[selectedSliderStep] || timeSteps[0];

    const screen = el('div', { className: 'screen-map' });

    // 1. Top Header Bar: Segmented Tabs + Layers Button
    const headerBar = el('div', { className: 'map-header-bar' });
    const tabsContainer = el('div', { className: 'map-tabs', role: 'tablist', 'aria-label': 'Map views' });

    const tabDefs = [
      { id: 'flood', labelKey: 'floodRiskTab' },
      { id: 'shelters', labelKey: 'sheltersTab' },
      { id: 'hospitals', labelKey: 'hospitalsTab' }
    ];

    tabDefs.forEach((tab) => {
      const isCurrent = activeTab === tab.id;
      const btn = el('button', {
        className: `map-tab-btn ${isCurrent ? 'active' : ''}`,
        type: 'button',
        role: 'tab',
        'aria-selected': isCurrent ? 'true' : 'false',
        textContent: t(tab.labelKey),
        onClick: () => {
          activeTab = tab.id;
          window.FS.router.renderCurrent();
        }
      });
      tabsContainer.appendChild(btn);
    });

    const layersBtn = el('button', {
      className: 'map-layers-btn',
      type: 'button',
      'aria-label': t('layers'),
      'aria-expanded': 'false',
      onClick: (e) => {
        e.stopPropagation();
        toggleLayersPopover();
      }
    }, [
      createLayersSvg()
    ]);

    headerBar.appendChild(tabsContainer);
    headerBar.appendChild(layersBtn);
    screen.appendChild(headerBar);

    // Layers Popover
    const layersPopover = el('div', { className: 'map-layers-popover', id: 'layers-popover' }, [
      el('div', { className: 'layers-title', textContent: t('layers') }),
      createLayerCheckbox('river', t('layerRiver'), layersState.river, (checked) => {
        layersState.river = checked;
        const riverEl = screen.querySelector('.map-river-label');
        if (riverEl) riverEl.style.display = checked ? 'block' : 'none';
      }),
      createLayerCheckbox('zones', t('layerZones'), layersState.zones, (checked) => {
        layersState.zones = checked;
        const overlay = screen.querySelector('.map-water-overlay');
        if (overlay) overlay.style.display = checked ? 'block' : 'none';
      }),
      createLayerCheckbox('roads', t('layerRoads'), layersState.roads, (checked) => {
        layersState.roads = checked;
        const routeSvg = screen.querySelector('.map-route-svg');
        if (routeSvg) routeSvg.style.display = checked ? 'block' : 'none';
      })
    ]);
    screen.appendChild(layersPopover);

    // 2. Map Stage Container (Scales proportionately across all screens)
    const stage = el('div', { className: 'map-stage' });
    const imgWrapper = el('div', { className: 'map-image-wrapper' });

    // Map Background Image
    const mapImg = el('img', {
      className: 'map-img',
      src: 'assets/riverside-map.jpg',
      alt: 'Flood risk map around Taman and Beas River'
    });
    imgWrapper.appendChild(mapImg);

    // Water Inundation Simulation Overlay
    const waterOverlay = el('div', {
      className: 'map-water-overlay',
      style: {
        opacity: String(currentStepData.waterOpacity),
        display: layersState.zones ? 'block' : 'none'
      }
    });
    imgWrapper.appendChild(waterOverlay);

    // River Waterway Label
    const riverLbl = el('div', {
      className: 'map-river-label',
      style: {
        position: 'absolute',
        left: '42%',
        top: '49%',
        transform: 'translate(-50%, -50%) rotate(15deg)',
        fontSize: '13px',
        fontWeight: '600',
        fontStyle: 'italic',
        color: '#2563eb',
        textShadow: '0 0 4px #ffffff, 0 0 4px #ffffff',
        pointerEvents: 'none',
        display: layersState.river ? 'block' : 'none'
      },
      textContent: place.river || 'Beas River'
    });
    imgWrapper.appendChild(riverLbl);

    // Safe Route SVG Overlay
    const routeSvg = createRouteSvg();
    routeSvg.style.display = layersState.roads ? 'block' : 'none';
    imgWrapper.appendChild(routeSvg);

    // Markers plotted in % coordinates
    renderMarkers(imgWrapper, activeTab, place, (clickedInfo) => {
      showMarkerDetails(clickedInfo);
    });

    stage.appendChild(imgWrapper);
    screen.appendChild(stage);

    // 3. Bottom Card (Default view showing place risk & view details trigger)
    const bottomCard = el('div', { className: 'map-bottom-card', id: 'map-bottom-card' });
    const cardTop = el('div', { className: 'map-card-top' });

    const cardInfo = el('div', { className: 'map-card-info' }, [
      el('b', { id: 'card-place-name', textContent: place.name }),
      el('span', { id: 'card-risk-label', textContent: currentStepData.risk + ' Risk' })
    ]);

    const viewDetailsBtn = el('button', {
      className: 'map-view-details-btn',
      type: 'button',
      onClick: () => {
        timeSheet.classList.add('open');
      }
    }, [
      document.createTextNode(t('viewDetails') + ' '),
      createChevronRightSvg()
    ]);

    cardTop.appendChild(cardInfo);
    cardTop.appendChild(viewDetailsBtn);
    bottomCard.appendChild(cardTop);

    // Risk Legend
    const legend = el('div', { className: 'map-legend' }, [
      el('div', { className: 'legend-item' }, [
        el('span', { className: 'legend-dot red' }),
        el('span', { textContent: t('highRisk') })
      ]),
      el('div', { className: 'legend-item' }, [
        el('span', { className: 'legend-dot orange' }),
        el('span', { textContent: t('moderateRisk') })
      ]),
      el('div', { className: 'legend-item' }, [
        el('span', { className: 'legend-dot green' }),
        el('span', { textContent: t('lowRisk') })
      ])
    ]);
    bottomCard.appendChild(legend);
    screen.appendChild(bottomCard);

    // 4. Time-to-Water Sheet Panel (Opened via "View details")
    const timeSheet = el('section', {
      className: 'time-water-sheet',
      id: 'time-water-sheet',
      'aria-label': 'Time to water and flood depth simulation'
    });

    const timeHeader = el('div', { className: 'time-water-header' }, [
      el('h3', { style: { fontSize: '18px', fontWeight: '700' }, textContent: place.name }),
      el('button', {
        className: 'fs-dialog-close',
        type: 'button',
        'aria-label': 'Close simulation panel',
        onClick: () => timeSheet.classList.remove('open')
      }, [createSvgClose()])
    ]);
    timeSheet.appendChild(timeHeader);

    const metricsWrap = el('div', { className: 'time-water-metrics' });

    // Time-to-water metric tile
    const timeMetricTile = el('div', { className: 'time-tile' }, [
      el('div', { className: 'time-tile-icon' }, [createClockSvg()]),
      el('div', { className: 'time-tile-txt' }, [
        el('span', { textContent: t('timeToWaterTitle') }),
        el('b', { id: 'time-hours-val', textContent: currentStepData.hours })
      ])
    ]);

    // Depth metric tile
    const depthMetricTile = el('div', { className: 'time-tile blue' }, [
      el('div', { className: 'time-tile-icon' }, [createDepthSvg()]),
      el('div', { className: 'time-tile-txt' }, [
        el('span', { textContent: t('likelyDepth') }),
        el('b', { id: 'time-depth-val', textContent: currentStepData.depth })
      ])
    ]);

    metricsWrap.appendChild(timeMetricTile);
    metricsWrap.appendChild(depthMetricTile);
    timeSheet.appendChild(metricsWrap);

    // Interactive Time Slider
    const sliderWrap = el('div', { className: 'time-slider-wrap' });
    const rangeInput = el('input', {
      type: 'range',
      className: 'time-range-input',
      min: '0',
      max: String(timeSteps.length - 1),
      step: '1',
      value: String(selectedSliderStep),
      'aria-label': 'Flood timeline in hours',
      onInput: (e) => {
        selectedSliderStep = parseInt(e.target.value, 10);
        updateSliderView();
      }
    });

    const ticksRow = el('div', { className: 'time-ticks' });
    timeSteps.forEach((s, idx) => {
      const lbl = el('span', {
        className: 'time-tick-lbl',
        style: { cursor: 'pointer', fontWeight: idx === selectedSliderStep ? '700' : '500' },
        textContent: s.label,
        onClick: () => {
          selectedSliderStep = idx;
          rangeInput.value = String(idx);
          updateSliderView();
        }
      });
      ticksRow.appendChild(lbl);
    });

    sliderWrap.appendChild(rangeInput);
    sliderWrap.appendChild(ticksRow);
    timeSheet.appendChild(sliderWrap);

    // Informational Note
    const infoNote = el('div', { className: 'time-info-note' }, [
      createAlertSmallSvg(),
      el('span', { id: 'time-note-text', textContent: currentStepData.note || t('basedOnNote') })
    ]);
    timeSheet.appendChild(infoNote);

    screen.appendChild(timeSheet);

    function updateSliderView() {
      const data = timeSteps[selectedSliderStep] || timeSteps[0];
      const hoursEl = document.getElementById('time-hours-val');
      const depthEl = document.getElementById('time-depth-val');
      const noteEl = document.getElementById('time-note-text');
      const cardRiskEl = document.getElementById('card-risk-label');

      if (hoursEl) hoursEl.textContent = data.hours;
      if (depthEl) depthEl.textContent = data.depth;
      if (noteEl) noteEl.textContent = data.note;
      if (cardRiskEl) {
        cardRiskEl.textContent = `${data.risk} Risk (${data.label})`;
        cardRiskEl.style.color = data.color;
      }

      if (waterOverlay) {
        waterOverlay.style.opacity = String(data.waterOpacity);
      }

      // Update tick bolding
      ticksRow.querySelectorAll('.time-tick-lbl').forEach((tEl, idx) => {
        tEl.style.fontWeight = idx === selectedSliderStep ? '700' : '500';
      });
    }

    function toggleLayersPopover() {
      const isOpen = layersPopover.classList.contains('open');
      if (isOpen) {
        layersPopover.classList.remove('open');
        layersBtn.setAttribute('aria-expanded', 'false');
        if (clickOutsideHandler) {
          window.removeEventListener('click', clickOutsideHandler);
          clickOutsideHandler = null;
        }
      } else {
        layersPopover.classList.add('open');
        layersBtn.setAttribute('aria-expanded', 'true');
        setTimeout(() => {
          clickOutsideHandler = (ev) => {
            if (!layersPopover.contains(ev.target) && ev.target !== layersBtn) {
              toggleLayersPopover();
            }
          };
          window.addEventListener('click', clickOutsideHandler);
        }, 10);
      }
    }

    function showMarkerDetails(info) {
      const card = document.getElementById('map-bottom-card');
      const nameEl = document.getElementById('card-place-name');
      const riskEl = document.getElementById('card-risk-label');

      if (nameEl) nameEl.textContent = info.name;
      if (riskEl) riskEl.textContent = `${info.dist} • ${info.type}`;

      if (info.type === 'Shelter') {
        window.FS.ui.toast(`Shelter: ${info.name}. Tap to view route.`, {
          action: {
            label: 'View Shelter',
            onClick: () => window.FS.router.navigate('/shelter')
          }
        });
      } else if (info.type === 'Hospital') {
        window.FS.ui.toast(`Hospital: ${info.name} (${info.phone || '108'})`);
      }
    }

    return screen;
  }

  function teardown() {
    if (clickOutsideHandler) {
      window.removeEventListener('click', clickOutsideHandler);
      clickOutsideHandler = null;
    }
  }

  function renderMarkers(container, tab, userPlace, onMarkerClick) {
    const { el } = window.FS.ui;

    // 1. User Location Marker (Always visible)
    const userMarker = el('div', {
      className: 'map-marker',
      style: { left: '49%', top: '65%' },
      role: 'button',
      tabIndex: 0,
      'aria-label': `Your location: ${userPlace.name}`,
      onClick: () => onMarkerClick({ name: userPlace.name, dist: '0 km', type: 'Current Location' })
    }, [
      el('div', { className: 'marker-user' }),
      el('div', { className: 'marker-user-label', textContent: userPlace.name.split(',')[0] })
    ]);
    container.appendChild(userMarker);

    // 2. Shelters
    if (tab === 'flood' || tab === 'shelters') {
      const shelterCoords = [
        { name: 'Govt School Taman', left: '56%', top: '26%', dist: '3.2 km' },
        { name: 'Phillaur Relief Camp', left: '65%', top: '58%', dist: '4.8 km' },
        { name: 'Khalsa Aid Centre', left: '34%', top: '75%', dist: '6.1 km' },
        { name: 'Kapurthala Shelter', left: '12%', top: '48%', dist: '8.5 km' },
        { name: 'Sultanpur Camp', left: '74%', top: '78%', dist: '7.2 km' }
      ];

      shelterCoords.forEach((s) => {
        const marker = el('button', {
          className: 'map-marker marker-shelter',
          style: { left: s.left, top: s.top },
          type: 'button',
          'aria-label': `Shelter: ${s.name}`,
          onClick: () => onMarkerClick({ name: s.name, dist: s.dist, type: 'Shelter' })
        }, [createHouseSvg()]);
        container.appendChild(marker);
      });
    }

    // 3. Hospitals
    if (tab === 'flood' || tab === 'hospitals') {
      const hospitalCoords = [
        { name: 'Primary Health Centre Taman', left: '52%', top: '38%', dist: '1.5 km', phone: '108' },
        { name: 'Sub-Divisional Hospital Phillaur', left: '32%', top: '42%', dist: '3.8 km', phone: '108' },
        { name: 'Civil Hospital Jalandhar', left: '88%', top: '62%', dist: '5.4 km', phone: '108' }
      ];

      hospitalCoords.forEach((h) => {
        const marker = el('button', {
          className: 'map-marker marker-hospital',
          style: { left: h.left, top: h.top },
          type: 'button',
          'aria-label': `Hospital: ${h.name}`,
          onClick: () => onMarkerClick({ name: h.name, dist: h.dist, type: 'Hospital', phone: h.phone })
        }, [createHospitalCrossSvg()]);
        container.appendChild(marker);
      });
    }

    // 4. Danger flood points
    if (tab === 'flood') {
      const dangerCoords = [
        { name: 'Beas Embankment Breach Alert', left: '16%', top: '38%', dist: '2.1 km' },
        { name: 'Low Causeway Submerged', left: '84%', top: '42%', dist: '3.5 km' }
      ];

      dangerCoords.forEach((d) => {
        const marker = el('button', {
          className: 'map-marker marker-danger',
          style: { left: d.left, top: d.top },
          type: 'button',
          'aria-label': `Hazard: ${d.name}`,
          onClick: () => onMarkerClick({ name: d.name, dist: d.dist, type: 'Flood Hazard' })
        }, [createDangerSvg()]);
        container.appendChild(marker);
      });
    }
  }

  function createLayerCheckbox(id, label, isChecked, onChange) {
    const { el } = window.FS.ui;
    const chk = el('input', {
      type: 'checkbox',
      id: `layer-${id}`,
      checked: isChecked,
      onChange: (e) => onChange(e.target.checked)
    });
    return el('label', { className: 'layers-item', htmlFor: `layer-${id}` }, [
      chk,
      el('span', { textContent: label })
    ]);
  }

  function createRouteSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'map-route-svg');
    svg.setAttribute('viewBox', '0 0 100 90');
    svg.setAttribute('style', 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;');
    svg.innerHTML = '<path d="M49 65 L56 50 L65 42 L56 26" fill="none" stroke="#ef1c24" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="3,3"/>';
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

  function createHouseSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.innerHTML = '<path d="M12 3.5L3.5 11H6v8.5h12V11h2.5z" fill="#fff"/><path d="M10 19.5v-5h4v5z" fill="#16a34a"/>';
    return svg;
  }

  function createHospitalCrossSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.innerHTML = '<path d="M9.5 4h5v5.5H20v5h-5.5V20h-5v-5.5H4v-5h5.5z" fill="#ef1c24"/>';
    return svg;
  }

  function createDangerSvg() {
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

  function createClockSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', '#ef1c24');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.innerHTML = '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>';
    return svg;
  }

  function createDepthSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', '#2f6fe4');
    svg.setAttribute('stroke-width', '1.8');
    svg.setAttribute('stroke-linecap', 'round');
    svg.innerHTML = '<path d="M12 3v7M8.5 6.5L12 3l3.5 3.5"/><path d="M3 14c2-1.5 3.5-1.5 5.5 0s3.5 1.5 5.5 0 3.5-1.5 5.5 0M3 18.5c2-1.5 3.5-1.5 5.5 0s3.5 1.5 5.5 0 3.5-1.5 5.5 0"/>';
    return svg;
  }

  function createAlertSmallSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', '#2b3347');
    svg.setAttribute('stroke-width', '1.8');
    svg.setAttribute('stroke-linecap', 'round');
    svg.innerHTML = '<path d="M12 3.5L21 20H3z"/><path d="M12 10v4.5M12 17.3v.2"/>';
    return svg;
  }

  function createChevronRightSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2.4');
    svg.setAttribute('stroke-linecap', 'round');
    svg.innerHTML = '<path d="M9 5l7 7-7 7"/>';
    return svg;
  }

  function createSvgClose() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '18');
    svg.setAttribute('height', '18');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2.2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.innerHTML = '<path d="M18 6L6 18M6 6l12 12"/>';
    return svg;
  }

  return {
    render: render,
    teardown: teardown
  };
})();

window.FS.router.register('/map', window.FS.screens.map);
