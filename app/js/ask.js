// app/js/ask.js
// Multilingual Offline Card Retriever with M5 Router & Safety Guards (PRD Section 10A & Phase 6)
// Pure ES module: runs offline, NO framework.

const STOP_WORDS = new Set(["का", "की", "के", "में", "से", "को", "है", "हैं", "हो", "पर", "दा", "ਦੀ", "ਦੇ", "ਵਿੱਚ", "ਨੂੰ", "ਹੈ", "ਹਨ", "the", "is", "in", "to", "and", "or", "of", "a", "an", "what", "how", "can", "should", "i", "we", "my", "our"]);

function tokenize(text) {
  if (!text) return [];
  const lower = text.toLowerCase();
  const matches = lower.match(/[\w\u0900-\u097F\u0A00-\u0A7F]+/g);
  return matches || [];
}

export class CardRetriever {
  constructor(cards = []) {
    this.cards = cards;
    this.docCount = cards.length;
    this.avgDocLen = 0;
    this.docLengths = [];
    this.docTokenCounts = [];
    this.df = {};
    this.buildIndex();
  }

  buildIndex() {
    let totalLen = 0;
    for (const card of this.cards) {
      const weightedTokens = [];

      // Keywords 4x
      for (const kw of card.keywords || []) {
        for (const t of tokenize(kw)) {
          if (!STOP_WORDS.has(t)) {
            for (let i = 0; i < 4; i++) weightedTokens.push(t);
          }
        }
      }

      // Title 3x
      for (const lang of ["en", "hi", "pa"]) {
        const titleText = (card.title && card.title[lang]) || "";
        for (const t of tokenize(titleText)) {
          if (!STOP_WORDS.has(t)) {
            for (let i = 0; i < 3; i++) weightedTokens.push(t);
          }
        }
      }

      // Summary 2x
      for (const lang of ["en", "hi", "pa"]) {
        const summaryText = (card.summary && card.summary[lang]) || "";
        for (const t of tokenize(summaryText)) {
          if (!STOP_WORDS.has(t)) {
            for (let i = 0; i < 2; i++) weightedTokens.push(t);
          }
        }
      }

      // Body 1x
      for (const lang of ["en", "hi", "pa"]) {
        const bodyText = (card.body && card.body[lang]) || "";
        for (const t of tokenize(bodyText)) {
          if (!STOP_WORDS.has(t)) weightedTokens.push(t);
        }
      }

      const docLen = weightedTokens.length;
      this.docLengths.push(docLen);
      totalLen += docLen;

      const counts = {};
      const uniqueTokens = new Set();
      for (const t of weightedTokens) {
        counts[t] = (counts[t] || 0) + 1;
        uniqueTokens.add(t);
      }
      this.docTokenCounts.push(counts);

      for (const t of uniqueTokens) {
        this.df[t] = (this.df[t] || 0) + 1;
      }
    }

    if (this.docCount > 0) {
      this.avgDocLen = totalLen / this.docCount;
    }
  }

