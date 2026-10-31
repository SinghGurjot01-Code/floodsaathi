/* Screen 9: Emergency SOS & Family Check-in (#/emergency) */
window.FS = window.FS || {};
window.FS.screens = window.FS.screens || {};

window.FS.screens.emergency = (function() {
  const { el } = window.FS.ui;
  const { t, getLang } = window.FS.i18n;

  let pressTimer = null;
  let progressInterval = null;
  let countdownTimer = null;
  let pressStartTime = 0;
  const HOLD_DURATION_MS = 1500;

  function render() {
    const contacts = window.FS.store.get('contacts') || [];
    const lastSafeAt = window.FS.store.get('lastSafeAt');

    const screen = el('div', { className: 'screen-emergency' });

    screen.appendChild(el('h1', { className: 'emergency-title', textContent: t('emergencyTitle') }));
    screen.appendChild(el('p', { className: 'emergency-sub', textContent: t('emergencySub') }));

    // 1. Big SOS Button with Animated Rings & Press Progress
    const sosWrapper = el('div', { className: 'sos-button-wrapper' });

    // Concentric pulse rings
    sosWrapper.appendChild(el('span', { className: 'sos-ring r1', 'aria-hidden': 'true' }));
    sosWrapper.appendChild(el('span', { className: 'sos-ring r2', 'aria-hidden': 'true' }));
    sosWrapper.appendChild(el('span', { className: 'sos-ring r3', 'aria-hidden': 'true' }));

    // Progress SVG ring (circumference = 2 * PI * 75 = 471)
    const progressSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    progressSvg.setAttribute('class', 'sos-press-progress');
    progressSvg.setAttribute('viewBox', '0 0 160 160');
    progressSvg.innerHTML = '<circle cx="80" cy="80" r="75"/>';
    sosWrapper.appendChild(progressSvg);

    const circleEl = progressSvg.querySelector('circle');

    // SOS Big Button
    const sosBtn = el('button', {
      className: 'sos-big-btn',
      type: 'button',
      'aria-describedby': 'sos-instruction',
      textContent: 'SOS'
    });

    // Touch & Mouse Press-and-Hold (1.5s) handlers
    function startHold(e) {
      if (countdownTimer) return;
      pressStartTime = Date.now();

      if (progressInterval) clearInterval(progressInterval);
      progressInterval = setInterval(() => {
        const elapsed = Date.now() - pressStartTime;
        const progress = Math.min(1, elapsed / HOLD_DURATION_MS);
        const offset = 471 * (1 - progress);
        if (circleEl) circleEl.style.strokeDashoffset = String(offset);

        if (elapsed >= HOLD_DURATION_MS) {
          clearHold();
          triggerCountdown();
        }
      }, 30);
    }

    function clearHold() {
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
      if (circleEl) circleEl.style.strokeDashoffset = '471';
    }

    sosBtn.addEventListener('mousedown', startHold);
    window.addEventListener('mouseup', clearHold);
    sosBtn.addEventListener('touchstart', (e) => {
      startHold(e);
    }, { passive: true });
    window.addEventListener('touchend', clearHold);
    window.addEventListener('touchcancel', clearHold);

    // Fallback: Click triggers confirmation modal directly if not held
    sosBtn.addEventListener('click', () => {
      const elapsed = Date.now() - pressStartTime;
      if (elapsed < HOLD_DURATION_MS - 200) {
        confirmSosModal();
      }
    });

    sosWrapper.appendChild(sosBtn);
    screen.appendChild(sosWrapper);

    screen.appendChild(el('p', { className: 'sos-instruction-tap', textContent: t('tapToSend') }));
    screen.appendChild(el('p', {
      className: 'sos-instruction-desc',
      id: 'sos-instruction',
      textContent: t('sosHelpDesc')
    }));

    // 2. Quick Actions: Call 112 & Send SMS
    const quickActions = el('div', { className: 'emergency-quick-actions' });

    const callBtn = el('a', {
      className: 'quick-action-btn',
      href: 'tel:112',
      'aria-label': 'Call 112 Emergency Police, Fire and Ambulance'
    }, [
      createPhoneSvg(),
      document.createTextNode(t('call112'))
    ]);

    const defaultSmsUrl = window.FS.services.buildSmsUrl(
      contacts.map(c => c.phone),
      'EMERGENCY - I need flood assistance. Please contact me immediately. - FloodSaathi'
    );

    const smsBtn = el('a', {
      className: 'quick-action-btn',
      href: defaultSmsUrl,
      'aria-label': 'Send emergency SMS'
    }, [
      createSmsSvg(),
      document.createTextNode(t('sendSms'))
    ]);

    quickActions.appendChild(callBtn);
    quickActions.appendChild(smsBtn);
    screen.appendChild(quickActions);

    // 3. Family Check-in Section
    const familyCard = el('section', { className: 'emergency-family-card', 'aria-label': t('familyCheckin') });

    const familyHead = el('div', { className: 'family-header' }, [
      el('div', { className: 'family-header-left' }, [
        el('div', { className: 'family-icon' }, [createUsersSvg()]),
        el('div', { className: 'family-title' }, [
          el('b', { textContent: t('familyCheckin') }),
          el('span', { textContent: t('familySub') })
        ])
      ]),
      // "I'm Safe" Button
      el('button', {
        className: 'im-safe-btn',
        id: 'im-safe-btn',
        type: 'button',
        onClick: handleImSafeClick
      }, [
        createCheckmarkSvg(),
        document.createTextNode(t('imSafe'))
      ])
    ]);
    familyCard.appendChild(familyHead);

    // Last safe status time
    if (lastSafeAt) {
      const lastSafeText = el('div', {
        className: 'last-safe-text',
        textContent: `${t('lastCheckedIn')}: ${formatLastSafeTime(lastSafeAt)}`
      });
      familyCard.appendChild(lastSafeText);
    }

    // Contacts List
    const contactsWrap = el('div', { className: 'contacts-list' });

    if (contacts.length === 0) {
      contactsWrap.appendChild(el('div', {
        style: { fontSize: '13px', color: 'var(--muted)', padding: '6px 0' },
        textContent: 'No family contacts added yet. Add trusted contacts to alert them with 1 touch.'
      }));
    } else {
      contacts.forEach((c) => {
        const item = el('div', { className: 'contact-item' }, [
          el('div', { className: 'contact-info' }, [
            el('b', { textContent: c.name }),
            el('span', { textContent: c.phone })
          ]),
          el('button', {
            className: 'contact-delete-btn',
            type: 'button',
            'aria-label': `Remove ${c.name}`,
            onClick: () => {
              const updated = contacts.filter(x => x.id !== c.id);
              window.FS.store.set('contacts', updated);
              window.FS.router.renderCurrent();
            }
          }, [createTrashSvg()])
        ]);
        contactsWrap.appendChild(item);
      });
    }
    familyCard.appendChild(contactsWrap);

    // Add Contact Button (if < 5 contacts)
    if (contacts.length < 5) {
      const addBtn = el('button', {
        className: 'add-contact-btn',
        type: 'button',
        onClick: openAddContactModal
      }, [
        createPlusSvg(),
        document.createTextNode(t('addContact'))
      ]);
      familyCard.appendChild(addBtn);
    }

    screen.appendChild(familyCard);

    // 4. 5-Second Cancellable Countdown Modal Overlay
    const countdownOverlay = el('div', { className: 'sos-countdown-modal', id: 'sos-countdown-overlay' });
    const countNum = el('div', { className: 'countdown-number', id: 'countdown-num', textContent: '5' });
    const countDesc = el('h2', {
      style: { fontSize: '20px', fontWeight: '700' },
      textContent: 'PREPARING EMERGENCY SOS ALERT'
    });
    const countSub = el('p', {
      style: { fontSize: '14px', color: '#e2e8f0', marginTop: '6px' },
      textContent: 'Alert will be dispatched to your emergency contacts...'
    });

    const cancelBtn = el('button', {
      className: 'countdown-cancel-btn',
      type: 'button',
      textContent: 'CANCEL SOS',
      onClick: cancelCountdown
    });

    countdownOverlay.appendChild(countDesc);
    countdownOverlay.appendChild(countNum);
    countdownOverlay.appendChild(countSub);
    countdownOverlay.appendChild(cancelBtn);
    screen.appendChild(countdownOverlay);

    // Countdown Logic
    function triggerCountdown() {
      countdownOverlay.classList.add('active');
      let remaining = 5;
      countNum.textContent = String(remaining);

      if (countdownTimer) clearInterval(countdownTimer);
      countdownTimer = setInterval(() => {
        remaining -= 1;
        if (remaining > 0) {
          countNum.textContent = String(remaining);
        } else {
          clearInterval(countdownTimer);
          countdownTimer = null;
          countdownOverlay.classList.remove('active');
          dispatchEmergencyAlert();
        }
      }, 1000);
    }

    function cancelCountdown() {
      if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
      }
      countdownOverlay.classList.remove('active');
      window.FS.ui.toast('Emergency SOS cancelled.', { type: 'info' });
    }

    function confirmSosModal() {
      const modalBody = el('div', { style: { display: 'flex', flexDirection: 'column', gap: '16px' } }, [
        el('p', {
          style: { fontSize: '15px', color: 'var(--navy)', lineHeight: '1.5' },
          textContent: 'Are you sure you want to trigger the Emergency SOS broadcast?'
        }),
        el('div', { style: { display: 'flex', gap: '10px' } }, [
          el('button', {
            className: 'quick-action-btn',
            style: { flex: '1', height: '48px', background: 'var(--red)', color: '#fff' },
            type: 'button',
            textContent: 'Yes, Send SOS',
            onClick: () => {
              window.FS.ui.closeModal();
              triggerCountdown();
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
        title: 'Confirm Emergency SOS',
        contentEl: modalBody
      });
    }

    async function dispatchEmergencyAlert() {
      let locStr = 'Location: Unavailable';
      try {
        const coords = await window.FS.services.getLocation(5000);
        locStr = `Location: https://maps.google.com/?q=${coords.lat},${coords.lng}`;
      } catch (_) {
        const savedPlace = window.FS.store.get('place');
        if (savedPlace) {
          locStr = `Near: ${savedPlace.name} (https://maps.google.com/?q=${savedPlace.lat},${savedPlace.lng})`;
        }
      }

      let batteryStr = '';
      try {
        const batt = await window.FS.services.getBatteryInfo();
        if (batt) {
          batteryStr = `Battery: ${batt.level}%`;
        }
      } catch (_) {}

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const currentContacts = window.FS.store.get('contacts') || [];

      const fullMessage = [
        'EMERGENCY - I need help with flood situation.',
        locStr,
        batteryStr,
        `Time: ${timeStr}`,
        '- via FloodSaathi'
      ].filter(Boolean).join(' ');

      if (!currentContacts.length) {
        // No contacts saved: prompt to add contact or share directly
        openAddContactModal(() => {
          window.FS.services.shareData({
            title: 'EMERGENCY SOS',
            text: fullMessage
          });
        });
        return;
      }

      // Open SMS app with contacts & prefilled text
      const phoneList = currentContacts.map(c => c.phone);
      const smsLink = window.FS.services.buildSmsUrl(phoneList, fullMessage);

      // Open SMS window
      window.location.href = smsLink;

      // Show Prepared Success Modal with Call 112 & Share fallback
      showSosSuccessModal(fullMessage);
    }

    function showSosSuccessModal(msg) {
      const content = el('div', { style: { display: 'flex', flexDirection: 'column', gap: '14px' } }, [
        el('p', {
          style: { fontSize: '15px', color: 'var(--navy)', lineHeight: '1.5' },
          textContent: 'Your emergency SMS has been prepared. If your messaging app did not open, you can share or call below:'
        }),
        el('div', {
          style: { background: 'var(--card-grey)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '13px', wordBreak: 'break-word' },
          textContent: msg
        }),
        el('div', { style: { display: 'flex', gap: '10px', marginTop: '6px' } }, [
          el('a', {
            className: 'quick-action-btn',
            style: { flex: '1', height: '48px', background: 'var(--green)', color: '#fff' },
            href: 'tel:112'
          }, [
            createPhoneSvg(),
            document.createTextNode(' Call 112')
          ]),
          el('button', {
            className: 'quick-action-btn',
            style: { flex: '1', height: '48px', background: 'var(--navy)', color: '#fff' },
            type: 'button',
            onClick: () => {
              window.FS.services.shareData({
                title: 'EMERGENCY SOS',
                text: msg
              });
            }
          }, [
            createShareSvg(),
            document.createTextNode(' Share')
          ])
        ])
      ]);

      window.FS.ui.openModal({
        title: 'SOS Alert Dispatched',
        contentEl: content
      });
    }

    // "I'm Safe" Check-in Handler
    async function handleImSafeClick() {
      const btn = document.getElementById('im-safe-btn');
      if (btn) btn.disabled = true;

      const savedPlace = window.FS.store.get('place') || { name: 'Punjab' };
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const safeMsg = `I am safe from the flood. Status: OK at ${savedPlace.name}. Time: ${timeStr} - via FloodSaathi`;

      const currentContacts = window.FS.store.get('contacts') || [];
      window.FS.store.set('lastSafeAt', Date.now());

      if (currentContacts.length) {
        const smsUrl = window.FS.services.buildSmsUrl(currentContacts.map(c => c.phone), safeMsg);
        window.location.href = smsUrl;
      } else {
        window.FS.services.shareData({
          title: "I'm Safe",
          text: safeMsg
        });
      }

      window.FS.ui.toast(t('safeSentToast'), { type: 'success' });

      // Refresh view to update timestamp
      setTimeout(() => {
        window.FS.router.renderCurrent();
      }, 500);

      // Disable button for 5s to prevent double sends
      setTimeout(() => {
        if (btn) btn.disabled = false;
      }, 5000);
    }

    function openAddContactModal(onAdded) {
      const form = el('form', {
        style: { display: 'flex', flexDirection: 'column', gap: '14px' },
        onSubmit: (e) => {
          e.preventDefault();
          const nameInput = form.querySelector('#contact-name');
          const phoneInput = form.querySelector('#contact-phone');

          const name = nameInput.value.trim();
          let phone = phoneInput.value.replace(/[^0-9+]/g, '').trim();

          if (!name) {
            window.FS.ui.toast('Please enter contact name', { type: 'warning' });
            return;
          }

          // Validate Indian mobile (10 digits or starting with +91)
          const digitsOnly = phone.replace(/[^0-9]/g, '');
          if (digitsOnly.length < 10) {
            window.FS.ui.toast(t('invalidPhone'), { type: 'warning' });
            return;
          }

          const existing = window.FS.store.get('contacts') || [];
          if (existing.some(c => c.phone === phone)) {
            window.FS.ui.toast('Contact with this number already exists', { type: 'warning' });
            return;
          }

          if (existing.length >= 5) {
            window.FS.ui.toast(t('contactsLimit'), { type: 'warning' });
            return;
          }

          existing.push({
            id: 'c_' + Date.now(),
            name: name,
            phone: phone
          });

          window.FS.store.set('contacts', existing);
          window.FS.ui.closeModal();
          window.FS.ui.toast(`Added ${name} to emergency contacts`, { type: 'success' });
          window.FS.router.renderCurrent();
          if (typeof onAdded === 'function') onAdded();
        }
      });

      form.appendChild(el('label', { style: { fontSize: '13px', fontWeight: '600' } }, [
        document.createTextNode(t('contactName')),
        el('input', {
          id: 'contact-name',
          type: 'text',
          className: 'saathi-input',
          required: true,
          placeholder: 'e.g., Brother, Gurpreet',
          style: { width: '100%', height: '44px', marginTop: '4px' }
        })
      ]));

      form.appendChild(el('label', { style: { fontSize: '13px', fontWeight: '600' } }, [
        document.createTextNode(t('contactPhone')),
        el('input', {
          id: 'contact-phone',
          type: 'tel',
          className: 'saathi-input',
          required: true,
          placeholder: '9876543210',
          style: { width: '100%', height: '44px', marginTop: '4px' }
        })
      ]));

      form.appendChild(el('button', {
        className: 'quick-action-btn',
        type: 'submit',
        style: { height: '48px', background: 'var(--red)', color: '#fff', marginTop: '8px' },
        textContent: t('saveBtn')
      }));

      window.FS.ui.openModal({
        title: t('addContact'),
        contentEl: form
      });
    }

    return screen;
  }

  function formatLastSafeTime(timestamp) {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    return `${d.toLocaleDateString()} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  function teardown() {
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }
  }

  function createPhoneSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '18');
    svg.setAttribute('height', '18');
    svg.setAttribute('fill', 'currentColor');
    svg.innerHTML = '<path d="M6.6 3.5l2.4-.5c.5-.1 1 .2 1.2.7l1.1 2.8c.2.5 0 1-.4 1.3L9.3 9.1a12 12 0 0 0 5.6 5.6l1.3-1.6c.3-.4.8-.6 1.3-.4l2.8 1.1c.5.2.8.7.7 1.2l-.5 2.4c-.1.7-.7 1.2-1.4 1.2C10.8 18.6 5.4 13.2 5.4 4.9c0-.7.5-1.3 1.2-1.4z"/>';
    return svg;
  }

  function createSmsSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '18');
    svg.setAttribute('height', '18');
    svg.setAttribute('fill', 'currentColor');
    svg.innerHTML = '<path d="M5 3.5h14a2.5 2.5 0 0 1 2.5 2.5v9a2.5 2.5 0 0 1-2.5 2.5h-6.2L8 21.2v-3.7H5A2.5 2.5 0 0 1 2.5 15V6A2.5 2.5 0 0 1 5 3.5z"/><path d="M8 9.2h.01M12 9.2h.01M16 9.2h.01" stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="none"/>';
    return svg;
  }

  function createUsersSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', '#ef1c24');
    svg.innerHTML = '<circle cx="12" cy="8" r="4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0z"/>';
    return svg;
  }

  function createCheckmarkSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', '#16a05a');
    svg.setAttribute('stroke-width', '3');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.innerHTML = '<path d="M5 12.5l4.5 4.5L19 7.5"/>';
    return svg;
  }

  function createTrashSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '18');
    svg.setAttribute('height', '18');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.innerHTML = '<path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M9 6V4h6v2"/>';
    return svg;
  }

  function createPlusSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '16');
    svg.setAttribute('height', '16');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2.5');
    svg.setAttribute('stroke-linecap', 'round');
    svg.innerHTML = '<path d="M12 5v14M5 12h14"/>';
    return svg;
  }

  function createShareSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '18');
    svg.setAttribute('height', '18');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', '#fff');
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

window.FS.router.register('/emergency', window.FS.screens.emergency);
