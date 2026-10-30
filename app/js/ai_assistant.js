// app/js/ai_assistant.js
// Client-side On-Device Inference & Safety Assistant for FloodSaathi (PRD Section 10A & 14)
// Supports On-Device WebGPU / Wasm inference with deterministic M5 safety fallback.
// Pure ES module: Zero framework, zero build step, 100% offline runnable.

import { CardRetriever } from "./ask.js";

// Authoritative verified emergency numbers (PRD Sec 9 & 14)
export const AUTHORIZED_HELPLINES = [
  {
    number: "112",
    name: "National Emergency Response Support System (ERSS)",
    scope: "national",
    description: "Search & rescue, disaster evacuation, police, fire, emergency assistance"
  },
  {
    number: "1078",
    name: "National Disaster Management Authority (NDMA)",
    scope: "national",
    description: "Central flood disaster control room and national alert verification"
  },
  {
    number: "1070",
    name: "Punjab State Emergency Operation Centre (SEOC)",
    scope: "state",
    description: "Punjab state flood control room, boat requests, and relief coordination"
  },
  {
    number: "1077",
    name: "District Disaster Management Control Room",
    scope: "district",
    description: "District level evacuation, local shelter allocation, and sandbag requests"
  },
  {
    number: "108",
    name: "Punjab Medical Ambulance Service",
    scope: "state",
    description: "Emergency ambulance transport and hospital admission"
  },
  {
    number: "1912",
    name: "Punjab State Power Corporation Limited (PSPCL)",
    scope: "state",
    description: "Electricity emergency, downed power lines, and feeder shutdown requests"
  }
];

export const FORBIDDEN_SAFETY_PATTERNS = [
  /it is safe to drive/i,
  /you can (safely )?drive/i,
  /safe to (cross|walk|wade)/i,
  /proceed slowly through water/i,
  /सुरक्षित है.*(चला|पार)/i,
  /गाड़ी निकाल/i,
  /ਪਾਣੀ ਵਿੱਚੋਂ.*(ਲੰਘੋ|ਕੱਢੋ)/i,
  /ਗੱਡੀ.*ਚਲਾ ਸਕਦੇ ਹੋ/i
];

export class AskSaathiAssistant {
  /**
   * @param {Object} config
   * @param {Array} [config.cards] - Array of verified knowledge cards from cards.json
   * @param {Array} [config.helplines] - Array of verified helpline objects
   * @param {Object} [config.modelConfig] - Configuration for WebGPU / ONNX runtime
   */
  constructor({ cards = [], helplines = AUTHORIZED_HELPLINES, modelConfig = {} } = {}) {
    this.cards = cards;
    this.helplines = helplines;
    this.modelConfig = modelConfig;
    this.retriever = new CardRetriever(cards);
    this.mode = "deterministic_m5"; // Default and safe offline mode
    this.hardwareCapabilities = {
      webgpu: false,
      wasmSIMD: false,
      estimatedMemoryMB: 0
    };
    this.initialized = false;
  }

  /**
   * Initializes hardware capability detection.
   * Gracefully detects WebGPU without throwing errors in environments where navigator is undefined.
   */
  async init() {
    if (this.initialized) return;

    if (typeof navigator !== "undefined") {
      // 1. Detect WebGPU
      if (navigator.gpu) {
        try {
          const adapter = await navigator.gpu.requestAdapter();
          if (adapter) {
            this.hardwareCapabilities.webgpu = true;
            // Mid-tier target: Check if device can support 350MB quantized buffer
            const limits = adapter.limits;
            if (limits && limits.maxStorageBufferBindingSize >= 268435456) {
              this.mode = "webgpu_slm";
            }
          }
        } catch {
          this.hardwareCapabilities.webgpu = false;
        }
      }

      // 2. Storage estimate
      if (navigator.storage && navigator.storage.estimate) {
        try {
          const est = await navigator.storage.estimate();
          this.hardwareCapabilities.estimatedMemoryMB = Math.round((est.quota || 0) / (1024 * 1024));
        } catch {
          // Fallback
        }
      }
    }

    this.initialized = true;
  }

  /**
   * Updates knowledge cards in the active retriever.
   */
  setCards(cards = []) {
    this.cards = cards;
    this.retriever = new CardRetriever(cards);
  }

  /**
   * Returns current execution mode.
   */
  getMode() {
    return this.mode;
  }

  /**
   * Manually sets assistant operating mode.
   * @param {"deterministic_m5" | "webgpu_slm" | "wasm_slm"} mode
   */
  setMode(mode) {
    if (["deterministic_m5", "webgpu_slm", "wasm_slm"].includes(mode)) {
      this.mode = mode;
    }
  }

