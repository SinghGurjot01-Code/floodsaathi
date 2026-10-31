/* Screen 4: Ask Saathi Chat (#/saathi) - Offline Natural Language Brain */
window.FS = window.FS || {};
window.FS.screens = window.FS.screens || {};

window.FS.screens.saathi = (function() {
  const { el } = window.FS.ui;
  const { t, getLang } = window.FS.i18n;

  let activeSpeech = null;
  let lastSendTime = 0;

  function render() {
    const currentLang = getLang();
    const chatHistory = window.FS.store.get('chat') || [];

    const screen = el('div', { className: 'screen-saathi' });

    // 1. Header with Logo, Title, and Action Buttons
    const header = el('header', { className: 'saathi-header' });

    const logo = el('img', {
      className: 'saathi-logo',
      src: 'assets/saathi-logo.png',
      alt: 'Ask Saathi Logo',
      width: '44',
      height: '44'
    });

    const titleGroup = el('div', { className: 'saathi-title-group' }, [
      el('h1', { textContent: t('askSaathiTitle') }),
      el('p', { textContent: t('askSaathiSub') })
    ]);

    // Download Guide Button (Offline Blob Download)
    const downloadBtn = el('button', {
      className: 'saathi-download-btn',
      type: 'button',
      'aria-label': t('downloadGuide'),
      title: t('downloadGuide'),
      onClick: handleDownloadGuide
    }, [
      createDownloadSvg()
    ]);

    // Clear Chat Button
    const clearBtn = el('button', {
      className: 'saathi-clear-btn',
      type: 'button',
      'aria-label': t('clearChat'),
      title: t('clearChat'),
      onClick: handleClearChat
    }, [
      createTrashSvg()
    ]);

    header.appendChild(logo);
    header.appendChild(titleGroup);
    header.appendChild(downloadBtn);
    header.appendChild(clearBtn);
    screen.appendChild(header);

    // 2. Chat Message Thread
    const thread = el('section', {
      className: 'saathi-thread',
      'aria-live': 'polite',
      'aria-label': 'Saathi Conversation'
    });

    // Initial greeting if history is empty
    if (!chatHistory.length) {
      appendBotGreeting(thread, currentLang);
    } else {
      chatHistory.forEach((msg) => {
        if (msg.sender === 'user') {
          appendUserBubble(thread, msg.text, msg.time, msg.lang || currentLang);
        } else {
          appendBotBubble(thread, msg.card, msg.time, msg.lang || currentLang);
        }
      });
    }

    screen.appendChild(thread);

    // 3. Suggestion Chips Bar
    const chipsBar = el('div', { className: 'saathi-chips', 'aria-label': 'Suggestions' });
    const suggestions = [
      { key: 'chipWaterHouse', query: 'water entered my house' },
      { key: 'chipPurifyWater', query: 'how to purify water' },
      { key: 'chipNearestShelter', query: 'nearest safe shelter' },
      { key: 'chipElectric', query: 'electrical safety flood' }
    ];

    suggestions.forEach((item) => {
      const chip = el('button', {
        className: 'saathi-chip-btn',
        type: 'button',
        textContent: t(item.key),
        onClick: () => {
          submitQuery(t(item.key));
        }
      });
      chipsBar.appendChild(chip);
    });
    screen.appendChild(chipsBar);

    // 4. Composer Input Bar
    const composer = el('div', { className: 'saathi-composer' });

    // Mic Button
    const micBtn = el('button', {
      className: 'saathi-mic-btn',
      type: 'button',
      'aria-label': 'Ask by voice',
      onClick: toggleVoiceInput
    }, [
      createMicSvg()
    ]);

    const inputField = el('input', {
      className: 'saathi-input',
      type: 'text',
      placeholder: t('typeQuestion'),
      'aria-label': t('typeQuestion'),
      onKeyDown: (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          submitQuery(inputField.value);
        }
      },
      onInput: () => {
        sendBtn.disabled = !inputField.value.trim();
      }
    });

    const sendBtn = el('button', {
      className: 'saathi-send-btn',
      type: 'button',
      disabled: true,
      'aria-label': 'Send',
      onClick: () => {
        submitQuery(inputField.value);
      }
    }, [
      createSendSvg()
    ]);

    composer.appendChild(micBtn);
    composer.appendChild(inputField);
    composer.appendChild(sendBtn);
    screen.appendChild(composer);

    // Scroll to bottom
    setTimeout(() => {
      thread.scrollTop = thread.scrollHeight;
    }, 50);

    // Submission handler
    function submitQuery(rawQuery) {
      const query = (rawQuery || '').trim();
      if (!query) return;

      // Debounce 300ms
      const now = Date.now();
      if (now - lastSendTime < 300) return;
      lastSendTime = now;

      inputField.value = '';
      sendBtn.disabled = true;

      const timeStr = formatCurrentTime();

      // 1. Append User Bubble
      appendUserBubble(thread, query, timeStr, currentLang);
      saveChatMessage({ sender: 'user', text: query, time: timeStr, lang: currentLang });
      thread.scrollTop = thread.scrollHeight;

      // 2. Show Typing Indicator
      const typingEl = createTypingIndicator();
      thread.appendChild(typingEl);
      thread.scrollTop = thread.scrollHeight;

      // 3. Offline Brain Search with natural delay
      setTimeout(() => {
        if (typingEl.parentNode) {
          typingEl.parentNode.removeChild(typingEl);
        }

        const matchResult = searchKnowledgeBase(query, currentLang);
        appendBotBubble(thread, matchResult, formatCurrentTime(), currentLang);
        saveChatMessage({ sender: 'bot', card: matchResult, time: formatCurrentTime(), lang: currentLang });
        thread.scrollTop = thread.scrollHeight;
      }, 450);
    }

    function toggleVoiceInput() {
      if (activeSpeech) {
        try { activeSpeech.stop(); } catch (_) {}
        activeSpeech = null;
        micBtn.classList.remove('recording');
        return;
      }

      const langMap = { en: 'en-IN', pa: 'pa-IN', hi: 'hi-IN' };
      const voiceLang = langMap[currentLang] || 'en-IN';

      activeSpeech = window.FS.services.createSpeechRecognizer({
        lang: voiceLang,
        onResult: (text) => {
          if (text) {
            inputField.value = text;
            sendBtn.disabled = false;
            submitQuery(text);
          }
        },
        onError: (err) => {
          micBtn.classList.remove('recording');
          activeSpeech = null;
          if (err !== 'no-speech') {
            window.FS.ui.toast(t('voiceNotSupported'), { type: 'warning' });
          }
        },
        onEnd: () => {
          micBtn.classList.remove('recording');
          activeSpeech = null;
        }
      });

      if (!activeSpeech) {
        window.FS.ui.toast(t('voiceNotSupported'), { type: 'warning' });
        return;
      }

      try {
        activeSpeech.start();
        micBtn.classList.add('recording');
        window.FS.ui.toast(t('listeningVoice'), { duration: 2000 });
      } catch (e) {
        micBtn.classList.remove('recording');
        activeSpeech = null;
        window.FS.ui.toast(t('voiceNotSupported'), { type: 'warning' });
      }
    }

    function handleClearChat() {
      window.FS.store.set('chat', []);
      thread.replaceChildren();
      appendBotGreeting(thread, currentLang);
      window.FS.ui.toast(t('chatCleared'), { type: 'info' });
    }

    return screen;
  }

  function appendBotGreeting(thread, lang) {
    const timeStr = formatCurrentTime();
    const bubble = el('div', { className: 'chat-bubble-bot' }, [
      el('div', { className: 'bot-avatar', 'aria-hidden': 'true' }, [createBotAvatarSvg()]),
      el('article', { className: 'bot-card', lang: lang }, [
        el('h2', { textContent: window.FS.i18n.t('greetingMsg') }),
        el('p', {
          style: { fontSize: '14.5px', color: '#374151', lineHeight: '1.5' },
          textContent: 'I can assist you with flood survival, water purification, emergency shelter routes, snake bites, and power safety.'
        })
      ])
    ]);
    thread.appendChild(bubble);
  }

  function appendUserBubble(thread, text, timeStr, lang) {
    const userWrap = el('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' } }, [
      el('div', { className: 'chat-bubble-user', lang: lang, textContent: text }),
      el('span', { className: 'chat-time', textContent: timeStr })
    ]);
    thread.appendChild(userWrap);
  }

  function appendBotBubble(thread, cardData, timeStr, lang) {
    const bubble = el('div', { className: 'chat-bubble-bot' });
    const avatar = el('div', { className: 'bot-avatar', 'aria-hidden': 'true' }, [createBotAvatarSvg()]);

    const card = el('article', { className: 'bot-card', lang: lang });
    card.appendChild(el('h2', { textContent: cardData.title }));

    if (Array.isArray(cardData.steps) && cardData.steps.length) {
      const ol = el('ol', { className: 'bot-steps' });
      cardData.steps.forEach((step, idx) => {
        const li = el('li', {}, [
          el('span', { className: 'step-num', textContent: String(idx + 1) }),
          el('span', { textContent: step })
        ]);
        ol.appendChild(li);
      });
      card.appendChild(ol);
    }

    if (cardData.source) {
      const srcLink = el('button', {
        className: 'bot-src-link',
        type: 'button',
        onClick: () => {
          showSourceModal(cardData.source);
        }
      }, [
        el('span', { textContent: `${window.FS.i18n.t('sourceLabel')}: ${cardData.source}` }),
        createChevronRightSvg()
      ]);
      card.appendChild(srcLink);
    }

    // Direct Call 112 button if fallback
    if (cardData.isFallback) {
      const callWrap = el('div', { style: { marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #eceef3' } }, [
        el('a', {
          className: 'quick-action-btn',
          style: { height: '42px', fontSize: '14px' },
          href: 'tel:112'
        }, [
          createPhoneSvg(),
          document.createTextNode(' Call 112 Emergency')
        ])
      ]);
      card.appendChild(callWrap);
    }

    bubble.appendChild(avatar);
    bubble.appendChild(card);
    thread.appendChild(bubble);
  }

  function createTypingIndicator() {
    return el('div', { className: 'chat-bubble-bot' }, [
      el('div', { className: 'bot-avatar' }, [createBotAvatarSvg()]),
      el('div', { className: 'typing-indicator' }, [
        el('span', { className: 'typing-dot' }),
        el('span', { className: 'typing-dot' }),
        el('span', { className: 'typing-dot' })
      ])
    ]);
  }

  /**
   * Normalized Multi-Language Scoring Algorithm against Knowledge Base
   */
  function searchKnowledgeBase(query, lang) {
    const kb = window.FS.DATA.knowledgeBase || [];
    const normalized = query.toLowerCase().replace(/[?,.!/\\-]/g, ' ').trim();
    const words = normalized.split(/\s+/).filter(w => w.length > 1);

    let bestTopic = null;
    let highestScore = 0;

    for (const item of kb) {
      let score = 0;
      for (const kw of item.keywords) {
        const kwLower = kw.toLowerCase();
        if (normalized.includes(kwLower)) {
          score += 5; // Exact phrase match
        } else {
          for (const word of words) {
            if (kwLower === word) {
              score += 3;
            } else if (kwLower.includes(word) || word.includes(kwLower)) {
              score += 1;
            }
          }
        }
      }

      if (score > highestScore) {
        highestScore = score;
        bestTopic = item;
      }
    }

    if (bestTopic && highestScore >= 2) {
      const titleObj = bestTopic.title;
      const stepsObj = bestTopic.steps;
      return {
        title: titleObj[lang] || titleObj['en'] || titleObj['hi'],
        steps: stepsObj[lang] || stepsObj['en'] || stepsObj['hi'],
        source: bestTopic.source,
        isFallback: false
      };
    }

    // Friendly Fallback
    const fallbackTitles = {
      en: "I don't have exact guidelines for that query yet.",
      pa: "ਮੇਰੇ ਕੋਲ ਇਸ ਸਵਾਲ ਲਈ ਪੂਰੀ ਜਾਣਕਾਰੀ ਨਹੀਂ ਹੈ।",
      hi: "मेरे पास इस सवाल के लिए सटीक दिशानिर्देश नहीं हैं।"
    };
    const fallbackSteps = {
      en: [
        "If you are facing an active emergency, dial National Emergency 112 immediately.",
        "Check our official emergency numbers and helplines in the More menu.",
        "Choose one of the common safety topics from the suggestion chips below."
      ],
      pa: [
        "ਜੇਕਰ ਤੁਸੀਂ ਕਿਸੇ ਐਮਰਜੈਂਸੀ ਵਿੱਚ ਹੋ ਤਾਂ ਤੁਰੰਤ 112 'ਤੇ ਕਾਲ ਕਰੋ।",
        "ਹੋਰ ਮੀਨੂੰ ਵਿੱਚ ਜਾ ਕੇ ਜ਼ਿਲ੍ਹਾ ਕੰਟਰੋਲ ਰੂਮ ਅਤੇ ਐਂਬੂਲੈਂਸ ਨੰਬਰ ਵੇਖੋ।",
        "ਹੇਠਾਂ ਦਿੱਤੇ ਮੁੱਖ ਸਵਾਲਾਂ ਵਿੱਚੋਂ ਕੋਈ ਵਿਸ਼ਾ ਚੁਣੋ।"
      ],
      hi: [
        "यदि आप किसी तात्कालिक खतरे में हैं तो तुरंत 112 डायल करें।",
        "मोर (अन्य) मेनू में जाकर जिला आपदा नियंत्रण कक्ष से संपर्क करें।",
        "नीचे दिए गए मुख्य सुरक्षा विषयों में से कोई विकल्प चुनें।"
      ]
    };

    return {
      title: fallbackTitles[lang] || fallbackTitles['en'],
      steps: fallbackSteps[lang] || fallbackSteps['en'],
      source: "NDMA & Punjab Disaster Response Directory",
      isFallback: true
    };
  }

  function showSourceModal(sourceText) {
    const content = el('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } }, [
      el('p', {
        style: { fontSize: '15px', color: 'var(--navy)', lineHeight: '1.5' },
        textContent: `This information is compiled from verified protocols published by ${sourceText}.`
      }),
      el('p', {
        style: { fontSize: '13px', color: 'var(--muted)', lineHeight: '1.4' },
        textContent: 'FloodSaathi adheres to standard flood mitigation procedures laid down by the National Disaster Management Authority (NDMA) and the State Disaster Management Authority (SDMA) Punjab.'
      })
    ]);

    window.FS.ui.openModal({
      title: 'Official Disaster Guidelines Source',
      contentEl: content
    });
  }

  function handleDownloadGuide() {
    const kb = window.FS.DATA.knowledgeBase || [];
    let text = "========================================================\n";
    text += "   FLOODSAATHI — PUNJAB FLOOD SAFETY & SURVIVAL GUIDE   \n";
    text += "========================================================\n\n";
    text += "OFFICIAL HELPLINES:\n";
    text += "- National Emergency: 112\n";
    text += "- State Disaster Helpline: 1070\n";
    text += "- District Control Room: 1077 / 1078\n";
    text += "- Ambulance: 108\n";
    text += "- Punjab Flood Control: 0172-2740397\n\n";
    text += "--------------------------------------------------------\n\n";

    kb.forEach((item, idx) => {
      text += `[${idx + 1}] ${item.title.en}\n`;
      text += `    (${item.title.pa})\n`;
      text += `    Source: ${item.source}\n`;
      text += "    STEPS:\n";
      item.steps.en.forEach((step, sIdx) => {
        text += `    ${sIdx + 1}. ${step}\n`;
      });
      text += "\n";
    });

    try {
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'FloodSaathi-Safety-Guide.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      window.FS.ui.toast(window.FS.i18n.t('downloadComplete'), { type: 'success' });
    } catch (e) {
      console.warn('Guide download failed:', e);
      window.FS.ui.toast('Failed to generate guide file', { type: 'error' });
    }
  }

  function saveChatMessage(msg) {
    const history = window.FS.store.get('chat') || [];
    history.push(msg);
    // Persist only last 50
    if (history.length > 50) history.shift();
    window.FS.store.set('chat', history);
  }

  function formatCurrentTime() {
    const d = new Date();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  }

  function teardown() {
    if (activeSpeech) {
      try { activeSpeech.stop(); } catch (_) {}
      activeSpeech = null;
    }
  }

  function createDownloadSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2.1');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.innerHTML = '<path d="M12 3.5v11M7.5 10.5l4.5 4.5 4.5-4.5M4.5 15v3.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V15"/>';
    return svg;
  }

  function createTrashSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.8');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.innerHTML = '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>';
    return svg;
  }

  function createBotAvatarSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', '#fff');
    svg.setAttribute('stroke-width', '1.9');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.innerHTML = '<path d="M4 11l8-6.5 8 6.5"/><path d="M6 9.8V13M18 9.8V13"/><path d="M3 15.5c1.5 0 1.5 1.2 3 1.2s1.5-1.2 3-1.2 1.5 1.2 3 1.2 1.5-1.2 3-1.2M3 19.5c1.5 0 1.5 1.2 3 1.2s1.5-1.2 3-1.2 1.5 1.2 3 1.2 1.5-1.2 3-1.2"/>';
    return svg;
  }

  function createMicSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', '#12172b');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.innerHTML = '<rect x="9" y="3" width="6" height="11" rx="3" fill="#12172b"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3"/>';
    return svg;
  }

  function createSendSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', '#fff');
    svg.setAttribute('stroke-width', '2.4');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.innerHTML = '<path d="M4.5 12h14M13 6l6 6-6 6"/>';
    return svg;
  }

  function createChevronRightSvg() {
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
    teardown: teardown
  };
})();

window.FS.router.register('/saathi', window.FS.screens.saathi);
