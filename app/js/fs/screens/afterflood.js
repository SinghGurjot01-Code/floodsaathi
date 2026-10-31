/* Screen 7: After-Flood Recovery Guide (#/afterflood) */
window.FS = window.FS || {};
window.FS.screens = window.FS.screens || {};

window.FS.screens.afterflood = (function() {
  const { el } = window.FS.ui;
  const { t, getLang } = window.FS.i18n;

  let activeTab = 'safety'; // 'safety', 'health', 'home', 'claims'

  function render() {
    const currentLang = getLang();
    const checklistsData = window.FS.DATA.afterFloodChecklists || {};
    const ticks = window.FS.store.get('checklistTicks') || {};

    const screen = el('div', { className: 'screen-afterflood' });

    // Header
    const header = el('div', { className: 'afterflood-header' }, [
      el('h1', { textContent: t('afterFloodTitle') }),
      el('p', { textContent: t('afterFloodSub') })
    ]);
    screen.appendChild(header);

    // Roving Tablist: Safety / Health / Home / Claims
    const tabsRow = el('div', {
      className: 'guide-tabs',
      role: 'tablist',
      'aria-label': 'Recovery Topics'
    });

    const tabDefs = [
      { id: 'safety', key: 'tabSafety' },
      { id: 'health', key: 'tabHealth' },
      { id: 'home', key: 'tabHome' },
      { id: 'claims', key: 'tabClaims' }
    ];

    const tabButtons = [];

    tabDefs.forEach((tb, index) => {
      const isSelected = activeTab === tb.id;
      const btn = el('button', {
        className: 'guide-tab-btn',
        type: 'button',
        role: 'tab',
        id: `tab-${tb.id}`,
        'aria-selected': isSelected ? 'true' : 'false',
        'aria-controls': `panel-${tb.id}`,
        tabIndex: isSelected ? 0 : -1,
        textContent: t(tb.key),
        onClick: () => {
          activeTab = tb.id;
          window.FS.router.renderCurrent();
        },
        onKeyDown: (e) => {
          handleRovingTabKeyDown(e, index, tabButtons);
        }
      });
      tabButtons.push(btn);
      tabsRow.appendChild(btn);
    });
    screen.appendChild(tabsRow);

    // Content Panel
    const panel = el('section', {
      id: `panel-${activeTab}`,
      role: 'tabpanel',
      'aria-labelledby': `tab-${activeTab}`,
      className: 'guide-section'
    });

    const items = checklistsData[activeTab] || [];
    const completedCount = items.filter(it => Boolean(ticks[it.id])).length;

    // Card with checklist
    const card = el('div', { className: 'guide-card' });

    const cardHeader = el('div', { className: 'guide-card-header' }, [
      el('h3', { textContent: t(`tab${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`) + ' Checklist' }),
      el('span', {
        className: 'guide-progress-badge',
        id: 'guide-progress',
        textContent: `${completedCount} of ${items.length} completed`
      })
    ]);
    card.appendChild(cardHeader);

    const list = el('div', { className: 'guide-checklist' });

    items.forEach((item) => {
      const isChecked = Boolean(ticks[item.id]);
      const labelText = item.text[currentLang] || item.text['en'] || item.text['hi'];

      const checkbox = el('input', {
        type: 'checkbox',
        id: `chk-${item.id}`,
        checked: isChecked,
        onChange: (e) => {
          const currentTicks = Object.assign({}, window.FS.store.get('checklistTicks') || {});
          if (e.target.checked) {
            currentTicks[item.id] = true;
            itemLabel.classList.add('done');
          } else {
            delete currentTicks[item.id];
            itemLabel.classList.remove('done');
          }
          window.FS.store.set('checklistTicks', currentTicks);

          // Update progress badge
          const updatedDone = items.filter(it => Boolean(currentTicks[it.id])).length;
          const badge = document.getElementById('guide-progress');
          if (badge) badge.textContent = `${updatedDone} of ${items.length} completed`;
        }
      });

      const itemLabel = el('label', {
        className: `guide-check-item ${isChecked ? 'done' : ''}`,
        htmlFor: `chk-${item.id}`
      }, [
        checkbox,
        el('span', { textContent: labelText })
      ]);

      list.appendChild(itemLabel);
    });

    card.appendChild(list);
    panel.appendChild(card);
    screen.appendChild(panel);

    return screen;
  }

  function handleRovingTabKeyDown(e, currentIndex, tabButtons) {
    let nextIndex = null;
    if (e.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % tabButtons.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + tabButtons.length) % tabButtons.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = tabButtons.length - 1;
    }

    if (nextIndex !== null) {
      e.preventDefault();
      tabButtons[currentIndex].tabIndex = -1;
      tabButtons[nextIndex].tabIndex = 0;
      tabButtons[nextIndex].focus();
      tabButtons[nextIndex].click();
    }
  }

  return {
    render: render,
    teardown: () => {}
  };
})();

window.FS.router.register('/afterflood', window.FS.screens.afterflood);