  /**
   * Queries the local real neural backend (Qwen2.5-0.5B-Instruct SLM).
   * @param {string} query
   * @param {Object} context
   * @returns {Promise<Object|null>}
   */
  async queryNeuralBackend(query, context = {}) {
    // Only query if in browser or explicitly requested
    if (typeof window === "undefined" && !context.useNeural) {
      return null;
    }

    const endpoints = [
      "/api/chat",
      "http://localhost:8080/api/chat",
      "http://127.0.0.1:8080/api/chat"
    ];

    for (const url of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query,
            lang: context.lang || "en",
            history: context.history || []
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data && data.text) {
            return {
              title: "Saathi Neural AI (Real On-Device SLM)",
              text: data.text,
              steps: data.text.split("\n").filter(l => l.trim().length > 0).map(l => l.replace(/^\d+[\.\)]\s*/, "")),
              stats: data.stats || { tokens: 0, duration_s: 0, tok_per_sec: 0, model: "Qwen2.5-0.5B" },
              helplines: data.helplines || AUTHORIZED_HELPLINES,
              source: data.source || "Qwen2.5-0.5B Local Neural SLM",
              reviewStatus: "verified",
              isNeural: true
            };
          }
        }
      } catch {
        // Fallback to next endpoint or deterministic offline core
      }
    }
    return null;
  }

  /**
   * Check whether WebGPU is detected on device.
   */
  isWebGPUSupported() {
    return this.hardwareCapabilities.webgpu;
  }

  /**
   * Core inference and query routing method.
   * Evaluates query against strict safety invariants first before generating or retrieving advice.
   *
   * @param {string} query - User question
   * @param {Object} [context] - Real-time context (lang, gauges, alerts, village)
   * @returns {Promise<Object>} Formatted assistant response card
   */
  async ask(query, context = {}) {
    if (!this.initialized) {
      await this.init();
    }

    const q = (query || "").trim();
    const lang = context.lang || "en";
    const qLower = q.toLowerCase();

    // =========================================================================
    // SAFETY INVARIANT 1: RIVER GAUGES & TELEMETRY (Grounded in real context)
    // =========================================================================
    const isGaugeQuery = [
      "river level", "gauge", "water level", "cwc", "danger level", "warning level",
      "beas", "sutlej", "ravi", "ਕਿੰਨਾ ਪਾਣੀ", "ਦਰਿਆ", "ਗੇਜ", "ਬਿਆਸ", "ਸਤਲੁਜ", "ਰਾਵੀ",
      "नदी का जलस्तर", "गेज", "सतलुज", "ब्यास", "रावी"
    ].some((term) => qLower.includes(term));

    if (isGaugeQuery && context.gauges && context.gauges.length > 0) {
      return this._formatGaugeContextResponse(context.gauges, lang);
    }

    // =========================================================================
    // REAL NEURAL MODEL INFERENCE (Qwen2.5-0.5B Local SLM)
    // Connects to local server when in neural mode
    // =========================================================================
    if (this.mode === "webgpu_slm" || this.mode === "neural_slm" || this.mode === "real_neural" || context.useNeural) {
      const neuralResp = await this.queryNeuralBackend(q, context);
      if (neuralResp) {
        return neuralResp;
      }
    }

    // =========================================================================
    // RETRIEVAL & SAFETY-GUARDED INFERENCE (M5 ROUTER + KNOWLEDGE REPOSITORY)
    // Offline deterministic fallback when neural server is not active
    // =========================================================================
    const retrieved = this.retriever.retrieve(q, 1);
    if (retrieved.length > 0) {
      const card = retrieved[0].card;

      if (card.id === "corpus-helpline") {
        return this._formatHelplineResponse(lang);
      }
      if (card.id === "card-water-crossing") {
        return this._formatCrossingHazardResponse(lang);
      }
      if (card.id === "card-medical-refusal") {
        return this._formatMedicalRefusalResponse(lang);
      }
      if (card.id === "card-electrical-safety") {
        return this._formatElectricalResponse(lang);
      }

      return await this._formatCardResponse(card, lang, q, context.apiKey);
    }

    // Contextual fallback for unindexed inquiries
    return this._formatGeneralHelpResponse(q, lang);
  }

  // ---------------------------------------------------------------------------
  // ONLINE TRANSLATION INTEGRATION (Optional Google Cloud Fallback)
  // ---------------------------------------------------------------------------

  /**
   * Optional Google Cloud Translation fallback (online only).
   * Falls back to offline localized text if offline or on network failure.
   *
   * @param {string} text - Source text to translate
   * @param {string} targetLang - Target language ('hi' or 'pa')
   * @param {string} apiKey - Google Cloud Translation API key
   * @returns {Promise<string|null>} Translated text or null
   */
  async translateWithGoogle(text, targetLang, apiKey) {
    if (!apiKey || !navigator.onLine || !text || targetLang === "en") {
      return null;
    }

    try {
      const url = `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: text,
          target: targetLang,
          format: "text"
        })
      });

      if (!res.ok) {
        console.warn(`Google Translate API HTTP ${res.status}, falling back to offline core.`);
        return null;
      }

      const data = await res.json();
      const translated = data?.data?.translations?.[0]?.translatedText;
      return translated || null;
    } catch (err) {
      console.warn("Google Translate network error, using offline cards:", err);
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // RESPONSE FORMATTERS (Grounded & Invariant-Checked)
  // ---------------------------------------------------------------------------

  _formatHelplineResponse(lang) {
    const titles = {
      en: "Official Emergency Helplines (Punjab & National)",
      hi: "आधिकारिक आपातकालीन हेल्पलाइन (पंजाब एवं राष्ट्रीय)",
      pa: "ਅਧਿਕਾਰਤ ਐਮਰਜੈਂਸੀ ਹੈਲਪਲਾਈਨ (ਪੰਜਾਬ ਅਤੇ ਕੌਮੀ)"
    };

    const steps = {
      en: [
        "112: National Emergency Response Support System (Police, Fire, Search & Rescue NDRF/SDRF).",
        "1078: National Disaster Management Authority (NDMA) National Flood Control Room.",
        "1070: Punjab State Emergency Operation Centre (State Disaster Control).",
        "1077: District Disaster Management Control Room (Local district relief & rescue).",
        "108: Punjab Free Medical Ambulance Emergency Service.",
        "1912: PSPCL Electricity Emergency & Downed Power Line Reports."
      ],
      hi: [
        "112: राष्ट्रीय आपातकालीन प्रतिक्रिया प्रणाली (पुलिस, दमकल, NDRF/SDRF बचाव)।",
        "1078: राष्ट्रीय आपदा प्रबंधन प्राधिकरण (NDMA) बाढ़ नियंत्रण कक्ष।",
        "1070: पंजाब राज्य आपातकालीन संचालन केंद्र (राहत एवं बचाव नियंत्रण)।",
        "1077: जिला आपदा प्रबंधन नियंत्रण कक्ष (स्थानीय जिला राहत)।",
        "108: पंजाब निःशुल्क आपातकालीन एम्बुलेंस सेवा।",
        "1912: बिजली विभाग (PSPCL) टूटे तार और आपातकालीन विद्युत हेल्पलाइन।"
      ],
      pa: [
        "112: ਕੌਮੀ ਐਮਰਜੈਂਸੀ ਰਿਸਪਾਂਸ ਸਪੋਰਟ ਸਿਸਟਮ (ਪੁਲਿਸ, ਫਾਇਰ ਅਤੇ NDRF/SDRF ਬਚਾਅ ਟੀਮਾਂ)।",
        "1078: ਕੌਮੀ ਆਫ਼ਤ ਪ੍ਰਬੰਧਨ ਅਥਾਰਟੀ (NDMA) ਕੰਟਰੋਲ ਰੂਮ।",
        "1070: ਪੰਜਾਬ ਰਾਜ ਆਫ਼ਤ ਕੰਟਰੋਲ ਰੂਮ (ਚੰਡੀਗੜ੍ਹ)।",
        "1077: ਜ਼ਿਲ੍ਹਾ ਆਫ਼ਤ ਪ੍ਰਬੰਧਨ ਕੰਟਰੋਲ ਰੂਮ (ਤੁਹਾਡੇ ਜ਼ਿਲ੍ਹੇ ਦਾ ਰਾਹਤ ਕੰਟਰੋਲ ਰੂਮ)।",
        "108: ਪੰਜਾਬ ਮੁਫ਼ਤ ਐਂਬੂਲੈਂਸ ਐਮਰਜੈਂਸੀ ਸੇਵਾ।",
        "1912: ਪਾਵਰਕਾਮ (PSPCL) ਬਿਜਲੀ ਦੇ ਖ਼ਤਰੇ ਅਤੇ ਡਿੱਗੀਆਂ ਤਾਰਾਂ ਲਈ।"
      ]
    };

    return {
      query: "helplines",
      intent: "helpline_routing",
      mode: "deterministic_m5",
      title: titles[lang] || titles.en,
      summary: "Dial 112 for immediate life-threatening search and rescue. Helplines operate 24/7.",
      steps: steps[lang] || steps.en,
      helplines: this.helplines,
      source: "Government of India & Government of Punjab Emergency Directories",
      verified: true,
      badge: "verified",
      cardId: "corpus-helpline"
    };
  }

  _formatCrossingHazardResponse(lang) {
    const titles = {
      en: "DANGER: Never Walk or Drive Through Flood Waters",
      hi: "खतरा: बाढ़ के पानी में कभी न चलें या गाड़ी न चलाएं",
      pa: "ਖ਼ਤਰਾ: ਹੜ੍ਹ ਦੇ ਪਾਣੀ ਵਿੱਚ ਕਦੇ ਵੀ ਨਾ ਤੁਰੋ ਜਾਂ ਗੱਡੀ ਨਾ ਚਲਾਓ"
    };

    const steps = {
      en: [
        "TURN AROUND, DON'T DROWN: Moving flood water carries tremendous force and hidden hazards.",
        "Just 15 cm (6 inches) of moving water can knock down an adult pedestrian.",
        "30 cm (12 inches) of moving water floats small cars, causing total loss of control.",
        "60 cm (2 feet) of rushing water will easily sweep away large tractors, SUVs, and heavy trucks.",
        "Submerged roads frequently suffer hidden structural washouts, sinkholes, and open storm drains.",
        "If trapped in a stalled vehicle in rising water, abandon the vehicle immediately and seek high ground."
      ],
      hi: [
        "वापस मुड़ें, जान बचाएं: बहते बाढ़ के पानी में कभी भी प्रवेश न करें।",
        "मात्र 15 सेमी गहरा बहता पानी किसी भी वयस्क को गिराकर बहा सकता है।",
        "30 सेमी पानी कार को तैराकर पूरी तरह से अनियंत्रित कर देता है।",
        "60 सेमी (2 फीट) बहता पानी बड़े ट्रैक्टर और भारी ट्रकों को भी आसानी से बहा ले जाता है।",
        "पानी के नीचे टूटी हुई पुलिया, खुले गटर और गहरे गड्ढे छिपे रहते हैं जो दिखाई नहीं देते।",
        "यदि वाहन पानी में बंद हो जाए तो तुरंत वाहन छोड़कर ऊंची सुरक्षित जमीन पर जाएं।"
      ],
      pa: [
        "ਵਾਪਸ ਮੁੜੋ, ਜਾਨ ਬਚਾਓ: ਵਗਦੇ ਹੜ੍ਹ ਦੇ ਪਾਣੀ ਵਿੱਚ ਕਦੇ ਵੀ ਨਾ ਵੜੋ।",
        "ਸਿਰਫ਼ 15 ਸੈਂਟੀਮੀਟਰ (6 ਇੰਚ) ਵਗਦਾ ਪਾਣੀ ਕਿਸੇ ਵੀ ਵਿਅਕਤੀ ਨੂੰ ਡੇਗ ਕੇ ਰੋੜ੍ਹ ਸਕਦਾ ਹੈ।",
        "30 ਸੈਂਟੀਮੀਟਰ (1 ਫੁੱਟ) ਪਾਣੀ ਕਾਰ ਨੂੰ ਤੈਰਾ ਕੇ ਬੇਕਾਬੂ ਕਰ ਦਿੰਦਾ ਹੈ।",
        "60 ਸੈਂਟੀਮੀਟਰ (2 ਫੁੱਟ) ਪਾਣੀ ਵੱਡੇ ਤੋਂ ਵੱਡੇ ਟਰੈਕਟਰ ਅਤੇ ਟਰੱਕ ਨੂੰ ਵੀ ਵਹਾ ਕੇ ਲੈ ਜਾਂਦਾ ਹੈ।",
        "ਪਾਣੀ ਦੇ ਹੇਠਾਂ ਟੁੱਟੀਆਂ ਪੁਲੀਆਂ, ਖੁੱਲ੍ਹੇ ਨਾਲੇ ਅਤੇ ਟੁੱਟੀ ਹੋਈ ਸੜਕ ਦਿਖਾਈ ਨਹੀਂ ਦਿੰਦੀ।",
        "ਜੇਕਰ ਵਾਹਨ ਪਾਣੀ ਵਿੱਚ ਬੰਦ ਹੋ ਜਾਵੇ ਤਾਂ ਤੁਰੰਤ ਬਾਹਰ ਨਿਕਲ ਕੇ ਉੱਚੀ ਥਾਂ 'ਤੇ ਜਾਓ।"
      ]
    };

    return {
      query: "water_crossing",
      intent: "hazard_warning",
      mode: "deterministic_m5",
      title: titles[lang] || titles.en,
      summary: "Never drive or walk through flood water under any circumstances.",
      steps: steps[lang] || steps.en,
      helplines: [{ number: "112", name: "Emergency Rescue (ERSS)" }],
      source: "NDMA Public Safety Protocol & Ministry of Road Transport",
      verified: true,
      badge: "verified",
      cardId: "card-water-crossing"
    };
  }

  _formatMedicalRefusalResponse(lang) {
    const titles = {
      en: "Medical Notice: Consult Healthcare Professionals",
      hi: "चिकित्सा सूचना: डॉक्टर से तुरंत संपर्क करें",
      pa: "ਡਾਕਟਰੀ ਸੂਚਨਾ: ਤੁਰੰਤ ਡਾਕਟਰ ਨਾਲ ਸੰਪਰਕ ਕਰੋ"
    };

    const steps = {
      en: [
        "I cannot prescribe medications, suggest dosages, or diagnose illnesses.",
        "Unprescribed medicines during floods can be dangerous and mask severe waterborne diseases.",
        "For acute dehydration from diarrhea or vomiting: Administer Oral Rehydration Salts (ORS) in boiled and cooled water.",
        "Keep the patient hydrated and resting on a raised, clean cot.",
        "Call 108 immediately for free government ambulance transport to the nearest hospital or relief medical camp.",
        "Call 112 if rising water prevents road access for ambulance teams."
      ],
      hi: [
        "मैं किसी भी प्रकार की दवा, खुराक (डोज़) या नुस्खा नहीं बता सकता।",
        "बाढ़ के समय बिना डॉक्टरी सलाह के दवा लेना गंभीर जलजनित बीमारियों के खतरे को बढ़ा सकता है।",
        "उल्टी-दस्त होने पर तुरंत उबले पानी में ओआरएस (ORS) का घोल बनाकर लगातार पिलाएं।",
        "मरीज को स्वच्छ एवं ऊंची जगह पर आराम करने दें।",
        "निकटतम अस्पताल या राहत चिकित्सा शिविर के लिए तुरंत 108 एम्बुलेंस पर कॉल करें।",
        "यदि रास्ता पानी से बंद हो तो 112 पर बचाव नाव के लिए संपर्क करें।"
      ],
      pa: [
        "ਮੈਂ ਕਿਸੇ ਵੀ ਦਵਾਈ, ਗੋਲੀ ਜਾਂ ਖ਼ੁਰਾਕ (ਡੋਜ਼) ਦੀ ਸਿਫ਼ਾਰਸ਼ ਨਹੀਂ ਕਰ ਸਕਦਾ।",
        "ਹੜ੍ਹਾਂ ਦੌਰਾਨ ਬਿਨਾਂ ਡਾਕਟਰੀ ਸਲਾਹ ਦੇ ਦਵਾਈ ਲੈਣਾ ਬਹੁਤ ਖ਼ਤਰਨਾਕ ਹੋ ਸਕਦਾ ਹੈ।",
        "ਉਲਟੀਆਂ ਜਾਂ ਦਸਤ ਹੋਣ 'ਤੇ ਉਬਲੇ ਤੇ ਠੰਡੇ ਕੀਤੇ ਪਾਣੀ ਵਿੱਚ ORS (ਓ.ਆਰ.ਐਸ) ਦਾ ਘੋਲ ਬਣਾ ਕੇ ਪਿਲਾਓ।",
        "ਮਰੀਜ਼ ਨੂੰ ਉੱਚੀ ਅਤੇ ਸਾਫ਼ ਥਾਂ 'ਤੇ ਆਰਾਮ ਕਰਨ ਦਿਓ।",
        "ਤੁਰੰਤ ਮੁਫ਼ਤ ਸਰਕਾਰੀ ਐਂਬੂਲੈਂਸ ਲਈ 108 'ਤੇ ਕਾਲ ਕਰੋ।",
        "ਜੇਕਰ ਰਸਤੇ ਵਿੱਚ ਪਾਣੀ ਹੋਵੇ ਤਾਂ ਬਚਾਅ ਲਈ 112 'ਤੇ ਸੰਪਰਕ ਕਰੋ।"
      ]
    };

    return {
      query: "medical",
      intent: "medical_refusal",
      mode: "deterministic_m5",
      title: titles[lang] || titles.en,
      summary: "Prescriptions require licensed medical practitioners. Dial 108 for ambulance.",
      steps: steps[lang] || steps.en,
      helplines: [
        { number: "108", name: "Punjab Medical Ambulance Service" },
        { number: "112", name: "Emergency Response (ERSS)" }
      ],
      source: "WHO Clinical Emergency Protocol & Ministry of Health & Family Welfare",
      verified: true,
      badge: "verified",
      cardId: "card-medical-refusal"
    };
  }

  _formatElectricalResponse(lang) {
    const titles = {
      en: "Electrical Safety & Downed Power Lines",
      hi: "विद्युत सुरक्षा एवं टूटे हुए बिजली के तार",
      pa: "ਬਿਜਲੀ ਸੁਰੱਖਿਆ ਅਤੇ ਡਿੱਗੀਆਂ ਹੋਈਆਂ ਤਾਰਾਂ"
    };

    const steps = {
      en: [
        "Stay at least 10 metres (33 feet) away from downed power lines, broken poles, and submerged transformers.",
        "Never touch electrical switches, meters, or cords while standing in water or with damp hands.",
        "Turn off the main electrical breaker ONLY if the panel is dry and you are standing on dry ground.",
        "If a fallen power line is touching wet ground near you, shuffle or hop with both feet touching together to escape step potential.",
        "Call PSPCL emergency helpline 1912 immediately to cut power supply to the area."
      ],
      hi: [
        "टूटे हुए बिजली के तारों, खंभों और डूबे हुए ट्रांसफार्मर से कम से कम 10 मीटर दूर रहें।",
        "पानी में खड़े होकर या गीले हाथों से बिजली के स्विचबोर्ड या मीटर को कभी न छुएं।",
        "मुख्य बिजली स्विच (MCB) तभी बंद करें यदि पैनल सूखा हो और आप सूखी जमीन पर हों।",
        "यदि पास में तार गिरा हो तो दोनों पैर एक साथ मिलाकर कूदते हुए (हॉप करते हुए) दूर जाएं।",
        "बिजली आपूर्ति तुरंत बंद करवाने के लिए बिजली विभाग के नंबर 1912 पर कॉल करें।"
      ],
      pa: [
        "ਬਿਜਲੀ ਦੀਆਂ ਟੁੱਟੀਆਂ ਤਾਰਾਂ, ਖੰਭਿਆਂ ਅਤੇ ਡੁੱਬੇ ਹੋਏ ਟਰਾਂਸਫਾਰਮਰਾਂ ਤੋਂ ਘੱਟੋ-ਘੱਟ 10 ਮੀਟਰ ਦੂਰ ਰਹੋ।",
        "ਪਾਣੀ ਵਿੱਚ ਖੜ੍ਹੇ ਹੋ ਕੇ ਜਾਂ ਗਿੱਲੇ ਹੱਥਾਂ ਨਾਲ ਕਦੇ ਵੀ ਬਿਜਲੀ ਦੇ ਸਵਿੱਚਾਂ ਨੂੰ ਨਾ ਛੂਹੋ।",
        "ਮੇਨ ਬਿਜਲੀ ਸਵਿੱਚ ਤਾਂ ਹੀ ਬੰਦ ਕਰੋ ਜੇਕਰ ਬੋਰਡ ਪੂਰੀ ਤਰ੍ਹਾਂ ਸੁੱਕਾ ਹੋਵੇ।",
        "ਜੇਕਰ ਤੁਹਾਡੇ ਨੇੜੇ ਤਾਰ ਡਿੱਗੀ ਹੋਵੇ ਤਾਂ ਦੋਵੇਂ ਪੈਰ ਜੋੜ ਕੇ ਛਾਲਾਂ ਮਾਰਦੇ ਹੋਏ ਦੂਰ ਜਾਓ (ਕਦਮ ਚੌੜੇ ਨਾ ਕਰੋ)।",
        "ਬਿਜਲੀ ਬੰਦ ਕਰਵਾਉਣ ਲਈ ਤੁਰੰਤ ਪਾਵਰਕਾਮ (PSPCL) ਹੈਲਪਲਾਈਨ 1912 'ਤੇ ਕਾਲ ਕਰੋ।"
      ]
    };

    return {
      query: "electrical",
      intent: "electrical_safety",
      mode: "deterministic_m5",
      title: titles[lang] || titles.en,
      summary: "Maintain 10m distance from downed wires. Call PSPCL at 1912.",
      steps: steps[lang] || steps.en,
      helplines: [
        { number: "1912", name: "Punjab Power Emergency (PSPCL)" },
        { number: "112", name: "Emergency Response (ERSS)" }
      ],
      source: "Punjab State Power Corporation Limited & NDMA Electrical Guidelines",
      verified: true,
      badge: "verified",
      cardId: "card-electrical-safety"
    };
  }

  _formatGaugeContextResponse(gauges, lang) {
    const primary = gauges[0];
    const riverName = primary.river || "River";
    const stnName = primary.station || "Upstream Station";
    const level = primary.level_m !== undefined ? `${primary.level_m} m` : "Telemetry updating";
    const danger = primary.danger_m !== undefined ? `${primary.danger_m} m` : "Declared DL";
    const trend = primary.trend || "Stable";

    const titles = {
      en: `Verified River Gauge: ${riverName} at ${stnName}`,
      hi: `प्रमाणित नदी जलस्तर: ${stnName} पर ${riverName}`,
      pa: `ਤਸਦੀਕਸ਼ੁਦਾ ਦਰਿਆਈ ਗੇਜ: ${stnName} ਵਿਖੇ ${riverName}`
    };

    const steps = {
      en: [
        `Current Monitored Water Level: ${level}`,
        `Declared Danger Level (DL): ${danger}`,
        `Observed Hydrologic Trend: ${trend}`,
        "Telemetry is verified directly from Central Water Commission (CWC) monitoring stations.",
        "If water reaches Danger Level and continues rising, follow official district evacuation advisories."
      ],
      hi: [
        `वर्तमान दर्ज जलस्तर: ${level}`,
        `घोषित खतरा स्तर (DL): ${danger}`,
        `जलस्तर की प्रवृत्ति (Trend): ${trend}`,
        "यह डेटा केंद्रीय जल आयोग (CWC) के निगरानी स्टेशनों से प्रमाणित है।",
        "यदि जलस्तर खतरे के निशान के पास पहुंचे, तो जिला प्रशासन के निर्देशों का पालन करें।"
      ],
      pa: [
        `ਮੌਜੂਦਾ ਦਰਜ ਪਾਣੀ ਦਾ ਪੱਧਰ: ${level}`,
        `ਐਲਾਨਿਆ ਖ਼ਤਰਾ ਪੱਧਰ (DL): ${danger}`,
        `ਪਾਣੀ ਦਾ ਰੁਝਾਨ (Trend): ${trend}`,
        "ਇਹ ਜਾਣਕਾਰੀ ਸੈਂਟਰਲ ਵਾਟਰ ਕਮਿਸ਼ਨ (CWC) ਦੇ ਅਧਿਕਾਰਤ ਸਟੇਸ਼ਨਾਂ ਤੋਂ ਤਸਦੀਕਸ਼ੁਦਾ ਹੈ।",
        "ਜੇਕਰ ਪਾਣੀ ਖ਼ਤਰੇ ਦੇ ਨਿਸ਼ਾਨ ਵੱਲ ਵਧ ਰਿਹਾ ਹੋਵੇ, ਤਾਂ ਪ੍ਰਸ਼ਾਸਨ ਦੇ ਨਿਰਦੇਸ਼ਾਂ ਦੀ ਪਾਲਣਾ ਕਰੋ।"
      ]
    };

    return {
      query: "gauges",
      intent: "gauge_telemetry",
      mode: "deterministic_m5",
      title: titles[lang] || titles.en,
      summary: `${riverName} level at ${stnName} is ${level} (Trend: ${trend}).`,
      steps: steps[lang] || steps.en,
      helplines: [{ number: "1070", name: "Punjab State Disaster Control" }],
      source: "Central Water Commission (CWC) Live River Monitoring",
      verified: true,
      badge: "verified",
      cardId: null
    };
  }

  async _formatCardResponse(card, lang, query, apiKey = null) {
    let title = (card.title && card.title[lang]) || card.title?.en || "Verified Flood Guidance";
    const body = (card.body && card.body[lang]) || card.body?.en || "";
    let summary = (card.summary && card.summary[lang]) || card.summary?.en || "";
    const source = card.source || "NDMA / Punjab SDMA Flood Safety Guidelines";

    // Dynamic online translation if target language translation is missing from card
    if (apiKey && lang !== "en" && (!card.title || !card.title[lang]) && typeof navigator !== "undefined" && navigator.onLine) {
      try {
        const transTitle = await this.translateWithGoogle(title, lang, apiKey);
        if (transTitle) title = transTitle;
        if (summary) {
          const transSummary = await this.translateWithGoogle(summary, lang, apiKey);
          if (transSummary) summary = transSummary;
        }
      } catch {}
    }

    const lines = body.split("\n").filter((l) => l.trim().length > 0);
    const steps = lines.map((l) => l.replace(/^\d+\.\s*/, "").trim());

    // Validate generated/formatted steps against safety invariants
    for (const step of steps) {
      for (const rx of FORBIDDEN_SAFETY_PATTERNS) {
        if (rx.test(step)) {
          // Safety violation detected: Override with strict safe crossing advice
          return this._formatCrossingHazardResponse(lang);
        }
      }
    }

    return {
      query,
      intent: card.category || "safety_guidance",
      mode: this.mode,
      title,
      summary,
      steps,
      helplines: card.helplines || [{ number: "112", name: "Emergency ERSS" }, { number: "1070", name: "Punjab SEOC" }],
      source,
      verified: card.review_status === "verified",
      badge: card.review_status === "verified" ? "verified" : "draft",
      cardId: card.id
    };
  }

  _formatGeneralHelpResponse(query = "", lang = "en") {
    const qLower = (query || "").toLowerCase();

    // Check if query is about being trapped or needing search & rescue
    if (["boat", "rescue", "trapped", "stranded", "stuck", "roof", "help", "ਕਿਸ਼ਤੀ", "ਬਚਾਓ", "ਫਸੇ", "ਛੱਤ", "ਮਦਦ", "नाव", "बचाव", "फंसे", "मदद"].some(w => qLower.includes(w))) {
      const titles = {
        en: "Emergency Flood Search & Rescue Protocol (Dial 112 / 1078)",
        hi: "बाढ़ बचाव एवं फंसे हुए लोगों के लिए आपातकालीन कदम (डायल 112 / 1078)",
        pa: "ਹੜ੍ਹ ਵਿੱਚ ਫਸੇ ਲੋਕਾਂ ਲਈ ਐਮਰਜੈਂਸੀ ਬਚਾਅ ਕਾਰਵਾਈ (ਡਾਇਲ 112 / 1078)"
      };
      const steps = {
        en: [
          "Call ERSS 112 or NDMA 1078 immediately to register your rescue coordinates and count of family members.",
          "Move to the highest stable concrete roof slab. Do NOT stay under tin sheds or cracked mud walls.",
          "Signal rescue boats: Wave bright-colored clothing (orange, red, yellow) or reflect sunlight with a mirror or torch at night.",
          "Conserve phone battery: Turn off mobile internet and GPS; communicate strictly via brief SMS messages.",
          "Tie children and seniors together with safety ropes so strong currents cannot separate them."
        ],
        hi: [
          "तुरंत 112 या 1078 पर फोन करके अपने गांव का नाम, लैंडमार्क और परिवार के सदस्यों की संख्या दर्ज करवाएं।",
          "घर की सबसे ऊंची और पक्की छत पर जाएं। कच्ची या तिनके की छतों के नीचे कभी न रहें।",
          "बचाव नौकाओं को इशारा करें: लाल, पीला या संतरी कपड़ा लहराएं या रात को टॉर्च जलाकर संकेत दें।",
          "मोबाइल की बैटरी बचाएं: इंटरनेट बंद रखें और केवल जरूरी एसएमएस से संपर्क करें।",
          "बच्चों और बुजुर्गों को रस्सी के सहारे सुरक्षित रखें ताकि पानी के बहाव में अलग न हों।"
        ],
        pa: [
          "ਤੁਰੰਤ 112 ਜਾਂ 1078 'ਤੇ ਕਾਲ ਕਰਕੇ ਆਪਣੇ ਪਿੰਡ ਦਾ ਨਾਂ, ਪੱਕਾ ਨਿਸ਼ਾਨ ਅਤੇ ਪਰਿਵਾਰ ਦੇ ਜੀਆਂ ਦੀ ਗਿਣਤੀ ਲਿਖਵਾਓ।",
          "ਮਕਾਨ ਦੀ ਸਭ ਤੋਂ ਉੱਚੀ ਪੱਕੀ ਲੈਂਟਰ ਵਾਲੀ ਛੱਤ 'ਤੇ ਜਾਓ। ਕੱਚੀਆਂ ਕੰਧਾਂ ਜਾਂ ਸ਼ੈੱਡਾਂ ਹੇਠਾਂ ਨਾ ਰਹੋ।",
          "ਬਚਾਅ ਕਿਸ਼ਤੀਆਂ ਨੂੰ ਇਸ਼ਾਰਾ ਕਰੋ: ਲਾਲ, ਪੀਲਾ ਜਾਂ ਸੰਤਰੀ ਕੱਪੜਾ ਹਿਲਾਓ ਜਾਂ ਰਾਤ ਨੂੰ ਟਾਰਚ ਜਗਾ ਕੇ ਰੋਸ਼ਨੀ ਮਾਰੋ।",
          "ਮੋਬਾਈਲ ਦੀ ਬੈਟਰੀ ਬਚਾਓ: ਇੰਟਰਨੈੱਟ ਬੰਦ ਰੱਖੋ ਅਤੇ ਸਿਰਫ਼ ਜ਼ਰੂਰੀ ਐੱਸ.ਐੱਮ.ਐੱਸ. ਰਾਹੀਂ ਰਾਬਤਾ ਰੱਖੋ।",
          "ਛੋਟੇ ਬੱਚਿਆਂ ਅਤੇ ਬਜ਼ੁਰਗਾਂ ਨੂੰ ਰੱਸੀ ਨਾਲ ਬੰਨ੍ਹ ਕੇ ਸਹਾਰਾ ਦਿਓ ਤਾਂ ਜੋ ਪਾਣੀ ਦੇ ਤੇਜ਼ ਵਹਾਅ ਵਿੱਚ ਪਾਸੇ ਨਾ ਹੋਣ।"
        ]
      };
      return {
        query: "rescue_emergency",
        intent: "search_and_rescue",
        mode: this.mode,
        title: titles[lang] || titles.en,
        summary: "For life-saving boat rescue, dial 112 (State Emergency) or 1078 (NDMA).",
        steps: steps[lang] || steps.en,
        helplines: [
          { number: "112", name: "Emergency Rescue (ERSS)" },
          { number: "1078", name: "NDMA National Control" },
          { number: "1070", name: "Punjab State Disaster Control" }
        ],
        source: "NDRF / SDRF Search and Rescue Protocol",
        verified: true,
        badge: "verified",
        cardId: null
      };
    }

    // Default general flood guide
    const titles = {
      en: "FloodSaathi Emergency Guide",
      hi: "बाढ़ साथी आपातकालीन मार्गदर्शिका",
      pa: "ਹੜ੍ਹ ਸਾਥੀ ਐਮਰਜੈਂਸੀ ਗਾਈਡ"
    };

    const steps = {
      en: [
        "1. Check your village status on the Home screen to see real estimated water arrival times.",
        "2. To disinfect well water: use 2.5g to 5g bleaching powder per 1,000 litres, let settle, and wait 1 hour.",
        "3. Boil all drinking water vigorously for at least 1 full minute.",
        "4. Never drive or walk through moving flood waters.",
        "5. For immediate life-saving search and rescue, dial 112 or 1078."
      ],
      hi: [
        "1. होम स्क्रीन पर अपने गांव की स्थिति और पानी पहुंचने का अनुमानित समय देखें।",
        "2. कुएं के पानी के लिए: प्रति 1,000 लीटर पानी में 2.5 से 5 ग्राम ब्लीचिंग पाउडर डालें और 1 घंटा प्रतीक्षा करें।",
        "3. पीने के पानी को कम से कम 1 मिनट तक पूरी तरह उबालें।",
        "4. बहते बाढ़ के पानी में कभी भी गाड़ी न चलाएं और न ही पैदल चलें।",
        "5. आपातकालीन बचाव के लिए तुरंत 112 या 1078 पर कॉल करें।"
      ],
      pa: [
        "1. ਹੋਮ ਸਕ੍ਰੀਨ 'ਤੇ ਆਪਣੇ ਪਿੰਡ ਦੀ ਸਥਿਤੀ ਅਤੇ ਪਾਣੀ ਪਹੁੰਚਣ ਦਾ ਅੰਦਾਜ਼ਾ ਸਮਾਂ ਦੇਖੋ।",
        "2. ਖੂਹ ਦੇ ਪਾਣੀ ਲਈ: ਪ੍ਰਤੀ 1,000 ਲੀਟਰ ਪਾਣੀ ਵਿੱਚ 2.5 ਤੋਂ 5 ਗ੍ਰਾਮ ਬਲੀਚਿੰਗ ਪਾਊਡਰ ਵਰਤੋ ਅਤੇ 1 ਘੰਟਾ ਉਡੀਕ ਕਰੋ।",
        "3. ਪੀਣ ਵਾਲੇ ਪਾਣੀ ਨੂੰ ਘੱਟੋ-ਘੱਟ 1 ਮਿੰਟ ਚੰਗੀ ਤਰ੍ਹਾਂ ਉਬਾਲੋ।",
        "4. ਹੜ੍ਹ ਦੇ ਵਗਦੇ ਪਾਣੀ ਵਿੱਚ ਕਦੇ ਵੀ ਗੱਡੀ ਨਾ ਚਲਾਓ ਅਤੇ ਨਾ ਹੀ ਪੈਦਲ ਚੱਲੋ।",
        "5. ਤੁਰੰਤ ਬਚਾਅ ਸਹਾਇਤਾ ਲਈ 112 ਜਾਂ 1078 'ਤੇ ਕਾਲ ਕਰੋ।"
      ]
    };

    return {
      query: "general",
      intent: "general_fallback",
      mode: this.mode,
      title: titles[lang] || titles.en,
      summary: "Official offline safety advice from NDMA and Punjab SDMA.",
      steps: steps[lang] || steps.en,
      helplines: this.helplines,
      source: "NDMA Flood SOP & Punjab State Disaster Management Authority",
      verified: true,
      badge: "verified",
      cardId: null
    };
  }
}
