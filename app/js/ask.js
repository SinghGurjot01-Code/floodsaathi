// app/js/ask.js
// Multilingual Offline Card Retriever with M5 Router & Safety Guards (PRD Section 10A & Phase 6)
// Pure ES module: runs offline, NO framework.

const STOP_WORDS = new Set([
  "का", "की", "के", "में", "से", "को", "है", "हैं", "हो", "पर", "और", "या", "तो", "भी", "ने", "एक",
  "ਦਾ", "ਦੀ", "ਦੇ", "ਵਿੱਚ", "ਨੂੰ", "ਹੈ", "ਹਨ", "ਅਤੇ", "ਜਾਂ", "ਨੇ", "ਇੱਕ", "ਤਾਂ", "ਕੀ", "ਕਿਵੇਂ", "ਕਰਨਾ",
  "the", "is", "in", "to", "and", "or", "of", "a", "an", "what", "how", "can", "should", "i", "we", "my", "our", "do", "if", "for", "on", "at", "by", "from", "with"
]);

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

    // 1. Water Crossing Hazards (Turn Around, Don't Drown - Highest Priority)
    if (["cross", "crossing", "walk", "walk through", "wade", "swim", "drive", "car", "tractor", "bike", "motorbike", "motorcycle", "vehicle", "knee", "ankle", "deep", "bridge", "causeway", "road", "पुल", "सड़क", "पैदल", "गाड़ी", "कार", "पार", "ਡਿੱਗਣ", "ਗੋਡੇ", "ਤੁਰ", "ਲੰਘ", "ਚਲਾਓ", "ਪੈਦਲ", "ਪਾਰ ਕਰਨਾ", "ਪੁਲ", "ਟਰੈਕਟਰ", "ਗੱਡੀ", "ਮੋਟਰਸਾਈਕਲ", "ਨਾਲਿਆਂ", "ਖੁੱਲ੍ਹੇ ਨਾਲਿਆਂ", "ਖ਼ਤਰੇ", "छिपे खतरे", "खेल सकते"].some(w => q.includes(w))) {
      if (!["snake", "saap", "saanp", "ਸੱਪ", "सांप", "wire", "electric", "power line", "बिजली", "तार", "ਬਿਜਲੀ", "ਤਾਰ", "1912", "step potential", "dry motor", "megger", "repair", "tether", "khunta", "breach"].some(w => q.includes(w))) {
        return { target: "card-water-crossing", boost: 70.0 };
      }
    }

    // 2. Dedicated Helpline Routing
    if (["helpline", "phone number", "control room", "ndma", "sdma", "ddma", "1078", "1070", "1077", "ਫੋਨ ਨੰਬਰ", "ਹੈਲਪਲਾਈਨ", "ਕੰਟਰੋਲ ਰੂਮ", "कंट्रोल रूम", "नियंत्रण कक्ष", "हेल्पलाइन", "फोन नंबर"].some(w => q.includes(w))) {
      return { target: "corpus-helpline", boost: 100.0 };
    }

    // 3. Medical Refusal & Ambulance
    if (["ambulance", "एंबुलेंस", "एम्बुलेंस", "ਐਂਬੂਲੈਂਸ", "medicine", "doctor", "tablet", "dose", "dosage", "fever", "diarrhea", "vomiting", "antibiotic", "injection", "paracetamol", "cholera", "दवा", "दवाई", "गोली", "खुराक", "बुखार", "दस्त", "उल्टी", "इंजेक्शन", "हैजा", "मरहम", "ਦਵਾਈ", "ਬੁਖ਼ਾਰ", "ਦਸਤ", "ਉਲਟੀਆਂ", "ਟੀਕਾ"].some(w => q.includes(w))) {
      if (!["purify", "chlorine tablet", "aquatabs"].some(w => q.includes(w))) {
        return { target: "card-medical-refusal", boost: 70.0 };
      }
    }

    // 4. Specific Disaster Sub-Topics (High Precision)
    // A. Electrical: Appliances & Motors Post-Flood
    const isMotorQuery = (
      (q.includes("motor") && !["motorbike", "motorcycle", "motor bike"].some(mb => q.includes(mb))) ||
      (q.includes("ਮੋਟਰ") && !q.includes("ਮੋਟਰਸਾਈਕਲ")) ||
      (q.includes("मोटर") && !q.includes("मोटरसाइकिल")) ||
      ["appliance", "appliances", "fridge", "television", "inverter", "megger", "submersible", "tubewell", "dry motor", "ਉਪਕਰਨ", "ਸਮਰਸੀਬਲ", "ਟਿਊਬਵੈੱਲ", "ਮੈਗਰ", "उपकरण", "मेगर", "समरसिबल", "ट्यूबवेल"].some(w => q.includes(w))
    );
    if (isMotorQuery) {
      return { target: "card-appliances-post-flood", boost: 75.0 };
    }

    // B. Electrical: Step Potential & Hopping/Shuffling
    if (["step potential", "hopping", "bunny hop", "shuffle", "feet together", "ground current", "ਸਟੈੱਪ ਪੋਟੈਂਸ਼ੀਅਲ", "ਪੈਰ ਘੜੀਸ", "ਦੋਵੇਂ ਪੈਰ ਜੋੜ", "ਛਾਲਾਂ ਮਾਰ", "स्टेप पोटेंशियल", "पैर घसीट", "कूदते हुए"].some(w => q.includes(w))) {
      return { target: "card-electrical-step-potential", boost: 75.0 };
    }

    // C. Water: Well Chlorination Math & Calculations
    if (["calculation", "formula", "pi r", "radius", "volume", "depth", "cubic metre", "12,500", "ਗਣਨਾ", "ਕੈਲਕੁਲੇਸ਼ਨ", "ਅਰਧ-ਵਿਆਸ", "ਸੂਤਰ", "ਫਾਰਮੂਲਾ", "ਖੂਹ ਦੀ ਗਣਨਾ", "ਕਿੰਨਾ ਬਲੀਚਿੰਗ", "ਕਿੰਨਾ ਪਾਊਡਰ", "गणना", "त्रिज्या", "कुएं की गणना", "कितना ब्लीचिंग"].some(w => q.includes(w))) {
      return { target: "card-well-chlorination-calc", boost: 75.0 };
    }

    // D. Water: Overhead Sintex / Plastic Storage Tanks
    if (["sintex", "overhead tank", "plastic tank", "storage tank", "cleaning tank", "clean tank", "ਸਿੰਟੈਕਸ", "ਟੈਂਕੀ ਸਾਫ਼", "ਛੱਤ ਵਾਲੀ ਟੈਂਕੀ", "ਸਿੰਟੈਕਸ ਟੈਂਕੀ", "ਪਲਾਸਟਿਕ ਟੈਂਕੀ", "सिंटेक्स", "टंकी साफ", "प्लास्टिक टंकी"].some(w => q.includes(w))) {
      return { target: "card-water-tank-disinfection", boost: 75.0 };
    }

    // E. Reptiles: Snakebite First Aid & ASV
    if (["first aid", "tourniquet", "anti-venom", "asv", "cut wound", "suck venom", "treatment", "ਕੱਟਣਾ", "ਫਸਟ ਏਡ", "ਐਂਟੀ ਵੈਨਮ", "ਸੱਪ ਦਾ ਇਲਾਜ", "ਚੀਰਾ", "ਰੱਸੀ ਬੰਨ੍ਹ", "प्राथमिक उपचार", "एंटी वेनम", "चीरा लगाना"].some(w => q.includes(w)) && ["snake", "snakebite", "bite", "ਸੱਪ", "ਸੱਪ ਲੜ", "ਡੰਗ", "सांप", "डंक"].some(s => q.includes(s))) {
      return { target: "card-snakebite-first-aid", boost: 75.0 };
    }

    // F. Reptiles: Scorpion Stings
    if (["scorpion sting", "scorpion bite", "ਬਿੱਛੂ ਦਾ ਡੰਗ", "ਬਿੱਛੂ ਲੜ", "बिच्छू का डंक", "बिच्छू काटना"].some(w => q.includes(w))) {
      return { target: "card-scorpion-sting-aid", boost: 75.0 };
    }

    // G. Sanitation: Silt & Flood Mud Cleanup
    if (["clean silt", "mud cleanup", "flood mud", "sludge", "cleaning house", "shovel", "ਗਾਰ ਸਾਫ਼", "ਚਿੱਕੜ ਸਾਫ਼", "ਹੜ੍ਹ ਦੀ ਗਾਰ", "ਸਿਲਟ", "ਕਹੀ", "गाद साफ", "कीचड़ साफ", "सिल्ट साफ"].some(w => q.includes(w))) {
      return { target: "card-silt-mud-cleanup", boost: 75.0 };
    }

    // H. Sanitation: Leptospirosis Prevention
    if (["leptospirosis", "rat urine", "stagnant water infection", "calf pain", "mud disease", "water infection", "ਲੈਪਟੋਸਪਾਇਰੋਸਿਸ", "ਪਿੰਨੀਆਂ ਦਾ ਦਰਦ", "ਲੇਪਟੋਸਪਾਇਰੋਸਿਸ", "ਚੂਹੇ ਦਾ ਪਿਸ਼ਾਬ", "लेप्टोस्पायरोसिस", "चूहे का पेशाब", "पिंडलियों का दर्द"].some(w => q.includes(w))) {
      return { target: "card-leptospirosis-prevention", boost: 75.0 };
    }

    // I. Sanitation: Livestock Carcass Disposal
    if (["carcass", "dead cattle", "dead animal", "dead cow", "dead buffalo", "quicklime", "bury carcass", "burial pit", "dead livestock", "ਮਰੇ ਪਸ਼ੂ", "ਮਰੇ ਡੰਗਰ", "ਮਰੀ ਗਾਂ", "ਦਫ਼ਨਾਉਣਾ", "ਚੂਨਾ ਪਾਉਣਾ", "ਮਰੇ ਹੋਏ ਪਸ਼ੂ", "ਪਸ਼ੂ ਦਬਾਉਣਾ", "मृत पशु", "दफनाना", "चूना डालकर"].some(w => q.includes(w))) {
      return { target: "card-carcass-disposal", boost: 75.0 };
    }

    // J. Livestock: Stranded Livestock on Islands / Bunds
    if (["stranded cattle", "stranded cows", "livestock island", "cattle on island", "fodder drop", "ਟਾਪੂ 'ਤੇ ਫਸੇ ਪਸ਼ੂ", "ਦਰਿਆਈ ਟਾਪੂ 'ਤੇ ਡੰਗਰ", "ਫਸੇ ਪਸ਼ੂ", "ਟਾਪੂ", "टापू पर फंसे मवेशी", "टापू पर फंसे"].some(w => q.includes(w))) {
      return { target: "card-stranded-livestock-rescue", boost: 75.0 };
    }

    // K. Embankments: Dhussi Bundh Breach Response
    if (["dhussi bundh breach", "dhussi breach", "embankment breach", "bundh breach", "dhussi tootna", "ਧੁੱਸੀ ਬੰਨ੍ਹ ਪਾੜ", "ਬੰਨ੍ਹ ਟੁੱਟ", "ਪਾੜ ਪੈਣਾ", "ਧੁੱਸੀ ਪਾੜ", "ਮੁਨਾਦੀ", "ਧੁੱਸੀ ਟੁੱਟ", "धुस्सी बांध टूटना", "बांध में दरार", "बांध टूटना"].some(w => q.includes(w))) {
      return { target: "card-dhussi-bundh-breach", boost: 75.0 };
    }

    // L. Embankments: Sand Boil Ring Bunding
    if (["sand boil", "ring bundh", "piping", "sand geyser", "bubbling sand", "sandbag ring", "sandboil", "ਸੈਂਡ ਬੋਇਲ", "ਰਿੰਗ ਬੰਨ੍ਹ", "ਮੋਘਾ", "ਰੇਤ ਉਬਲ", "ਬੰਨ੍ਹ 'ਚੋਂ ਪਾਣੀ", "सैंड बॉयल", "रिंग बांध", "उबलती रेत"].some(w => q.includes(w))) {
      return { target: "card-sand-boil-embankment", boost: 75.0 };
    }

    // M. Evacuation: Vulnerable Populations (Pregnant, Elderly, Infants)
    if (["pregnant", "pregnancy", "wheelchair", "handicapped", "mcp card", "disabled", "infant", "infants", "elderly", "ਬਜ਼ੁਰਗ", "ਗਰਭਵਤੀ", "ਅਪਾਹਜ", "ਸੋਟੀ", "ਐਨਕਾਂ", "ਜੱਚਾ-ਬੱਚਾ", "ਬੱਚਿਆਂ ਨੂੰ ਬਚਾਓ", "गर्भवती", "दिव्यांग", "बुजुर्ग", "शिशु"].some(w => q.includes(w))) {
      return { target: "card-vulnerable-evacuation", boost: 75.0 };
    }

    // N. Evacuation: Government Relief Shelters Directory
    if (["shahkot", "sultanpur lodhi", "ajnala", "makhu", "mukerian", "anandpur sahib", "jalandhar shelter", "kapurthala shelter", "amritsar shelter", "firozpur shelter", "shelter address", "which shelter", "relief shelter", "ਸੁਲਤਾਨਪੁਰ ਲੋਧੀ", "ਸ਼ਾਹਕੋਟ", "ਅਜਨਾਲਾ", "ਮੱਖੂ", "ਮੁਕੇਰੀਆਂ", "ਸ੍ਰੀ ਅਨੰਦਪੁਰ ਸਾਹਿਬ", "ਕਿਹੜਾ ਰਾਹਤ ਕੈਂਪ", "ਰਾਹਤ ਸ਼ਿਵਿਰ", "ਸ਼ੈਲਟਰ ਕਿੱਥੇ", "ਕੈਂਪ ਕਿੱਥੇ", "राहत शिविर कहां", "कैंप कहां"].some(w => q.includes(w))) {
      return { target: "card-shelters-directory-punjab", boost: 75.0 };
    }

    // O. Food: Food & Grain Preservation
    if (["food storage", "protect food", "protect ration", "safe food", "flour", "rice", "dry food", "food touched", "gas cylinder", "lpg cylinder", "ration", "ਰਾਸ਼ਨ ਬਚਾਉਣਾ", "ਅਨਾਜ ਸੁਰੱਖਿਆ", "ਸੁੱਕਾ ਰਾਸ਼ਨ", "ਗੈਸ ਸਿਲੰਡਰ ਬਚਾਓ", "ਰਾਸ਼ਨ", "ਅਨਾਜ", "ਖਾਣਾ", "राशन सुरक्षा", "अनाज सुरक्षा", "गैस सिलेंडर", "भोजन", "खाना"].some(w => q.includes(w))) {
      return { target: "card-food-preservation-flood", boost: 75.0 };
    }

    // P. Recovery: Damage Survey & Girdawari Compensation
    if (["compensation", "girdawari", "patwari", "crop damage", "fasal kharaba", "loss money", "sdrf", "fard", "jamabandi", "damage survey", "claim money", "ਮੁਆਵਜ਼ਾ", "ਗਿਰਦਾਵਰੀ", "ਪਟਵਾਰੀ", "ਖ਼ਰਾਬਾ", "ਫ਼ਸਲ ਨੁਕਸਾਨ", "ਸਰਕਾਰੀ ਮਦਦ", "ਫ਼ਰਦ", "ਮੁਆਵਜ਼ਾ ਕਿਵੇਂ", "मुआवजा", "गिरदावरी", "पटवारी", "फसल खराबा"].some(w => q.includes(w))) {
      return { target: "card-compensation-girdawari", boost: 75.0 };
    }

    // Q. Search & Rescue: Trapped Persons & Boat Evacuation
    if (["boat", "rescue", "trapped", "stranded", "stuck", "roof", "ndrf", "sdrf", "ਕਿਸ਼ਤੀ", "ਬਚਾਓ", "ਫਸੇ", "ਛੱਤ", "ਮਦਦ", "नाव", "बचाव", "फंसे", "छत"].some(w => q.includes(w))) {
      if (!["cattle", "cow", "buffalo", "ਪਸ਼ੂ", "ਡੰਗਰ", "animal", "fodder"].some(w => q.includes(w))) {
        return { target: "card-search-and-rescue", boost: 75.0 };
      }
    }

    // 5. Core Hazard Fallbacks (Broad)
    // A. Electrical Safety
    if (["wire", "wires", "electric", "power line", "shock", "breaker", "switch", "meter", "current", "pole", "transformer", "बिजली", "तार", "तारों", "करंट", "स्विच", "खंभा", "खंभे", "खंभों", "मीटर", "ਬਿਜਲੀ", "ਤਾਰਾਂ", "ਤਾਰ", "ਕਰੰਟ", "ਸਵਿੱਚ", "ਖੰਭੇ", "ਖੰਭਾ", "ਪਾਵਰਕਾਮ", "1912"].some(w => q.includes(w))) {
      return { target: "card-electrical-safety", boost: 70.0 };
    }

    // B. Drinking Water
    if (["drinking water", "boil water", "boil", "purify", "well water", "hand pump", "borewell", "chlorine", "peene ka pani", "ubalna", "हैंडपंप", "बोरवेल", "कुएं", "कुआं", "उबालना", "उबालें", "पीने", "ਪੀਣ ਵਾਲਾ", "ਉਬਾਲਣਾ", "ਉਬਾਲੋ", "ਨਲਕੇ", "ਨਲਕਾ", "ਖੂਹ", "ਕਲੋਰੀਨ", "ਸ਼ੁੱਧ"].some(w => q.includes(w))) {
      return { target: "card-drinking-water", boost: 70.0 };
    }

    // C. Snake & Reptile Hazards
    if (["snake", "snakebite", "reptile", "scorpion", "saap", "saanp", "katna", "सांप", "सांपों", "बिच्छू", "डंक", "ਸੱਪ", "ਸੱਪਾਂ", "ਬਿੱਛੂ", "ਡੰਗ"].some(w => q.includes(w))) {
      return { target: "card-snakes-reptiles", boost: 70.0 };
    }

    // D. Livestock & Cattle Safety
    if (["cattle", "livestock", "cow", "cows", "buffalo", "buffaloes", "animal", "animals", "fodder", "untie", "pashu", "gay", "bhains", "chara", "पशु", "पशुओं", "गाय", "भैंस", "भैंसों", "मवेशी", "मवेशियों", "चारा", "खूंटे", "ਪਸ਼ੂ", "ਪਸ਼ੂਆਂ", "ਮੱਝ", "ਮੱਝਾਂ", "ਗਾਂ", "ਗਾਵਾਂ", "ਪੱਠੇ", "ਤੂੜੀ", "ਕਿੱਲੇ", "ਵਾੜੇ"].some(w => q.includes(w))) {
      return { target: "card-livestock-protection", boost: 70.0 };
    }

    // E. Evacuation & Go-bag
    if (["evacuate", "evacuation", "shelter", "go-bag", "go bag", "pack", "leave home", "documents", "torch", "आपातकालीन बैग", "निकासी", "राहत शिविर", "घर खाली", "ਘਰ ਖਾਲੀ", "ਨਿਕਾਸੀ", "ਰਾਹਤ ਕੈਂਪ", "ਐਮਰਜੈਂਸੀ ਬੈਗ", "ਕਾਗਜ਼ਾਤ", "ਬੈਗ", "ਕੀ-ਕੀ ਰੱਖੀਏ"].some(w => q.includes(w))) {
      return { target: "card-evacuation-readiness", boost: 70.0 };
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