  routeIntent(query) {
    const q = query.toLowerCase();

    // 1. Electrical Hazard
    if (["wire", "wires", "electric", "power line", "shock", "breaker", "switch", "meter", "current", "pole", "बिजली", "तार", "तारों", "करंट", "स्विच", "खंभा", "खंभे", "खंभों", "मीटर", "ਬਿਜਲੀ", "ਤਾਰਾਂ", "ਤਾਰ", "ਕਰੰਟ", "ਸਵਿੱਚ", "ਖੰਭੇ", "ਖੰਭਾ", "ਪਾਵਰਕਾਮ", "1912"].some(w => q.includes(w))) {
      return { target: "card-electrical-safety", boost: 70.0 };
    }

    // 2. Medical Refusal & Ambulance
    if (["ambulance", "एंबुलेंस", "एम्बुलेंस", "ਐਂਬੂਲੈਂਸ", "medicine", "doctor", "tablet", "dose", "dosage", "fever", "diarrhea", "vomiting", "antibiotic", "injection", "paracetamol", "cholera", "दवा", "दवाई", "गोली", "खुराक", "बुखार", "दस्त", "उल्टी", "इंजेक्शन", "हैजा", "मरहम", "ਦਵਾਈ", "ਬੁਖ਼ਾਰ", "ਦਸਤ", "ਉਲਟੀਆਂ", "ਟੀਕਾ"].some(w => q.includes(w))) {
      return { target: "card-medical-refusal", boost: 70.0 };
    }

    // 3. Dedicated Helpline
    if (["helpline", "phone number", "control room", "ndma", "sdma", "ddma", "1078", "1070", "1077", "ਨੰਬਰ", "ਫੋਨ", "हैल्पलाइन", "नंबर", "कंट्रोल रूम", "ਕੰਟਰੋਲ ਰੂਮ"].some(w => q.includes(w))) {
      if (["helpline", "number", "ਨੰਬਰ", "नंबर", "phone", "ਕੰਟਰੋਲ", "कंट्रोल", "emergency"].some(w => q.includes(w))) {
        return { target: "corpus-helpline", boost: 100.0 };
      }
    }

    // 4. Drinking water
    if (["drinking water", "boil water", "boil", "purify", "well water", "hand pump", "borewell", "chlorine", "peene ka pani", "ubalna", "हैंडपंप", "बोरवेल", "कुएं", "कुआं", "उबालना", "उबालें", "पीने", "ਪੀਣ ਵਾਲਾ", "ਉਬਾਲਣਾ", "ਉਬਾਲੋ", "ਨਲਕੇ", "ਨਲਕਾ", "ਖੂਹ", "ਕਲੋਰੀਨ", "ਸ਼ੁੱਧ"].some(w => q.includes(w))) {
      return { target: "card-drinking-water", boost: 70.0 };
    }

    // 5. Snake & reptile hazards
    if (["snake", "snakebite", "reptile", "scorpion", "saap", "saanp", "katna", "सांप", "सांपों", "बिच्छू", "डंक", "ਸੱਪ", "ਸੱਪਾਂ", "ਬਿੱਛੂ", "ਡੰਗ"].some(w => q.includes(w))) {
      return { target: "card-snakes-reptiles", boost: 70.0 };
    }

    // 6. Livestock & cattle
    if (["cattle", "livestock", "cow", "cows", "buffalo", "buffaloes", "animal", "animals", "fodder", "untie", "pashu", "gay", "bhains", "chara", "पशु", "पशुओं", "गाय", "भैंस", "भैंसों", "मवेशी", "मवेशियों", "चारा", "खूंटे", "ਪਸ਼ੂ", "ਪਸ਼ੂਆਂ", "ਮੱਝ", "ਮੱਝਾਂ", "ਗਾਂ", "ਗਾਵਾਂ", "ਪੱਠੇ", "ਤੂੜੀ", "ਕਿੱਲੇ", "ਵਾੜੇ"].some(w => q.includes(w))) {
      return { target: "card-livestock-protection", boost: 70.0 };
    }

    // 7. Evacuation & Go-bag
    if (["evacuate", "evacuation", "shelter", "go-bag", "go bag", "pack", "leave home", "documents", "torch", "आपातकालीन बैग", "निकासी", "राहत शिविर", "घर खाली", "ਘਰ ਖਾਲੀ", "ਨਿਕਾਸੀ", "ਰਾਹਤ ਕੈਂਪ", "ਐਮਰਜੈਂਸੀ ਬੈਗ", "ਕਾਗਜ਼ਾਤ"].some(w => q.includes(w))) {
      return { target: "card-evacuation-readiness", boost: 70.0 };
    }

    // 8. Water crossing / driving hazards
    if (["cross", "crossing", "walk", "walk through", "wade", "swim", "drive", "car", "tractor", "bike", "motorbike", "vehicle", "knee", "ankle", "deep", "bridge", "causeway", "road", "पुल", "सड़क", "पैदल", "गाड़ी", "कार", "पार", "ਡਿੱਗਣ", "ਗੋਡੇ", "ਤੁਰ", "ਲੰਘ", "ਚਲਾਓ", "ਪੈਦਲ", "ਪਾਰ ਕਰਨਾ", "ਪੁਲ", "ਟਰੈਕਟਰ", "ਗੱਡੀ", "ਮੋਟਰਸਾਈਕਲ"].some(w => q.includes(w))) {
      return { target: "card-water-crossing", boost: 70.0 };
    }

    return { target: null, boost: 0 };
  }

  retrieve(query, topK = 3) {
    const { target: routedTarget, boost: routerBoost } = this.routeIntent(query);

    if (routedTarget === "corpus-helpline") {
      const helplineCard = {
        id: "corpus-helpline",
        title: { en: "Emergency Helplines", hi: "आपातकालीन हेल्पलाइन", pa: "ਐਮਰਜੈਂਸੀ ਹੈਲਪਲਾਈਨ" },
        category: "helpline",
        review_status: "verified"
      };
      return [{ card: helplineCard, score: 100.0 }];
    }

    const qTokens = tokenize(query).filter(t => !STOP_WORDS.has(t));
    if (qTokens.length === 0 || this.docCount === 0) return [];

    const k1 = 1.5;
    const b = 0.75;
    const scores = [];

    for (let idx = 0; idx < this.cards.length; idx++) {
      const card = this.cards[idx];
      let score = 0.0;
      const docLen = this.docLengths[idx];
      const counts = this.docTokenCounts[idx];

      for (const t of qTokens) {
        if (counts[t]) {
          const tf = counts[t];
          const docFreq = this.df[t] || 1;
          const idf = Math.log((this.docCount - docFreq + 0.5) / (docFreq + 0.5) + 1.0);
          const numerator = tf * (k1 + 1.0);
          const denominator = tf + k1 * (1.0 - b + b * (docLen / this.avgDocLen));
          score += idf * (numerator / denominator);
        }
      }

      if (routedTarget && card.id === routedTarget) {
        score += routerBoost;
      }

      scores.push({ card, score });
    }

    scores.sort((a, b) => b.score - a.score);
    return scores.slice(0, topK);
  }
}
