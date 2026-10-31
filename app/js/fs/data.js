/* FloodSaathi Data Store & Knowledge Base (Self-Contained Vanilla JS) */
window.FS = window.FS || {};

window.FS.DATA = {
  // Punjab Places with Geographical & Hydrological Profiles
  places: [
    {
      id: "taman",
      name: "Taman, Jalandhar",
      region: "Punjab",
      lat: 31.3260,
      lng: 75.5762,
      river: "River Beas",
      riverLevel: 3.2,
      warningLevel: 3.8,
      delta: -0.4,
      rainForecast: 12,
      elevation: 246,
      riverDistance: 3.8,
      risk: "Moderate",
      riskLabel: "Moderate Risk"
    },
    {
      id: "phillaur",
      name: "Phillaur, Jalandhar",
      region: "Punjab",
      lat: 31.0205,
      lng: 75.7869,
      river: "River Sutlej",
      riverLevel: 4.2,
      warningLevel: 4.0,
      delta: 0.6,
      rainForecast: 28,
      elevation: 234,
      riverDistance: 1.2,
      risk: "High",
      riskLabel: "High Risk"
    },
    {
      id: "nakodar",
      name: "Nakodar, Jalandhar",
      region: "Punjab",
      lat: 31.1274,
      lng: 75.4746,
      river: "White Bein",
      riverLevel: 2.1,
      warningLevel: 3.5,
      delta: -0.1,
      rainForecast: 8,
      elevation: 238,
      riverDistance: 6.5,
      risk: "Low",
      riskLabel: "Low Risk"
    },
    {
      id: "kapurthala",
      name: "Kapurthala Central",
      region: "Punjab",
      lat: 31.3802,
      lng: 75.3819,
      river: "River Beas",
      riverLevel: 3.4,
      warningLevel: 3.8,
      delta: 0.2,
      rainForecast: 18,
      elevation: 228,
      riverDistance: 4.2,
      risk: "Moderate",
      riskLabel: "Moderate Risk"
    },
    {
      id: "sultanpur",
      name: "Sultanpur Lodhi",
      region: "Kapurthala, Punjab",
      lat: 31.2185,
      lng: 75.1979,
      river: "Kali Bein & Beas",
      riverLevel: 4.4,
      warningLevel: 4.0,
      delta: 0.8,
      rainForecast: 32,
      elevation: 215,
      riverDistance: 1.5,
      risk: "High",
      riskLabel: "High Risk"
    },
    {
      id: "ludhiana",
      name: "Ludhiana (Sutlej Bank)",
      region: "Punjab",
      lat: 30.9010,
      lng: 75.8573,
      river: "River Sutlej",
      riverLevel: 2.8,
      warningLevel: 3.6,
      delta: 0.3,
      rainForecast: 15,
      elevation: 244,
      riverDistance: 5.2,
      risk: "Moderate",
      riskLabel: "Moderate Risk"
    },
    {
      id: "ferozepur",
      name: "Ferozepur Border Belt",
      region: "Punjab",
      lat: 30.9237,
      lng: 74.6139,
      river: "River Sutlej",
      riverLevel: 4.6,
      warningLevel: 4.2,
      delta: 1.1,
      rainForecast: 45,
      elevation: 198,
      riverDistance: 2.1,
      risk: "High",
      riskLabel: "High Risk"
    },
    {
      id: "harike",
      name: "Harike Pattan",
      region: "Tarn Taran, Punjab",
      lat: 31.1542,
      lng: 74.9622,
      river: "Beas-Sutlej Confluence",
      riverLevel: 4.8,
      warningLevel: 4.5,
      delta: 0.9,
      rainForecast: 35,
      elevation: 210,
      riverDistance: 0.8,
      risk: "High",
      riskLabel: "High Risk"
    },
    {
      id: "ropar",
      name: "Rupnagar (Ropar)",
      region: "Punjab",
      lat: 30.9664,
      lng: 76.5331,
      river: "River Sutlej",
      riverLevel: 3.1,
      warningLevel: 3.6,
      delta: 0.2,
      rainForecast: 20,
      elevation: 260,
      riverDistance: 2.4,
      risk: "Moderate",
      riskLabel: "Moderate Risk"
    },
    {
      id: "anandpur",
      name: "Anandpur Sahib",
      region: "Rupnagar, Punjab",
      lat: 31.2361,
      lng: 76.4984,
      river: "River Sutlej",
      riverLevel: 2.5,
      warningLevel: 3.8,
      delta: -0.2,
      rainForecast: 14,
      elevation: 290,
      riverDistance: 3.2,
      risk: "Low",
      riskLabel: "Low Risk"
    }
  ],

  // Emergency Shelters
  shelters: [
    {
      id: "shelter-taman",
      name: "Government Senior Secondary School, Taman",
      distKm: 3.2,
      distText: "3.2 km • 8 min walk",
      lat: 31.3310,
      lng: 75.5820,
      capacity: 500,
      phone: "+91 181 2234567",
      features: [
        "Capacity: 500 people",
        "Safe drinking water supply",
        "Medical camp & First Aid",
        "Elevated & safe from flood zone",
        "Community kitchen (Langar)"
      ]
    },
    {
      id: "shelter-phillaur",
      name: "Phillaur Community Hall & Relief Camp",
      distKm: 4.8,
      distText: "4.8 km • 12 min drive",
      lat: 31.0250,
      lng: 75.7920,
      capacity: 800,
      phone: "+91 182 6223111",
      features: [
        "Capacity: 800 people",
        "Hot food & clean ration",
        "Doctors on 24-hr duty",
        "Generator power backup",
        "Separate family dormitories"
      ]
    },
    {
      id: "shelter-nakodar",
      name: "Khalsa Aid Disaster Centre, Nakodar",
      distKm: 6.1,
      distText: "6.1 km • 15 min drive",
      lat: 31.1350,
      lng: 75.4820,
      capacity: 400,
      phone: "+91 182 1224888",
      features: [
        "Capacity: 400 people",
        "24/7 Pure water filtering",
        "Animal & cattle shelter adjoining",
        "Emergency communications hub",
        "Bedding & blankets distributed"
      ]
    }
  ],

  // Hospitals & Medical Centres
  hospitals: [
    {
      id: "hosp-1",
      name: "Civil Hospital, Jalandhar",
      lat: 31.3200,
      lng: 75.5700,
      dist: "5.4 km",
      phone: "108"
    },
    {
      id: "hosp-2",
      name: "Sub-Divisional Hospital, Phillaur",
      lat: 31.0220,
      lng: 75.7850,
      dist: "3.8 km",
      phone: "108"
    },
    {
      id: "hosp-3",
      name: "Primary Health Centre, Taman",
      lat: 31.3280,
      lng: 75.5790,
      dist: "1.5 km",
      phone: "+91 181 2289100"
    }
  ],

  // Official Alerts
  alerts: [
    {
      id: "alert-1",
      type: "flood",
      severity: "danger",
      title: "Flood Warning: Beas River Rising",
      timeAgo: "2 hours ago",
      timestamp: Date.now() - 2 * 3600 * 1000,
      description: "Beas River water level rising rapidly due to heavy rainfall in Himachal catchment. Villages downstream in Jalandhar and Kapurthala may experience inundation.",
      source: "NDMA - SACHET",
      affectedAreas: "Taman, Phillaur, Sultanpur Lodhi, Harike belt",
      actions: [
        "Move elderly, children, and livestock to designated high ground immediately",
        "Pack identity cards, medications, dry food, and power banks in watertight bags",
        "Do not drive or walk through standing floodwater under any circumstances",
        "Tune in to local administration radio broadcasts and keep phones charged"
      ]
    },
    {
      id: "alert-2",
      type: "dam",
      severity: "warning",
      title: "Dam Release Update: Pong Reservoir",
      timeAgo: "4 hours ago",
      timestamp: Date.now() - 4 * 3600 * 1000,
      description: "Bhakra Beas Management Board (BBMB) has initiated controlled discharge of 45,000 cusecs from Pong Dam spillway. Downstream water levels will surge in 12–24 hours.",
      source: "BBMB & Punjab Irrigation Dept",
      affectedAreas: "Hoshiarpur, Kapurthala, Gurdaspur, Jalandhar riverbanks",
      actions: [
        "Evacuate cattle from riverbed farming belts immediately",
        "Boat owners and fishermen must secure crafts and stay off the water",
        "Follow instructions broadcast by village Sarpanch and loudspeakers"
      ]
    },
    {
      id: "alert-3",
      type: "rain",
      severity: "warning",
      title: "Heavy Rainfall Alert: Orange Warning",
      timeAgo: "6 hours ago",
      timestamp: Date.now() - 6 * 3600 * 1000,
      description: "IMD Chandigarh issues Orange Alert for widespread heavy to very heavy rainfall (70–120 mm) across Majha and Doaba regions over next 24 hours.",
      source: "India Meteorological Dept (IMD)",
      affectedAreas: "Jalandhar, Amritsar, Kapurthala, Hoshiarpur, Rupnagar",
      actions: [
        "Clear rooftop drainage pipes and household outlets of debris",
        "Disconnect non-essential electrical appliances to prevent short circuits",
        "Store at least 10 litres of boiled drinking water per household member"
      ]
    },
    {
      id: "alert-4",
      type: "flood",
      severity: "info",
      title: "Sutlej River Monitoring Bulletin",
      timeAgo: "10 hours ago",
      timestamp: Date.now() - 10 * 3600 * 1000,
      description: "Sutlej River discharge at Ropar Headworks is currently 28,000 cusecs, staying within safe banking capacity. Irrigation department 24/7 patrols are active.",
      source: "Central Water Commission (CWC Punjab)",
      affectedAreas: "Ropar, Machhiwara, Ludhiana rural",
      actions: [
        "Normal vigilance advised; no immediate evacuation order in effect",
        "Report any embankment weakness or seepage to District Control Room (1077)"
      ]
    }
  ],

  // Time-to-Water simulation steps (used in map slider)
  timeToWater: [
    {
      step: 0,
      label: "Now",
      hours: "32 hours",
      depth: "0.5 – 1.2 m",
      risk: "Moderate",
      color: "#f58a2b",
      waterOpacity: 0.15,
      note: "Based on river level rise at Beas, rain forecast and terrain elevation."
    },
    {
      step: 1,
      label: "12h",
      hours: "20 hours",
      depth: "0.8 – 1.5 m",
      risk: "Moderate",
      color: "#f58a2b",
      waterOpacity: 0.28,
      note: "Upstream dam release reaching central channels. Water entering low farmlands."
    },
    {
      step: 2,
      label: "24h",
      hours: "8 hours",
      depth: "1.2 – 2.0 m",
      risk: "High",
      color: "#ef1c24",
      waterOpacity: 0.45,
      note: "Secondary tributaries overflowing. Village approach roads becoming submerged."
    },
    {
      step: 3,
      label: "48h",
      hours: "Inundated",
      depth: "1.8 – 2.8 m",
      risk: "Severe",
      color: "#c4131b",
      waterOpacity: 0.65,
      note: "Peak flood level expected. Ground floors inundated; evacuation essential."
    },
    {
      step: 4,
      label: "72h",
      hours: "Receding",
      depth: "1.0 – 1.6 m",
      risk: "Moderate",
      color: "#f58a2b",
      waterOpacity: 0.35,
      note: "Water receding slowly. Heavy silt deposits and structural hazards remain."
    }
  ],

  // Offline Knowledge Base: 15 comprehensive disaster topics
  knowledgeBase: [
    {
      id: "water-in-house",
      keywords: [
        "water", "house", "enter", "inside", "room", "flooding", "ghare", "ghar", "paani", "pani",
        "ਪਾਣੀ", "ਘਰ", "ਆ ਗਿਆ", "ਅੰਦਰ", "कमरे", "घुस गया", "मकान"
      ],
      title: {
        en: "Water entered my house: Immediate actions",
        pa: "ਘਰ ਵਿੱਚ ਪਾਣੀ ਦਾਖਲ ਹੋ ਗਿਆ: ਤੁਰੰਤ ਕਰਨ ਵਾਲੇ ਕੰਮ",
        hi: "घर में पानी घुस गया: तुरंत किए जाने वाले कदम"
      },
      steps: {
        en: [
          "Evacuate all family members and pets to the highest floor, terrace, or an official shelter immediately.",
          "Switch off the main electrical circuit breaker (MCB) only if the switchboard area is completely dry. Never touch switches in standing water.",
          "Shut off the main LPG cooking gas cylinder valve tightly.",
          "Gather waterproof bag with ID cards, property deeds, medications, cash, and mobile phone chargers.",
          "Call the state flood helpline at 112 or 1070 for emergency boat rescue if water rises above knee level."
        ],
        pa: [
          "ਸਭ ਤੋਂ ਪਹਿਲਾਂ ਆਪਣੇ ਪਰਿਵਾਰਕ ਮੈਂਬਰਾਂ ਅਤੇ ਜਾਨਵਰਾਂ ਨੂੰ ਛੱਤ 'ਤੇ ਜਾਂ ਕਿਸੇ ਸੁਰੱਖਿਅਤ ਉੱਚੀ ਥਾਂ 'ਤੇ ਲੈ ਜਾਓ।",
          "ਜੇਕਰ ਸਵਿੱਚਬੋਰਡ ਪੂਰੀ ਤਰ੍ਹਾਂ ਸੁੱਕਾ ਹੈ ਤਾਂ ਮੁੱਖ ਬਿਜਲੀ ਦਾ ਮੀਟਰ/ਸਵਿੱਚ (MCB) ਬੰਦ ਕਰੋ। ਪਾਣੀ ਵਿੱਚ ਖੜ੍ਹੇ ਹੋ ਕੇ ਬਿਜਲੀ ਨੂੰ ਕਦੇ ਹੱਥ ਨਾ ਲਾਓ।",
          "ਰਸੋਈ ਗੈਸ (LPG) ਸਿਲੰਡਰ ਦਾ ਰੈਗੂਲੇਟਰ ਚੰਗੀ ਤਰ੍ਹਾਂ ਬੰਦ ਕਰ ਦਿਓ।",
          "ਜ਼ਰੂਰੀ ਕਾਗਜ਼ਾਤ, ਆਧਾਰ ਕਾਰਡ, ਦਵਾਈਆਂ ਅਤੇ ਮੋਬਾਈਲ ਨੂੰ ਪਲਾਸਟਿਕ ਦੇ ਲਿਫ਼ਾਫ਼ੇ ਵਿੱਚ ਬੰਨ੍ਹ ਕੇ ਉੱਚੀ ਥਾਂ ਰੱਖੋ।",
          "ਜੇਕਰ ਪਾਣੀ ਗੋਡਿਆਂ ਤੋਂ ਉੱਪਰ ਚੜ੍ਹ ਰਿਹਾ ਹੋਵੇ ਤਾਂ ਤੁਰੰਤ 112 ਜਾਂ 1070 'ਤੇ ਬਚਾਅ ਟੀਮ ਲਈ ਸੰਪਰਕ ਕਰੋ।"
        ],
        hi: [
          "सबसे पहले परिवार के सभी सदस्यों और पशुओं को छत या किसी सुरक्षित ऊंचे स्थान पर ले जाएं।",
          "यदि स्विचबोर्ड सूखा है तो घर की मुख्य बिजली (MCB) तुरंत बंद करें। गीले हाथों या पानी में खड़े होकर बिजली को न छुएं।",
          "रसोई गैस (LPG) सिलेंडर का रेगुलेटर तुरंत बंद कर दें।",
          "ज़रूरी दस्तावेज़, आधार कार्ड, दवाएं और मोबाइल फोन को वाटरप्रूफ प्लास्टिक बैग में सुरक्षित रखें।",
          "यदि पानी घुटनों से ऊपर बढ़ रहा है तो तत्काल 112 या 1070 पर कॉल करके नाव बचाव टीम की मदद लें।"
        ]
      },
      source: "NDMA Flood Safety Guidelines & Punjab SDMA"
    },
    {
      id: "water-purification",
      keywords: [
        "purify", "clean", "drink", "drinking", "boil", "chlorine", "tablet", "peena", "peene",
        "ਪੀਣ ਵਾਲਾ", "ਪਾਣੀ ਸਾਫ਼", "ਉਬਾਲਣਾ", "ਕਲੋਰੀਨ", "ਸਵੱਛ", "उबालना", "क्लोरीन", "साफ पानी"
      ],
      title: {
        en: "How to safely purify drinking water during floods",
        pa: "ਹੜ੍ਹਾਂ ਦੌਰਾਨ ਪੀਣ ਵਾਲੇ ਪਾਣੀ ਨੂੰ ਕਿਵੇਂ ਸਾਫ਼ ਕਰੀਏ",
        hi: "बाढ़ के समय पीने के पानी को कैसे शुद्ध करें"
      },
      steps: {
        en: [
          "Boil water vigorously for at least 3 full minutes at rolling boil to eliminate all bacteria, viruses, and parasites.",
          "If fuel or gas is unavailable, use Chlorine / Halazone tablets: Add 1 tablet (0.5g) to 20 litres of clear water; stir and wait 30 minutes before drinking.",
          "Filter muddy water through a clean cotton cloth or four folds of dupatta before boiling or chlorinating.",
          "Never consume floodwater or tap water from submerged pipelines without thorough purification.",
          "Keep drinking water stored in tightly covered narrow-mouthed containers to prevent recontamination."
        ],
        pa: [
          "ਪਾਣੀ ਨੂੰ ਘੱਟੋ-ਘੱਟ 3 ਮਿੰਟ ਤੇਜ਼ ਉਬਾਲਾ ਦਿਵਾਓ ਤਾਂ ਜੋ ਸਾਰੇ ਰੋਗਾਣੂ ਅਤੇ ਬੈਕਟੀਰੀਆ ਖ਼ਤਮ ਹੋ ਜਾਣ।",
          "ਜੇਕਰ ਬਾਲਣ ਨਾ ਹੋਵੇ ਤਾਂ ਕਲੋਰੀਨ ਦੀ ਗੋਲੀ ਵਰਤੋ: 20 ਲੀਟਰ ਸਾਫ਼ ਪਾਣੀ ਵਿੱਚ ਇੱਕ ਗੋਲੀ ਘੋਲੋ ਅਤੇ 30 ਮਿੰਟ ਬਾਅਦ ਹੀ ਪੀਓ।",
          "ਮੈਲੇ ਪਾਣੀ ਨੂੰ ਉਬਾਲਣ ਤੋਂ ਪਹਿਲਾਂ ਸਾਫ਼ ਸੂਤੀ ਕੱਪੜੇ ਜਾਂ ਦੁਪੱਟੇ ਦੀਆਂ ਚਾਰ ਤਹਿਆਂ ਵਿੱਚੋਂ ਛਾਣ ਲਓ।",
          "ਹੜ੍ਹ ਦੇ ਪਾਣੀ ਜਾਂ ਡੁੱਬੀਆਂ ਪਾਈਪਾਂ ਦੇ ਪਾਣੀ ਨੂੰ ਬਿਨਾਂ ਸਾਫ਼ ਕੀਤੇ ਕਦੇ ਨਾ ਪੀਓ।",
          "ਪੀਣ ਵਾਲੇ ਪਾਣੀ ਨੂੰ ਹਮੇਸ਼ਾ ਢੱਕਣ ਵਾਲੇ ਬਰਤਨ ਵਿੱਚ ਹੀ ਸੰਭਾਲ ਕੇ ਰੱਖੋ।"
        ],
        hi: [
          "पानी को कम से कम 3 मिनट तक अच्छी तरह उबालें ताकि सभी कीटाणु और बैक्टीरिया नष्ट हो जाएं।",
          "यदि ईंधन उपलब्ध न हो तो क्लोरीन की गोली का उपयोग करें: 20 लीटर पानी में एक गोली डालें और 30 मिनट बाद ही पिएं।",
          "मैले पानी को उबालने से पहले किसी साफ सूती कपड़े या दुपट्टे की चार तहों से अच्छी तरह छान लें।",
          "बाढ़ के संपर्क में आए नल के पानी को बिना पूरी तरह शुद्ध किए कभी न पिएं।",
          "पीने के पानी को हमेशा साफ और ढके हुए संकरे मुंह वाले बर्तनों में ही रखें।"
        ]
      },
      source: "WHO Water Sanitation & UNICEF Flood Manual"
    },
    {
      id: "nearest-shelter",
      keywords: [
        "shelter", "camp", "relief", "school", "refuge", "stay", "rahat", "dera", "sharan",
        "ਕੈਂਪ", "ਰਾਹਤ", "ਸ਼ਰਨ", "ਸਕੂਲ", "ਸ਼ੈਲਟਰ", "राहत शिविर", "शरण स्थल", "आश्रय"
      ],
      title: {
        en: "Where to find the nearest safe shelter",
        pa: "ਸਭ ਤੋਂ ਨਜ਼ਦੀਕੀ ਸੁਰੱਖਿਅਤ ਰਾਹਤ ਕੈਂਪ ਕਿੱਥੇ ਹੈ",
        hi: "निकटतम सुरक्षित राहत शिविर कहाँ मिलेगा"
      },
      steps: {
        en: [
          "Open the 'Shelters' tab in FloodSaathi Map to locate designated schools, community centres, and Gurdwaras.",
          "Government Senior Secondary School Taman is currently active with free food, medical support, and clean water.",
          "Local Gurdwaras also operate 24/7 disaster relief Langar camps on elevated grounds.",
          "Follow the marked blue 'Safe Route' on the map to avoid waterlogged bridges and overflowing drains.",
          "Call the camp incharge directly or dial 1077 for emergency transport assistance."
        ],
        pa: [
          "ਫਲੱਡ ਸਾਥੀ ਐਪ ਦੇ 'ਸ਼ੈਲਟਰ' ਨਕਸ਼ੇ 'ਤੇ ਜਾ ਕੇ ਆਪਣੇ ਇਲਾਕੇ ਦੇ ਸਰਕਾਰੀ ਸਕੂਲਾਂ ਅਤੇ ਗੁਰਦੁਆਰਾ ਸਾਹਿਬਾਨ ਦੀ ਸੂਚੀ ਵੇਖੋ।",
          "ਸਰਕਾਰੀ ਸੀਨੀਅਰ ਸੈਕੰਡਰੀ ਸਕੂਲ ਤਮਨ ਵਿਖੇ ਮੁਫ਼ਤ ਲੰਗਰ, ਦਵਾਈਆਂ ਅਤੇ ਠਹਿਰਣ ਦਾ ਪੂਰਾ ਪ੍ਰਬੰਧ ਚਾਲੂ ਹੈ।",
          "ਇਲਾਕੇ ਦੇ ਗੁਰਦੁਆਰੇ ਵੀ ਹੜ੍ਹ ਪੀੜਤਾਂ ਲਈ 24 ਘੰਟੇ ਲੰਗਰ ਅਤੇ ਰਿਹਾਇਸ਼ ਦੀ ਸੇਵਾ ਨਿਭਾ ਰਹੇ ਹਨ।",
          "ਨਕਸ਼ੇ 'ਤੇ ਵਿਖਾਏ ਗਏ ਨੀਲੇ 'ਸੁਰੱਖਿਅਤ ਰਸਤੇ' 'ਤੇ ਹੀ ਚੱਲੋ ਤਾਂ ਜੋ ਡੁੱਬੀਆਂ ਸੜਕਾਂ ਤੋਂ ਬਚਿਆ ਜਾ ਸਕੇ।",
          "ਮਦਦ ਲਈ ਕੈਂਪ ਇੰਚਾਰਜ ਨਾਲ ਸੰਪਰਕ ਕਰੋ ਜਾਂ ਜ਼ਿਲ੍ਹਾ ਹੈਲਪਲਾਈਨ 1077 'ਤੇ ਕਾਲ ਕਰੋ।"
        ],
        hi: [
          "फ्लड साथी ऐप के 'शेल्टर' मैप पर जाकर पास के सरकारी स्कूलों और धर्मशालाओं की सूची देखें।",
          "गवर्नमेंट सीनियर सेकेंडरी स्कूल तमन में मुफ्त भोजन, दवाएं और रहने की सुरक्षित व्यवस्था चालू है।",
          "स्थानीय गुरुद्वारों में भी बाढ़ पीड़ितों के लिए 24 घंटे लंगर और ठहरने की व्यवस्था उपलब्ध है।",
          "मैप पर दिखाए गए नीले 'सुरक्षित मार्ग' का ही उपयोग करें ताकि पानी भरी सड़कों और नालों से बचा जा सके।",
          "आश्रय स्थल तक पहुंचने में सहायता के लिए जिला हेल्पलाइन 1077 पर संपर्क करें।"
        ]
      },
      source: "Punjab State Disaster Management Authority (SDMA)"
    },
    {
      id: "electrical-safety",
      keywords: [
        "electric", "power", "shock", "wire", "switch", "meter", "current", "bijli", "bijlee",
        "ਬਿਜਲੀ", "ਕਰੰਟ", "ਤਾਰ", "ਸਵਿੱਚ", "ਮੀਟਰ", "बिजली", "करंट", "तार", "शॉक"
      ],
      title: {
        en: "Electrical hazards and safety in floodwater",
        pa: "ਹੜ੍ਹਾਂ ਦੇ ਪਾਣੀ ਵਿੱਚ ਬਿਜਲੀ ਦੇ ਖ਼ਤਰੇ ਅਤੇ ਸਾਵਧਾਨੀਆਂ",
        hi: "बाढ़ के पानी में बिजली के खतरे और सुरक्षा"
      },
      steps: {
        en: [
          "Assume all submerged electrical wires, poles, transformers, and outlets are energized and deadly.",
          "Never step into flooded rooms or puddles where fallen power cables or submerged appliances exist.",
          "If your home is flooding, turn off power at the main switch ONLY while standing on dry wood or rubber mats.",
          "Do not touch submerged electrical equipment until power has been completely certified disconnected by PSPCL.",
          "Report sparked or submerged electrical poles immediately to Punjab Power Helpline at 1912."
        ],
        pa: [
          "ਪਾਣੀ ਵਿੱਚ ਡੁੱਬੀਆਂ ਸਾਰੀਆਂ ਬਿਜਲੀ ਦੀਆਂ ਤਾਰਾਂ, ਖੰਭਿਆਂ ਅਤੇ ਪਲੱਗਾਂ ਨੂੰ ਕਰੰਟ ਵਾਲਾ ਹੀ ਸਮਝੋ।",
          "ਡਿੱਗੀਆਂ ਹੋਈਆਂ ਤਾਰਾਂ ਜਾਂ ਡੁੱਬੇ ਹੋਏ ਸਵਿੱਚਬੋਰਡਾਂ ਵਾਲੇ ਪਾਣੀ ਵਿੱਚ ਭੁੱਲ ਕੇ ਵੀ ਪੈਰ ਨਾ ਰੱਖੋ।",
          "ਜੇਕਰ ਘਰ ਵਿੱਚ ਪਾਣੀ ਦਾਖਲ ਹੋ ਰਿਹਾ ਹੋਵੇ ਤਾਂ ਸੁੱਕੀ ਲੱਕੜ ਜਾਂ ਰਬੜ ਦੀ ਚੱਪਲ ਪਾ ਕੇ ਹੀ ਮੇਨ ਸਵਿੱਚ ਬੰਦ ਕਰੋ।",
          "ਬਿਜਲੀ ਵਿਭਾਗ (PSPCL) ਦੀ ਜਾਂਚ ਤੋਂ ਬਿਨਾਂ ਗਿੱਲੇ ਉਪਕਰਨਾਂ ਜਾਂ ਮੀਟਰ ਨੂੰ ਕਦੇ ਚਾਲੂ ਨਾ ਕਰੋ।",
          "ਬਿਜਲੀ ਦੀਆਂ ਡਿੱਗੀਆਂ ਤਾਰਾਂ ਦੀ ਸ਼ਿਕਾਇਤ ਤੁਰੰਤ ਪਾਵਰ ਹੈਲਪਲਾਈਨ 1912 'ਤੇ ਦਰਜ ਕਰਵਾਓ।"
        ],
        hi: [
          "बाढ़ के पानी में डूबे किसी भी बिजली के खंभे, तार या उपकरण को चालू मानकर दूर रहें।",
          "डूबे हुए कमरों या गलियों में जहां तार गिरे हों, कभी भी न जाएं।",
          "यदि घर में पानी आ रहा है तो सूखी लकड़ी या रबर की चप्पल पहनकर ही मेन स्विच बंद करें।",
          "बिजली विभाग (PSPCL) द्वारा लाइन क्लीयर होने से पहले किसी भी गीले उपकरण को चालू न करें।",
          "बिजली की टूटी या डूबी तारों की सूचना तुरंत पंजाब बिजली हेल्पलाइन 1912 पर दें।"
        ]
      },
      source: "PSPCL & Central Electricity Authority Safety Directives"
    },
    {
      id: "evacuation",
      keywords: [
        "evacuate", "leave", "escape", "bag", "kit", "go", "bhago", "niklo", "khali",
        "ਨਿਕਲਣਾ", "ਛੱਡਣਾ", "ਸਮਾਨ", "ਥੈਲਾ", "ਖਾਲੀ", "निकासी", "खाली करना", "भागना"
      ],
      title: {
        en: "Evacuation guidelines: When and how to leave",
        pa: "ਘਰ ਖਾਲੀ ਕਰਨ ਦੇ ਨਿਯਮ: ਕਦੋਂ ਅਤੇ ਕਿਵੇਂ ਨਿਕਲਣਾ ਹੈ",
        hi: "निकासी दिशानिर्देश: कब और कैसे सुरक्षित निकलें"
      },
      steps: {
        en: [
          "Leave immediately if village administration, loudspeakers, or sirens issue an official evacuation order.",
          "Do not delay waiting for water to reach your doorstep; roads become impassable very quickly.",
          "Take only your pre-packed Go-Bag: medicines, ID cards, phone, charger, torch, whistle, and dry ration.",
          "Fasten your shoes securely and carry a sturdy wooden walking stick to check depth and hidden pits ahead.",
          "Inform your family members or register your status via the 'I am Safe' button in FloodSaathi."
        ],
        pa: [
          "ਜੇਕਰ ਪ੍ਰਸ਼ਾਸਨ ਜਾਂ ਗੁਰਦੁਆਰੇ ਤੋਂ ਘਰ ਖਾਲੀ ਕਰਨ ਦਾ ਐਲਾਨ ਹੋਵੇ ਤਾਂ ਤੁਰੰਤ ਨਿਕਲੋ, ਦੇਰੀ ਨਾ ਕਰੋ।",
          "ਪਾਣੀ ਦੇ ਬੂਹੇ ਤੱਕ ਆਉਣ ਦਾ ਇੰਤਜ਼ਾਰ ਨਾ ਕਰੋ, ਕਿਉਂਕਿ ਸੜਕਾਂ ਬਹੁਤ ਤੇਜ਼ੀ ਨਾਲ ਬੰਦ ਹੋ ਜਾਂਦੀਆਂ ਹਨ।",
          "ਸਿਰਫ਼ ਜ਼ਰੂਰੀ ਐਮਰਜੈਂਸੀ ਝੋਲਾ (ਦਵਾਈਆਂ, ਕਾਗਜ਼ਾਤ, ਫ਼ੋਨ, ਟਾਰਚ ਅਤੇ ਸੁੱਕਾ ਰਾਸ਼ਨ) ਹੀ ਨਾਲ ਲਓ।",
          "ਮਜ਼ਬੂਤ ਜੁੱਤੀਆਂ ਪਾਓ ਅਤੇ ਅੱਗੇ ਪਾਣੀ ਦੀ ਡੂੰਘਾਈ ਅਤੇ ਟੋਇਆਂ ਦੀ ਜਾਂਚ ਲਈ ਇੱਕ ਲੱਕੜ ਦੀ ਡਾਂਗ ਹੱਥ ਵਿੱਚ ਰੱਖੋ।",
          "ਨਿਕਲਣ ਤੋਂ ਪਹਿਲਾਂ ਆਪਣੇ ਰਿਸ਼ਤੇਦਾਰਾਂ ਨੂੰ ਸੂਚਿਤ ਕਰੋ ਜਾਂ ਐਪ ਵਿੱਚ 'ਮੈਂ ਸੁਰੱਖਿਅਤ ਹਾਂ' ਬਟਨ ਦਬਾਓ।"
        ],
        hi: [
          "यदि प्रशासन या लाउडस्पीकर द्वारा निकासी का आदेश दिया जाए तो बिना देरी किए तुरंत सुरक्षित स्थान की ओर निकलें।",
          "पानी घर के अंदर आने का इंतजार न करें, क्योंकि रास्ते बहुत तेजी से कट जाते हैं।",
          "केवल अपना इमरजेंसी बैग साथ लें: दवाइयां, ज़रूरी कागज़ात, मोबाइल, टॉर्च और सूखा भोजन।",
          "पैरों में मजबूत जूते पहनें और रास्ते में पानी की गहराई और गड्ढों को जांचने के लिए एक मजबूत लाठी हाथ में रखें।",
          "निकलने से पहले अपने परिजनों को सूचित करें या ऐप में 'मैं सुरक्षित हूँ' बटन दबाएं।"
        ]
      },
      source: "National Disaster Response Force (NDRF) Standard Operating Procedure"
    },
    {
      id: "snake-bite",
      keywords: [
        "snake", "bite", "reptile", "insect", "sap", "saanp", "katya", "zeher", "venom",
        "ਸੱਪ", "ਡੰਗ", "ਕੀੜੇ", "ਜ਼ਹਿਰ", "ਸੱਪ ਦਾ ਡੰਗ", "सांप", "सर्पदंश", "काट लिया", "जहर"
      ],
      title: {
        en: "Snake and reptile hazards in floodwaters",
        pa: "ਹੜ੍ਹ ਦੇ ਪਾਣੀ ਵਿੱਚ ਸੱਪਾਂ ਅਤੇ ਜ਼ਹਿਰੀਲੇ ਜੀਵਾਂ ਤੋਂ ਬਚਾਅ",
        hi: "बाढ़ में सांप और विषैले जीवों से सुरक्षा"
      },
      steps: {
        en: [
          "Snakes and scorpions lose natural burrows and climb trees, roofs, verandas, and floating debris for shelter.",
          "Always carry a bamboo stick and tap the ground or vegetation ahead to scare away hidden reptiles.",
          "Wear thick rubber gumboots or shoes; never walk barefoot or blindly reach into dark shelves or corners.",
          "If bitten: Keep the victim calm and still; immobilize the bitten limb below heart level.",
          "NEVER cut, suck venom, or tie tight tourniquets. Transport immediately to Civil Hospital for Anti-Snake Venom (ASV)."
        ],
        pa: [
          "ਪਾਣੀ ਭਰਨ ਕਾਰਨ ਸੱਪ ਅਤੇ ਬਿੱਛੂ ਆਪਣੀਆਂ ਖੁੱਡਾਂ ਵਿੱਚੋਂ ਨਿਕਲ ਕੇ ਛੱਤਾਂ, ਰੁੱਖਾਂ ਅਤੇ ਸੁੱਕੇ ਸਮਾਨ 'ਤੇ ਚੜ੍ਹ ਜਾਂਦੇ ਹਨ।",
          "ਹਮੇਸ਼ਾ ਇੱਕ ਲੰਮੀ ਲੱਕੜੀ ਨਾਲ ਜ਼ਮੀਨ ਅਤੇ ਘਾਹ-ਫੂਸ ਨੂੰ ਠਕ-ਠਕ ਕਰਦੇ ਹੋਏ ਅੱਗੇ ਵਧੋ।",
          "ਰਬੜ ਦੇ ਉੱਚੇ ਬੂਟ ਪਾਓ; ਨੰਗੇ ਪੈਰੀਂ ਨਾ ਤੁਰੋ ਅਤੇ ਹਨੇਰੇ ਕੋਨਿਆਂ ਵਿੱਚ ਹੱਥ ਨਾ ਪਾਓ।",
          "ਜੇਕਰ ਸੱਪ ਡੰਗ ਲਵੇ: ਮਰੀਜ਼ ਨੂੰ ਸ਼ਾਂਤ ਰੱਖੋ, ਅੰਗ ਨੂੰ ਹਿਲਣ ਨਾ ਦਿਓ ਅਤੇ ਦਿਲ ਦੇ ਪੱਧਰ ਤੋਂ ਹੇਠਾਂ ਰੱਖੋ।",
          "ਚੀਰਾ ਨਾ ਲਗਾਓ ਅਤੇ ਨਾ ਹੀ ਜ਼ਹਿਰ ਚੂਸੋ। ਤੁਰੰਤ ਸਿਵਲ ਹਸਪਤਾਲ ਜਾਓ ਜਿੱਥੇ ਐਂਟੀ-ਸਨੇਕ ਵੈਨਮ (ASV) ਟੀਕਾ ਮੁਫ਼ਤ ਉਪਲਬਧ ਹੈ।"
        ],
        hi: [
          "बाढ़ का पानी भरने से सांप और बिच्छू अपने बिलों से निकलकर छतों, पेड़ों और ऊंचे स्थानों पर आ जाते हैं।",
          "चलते समय लाठी से आगे की जमीन को थपथपाते रहें ताकि छुपे हुए जीव दूर भाग जाएं।",
          "ऊंचे रबर के जूते पहनें; नंगे पैर न चलें और अंधेरे बक्सों या कोनों में बिना देखे हाथ न डालें।",
          "यदि सांप काट ले: पीड़ित को बिल्कुल शांत रखें और काटे गए अंग को हिलाए बिना दिल के स्तर से नीचे रखें।",
          "काटे हुए स्थान पर चीरा न लगाएं और न ही मुंह से जहर चूसें। तुरंत सिविल अस्पताल ले जाएं जहां एंटी-स्नेक वेनम का टीका उपलब्ध है।"
        ]
      },
      source: "National Health Mission (NHM) Snakebite Management Protocol"
    },
    {
      id: "disease-prevention",
      keywords: [
        "disease", "cholera", "diarrhea", "vomit", "fever", "leptospirosis", "dengue", "illness", "bimar", "dast", "ulti",
        "ਬਿਮਾਰੀ", "ਦਸਤ", "ਉਲਟੀਆਂ", "ਹੈਜ਼ਾ", "ਬੁਖ਼ਾਰ", "ਮਲੇਰੀਆ", "बीमारी", "दस्त", "उल्टी", "हैजा", "बुखार"
      ],
      title: {
        en: "Preventing waterborne and vector diseases during floods",
        pa: "ਹੜ੍ਹਾਂ ਦੌਰਾਨ ਪਾਣੀ ਅਤੇ ਮੱਛਰਾਂ ਤੋਂ ਫੈਲਣ ਵਾਲੀਆਂ ਬਿਮਾਰੀਆਂ ਤੋਂ ਬਚਾਅ",
        hi: "बाढ़ में जलजनित और संक्रामक बीमारियों से बचाव"
      },
      steps: {
        en: [
          "Drink only boiled or chlorinated water; contaminated water is the primary cause of cholera and severe diarrhea.",
          "Wash hands thoroughly with soap or ash before eating food and after handling any flood debris.",
          "Avoid direct contact with floodwaters to prevent Leptospirosis (rat fever), which enters through minor skin cuts.",
          "Use mosquito nets and repellents; apply neem oil to exposed skin to prevent dengue and malaria.",
          "Keep Oral Rehydration Salts (ORS) packets handy and give frequently if anyone develops loose motions."
        ],
        pa: [
          "ਸਿਰਫ਼ ਉਬਾਲਿਆ ਜਾਂ ਕਲੋਰੀਨ ਵਾਲਾ ਪਾਣੀ ਹੀ ਪੀਓ; ਗੰਦਾ ਪਾਣੀ ਹੈਜ਼ਾ ਅਤੇ ਦਸਤ ਦਾ ਮੁੱਖ ਕਾਰਨ ਹੈ।",
          "ਰੋਟੀ ਖਾਣ ਤੋਂ ਪਹਿਲਾਂ ਅਤੇ ਹੜ੍ਹ ਦੇ ਸਮਾਨ ਨੂੰ ਛੂਹਣ ਤੋਂ ਬਾਅਦ ਹੱਥਾਂ ਨੂੰ ਸਾਬਣ ਨਾਲ ਚੰਗੀ ਤਰ੍ਹਾਂ ਧੋਵੋ।",
          "ਹੜ੍ਹ ਦੇ ਪਾਣੀ ਵਿੱਚ ਬਿਨਾਂ ਜ਼ਰੂਰਤ ਨਾ ਵੜੋ, ਤਾਂ ਜੋ ਚੂਹਿਆਂ ਦੇ ਪਿਸ਼ਾਬ ਤੋਂ ਹੋਣ ਵਾਲੇ ਲੈਪਟੋਸਪਾਇਰੋਸਿਸ ਬੁਖ਼ਾਰ ਤੋਂ ਬਚਿਆ ਜਾ ਸਕੇ।",
          "ਮੱਛਰਦਾਨੀ ਦੀ ਵਰਤੋਂ ਕਰੋ ਅਤੇ ਨਿੰਮ ਦਾ ਤੇਲ ਲਗਾਓ ਤਾਂ ਜੋ ਡੇਂਗੂ ਅਤੇ ਮਲੇਰੀਆ ਤੋਂ ਬਚਾਅ ਹੋ ਸਕੇ।",
          "ਘਰ ਵਿੱਚ ORS ਦੇ ਪੈਕੇਟ ਜ਼ਰੂਰ ਰੱਖੋ ਅਤੇ ਦਸਤ ਲੱਗਣ 'ਤੇ ਵਾਰ-ਵਾਰ ਪੀਣ ਲਈ ਦਿਓ।"
        ],
        hi: [
          "केवल उबला हुआ या क्लोरीन युक्त पानी पिएं; दूषित पानी से हैजा और उल्टी-दस्त फैलते हैं।",
          "खाना खाने से पहले और गंदे पानी के संपर्क के बाद हाथों को साबुन से अच्छी तरह धोएं।",
          "बाढ़ के गंदे पानी में अनावश्यक रूप से न जाएं, इससे लेप्टोस्पायरोसिस (चूहों के संक्रमण से बुखार) का खतरा रहता है।",
          "मच्छरदानी का प्रयोग करें और नीम का तेल लगाएं ताकि डेंगू और मलेरिया से बचाव हो सके।",
          "घर में ORS के पैकेट रखें और दस्त होने पर तुरंत घोल बनाकर पिलाएं।"
        ]
      },
      source: "Directorate of Health Services Punjab"
    },
    {
      id: "relief-claims",
      keywords: [
        "relief", "compensation", "claim", "damage", "loss", "money", "government", "form", "muavza", "kharaba",
        "ਮੁਆਵਜ਼ਾ", "ਖ਼ਰਾਬਾ", "ਨੁਕਸਾਨ", "ਸਰਕਾਰ", "ਦਾਅਵਾ", "मुआवजा", "नुकसान", "राहत राशि", "दावा"
      ],
      title: {
        en: "How to document flood damages and claim relief compensation",
        pa: "ਹੜ੍ਹਾਂ ਦੇ ਨੁਕਸਾਨ ਦੇ ਸਬੂਤ ਅਤੇ ਸਰਕਾਰੀ ਮੁਆਵਜ਼ਾ ਕਿਵੇਂ ਲੈਣਾ ਹੈ",
        hi: "बाढ़ के नुकसान के प्रमाण और सरकारी मुआवजा कैसे प्राप्त करें"
      },
      steps: {
        en: [
          "Take clear photos and video of all damaged rooms, collapsed walls, drowned crops, and perished livestock before cleaning up.",
          "Keep Aadhaar card, bank passbook, and land ownership (Fard/Jamabandi) papers safely accessible.",
          "Submit a written damage report to the Patwari, Kanungo, or Sub-Divisional Magistrate (SDM) office within 7 days.",
          "Ensure your bank account is linked to your Aadhaar number for direct benefit transfer (DBT) relief funds.",
          "Check the Punjab Government disaster relief portal or call the district helpline 1077 for Girdawari assessment schedules."
        ],
        pa: [
          "ਘਰ ਦੀਆਂ ਕੰਧਾਂ, ਨੁਕਸਾਨੇ ਸਮਾਨ, ਖ਼ਰਾਬ ਫ਼ਸਲਾਂ ਅਤੇ ਮਰੇ ਹੋਏ ਪਸ਼ੂਆਂ ਦੀਆਂ ਸਾਫ਼ ਫ਼ੋਟੋਆਂ ਅਤੇ ਵੀਡੀਓ ਬਣਾ ਲਓ।",
          "ਆਧਾਰ ਕਾਰਡ, ਬੈਂਕ ਦੀ ਕਾਪੀ ਅਤੇ ਜ਼ਮੀਨ ਦੀ ਫ਼ਰਦ/ਜਮ੍ਹਾਂਬੰਦੀ ਦੇ ਕਾਗਜ਼ ਸੁਰੱਖਿਅਤ ਰੱਖੋ।",
          "ਪਟਵਾਰੀ ਜਾਂ ਐੱਸ.ਡੀ.ਐੱਮ. (SDM) ਦਫ਼ਤਰ ਵਿੱਚ 7 ਦਿਨਾਂ ਦੇ ਅੰਦਰ ਨੁਕਸਾਨ ਦਾ ਲਿਖਤੀ ਬਿਨੈ-ਪੱਤਰ ਜਮ੍ਹਾਂ ਕਰਵਾਓ।",
          "ਆਪਣੇ ਬੈਂਕ ਖਾਤੇ ਨੂੰ ਆਧਾਰ ਨਾਲ ਲਿੰਕ ਕਰਵਾਓ ਤਾਂ ਜੋ ਮੁਆਵਜ਼ੇ ਦੀ ਰਕਮ ਸਿੱਧੀ ਖਾਤੇ ਵਿੱਚ ਆ ਸਕੇ।",
          "ਸਰਕਾਰੀ ਗਿਰਦਾਵਰੀ (ਸਰਵੇਖਣ) ਦੀ ਮਿਤੀ ਬਾਰੇ ਪਟਵਾਰੀ ਜਾਂ ਜ਼ਿਲ੍ਹਾ ਹੈਲਪਲਾਈਨ 1077 ਤੋਂ ਪਤਾ ਕਰੋ।"
        ],
        hi: [
          "सफाई शुरू करने से पहले मकान की दरारों, क्षतिग्रस्त सामान, डूबी फसलों और मृत पशुओं की साफ फोटो और वीडियो लें।",
          "आधार कार्ड, बैंक पासबुक और ज़मीन के कागज़ात को सुरक्षित रखें।",
          "पटवारी या एसडीएम (SDM) कार्यालय में नुकसान का लिखित विवरण 7 दिनों के भीतर दर्ज कराएं।",
          "सुनिश्चित करें कि आपका बैंक खाता आधार से लिंक है ताकि मुआवजा राशि सीधे खाते में आ सके।",
          "विशेष गिरदावरी (सर्वेक्षण) के लिए पटवारी से संपर्क करें या जिला कंट्रोल रूम 1077 पर कॉल करें।"
        ]
      },
      source: "Punjab Revenue & Disaster Relief Department Guidelines"
    },
    {
      id: "emergency-kit",
      keywords: [
        "kit", "bag", "items", "torch", "food", "ready", "tayari", "samana", "saman",
        "ਕਿੱਟ", "ਸਮਾਨ", "ਥੈਲਾ", "ਟਾਰਚ", "ਤਿਆਰੀ", "इमरजेंसी किट", "राशन", "तैयारी"
      ],
      title: {
        en: "What to pack in a 72-Hour Flood Survival Kit",
        pa: "72 ਘੰਟਿਆਂ ਦੇ ਐਮਰਜੈਂਸੀ ਬਚਾਅ ਕਿੱਟ ਵਿੱਚ ਕੀ ਰੱਖਣਾ ਚਾਹੀਦਾ ਹੈ",
        hi: "72 घंटे की आपातकालीन उत्तरजीविता किट में क्या रखें"
      },
      steps: {
        en: [
          "Pack 3 days of non-perishable dry food (roasted chana, biscuits, jaggery/gur, sattu) that requires no cooking.",
          "At least 3 litres of drinking water per person per day in sealed bottles.",
          "Waterproof LED torch with extra batteries, plus a loud safety whistle to signal search boats.",
          "First aid kit: antiseptic liquid, bandages, ORS packets, paracetamol, and 14 days of personal chronic medicines.",
          "Charged power bank, battery-powered radio, waterproof matchbox/lighter, and a multipurpose pocket knife."
        ],
        pa: [
          "3 ਦਿਨਾਂ ਦਾ ਸੁੱਕਾ ਭੋਜਨ ਰੱਖੋ ਜਿਸਨੂੰ ਪਕਾਉਣ ਦੀ ਲੋੜ ਨਾ ਪਵੇ (ਭੁੱਜੇ ਛੋਲੇ, ਬਿਸਕੁਟ, ਗੁੜ, ਸੱਤੂ)।",
          "ਪ੍ਰਤੀ ਜੀਅ ਰੋਜ਼ਾਨਾ ਘੱਟੋ-ਘੱਟ 3 ਲੀਟਰ ਪੀਣ ਵਾਲਾ ਪਾਣੀ ਸੀਲਬੰਦ ਬੋਤਲਾਂ ਵਿੱਚ ਰੱਖੋ।",
          "ਵਾਟਰਪਰੂਫ਼ ਐਲ.ਈ.ਡੀ. ਟਾਰਚ, ਵਾਧੂ ਸੈੱਲ ਅਤੇ ਬਚਾਅ ਟੀਮਾਂ ਨੂੰ ਆਵਾਜ਼ ਦੇਣ ਲਈ ਇੱਕ ਸੀਟੀ (Whistle)।",
          "ਮੁੱਢਲੀ ਸਹਾਇਤਾ ਕਿੱਟ: ਡੈਟੋਲ, ਪੱਟੀਆਂ, ਓ.ਆਰ.ਐੱਸ., ਬੁਖ਼ਾਰ ਦੀ ਗੋਲੀ ਅਤੇ ਰੋਜ਼ਾਨਾ ਖਾਣ ਵਾਲੀਆਂ ਜ਼ਰੂਰੀ ਦਵਾਈਆਂ।",
          "ਫੁੱਲ ਚਾਰਜ ਪਾਵਰ ਬੈਂਕ, ਸੈੱਲਾਂ ਵਾਲਾ ਰੇਡੀਓ ਅਤੇ ਵਾਟਰਪਰੂਫ਼ ਮਾਚਿਸ ਜਾਂ ਲਾਈਟਰ।"
        ],
        hi: [
          "3 दिनों का ऐसा सूखा राशन रखें जिसे पकाने की आवश्यकता न हो (भुने चने, बिस्कुट, गुड़, सत्तू)।",
          "प्रति व्यक्ति प्रतिदिन कम से कम 3 लीटर साफ पीने का पानी बोतलों में रखें।",
          "वाटरप्रूफ टॉर्च, अतिरिक्त बैटरी और नाव वालों को संकेत देने के लिए एक तेज आवाज वाली सीटी।",
          "प्राथमिक चिकित्सा किट: डेटॉल, पट्टियां, ORS के पैकेट, बुखार की दवा और अपनी नियमित दवाएं।",
          "पूरी तरह चार्ज पावर बैंक, पोर्टेबल रेडियो और वाटरप्रूफ माचिस।"
        ]
      },
      source: "NDMA Family Disaster Preparedness Manual"
    },
    {
      id: "child-elderly",
      keywords: [
        "child", "children", "baby", "elderly", "old", "senior", "pregnant", "bache", "buzurg",
        "ਬੱਚੇ", "ਬਜ਼ੁਰਗ", "ਗਰਭਵਤੀ", "ਮਰੀਜ਼", "बच्चे", "बुजुर्ग", "गर्भवती", "देखभाल"
      ],
      title: {
        en: "Protecting children, pregnant women, and elderly citizens",
        pa: "ਬੱਚਿਆਂ, ਬਜ਼ੁਰਗਾਂ ਅਤੇ ਗਰਭਵਤੀ ਔਰਤਾਂ ਦੀ ਦੇਖਭਾਲ",
        hi: "बच्चों, बुजुर्गों और गर्भवती महिलाओं की सुरक्षा"
      },
      steps: {
        en: [
          "Evacuate infants, pregnant women, and elderly family members on the earliest warning; do not wait for waters to rise.",
          "Write emergency contact numbers on a waterproof wristband or note in the child's pocket.",
          "Ensure continuous supply of essential infant milk formula, boiled water, and elderly heart/blood pressure medications.",
          "Keep warm dry blankets and multiple changes of cotton clothes to prevent hypothermia.",
          "Register pregnant women near delivery dates with the nearest Primary Health Centre (PHC) or Anganwadi worker."
        ],
        pa: [
          "ਬੱਚਿਆਂ, ਗਰਭਵਤੀ ਔਰਤਾਂ ਅਤੇ ਬਜ਼ੁਰਗਾਂ ਨੂੰ ਪਹਿਲੀ ਚੇਤਾਵਨੀ ਮਿਲਣ 'ਤੇ ਹੀ ਸੁਰੱਖਿਅਤ ਥਾਂ 'ਤੇ ਭੇਜ ਦਿਓ।",
          "ਬੱਚਿਆਂ ਦੀ ਜੇਬ ਵਿੱਚ ਜਾਂ ਹੱਥ 'ਤੇ ਪਰਿਵਾਰ ਦੇ ਫ਼ੋਨ ਨੰਬਰ ਵਾਲੀ ਪਰਚੀ ਜ਼ਰੂਰ ਰੱਖੋ।",
          "ਨਿਆਣਿਆਂ ਦੇ ਦੁੱਧ, ਉਬਲੇ ਪਾਣੀ ਅਤੇ ਬਜ਼ੁਰਗਾਂ ਦੀਆਂ ਬੀ.ਪੀ./ਸ਼ੂਗਰ ਦੀਆਂ ਦਵਾਈਆਂ ਦਾ ਪਹਿਲਾਂ ਪ੍ਰਬੰਧ ਰੱਖੋ।",
          "ਠੰਢ ਅਤੇ ਨਮੂਨੀਆ ਤੋਂ ਬਚਾਅ ਲਈ ਸੁੱਕੇ ਕੰਬਲ ਅਤੇ ਗਰਮ ਕੱਪੜੇ ਨਾਲ ਰੱਖੋ।",
          "ਜਣੇਪੇ ਵਾਲੀਆਂ ਔਰਤਾਂ ਦੀ ਜਾਣਕਾਰੀ ਆਸ਼ਾ ਵਰਕਰ ਜਾਂ ਨਜ਼ਦੀਕੀ ਸਿਹਤ ਕੇਂਦਰ (PHC) ਨੂੰ ਪਹਿਲਾਂ ਹੀ ਦਿਓ।"
        ],
        hi: [
          "छोटे बच्चों, गर्भवती महिलाओं और बुजुर्गों को पहली चेतावनी मिलते ही सुरक्षित स्थान पर भेज दें।",
          "बच्चों की जेब में माता-पिता का नाम और मोबाइल नंबर लिखी पर्ची अवश्य रखें।",
          "शिशुओं के दूध, उबले पानी और बुजुर्गों की नियमित बीपी/शुगर की दवाओं का पर्याप्त स्टॉक रखें।",
          "गीलेपन और ठंड से बचाने के लिए सूखे कपड़े और कंबल साथ रखें।",
          "गर्भवती महिलाओं की जानकारी आशा वर्कर या प्राथमिक स्वास्थ्य केंद्र (PHC) को पहले से देकर रखें।"
        ]
      },
      source: "UNICEF Child Protection & Health Guidelines"
    },
    {
      id: "driving-flood",
      keywords: [
        "drive", "car", "tractor", "bike", "vehicle", "road", "bridge", "gaddi", "motor", "sarak",
        "ਗੱਡੀ", "ਕਾਰ", "ਟਰੈਕਟਰ", "ਮੋਟਰਸਾਈਕਲ", "ਸੜਕ", "ਪੁਲ", "गाड़ी", "कार", "ट्रैक्टर", "सड़क"
      ],
      title: {
        en: "Vehicle and driving rules during flood situations",
        pa: "ਹੜ੍ਹਾਂ ਦੌਰਾਨ ਗੱਡੀ ਜਾਂ ਮੋਟਰਸਾਈਕਲ ਚਲਾਉਣ ਦੇ ਸਖ਼ਤ ਨਿਯਮ",
        hi: "बाढ़ के दौरान वाहन चलाने और सड़क सुरक्षा के नियम"
      },
      steps: {
        en: [
          "Never attempt to drive across water covered bridges, causeways, or culverts. Just 6 inches of moving water can stall a car.",
          "Just 12 inches (1 foot) of rushing water can easily sweep away small cars; 2 feet can float heavy tractors.",
          "If your vehicle stalls in rising floodwater, abandon it immediately and climb to high ground. Do not stay inside.",
          "Park vehicles on high highway bridges or elevated village ramps before water enters low streets.",
          "Avoid driving at night when washed-out road edges and sinkholes are completely invisible."
        ],
        pa: [
          "ਪਾਣੀ ਭਰੇ ਪੁਲਾਂ ਜਾਂ ਨਹਿਰੀ ਪੁਲੀਆਂ ਤੋਂ ਗੱਡੀ ਕਦੇ ਨਾ ਲੰਘਾਓ। ਸਿਰਫ਼ 6 ਇੰਚ ਤੇਜ਼ ਪਾਣੀ ਕਾਰ ਨੂੰ ਬੰਦ ਕਰ ਸਕਦਾ ਹੈ।",
          "ਇੱਕ ਫੁੱਟ ਤੇਜ਼ ਪਾਣੀ ਛੋਟੀ ਕਾਰ ਨੂੰ ਰੋੜ੍ਹ ਸਕਦਾ ਹੈ ਅਤੇ ਦੋ ਫੁੱਟ ਪਾਣੀ ਟਰੈਕਟਰ ਨੂੰ ਵੀ ਵਹਾ ਲਿਜਾਂਦਾ ਹੈ।",
          "ਜੇਕਰ ਤੁਹਾਡੀ ਗੱਡੀ ਪਾਣੀ ਵਿੱਚ ਬੰਦ ਹੋ ਜਾਵੇ ਤਾਂ ਤੁਰੰਤ ਗੱਡੀ ਵਿੱਚੋਂ ਨਿਕਲ ਕੇ ਉੱਚੀ ਥਾਂ ਵੱਲ ਜਾਓ।",
          "ਪਾਣੀ ਆਉਣ ਤੋਂ ਪਹਿਲਾਂ ਗੱਡੀਆਂ ਨੂੰ ਪਿੰਡ ਦੇ ਉੱਚੇ ਪਲੇਟਫਾਰਮ ਜਾਂ ਹਾਈਵੇ ਵਾਲੇ ਪਾਸੇ ਪਾਰਕ ਕਰ ਦਿਓ।",
          "ਰਾਤ ਦੇ ਸਮੇਂ ਗੱਡੀ ਚਲਾਉਣ ਤੋਂ ਬਚੋ ਕਿਉਂਕਿ ਟੁੱਟੀਆਂ ਸੜਕਾਂ ਅਤੇ ਡੂੰਘੇ ਪਾੜ ਨਜ਼ਰ ਨਹੀਂ ਆਉਂਦੇ।"
        ],
        hi: [
          "पानी से भरे पुलिया या रपटों पर कभी भी गाड़ी न ले जाएं। केवल 6 इंच बहता पानी कार को बंद कर सकता है।",
          "एक फीट गहरा तेज पानी कार को बहा सकता है और दो फीट पानी में ट्रैक्टर भी बह जाता है।",
          "यदि आपकी गाड़ी बढ़ते पानी में बंद हो जाए तो तुरंत गाड़ी छोड़ें और बाहर निकलकर ऊंची जगह जाएं।",
          "बाढ़ का पानी आने से पहले वाहनों को किसी ऊंचे पुल या पक्के ऊंचे स्थान पर पार्क कर दें।",
          "रात के समय वाहन न चलाएं क्योंकि टूटी हुई सड़कें और गड्ढे दिखाई नहीं देते।"
        ]
      },
      source: "Traffic Police Punjab & Disaster Transport Advisory"
    },
    {
      id: "after-cleaning",
      keywords: [
        "clean", "mud", "reenter", "house", "wash", "disinfect", "safai", "ret", "mitti",
        "ਸਫ਼ਾਈ", "ਮਿੱਟੀ", "ਘਰ ਵਾਪਸੀ", "ਕੀਟਾਣੂ", "सफाई", "कीचड़", "घर वापसी", "कीटाणुशोधन"
      ],
      title: {
        en: "Cleaning and disinfecting your home after floodwaters recede",
        pa: "ਹੜ੍ਹ ਦਾ ਪਾਣੀ ਉਤਰਨ ਤੋਂ ਬਾਅਦ ਘਰ ਦੀ ਸਫ਼ਾਈ ਅਤੇ ਕੀਟਾਣੂ-ਮੁਕਤ ਕਰਨਾ",
        hi: "बाढ़ का पानी उतरने के बाद घर की सफाई और कीटाणुशोधन"
      },
      steps: {
        en: [
          "Inspect walls, foundations, and ceilings from outside for structural cracks before stepping inside.",
          "Open all doors and windows to cross-ventilate and clear trapped gas or stale toxic fumes.",
          "Shovel out thick mud and silt while it is still wet; wash floors with clean water and bleaching powder.",
          "Disinfect all surfaces with a mixture of 1 cup household bleach per 20 litres of clean water.",
          "Discard any mattresses, pillows, carpets, and cosmetics that remained submerged in floodwater."
        ],
        pa: [
          "ਘਰ ਅੰਦਰ ਵੜਨ ਤੋਂ ਪਹਿਲਾਂ ਬਾਹਰੋਂ ਕੰਧਾਂ ਅਤੇ ਛੱਤ ਦੀਆਂ ਤਰੇੜਾਂ ਦੀ ਜਾਂਚ ਕਰੋ ਕਿ ਕੋਈ ਹਿੱਸਾ ਡਿੱਗਣ ਵਾਲਾ ਤਾਂ ਨਹੀਂ।",
          "ਅੰਦਰ ਵੜਦੇ ਹੀ ਸਾਰੇ ਦਰਵਾਜ਼ੇ ਅਤੇ ਖਿੜਕੀਆਂ ਖੋਲ੍ਹ ਦਿਓ ਤਾਂ ਜੋ ਅੰਦਰਲੀ ਜ਼ਹਿਰੀਲੀ ਗੈਸ ਬਾਹਰ ਨਿਕਲ ਸਕੇ।",
          "ਮਿੱਟੀ ਅਤੇ ਗਾਰ ਸੁੱਕਣ ਤੋਂ ਪਹਿਲਾਂ ਹੀ ਕਹੀ ਨਾਲ ਬਾਹਰ ਕੱਢੋ ਅਤੇ ਫ਼ਰਸ਼ ਨੂੰ ਬਲੀਚਿੰਗ ਪਾਊਡਰ ਵਾਲੇ ਪਾਣੀ ਨਾਲ ਧੋਵੋ।",
          "ਕੰਧਾਂ ਅਤੇ ਫ਼ਰਸ਼ਾਂ ਨੂੰ ਕੀਟਾਣੂ-ਮੁਕਤ ਕਰਨ ਲਈ ਫਿਨਾਇਲ ਜਾਂ ਬਲੀਚ ਦੀ ਵਰਤੋਂ ਕਰੋ।",
          "ਪਾਣੀ ਵਿੱਚ ਭਿੱਜੇ ਗੱਦੇ, ਸਿਰਹਾਣੇ ਅਤੇ ਗ਼ਲੀਚੇ ਸੁੱਟ ਦਿਓ ਕਿਉਂਕਿ ਇਨ੍ਹਾਂ ਵਿੱਚ ਉੱਲੀ (Fungus) ਅਤੇ ਗੰਭੀਰ ਰੋਗਾਣੂ ਪੈਦਾ ਹੋ ਜਾਂਦੇ ਹਨ।"
        ],
        hi: [
          "घर में प्रवेश करने से पहले बाहर से दीवारों और छत की दरारें जांच लें कि कोई हिस्सा झुक तो नहीं गया।",
          "अंदर जाते ही सभी खिड़कियां और दरवाजे खोल दें ताकि जमा हुई जहरीली गैस और बदबू बाहर निकल सके।",
          "कीचड़ और गाद को सूखने से पहले ही बाहर निकालें और फर्श को ब्लीचिंग पाउडर से धोएं।",
          "फर्श और दीवारों को कीटाणुरहित करने के लिए फिनाइल या हल्के ब्लीच के घोल का छिड़काव करें।",
          "बाढ़ के पानी में डूबे गद्दे, तकिए और कालीन फेंक दें, इनमें फंगस और गंभीर संक्रमण होता है।"
        ]
      },
      source: "Central Pollution Control Board & NDMA Recovery Manual"
    },
    {
      id: "dam-release",
      keywords: [
        "dam", "release", "pong", "bhakra", "cusecs", "discharge", "water", "bbmb", "paani chhadeya",
        "ਡੈਮ", "ਭਾਖੜਾ", "ਪੌਂਗ", "ਪਾਣੀ ਛੱਡਿਆ", "ਕਿਊਸਿਕ", "डैम", "भाखड़ा", "पोंग", "पानी छोड़ा", "क्यूसेक"
      ],
      title: {
        en: "Understanding dam water releases and cusec levels",
        pa: "ਡੈਮਾਂ ਤੋਂ ਪਾਣੀ ਛੱਡਣ ਅਤੇ ਕਿਊਸਿਕ ਦੇ ਪੈਮਾਨੇ ਨੂੰ ਸਮਝਣਾ",
        hi: "डैम से पानी छोड़े जाने और क्यूसेक के स्तर को समझें"
      },
      steps: {
        en: [
          "A 'cusec' is a unit of flow equal to one cubic foot of water per second (approx. 28.3 litres/sec).",
          "Discharge up to 30,000 cusecs is normal safe river capacity for Beas and Sutlej rivers.",
          "40,000 to 75,000 cusecs triggers a Low-to-Medium flood watch; low-lying crop fields get inundated.",
          "Discharges exceeding 1,00,000 cusecs represent High Danger: village bunds risk breach and immediate evacuation is enforced.",
          "Always verify release news from official BBMB or district public relations alerts, not unverified social media rumours."
        ],
        pa: [
          "'ਕਿਊਸਿਕ' (Cusec) ਪਾਣੀ ਦੇ ਵਹਾਅ ਦਾ ਪੈਮਾਨਾ ਹੈ, ਜਿਸਦਾ ਮਤਲਬ ਹੈ ਹਰ ਇੱਕ ਸਕਿੰਟ ਵਿੱਚ ਲਗਭਗ 28.3 ਲੀਟਰ ਪਾਣੀ।",
          "ਬਿਆਸ ਅਤੇ ਸਤਲੁਜ ਵਿੱਚ 30,000 ਕਿਊਸਿਕ ਤੱਕ ਦਾ ਵਹਾਅ ਆਮ ਅਤੇ ਸੁਰੱਖਿਅਤ ਮੰਨਿਆ ਜਾਂਦਾ ਹੈ।",
          "40,000 ਤੋਂ 75,000 ਕਿਊਸਿਕ 'ਤੇ ਦਰਿਆ ਕੰਢੇ ਦੇ ਨੀਵੇਂ ਖੇਤਾਂ ਵਿੱਚ ਪਾਣੀ ਭਰਨਾ ਸ਼ੁਰੂ ਹੋ ਜਾਂਦਾ ਹੈ।",
          "1,00,000 ਕਿਊਸਿਕ ਤੋਂ ਉੱਪਰ ਪਾਣੀ ਆਉਣ 'ਤੇ ਬੰਨ੍ਹਾਂ ਦੇ ਟੁੱਟਣ ਦਾ ਖ਼ਤਰਾ ਬਣ ਜਾਂਦਾ ਹੈ ਅਤੇ ਪਿੰਡ ਖਾਲੀ ਕਰਵਾਏ ਜਾਂਦੇ ਹਨ।",
          "ਸਿਰਫ਼ ਸਰਕਾਰੀ ਬੁਲੇਟਿਨਾਂ 'ਤੇ ਭਰੋਸਾ ਕਰੋ ਅਤੇ ਸੋਸ਼ਲ ਮੀਡੀਆ ਦੀਆਂ ਅਫ਼ਵਾਹਾਂ ਤੋਂ ਬਚੋ।"
        ],
        hi: [
          "'क्यूसेक' पानी के बहाव की इकाई है, जिसका अर्थ है प्रति सेकंड लगभग 28.3 लीटर पानी निकलना।",
          "ब्यास और सतलुज नदी में 30,000 क्यूसेक तक का बहाव सामान्य और सुरक्षित माना जाता है।",
          "40,000 से 75,000 क्यूसेक पर नदी किनारे के निचले खेतों में पानी भरने लगता है।",
          "1,00,000 क्यूसेक से अधिक पानी छोड़े जाने पर गंभीर खतरा होता है और गांवों को खाली कराया जाता है।",
          "डैम से पानी छोड़े जाने की सही जानकारी के लिए केवल आधिकारिक बुलेटिन देखें, सोशल मीडिया की अफवाहों से बचें।"
        ]
      },
      source: "Bhakra Beas Management Board (BBMB) Operational Guidelines"
    },
    {
      id: "food-safety",
      keywords: [
        "food", "eat", "ration", "cook", "spoil", "roti", "khana", "rashan",
        "ਖਾਣਾ", "ਭੋਜਨ", "ਰਾਸ਼ਨ", "ਖ਼ਰਾਬ", "ਸੜਿਆ", "खाना", "भोजन", "राशन", "सुरक्षा"
      ],
      title: {
        en: "Food safety during and after floods",
        pa: "ਹੜ੍ਹਾਂ ਦੌਰਾਨ ਖਾਣ-ਪੀਣ ਦੀਆਂ ਵਸਤਾਂ ਦੀ ਸੁਰੱਖਿਆ",
        hi: "बाढ़ के दौरान भोजन और राशन की सुरक्षा"
      },
      steps: {
        en: [
          "Throw away all fresh food, vegetables, and milk that came in contact with floodwater.",
          "Discard food stored in screw-top bottles, cardboard boxes, and sealed foil pouches if submerged.",
          "Commercially canned metal food cans can be saved if undamaged: wash with soap and soak in sanitized bleach water for 15 minutes before opening.",
          "Cook only fresh, thoroughly boiled meals; eat food immediately while hot.",
          "Store grains and wheat flour bags on wooden cots or plastic sheets elevated well above ground."
        ],
        pa: [
          "ਹੜ੍ਹ ਦੇ ਗੰਦੇ ਪਾਣੀ ਦੇ ਸੰਪਰਕ ਵਿੱਚ ਆਈ ਹਰ ਖਾਣ ਵਾਲੀ ਚੀਜ਼, ਸਬਜ਼ੀ ਅਤੇ ਦੁੱਧ ਨੂੰ ਤੁਰੰਤ ਸੁੱਟ ਦਿਓ।",
          "ਡੱਬਿਆਂ, ਗੱਤਿਆਂ ਜਾਂ ਪਲਾਸਟਿਕ ਦੇ ਲਿਫ਼ਾਫ਼ਿਆਂ ਵਿੱਚ ਰੱਖਿਆ ਰਾਸ਼ਨ ਜੇ ਪਾਣੀ ਵਿੱਚ ਡੁੱਬ ਗਿਆ ਹੋਵੇ ਤਾਂ ਉਸਨੂੰ ਨਾ ਵਰਤੋ।",
          "ਸੀਲਬੰਦ ਧਾਤ ਦੇ ਟੀਨ ਦੇ ਡੱਬਿਆਂ ਨੂੰ ਸਾਬਣ ਨਾਲ ਧੋ ਕੇ ਅਤੇ ਉਬਾਲ ਕੇ ਵਰਤਿਆ ਜਾ ਸਕਦਾ ਹੈ।",
          "ਹਮੇਸ਼ਾ ਤਾਜ਼ਾ ਅਤੇ ਗਰਮ ਪਕਾਇਆ ਹੋਇਆ ਭੋਜਨ ਹੀ ਖਾਓ; ਬਾਸੀ ਖਾਣਾ ਬਿਲਕੁਲ ਨਾ ਖਾਓ।",
          "ਕਣਕ ਅਤੇ ਆਟੇ ਦੀਆਂ ਬੋਰੀਆਂ ਨੂੰ ਜ਼ਮੀਨ ਤੋਂ ਉੱਚੇ ਮੰਜਿਆਂ ਜਾਂ ਲੱਕੜੀ ਦੇ ਤਖ਼ਤਿਆਂ 'ਤੇ ਰੱਖੋ।"
        ],
        hi: [
          "बाढ़ के गंदे पानी के संपर्क में आया कोई भी भोजन, सब्जी या दूध तुरंत फेंक दें।",
          "पैकेट बंद या डिब्बे में रखा राशन यदि पानी में डूब गया हो तो उसका उपयोग न करें।",
          "सील बंद मेटल के डिब्बों को साबुन से धोकर और साफ कपड़े से पोंछकर उपयोग में लाया जा सकता है।",
          "हमेशा ताजा और अच्छी तरह उबला हुआ गर्म भोजन ही खाएं; बासी भोजन न करें।",
          "अनाज और आटे की बोरियों को जमीन पर न रखकर ऊंचे तख्तों या खाट पर रखें।"
        ]
      },
      source: "Food Safety and Standards Authority of India (FSSAI)"
    },
    {
      id: "emergency-numbers",
      keywords: [
        "number", "helpline", "phone", "contact", "call", "police", "ambulance", "fire", "ndrf",
        "ਨੰਬਰ", "ਫ਼ੋਨ", "ਹੈਲਪਲਾਈਨ", "ਪੁਲਿਸ", "ਐਂਬੂਲੈਂਸ", "ਨੰਬਰ", "हेल्पलाइन", "फोन", "नंबर", "पुलिस", "एंबुलेंस"
      ],
      title: {
        en: "Official Punjab emergency helplines and response numbers",
        pa: "ਪੰਜਾਬ ਸਰਕਾਰ ਦੇ ਅਧਿਕਾਰਤ ਐਮਰਜੈਂਸੀ ਹੈਲਪਲਾਈਨ ਨੰਬਰ",
        hi: "पंजाब सरकार के आधिकारिक आपातकालीन हेल्पलाइन नंबर"
      },
      steps: {
        en: [
          "National Emergency Unified Response Number: Dial 112 (Police, Fire, Ambulance)",
          "State Disaster Management Control Room: Dial 1070",
          "District Emergency Operations Centre (Jalandhar / Kapurthala): Dial 1077 or 1078",
          "Medical Emergency Ambulance Service: Dial 108",
          "Punjab Power Corporation Breakdown (PSPCL): Dial 1912",
          "Punjab Flood Control Room Headquarters: Dial 0172-2740397"
        ],
        pa: [
          "ਕੌਮੀ ਐਮਰਜੈਂਸੀ ਸਾਂਝਾ ਨੰਬਰ: 112 (ਪੁਲਿਸ, ਫਾਇਰ ਬ੍ਰਿਗੇਡ, ਐਂਬੂਲੈਂਸ)",
          "ਸਟੇਟ ਡਿਜ਼ਾਸਟਰ ਕੰਟਰੋਲ ਰੂਮ: 1070",
          "ਜ਼ਿਲ੍ਹਾ ਆਫ਼ਤ ਕੰਟਰੋਲ ਰੂਮ (ਜਲੰਧਰ/ਕਪੂਰਥਲਾ): 1077 ਜਾਂ 1078",
          "ਸਰਕਾਰੀ ਮੁਫ਼ਤ ਐਂਬੂਲੈਂਸ ਸੇਵਾ: 108",
          "ਬਿਜਲੀ ਖ਼ਰਾਬੀ ਅਤੇ ਕਰੰਟ ਸ਼ਿਕਾਇਤ (PSPCL): 1912",
          "ਪੰਜਾਬ ਹੜ੍ਹ ਕੰਟਰੋਲ ਰੂਮ ਮੁੱਖ ਦਫ਼ਤਰ: 0172-2740397"
        ],
        hi: [
          "राष्ट्रीय आपातकालीन नंबर: 112 (पुलिस, दमकल, एम्बुलेंस)",
          "राज्य आपदा नियंत्रण कक्ष: 1070",
          "जिला आपदा नियंत्रण कक्ष: 1077 या 1078",
          "सरकारी एम्बुलेंस सेवा: 108",
          "बिजली समस्या और फॉल्ट (PSPCL): 1912",
          "पंजाब बाढ़ नियंत्रण कक्ष: 0172-2740397"
        ]
      },
      source: "Government of Punjab Emergency Helpline Directory"
    }
  ],

  // After-Flood Checklists by Category
  afterFloodChecklists: {
    safety: [
      { id: "s1", text: { en: "Check exterior walls and foundation for deep structural cracks before entry", pa: "ਘਰ ਅੰਦਰ ਜਾਣ ਤੋਂ ਪਹਿਲਾਂ ਬਾਹਰੀ ਕੰਧਾਂ ਅਤੇ ਨੀਂਹ ਵਿੱਚ ਪਈਆਂ ਤਰੇੜਾਂ ਦੀ ਜਾਂਚ ਕਰੋ", hi: "घर में प्रवेश करने से पहले बाहरी दीवारों और नींव में गहरी दरारें जांचें" } },
      { id: "s2", text: { en: "Ensure main power breaker (MCB) is completely OFF before touching appliances", pa: "ਸਾਮਾਨ ਨੂੰ ਹੱਥ ਲਾਉਣ ਤੋਂ ਪਹਿਲਾਂ ਮੇਨ ਸਵਿੱਚ (MCB) ਬੰਦ ਹੋਣ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ", hi: "उपकरणों को छूने से पहले सुनिश्चित करें कि मुख्य पावर (MCB) पूरी तरह बंद है" } },
      { id: "s3", text: { en: "Smell carefully for LPG gas leaks; do not light matchsticks or turn on lights", pa: "ਰਸੋਈ ਗੈਸ ਦੀ ਲੀਕੇਜ ਦੀ ਜਾਂਚ ਕਰੋ; ਮਾਚਿਸ ਜਾਂ ਲਾਈਟਰ ਬਿਲਕੁਲ ਨਾ ਬਾਲੋ", hi: "गैस रिसाव की गंध सूंघें; माचिस न जलाएं और न ही कोई लाइट चालू करें" } },
      { id: "s4", text: { en: "Tap with wooden stick to inspect corners and shelves for snakes and scorpions", pa: "ਲੱਕੜ ਦੀ ਡਾਂਗ ਨਾਲ ਹਨੇਰੇ ਕੋਨਿਆਂ ਅਤੇ ਅਲਮਾਰੀਆਂ ਵਿੱਚ ਸੱਪਾਂ ਦੀ ਜਾਂਚ ਕਰੋ", hi: "लाठी से कोने-कोने में थपथपाकर सांप और बिच्छू की जांच करें" } }
    ],
    health: [
      { id: "h1", text: { en: "Boil all drinking water for 3 full minutes or use Chlorine tablets", pa: "ਪੀਣ ਵਾਲੇ ਪਾਣੀ ਨੂੰ 3 ਮਿੰਟ ਉਬਾਲੋ ਜਾਂ ਕਲੋਰੀਨ ਦੀਆਂ ਗੋਲੀਆਂ ਵਰਤੋ", hi: "पीने के सभी पानी को 3 मिनट तक उबालें या क्लोरीन की गोलियां मिलाएं" } },
      { id: "h2", text: { en: "Throw away all perishable food and open grains touched by floodwater", pa: "ਹੜ੍ਹ ਦੇ ਪਾਣੀ ਦੇ ਸੰਪਰਕ ਵਿੱਚ ਆਇਆ ਸਾਰਾ ਖੁੱਲ੍ਹਾ ਭੋਜਨ ਅਤੇ ਅਨਾਜ ਸੁੱਟ ਦਿਓ", hi: "बाढ़ के पानी के संपर्क में आए सभी खुले अनाज और भोजन को फेंक दें" } },
      { id: "h3", text: { en: "Apply disinfectant / neem oil to skin to prevent insect and fungal infections", pa: "ਚਮੜੀ 'ਤੇ ਨਿੰਮ ਦਾ ਤੇਲ ਜਾਂ ਦਵਾਈ ਲਗਾਓ ਤਾਂ ਜੋ ਖਾਰਸ਼ ਅਤੇ ਉੱਲੀ ਤੋਂ ਬਚਿਆ ਜਾ ਸਕੇ", hi: "त्वचा के संक्रमण और फंगस से बचने के लिए नीम का तेल या एंटीसेप्टिक लगाएं" } },
      { id: "h4", text: { en: "Visit local health camp to collect ORS packets and water testing vials", pa: "ਨੇੜਲੇ ਸਿਹਤ ਕੈਂਪ ਤੋਂ ORS ਦੇ ਪੈਕੇਟ ਅਤੇ ਪਾਣੀ ਟੈਸਟ ਕਰਨ ਵਾਲੀ ਦਵਾਈ ਲਵੋ", hi: "नजदीकी स्वास्थ्य शिविर से ORS के पैकेट और जल शुद्धिकरण दवाएं लें" } }
    ],
    home: [
      { id: "hm1", text: { en: "Shovel out all mud and silt while it remains soft and damp", pa: "ਮਿੱਟੀ ਅਤੇ ਗਾਰ ਸੁੱਕਣ ਤੋਂ ਪਹਿਲਾਂ ਕਹੀ ਨਾਲ ਬਾਹਰ ਕੱਢੋ", hi: "कीचड़ और गाद को सूखने से पहले ही बाहर निकालें" } },
      { id: "hm2", text: { en: "Open all doors and windows to cross-ventilate and clear humidity", pa: "ਸਾਰੇ ਬੂਹੇ ਅਤੇ ਬਾਰੀਆਂ ਖੋਲ੍ਹ ਕੇ ਕਮਰਿਆਂ ਦੀ ਹਵਾਦਾਰੀ ਕਰੋ", hi: "कमरों की नमी और बदबू निकालने के लिए सभी दरवाजे और खिड़कियां खोलें" } },
      { id: "hm3", text: { en: "Wash hard surfaces with bleach solution (1 cup bleach in 20L water)", pa: "ਫ਼ਰਸ਼ਾਂ ਅਤੇ ਪੱਕੀਆਂ ਕੰਧਾਂ ਨੂੰ ਬਲੀਚਿੰਗ ਪਾਊਡਰ ਵਾਲੇ ਪਾਣੀ ਨਾਲ ਧੋਵੋ", hi: "फर्श और पक्की दीवारों को ब्लीच के घोल से साफ और कीटाणुरहित करें" } },
      { id: "hm4", text: { en: "Discard waterlogged mattresses, foam cushions, and soaked pillows", pa: "ਪਾਣੀ ਵਿੱਚ ਭਿੱਜੇ ਹੋਏ ਗੱਦੇ, ਫ਼ੋਮ ਦੀਆਂ ਗੱਦੀਆਂ ਅਤੇ ਸਿਰਹਾਣੇ ਬਾਹਰ ਕੱਢ ਦਿਓ", hi: "बाढ़ में भीगे गद्दे, तकिए और फोम के कुशन बाहर फेंक दें" } }
    ],
    claims: [
      { id: "c1", text: { en: "Take clear timestamped photos and videos of all damaged walls and roofs", pa: "ਕੰਧਾਂ, ਛੱਤਾਂ ਅਤੇ ਫ਼ਰਸ਼ਾਂ ਦੇ ਨੁਕਸਾਨ ਦੀਆਂ ਸਾਫ਼ ਫ਼ੋਟੋਆਂ ਅਤੇ ਵੀਡੀਓ ਬਣਾਓ", hi: "क्षतिग्रस्त दीवारों, छतों और सामान की स्पष्ट फोटो और वीडियो लें" } },
      { id: "c2", text: { en: "Photograph damaged household assets, tubewell motors, and dead livestock", pa: "ਨੁਕਸਾਨੇ ਗਏ ਮੋਟਰਾਂ, ਘਰੇਲੂ ਸਮਾਨ ਅਤੇ ਮਰੇ ਹੋਏ ਪਸ਼ੂਆਂ ਦੀਆਂ ਫ਼ੋਟੋਆਂ ਖਿੱਚੋ", hi: "खराब मोटर, घरेलू सामान और मृत मवेशियों की फोटो खींचकर रखें" } },
      { id: "c3", text: { en: "Keep Aadhaar card, bank passbook, and land ownership Fard ready", pa: "ਆਧਾਰ ਕਾਰਡ, ਬੈਂਕ ਖਾਤਾ ਕਾਪੀ ਅਤੇ ਜ਼ਮੀਨ ਦੀ ਫ਼ਰਦ ਸੁਰੱਖਿਅਤ ਰੱਖੋ", hi: "आधार कार्ड, बैंक पासबुक और जमीन के कागजात तैयार रखें" } },
      { id: "c4", text: { en: "Submit written damage claim to Patwari or SDM office within 7 days", pa: "ਪਟਵਾਰੀ ਜਾਂ ਐੱਸ.ਡੀ.ਐੱਮ. ਦਫ਼ਤਰ ਵਿੱਚ 7 ਦਿਨਾਂ ਅੰਦਰ ਮੁਆਵਜ਼ਾ ਅਰਜ਼ੀ ਜਮ੍ਹਾਂ ਕਰੋ", hi: "पटवारी या एसडीएम कार्यालय में 7 दिनों के भीतर लिखित दावा पत्र दें" } }
    ]
  },

  // Complete Internationalization Dictionary (en, pa, hi)
  translations: {
    en: {
      appName: "FloodSaathi",
      brandTag: "Early warnings. Safer families. Stronger communities.",
      useLocation: "Use my current location",
      locationSub: "Get real-time risk for your area",
      selectManually: "Select manually",
      selectLocationTitle: "Choose Your Location in Punjab",
      searchLocationPlaceholder: "Search city, village or river bank...",
      continueBtn: "Continue",
      home: "Home",
      map: "Map",
      saathi: "Saathi",
      alerts: "Alerts",
      more: "More",
      safeStatus: "Safe",
      watchStatus: "Watch",
      dangerStatus: "Danger",
      noThreatSub: "No immediate flood threat in your area.",
      watchSub: "Rising river levels. Stay alert.",
      dangerSub: "Flooding reported! Take precautions.",
      riverLevel: "River Level",
      belowWarning: "Below warning level",
      aboveWarning: "Above warning level",
      rainForecast: "Rain Forecast",
      next24h: "Next 24 hours",
      elevation: "Elevation",
      aboveSea: "above sea level",
      distToRiver: "Distance to river",
      noAlertsActive: "No active official alerts for your area",
      updatedAgo: "Updated just now",
      offlineDataPill: "Offline data",
      floodRiskTab: "Flood Risk",
      sheltersTab: "Shelters",
      hospitalsTab: "Hospitals",
      layers: "Layers",
      layerRiver: "River & Waterways",
      layerZones: "Flood Hazard Zones",
      layerRoads: "Safe Road Network",
      viewDetails: "View details",
      highRisk: "High risk",
      moderateRisk: "Moderate",
      lowRisk: "Low risk",
      timeToWaterTitle: "Estimated time-to-water",
      likelyDepth: "Likely depth",
      basedOnNote: "Based on river level rise at Beas, rain forecast and terrain elevation.",
      askSaathiTitle: "Ask Saathi",
      askSaathiSub: "Your offline disaster guide",
      downloadGuide: "Download guide",
      downloadComplete: "Flood Safety Guide downloaded as text file",
      greetingMsg: "Sat Sri Akal! I am Saathi, your offline flood assistant. How can I help you stay safe today?",
      chipWaterHouse: "Water entered my house",
      chipPurifyWater: "How to purify water",
      chipNearestShelter: "Where is nearest shelter?",
      chipElectric: "Electrical safety",
      typeQuestion: "Ask your question...",
      listeningVoice: "Listening... speak now",
      voiceNotSupported: "Voice input is not supported on this browser",
      clearChat: "Clear chat",
      chatCleared: "Chat history cleared",
      sourceLabel: "Source",
      officialAlertsTitle: "Official Alerts",
      officialAlertsSub: "Real-time alerts from NDMA, CWC and state authorities.",
      filterAll: "All",
      filterFlood: "Flood",
      filterDam: "Dam Release",
      filterRain: "Rain",
      noAlertsCategory: "No alerts in this category",
      affectedAreasLabel: "Affected Areas",
      recommendedActions: "Recommended Actions",
      shareAlert: "Share alert",
      copiedClipboard: "Alert text copied to clipboard!",
      emergencyTitle: "Emergency",
      emergencySub: "Get help or inform your family",
      tapToSend: "Press & hold 1.5s to trigger SOS",
      sosHelpDesc: "Sends your location, battery and status to your emergency contacts",
      call112: "Call 112",
      sendSms: "Send SMS",
      familyCheckin: "Family Check-in",
      familySub: "Let your family know you're safe",
      imSafe: "I'm Safe",
      safeSentToast: "Safe status shared with contacts!",
      lastCheckedIn: "Last checked in",
      today: "Today",
      addContact: "Add Emergency Contact",
      contactName: "Contact Name",
      contactPhone: "Mobile Number (10 digits)",
      saveBtn: "Save Contact",
      invalidPhone: "Please enter a valid 10-digit phone number",
      contactsLimit: "Maximum 5 emergency contacts allowed",
      nearestShelterTitle: "Nearest Safe Shelter",
      safeRoutePill: "Safe Route",
      getDirections: "Get Directions",
      callShelter: "Call Shelter",
      afterFloodTitle: "After-Flood Guide",
      afterFloodSub: "Stay safe and get back on your feet.",
      tabSafety: "Safety",
      tabHealth: "Health",
      tabHome: "Home",
      tabClaims: "Claims",
      alertPrefsTitle: "Alert Preferences",
      alertPrefsSub: "Get notified based on your location and risk level.",
      prefFlood: "Flood Warnings",
      prefFloodSub: "River overflow and dam release warnings",
      prefDam: "Dam Release Updates",
      prefDamSub: "Controlled spillway discharges from Pong & Bhakra",
      prefRain: "Heavy Rain Alerts",
      prefRainSub: "Monsoon cloudbursts & intense rain advisories",
      prefWeather: "Weather Advisories",
      prefWeatherSub: "Daily meteorological summary for Punjab",
      prefRadius: "Alert Radius",
      notifyWithin: "Notify me within",
      prefQuiet: "Quiet Hours",
      quietSub: "Mute non-urgent alerts between",
      sendTestAlert: "Send Test Alert",
      testAlertSuccess: "Test alert triggered successfully!",
      moreEmergency: "Emergency SOS & Helplines",
      moreAfterFlood: "After-Flood Recovery Guide",
      moreAlertPrefs: "Alert Preferences",
      moreLanguage: "Language",
      moreChangeLoc: "Change Location",
      moreHelplines: "Official Helplines",
      moreResetApp: "Reset App Data",
      resetConfirmTitle: "Reset All App Data?",
      resetConfirmMsg: "This will restore default settings, remove saved contacts and clear chat history.",
      confirmResetBtn: "Yes, Reset Everything",
      cancelBtn: "Cancel",
      appResetToast: "FloodSaathi has been reset to initial state",
      offlineNotice: "You are offline — showing saved info"
    },
    pa: {
      appName: "ਫਲੱਡ ਸਾਥੀ",
      brandTag: "ਸਮੇਂ ਸਿਰ ਚੇਤਾਵਨੀ। ਸੁਰੱਖਿਅਤ ਪਰਿਵਾਰ। ਮਜ਼ਬੂਤ ਭਾਈਚਾਰਾ।",
      useLocation: "ਮੇਰੀ ਮੌਜੂਦਾ ਥਾਂ ਦੀ ਵਰਤੋਂ ਕਰੋ",
      locationSub: "ਆਪਣੇ ਇਲਾਕੇ ਦਾ ਸਹੀ ਹੜ੍ਹ ਖ਼ਤਰਾ ਜਾਣੋ",
      selectManually: "ਖ਼ੁਦ ਥਾਂ ਚੁਣੋ",
      selectLocationTitle: "ਪੰਜਾਬ ਵਿੱਚ ਆਪਣਾ ਸ਼ਹਿਰ ਜਾਂ ਪਿੰਡ ਚੁਣੋ",
      searchLocationPlaceholder: "ਪਿੰਡ, ਸ਼ਹਿਰ ਜਾਂ ਦਰਿਆ ਦਾ ਨਾਂ ਖੋਜੋ...",
      continueBtn: "ਅੱਗੇ ਵਧੋ",
      home: "ਮੁੱਖ",
      map: "ਨਕਸ਼ਾ",
      saathi: "ਸਾਥੀ",
      alerts: "ਅਲਰਟ",
      more: "ਹੋਰ",
      safeStatus: "ਸੁਰੱਖਿਅਤ",
      watchStatus: "ਚੌਕਸ ਰਹੋ",
      dangerStatus: "ਖ਼ਤਰਾ",
      noThreatSub: "ਤੁਹਾਡੇ ਇਲਾਕੇ ਵਿੱਚ ਹੜ੍ਹ ਦਾ ਕੋਈ ਤੁਰੰਤ ਖ਼ਤਰਾ ਨਹੀਂ।",
      watchSub: "ਦਰਿਆ ਵਿੱਚ ਪਾਣੀ ਚੜ੍ਹ ਰਿਹਾ ਹੈ। ਸਾਵਧਾਨ ਰਹੋ।",
      dangerSub: "ਹੜ੍ਹ ਦਾ ਖ਼ਤਰਾ! ਤੁਰੰਤ ਸੁਰੱਖਿਅਤ ਥਾਂ ਜਾਓ।",
      riverLevel: "ਦਰਿਆ ਦਾ ਪੱਧਰ",
      belowWarning: "ਖ਼ਤਰੇ ਦੇ ਨਿਸ਼ਾਨ ਤੋਂ ਹੇਠਾਂ",
      aboveWarning: "ਖ਼ਤਰੇ ਦੇ ਨਿਸ਼ਾਨ ਤੋਂ ਉੱਪਰ",
      rainForecast: "ਮੀਂਹ ਦੀ ਭਵਿੱਖਬਾਣੀ",
      next24h: "ਅਗਲੇ 24 ਘੰਟੇ",
      elevation: "ਉਚਾਈ",
      aboveSea: "ਸਮੁੰਦਰ ਤਲ ਤੋਂ ਉੱਤੇ",
      distToRiver: "ਦਰਿਆ ਤੋਂ ਦੂਰੀ",
      noAlertsActive: "ਤੁਹਾਡੇ ਇਲਾਕੇ ਲਈ ਕੋਈ ਸਰਕਾਰੀ ਅਲਰਟ ਜਾਰੀ ਨਹੀਂ",
      updatedAgo: "ਹੁਣੇ ਅੱਪਡੇਟ ਕੀਤਾ",
      offlineDataPill: "ਆਫ਼ਲਾਈਨ ਜਾਣਕਾਰੀ",
      floodRiskTab: "ਹੜ੍ਹ ਖ਼ਤਰਾ",
      sheltersTab: "ਰਾਹਤ ਕੈਂਪ",
      hospitalsTab: "ਹਸਪਤਾਲ",
      layers: "ਪਰਤਾਂ",
      layerRiver: "ਦਰਿਆ ਅਤੇ ਨਹਿਰਾਂ",
      layerZones: "ਹੜ੍ਹ ਪ੍ਰਭਾਵਿਤ ਖੇਤਰ",
      layerRoads: "ਸੁਰੱਖਿਅਤ ਸੜਕਾਂ",
      viewDetails: "ਵੇਰਵਾ ਵੇਖੋ",
      highRisk: "ਵੱਡਾ ਖ਼ਤਰਾ",
      moderateRisk: "ਦਰਮਿਆਨਾ",
      lowRisk: "ਘੱਟ ਖ਼ਤਰਾ",
      timeToWaterTitle: "ਪਾਣੀ ਆਉਣ ਦਾ ਅਨੁਮਾਨਿਤ ਸਮਾਂ",
      likelyDepth: "ਸੰਭਾਵੀ ਡੂੰਘਾਈ",
      basedOnNote: "ਦਰਿਆ ਦੇ ਪਾਣੀ, ਮੀਂਹ ਅਤੇ ਜ਼ਮੀਨੀ ਉਚਾਈ ਦੇ ਅਧਾਰ 'ਤੇ।",
      askSaathiTitle: "ਸਾਥੀ ਨੂੰ ਪੁੱਛੋ",
      askSaathiSub: "ਤੁਹਾਡਾ ਆਫ਼ਲਾਈਨ ਆਫ਼ਤ ਗਾਈਡ",
      downloadGuide: "ਗਾਈਡ ਡਾਊਨਲੋਡ ਕਰੋ",
      downloadComplete: "ਸੁਰੱਖਿਆ ਗਾਈਡ ਫ਼ੋਨ ਵਿੱਚ ਡਾਊਨਲੋਡ ਹੋ ਗਈ ਹੈ",
      greetingMsg: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡਾ ਫਲੱਡ ਸਾਥੀ ਹਾਂ। ਹੜ੍ਹਾਂ ਸੰਬੰਧੀ ਕੋਈ ਵੀ ਸਵਾਲ ਪੁੱਛੋ।",
      chipWaterHouse: "ਘਰ ਵਿੱਚ ਪਾਣੀ ਆ ਗਿਆ",
      chipPurifyWater: "ਪਾਣੀ ਸਾਫ਼ ਕਿਵੇਂ ਕਰੀਏ?",
      chipNearestShelter: "ਨੇੜੇ ਰਾਹਤ ਕੈਂਪ ਕਿੱਥੇ ਹੈ?",
      chipElectric: "ਬਿਜਲੀ ਦਾ ਕਰੰਟ ਤੇ ਸੁਰੱਖਿਆ",
      typeQuestion: "ਆਪਣਾ ਸਵਾਲ ਇੱਥੇ ਲਿਖੋ...",
      listeningVoice: "ਸੁਣ ਰਿਹਾ ਹਾਂ... ਬੋਲੋ ਜੀ",
      voiceNotSupported: "ਇਸ ਬ੍ਰਾਊਜ਼ਰ 'ਤੇ ਆਵਾਜ਼ ਸਹੂਲਤ ਉਪਲਬਧ ਨਹੀਂ ਹੈ",
      clearChat: "ਗੱਲਬਾਤ ਸਾਫ਼ ਕਰੋ",
      chatCleared: "ਸਾਰੀ ਪੁਰਾਣੀ ਗੱਲਬਾਤ ਸਾਫ਼ ਕਰ ਦਿੱਤੀ ਗਈ ਹੈ",
      sourceLabel: "ਸਰੋਤ",
      officialAlertsTitle: "ਸਰਕਾਰੀ ਅਲਰਟ",
      officialAlertsSub: "ਐਨ.ਡੀ.ਐਮ.ਏ. ਅਤੇ ਪੰਜਾਬ ਸਰਕਾਰ ਵੱਲੋਂ ਜਾਰੀ ਤਾਜ਼ਾ ਜਾਣਕਾਰੀ।",
      filterAll: "ਸਾਰੇ",
      filterFlood: "ਹੜ੍ਹ",
      filterDam: "ਡੈਮ",
      filterRain: "ਮੀਂਹ",
      noAlertsCategory: "ਇਸ ਸ਼੍ਰੇਣੀ ਵਿੱਚ ਕੋਈ ਅਲਰਟ ਨਹੀਂ ਹੈ",
      affectedAreasLabel: "ਪ੍ਰਭਾਵਿਤ ਇਲਾਕੇ",
      recommendedActions: "ਜ਼ਰੂਰੀ ਕਦਮ",
      shareAlert: "ਅਲਰਟ ਸਾਂਝਾ ਕਰੋ",
      copiedClipboard: "ਜਾਣਕਾਰੀ ਕਾਪੀ ਕਰ ਲਈ ਗਈ ਹੈ!",
      emergencyTitle: "ਐਮਰਜੈਂਸੀ (SOS)",
      emergencySub: "ਮਦਦ ਮੰਗੋ ਜਾਂ ਪਰਿਵਾਰ ਨੂੰ ਸੂਚਿਤ ਕਰੋ",
      tapToSend: "SOS ਲਈ 1.5 ਸਕਿੰਟ ਦਬਾ ਕੇ ਰੱਖੋ",
      sosHelpDesc: "ਤੁਹਾਡੀ ਲੋਕੇਸ਼ਨ, ਬੈਟਰੀ ਅਤੇ ਸੁਨੇਹਾ ਤੁਰੰਤ ਪਰਿਵਾਰ ਨੂੰ ਭੇਜਦਾ ਹੈ",
      call112: "112 'ਤੇ ਕਾਲ ਕਰੋ",
      sendSms: "SMS ਭੇਜੋ",
      familyCheckin: "ਪਰਿਵਾਰ ਨਾਲ ਸੰਪਰਕ",
      familySub: "ਪਰਿਵਾਰ ਨੂੰ ਦੱਸੋ ਕਿ ਤੁਸੀਂ ਰਾਜ਼ੀ-ਖ਼ੁਸ਼ੀ ਹੋ",
      imSafe: "ਮੈਂ ਠੀਕ ਹਾਂ",
      safeSentToast: "ਸੁਰੱਖਿਅਤ ਹੋਣ ਦਾ ਸੁਨੇਹਾ ਭੇਜ ਦਿੱਤਾ ਗਿਆ ਹੈ!",
      lastCheckedIn: "ਆਖ਼ਰੀ ਵਾਰ ਦੱਸਿਆ",
      today: "ਅੱਜ",
      addContact: "ਨਵਾਂ ਨੰਬਰ ਜੋੜੋ",
      contactName: "ਨਾਮ",
      contactPhone: "ਮੋਬਾਈਲ ਨੰਬਰ (10 ਅੰਕ)",
      saveBtn: "ਸੰਭਾਲੋ",
      invalidPhone: "ਕਿਰਪਾ ਕਰਕੇ ਸਹੀ 10 ਅੰਕਾਂ ਦਾ ਮੋਬਾਈਲ ਨੰਬਰ ਭਰੋ",
      contactsLimit: "ਵੱਧ ਤੋਂ ਵੱਧ 5 ਸੰਪਰਕ ਹੀ ਰੱਖੇ ਜਾ ਸਕਦੇ ਹਨ",
      nearestShelterTitle: "ਨਜ਼ਦੀਕੀ ਸੁਰੱਖਿਅਤ ਰਾਹਤ ਕੈਂਪ",
      safeRoutePill: "ਸੁਰੱਖਿਅਤ ਰਸਤਾ",
      getDirections: "ਰਸਤਾ ਵੇਖੋ (GPS)",
      callShelter: "ਕੈਂਪ ਨੂੰ ਕਾਲ ਕਰੋ",
      afterFloodTitle: "ਹੜ੍ਹ ਤੋਂ ਬਾਅਦ ਦੀ ਗਾਈਡ",
      afterFloodSub: "ਸੁਰੱਖਿਅਤ ਰਹੋ ਅਤੇ ਜ਼ਿੰਦਗੀ ਨੂੰ ਮੁੜ ਲੀਹ 'ਤੇ ਲਿਆਓ।",
      tabSafety: "ਸੁਰੱਖਿਆ",
      tabHealth: "ਸਿਹਤ",
      tabHome: "ਘਰ",
      tabClaims: "ਮੁਆਵਜ਼ਾ",
      alertPrefsTitle: "ਅਲਰਟ ਸੈਟਿੰਗਜ਼",
      alertPrefsSub: "ਆਪਣੇ ਇਲਾਕੇ ਅਨੁਸਾਰ ਚੇਤਾਵਨੀਆਂ ਸੈੱਟ ਕਰੋ।",
      prefFlood: "ਹੜ੍ਹ ਚੇਤਾਵਨੀ",
      prefFloodSub: "ਦਰਿਆਵਾਂ ਦੇ ਪਾਣੀ ਚੜ੍ਹਨ ਦੀਆਂ ਖ਼ਬਰਾਂ",
      prefDam: "ਡੈਮਾਂ ਤੋਂ ਪਾਣੀ",
      prefDamSub: "ਪੌਂਗ ਅਤੇ ਭਾਖੜਾ ਡੈਮ ਤੋਂ ਪਾਣੀ ਛੱਡਣ ਦੀ ਸੂਚਨਾ",
      prefRain: "ਭਾਰੀ ਮੀਂਹ ਦਾ ਅਲਰਟ",
      prefRainSub: "ਮੌਸਮ ਵਿਭਾਗ ਵੱਲੋਂ ਤੇਜ਼ ਬਾਰਿਸ਼ ਦੀ ਚੇਤਾਵਨੀ",
      prefWeather: "ਰੋਜ਼ਾਨਾ ਮੌਸਮ",
      prefWeatherSub: "ਪੰਜਾਬ ਦੇ ਮੌਸਮ ਦਾ ਰੋਜ਼ਾਨਾ ਹਾਲ",
      prefRadius: "ਅਲਰਟ ਦਾ ਦਾਇਰਾ",
      notifyWithin: "ਮੈਨੂੰ ਇੰਨੇ ਦਾਇਰੇ ਵਿੱਚ ਸੂਚਿਤ ਕਰੋ",
      prefQuiet: "ਸ਼ਾਂਤ ਸਮਾਂ (Quiet Hours)",
      quietSub: "ਰਾਤ ਦੇ ਸਮੇਂ ਗੈਰ-ਜ਼ਰੂਰੀ ਅਲਰਟ ਬੰਦ ਰੱਖੋ",
      sendTestAlert: "ਟੈਸਟ ਅਲਰਟ ਭੇਜੋ",
      testAlertSuccess: "ਟੈਸਟ ਅਲਰਟ ਸਫਲਤਾਪੂਰਵਕ ਭੇਜਿਆ ਗਿਆ!",
      moreEmergency: "ਐਮਰਜੈਂਸੀ ਅਤੇ ਹੈਲਪਲਾਈਨਾਂ",
      moreAfterFlood: "ਹੜ੍ਹ ਤੋਂ ਬਾਅਦ ਮੁੜ ਵਸੇਬਾ",
      moreAlertPrefs: "ਅਲਰਟ ਸੈਟਿੰਗਜ਼",
      moreLanguage: "ਬੋਲੀ (Language)",
      moreChangeLoc: "ਥਾਂ ਬਦਲੋ",
      moreHelplines: "ਸਰਕਾਰੀ ਹੈਲਪਲਾਈਨਾਂ",
      moreResetApp: "ਐਪ ਡਾਟਾ ਰੀਸੈੱਟ ਕਰੋ",
      resetConfirmTitle: "ਕੀ ਸਾਰਾ ਡਾਟਾ ਸਾਫ਼ ਕਰਨਾ ਹੈ?",
      resetConfirmMsg: "ਇਸ ਨਾਲ ਤੁਹਾਡੇ ਸੰਭਾਲੇ ਹੋਏ ਫ਼ੋਨ ਨੰਬਰ ਅਤੇ ਪੁਰਾਣੀ ਗੱਲਬਾਤ ਖ਼ਤਮ ਹੋ ਜਾਵੇਗੀ।",
      confirmResetBtn: "ਹਾਂ, ਸਭ ਸਾਫ਼ ਕਰੋ",
      cancelBtn: "ਰੱਦ ਕਰੋ",
      appResetToast: "ਐਪ ਦਾ ਸਾਰਾ ਡਾਟਾ ਸ਼ੁਰੂਆਤੀ ਹਾਲਤ ਵਿੱਚ ਆ ਗਿਆ ਹੈ",
      offlineNotice: "ਤੁਸੀਂ ਆਫ਼ਲਾਈਨ ਹੋ — ਸੰਭਾਲੀ ਹੋਈ ਜਾਣਕਾਰੀ ਵਿਖਾਈ ਜਾ ਰਹੀ ਹੈ"
    },
    hi: {
      appName: "फ्लड साथी",
      brandTag: "समय पर चेतावनी। सुरक्षित परिवार। सशक्त समाज।",
      useLocation: "मेरी वर्तमान लोकेशन का उपयोग करें",
      locationSub: "अपने क्षेत्र का वास्तविक बाढ़ जोखिम जानें",
      selectManually: "खुद स्थान चुनें",
      selectLocationTitle: "पंजाब में अपना शहर या गाँव चुनें",
      searchLocationPlaceholder: "शहर, गाँव या नदी का नाम खोजें...",
      continueBtn: "आगे बढ़ें",
      home: "होम",
      map: "मैप",
      saathi: "साथी",
      alerts: "अलर्ट",
      more: "अन्य",
      safeStatus: "सुरक्षित",
      watchStatus: "सतर्क रहें",
      dangerStatus: "खतरा",
      noThreatSub: "आपके क्षेत्र में बाढ़ का कोई तात्कालिक खतरा नहीं है।",
      watchSub: "नदी में जलस्तर बढ़ रहा है। सावधान रहें।",
      dangerSub: "बाढ़ की चेतावनी! तुरंत सुरक्षित स्थान पर जाएं।",
      riverLevel: "नदी का जलस्तर",
      belowWarning: "खतरे के निशान से नीचे",
      aboveWarning: "खतरे के निशान से ऊपर",
      rainForecast: "बारिश का पूर्वानुमान",
      next24h: "अगले 24 घंटे",
      elevation: "ऊंचाई",
      aboveSea: "समुद्र तल से ऊपर",
      distToRiver: "नदी से दूरी",
      noAlertsActive: "आपके क्षेत्र के लिए कोई सक्रिय आधिकारिक चेतावनी नहीं है",
      updatedAgo: "अभी अपडेट किया गया",
      offlineDataPill: "ऑफ़लाइन डेटा",
      floodRiskTab: "बाढ़ जोखिम",
      sheltersTab: "राहत शिविर",
      hospitalsTab: "अस्पताल",
      layers: "परतें",
      layerRiver: "नदियाँ व जलमार्ग",
      layerZones: "बाढ़ संभावित क्षेत्र",
      layerRoads: "सुरक्षित सड़कें",
      viewDetails: "विवरण देखें",
      highRisk: "उच्च जोखिम",
      moderateRisk: "मध्यम",
      lowRisk: "कम जोखिम",
      timeToWaterTitle: "पानी पहुंचने का अनुमानित समय",
      likelyDepth: "संभावित गहराई",
      basedOnNote: "ब्यास नदी के जलस्तर, वर्षा पूर्वानुमान और धरातलीय ऊंचाई पर आधारित।",
      askSaathiTitle: "साथी से पूछें",
      askSaathiSub: "आपका ऑफ़लाइन आपदा गाइड",
      downloadGuide: "गाइड डाउनलोड करें",
      downloadComplete: "बाढ़ सुरक्षा गाइड टेक्स्ट फाइल के रूप में डाउनलोड हो गई है",
      greetingMsg: "नमस्ते! मैं आपका बाढ़ साथी हूँ। आज मैं आपको सुरक्षित रखने में क्या मदद कर सकता हूँ?",
      chipWaterHouse: "घर में पानी आ गया",
      chipPurifyWater: "पानी कैसे शुद्ध करें?",
      chipNearestShelter: "निकटतम राहत शिविर कहाँ है?",
      chipElectric: "बिजली और करंट से सुरक्षा",
      typeQuestion: "अपना सवाल यहाँ पूछें...",
      listeningVoice: "सुन रहा हूँ... बोलिए",
      voiceNotSupported: "इस ब्राउज़र पर वॉइस इनपुट उपलब्ध नहीं है",
      clearChat: "बातचीत साफ करें",
      chatCleared: "पिछली बातचीत साफ कर दी गई है",
      sourceLabel: "स्रोत",
      officialAlertsTitle: "आधिकारिक अलर्ट",
      officialAlertsSub: "एनडीएमए और राज्य प्राधिकरणों से रीयल-टाइम अलर्ट।",
      filterAll: "सभी",
      filterFlood: "बाढ़",
      filterDam: "डैम अलर्ट",
      filterRain: "बारिश",
      noAlertsCategory: "इस श्रेणी में कोई अलर्ट नहीं है",
      affectedAreasLabel: "प्रभावित क्षेत्र",
      recommendedActions: "ज़रूरी सावधानियां",
      shareAlert: "अलर्ट साझा करें",
      copiedClipboard: "अलर्ट क्लिपबोर्ड पर कॉपी हो गया!",
      emergencyTitle: "आपातकाल (SOS)",
      emergencySub: "मदद प्राप्त करें या परिवार को सूचित करें",
      tapToSend: "SOS अलर्ट के लिए 1.5 सेकंड दबाकर रखें",
      sosHelpDesc: "आपकी लोकेशन, बैटरी और स्थिति आपके आपातकालीन संपर्कों को भेजता है",
      call112: "112 पर कॉल करें",
      sendSms: "SMS भेजें",
      familyCheckin: "परिवार से संपर्क",
      familySub: "परिवार को बताएं कि आप सुरक्षित हैं",
      imSafe: "मैं सुरक्षित हूँ",
      safeSentToast: "सुरक्षित होने की सूचना परिजनों को भेज दी गई है!",
      lastCheckedIn: "अंतिम सूचना",
      today: "आज",
      addContact: "नया संपर्क जोड़ें",
      contactName: "नाम",
      contactPhone: "मोबाइल नंबर (10 अंक)",
      saveBtn: "सहेजें",
      invalidPhone: "कृपया सही 10 अंकों का मोबाइल नंबर दर्ज करें",
      contactsLimit: "अधिकतम 5 संपर्क ही जोड़े जा सकते हैं",
      nearestShelterTitle: "निकटतम सुरक्षित राहत शिविर",
      safeRoutePill: "सुरक्षित मार्ग",
      getDirections: "दिशा-निर्देश (GPS)",
      callShelter: "शिविर को कॉल करें",
      afterFloodTitle: "बाढ़ के बाद की गाइड",
      afterFloodSub: "सुरक्षित रहें और सामान्य जीवन में लौटें।",
      tabSafety: "सुरक्षा",
      tabHealth: "स्वास्थ्य",
      tabHome: "घर",
      tabClaims: "मुआवजा",
      alertPrefsTitle: "अलर्ट प्राथमिकताएं",
      alertPrefsSub: "अपने स्थान और जोखिम स्तर के आधार पर सूचनाएं पाएं।",
      prefFlood: "बाढ़ की चेतावनी",
      prefFloodSub: "नदी के उफान और जलस्तर की जानकारी",
      prefDam: "डैम से पानी छोड़ने की सूचना",
      prefDamSub: "पोंग और भाखड़ा बांध से पानी छोड़े जाने की सूचना",
      prefRain: "भारी बारिश का अलर्ट",
      prefRainSub: "मौसम विभाग की तेज वर्षा की चेतावनी",
      prefWeather: "दैनिक मौसम",
      prefWeatherSub: "पंजाब के मौसम का दैनिक सार",
      prefRadius: "अलर्ट का दायरा",
      notifyWithin: "मुझे इस दायरे में सूचित करें",
      prefQuiet: "शांत समय (Quiet Hours)",
      quietSub: "रात के समय सामान्य अलर्ट म्यूट रखें",
      sendTestAlert: "टेस्ट अलर्ट भेजें",
      testAlertSuccess: "टेस्ट अलर्ट सफलतापूर्वक भेजा गया!",
      moreEmergency: "आपातकालीन SOS व हेल्पलाइन",
      moreAfterFlood: "बाढ़ उपरांत पुनर्वास गाइड",
      moreAlertPrefs: "अलर्ट प्राथमिकताएं",
      moreLanguage: "भाषा (Language)",
      moreChangeLoc: "स्थान बदलें",
      moreHelplines: "आधिकारिक हेल्पलाइनें",
      moreResetApp: "ऐप डेटा रीसेट करें",
      resetConfirmTitle: "क्या सारा डेटा हटाना चाहते हैं?",
      resetConfirmMsg: "इससे आपके सहेजे गए फ़ोन नंबर और चैट इतिहास पूरी तरह मिट जाएंगे।",
      confirmResetBtn: "हाँ, सब रीसेट करें",
      cancelBtn: "रद्द करें",
      appResetToast: "ऐप का डेटा प्रारंभिक स्थिति में रीसेट हो गया है",
      offlineNotice: "आप ऑफ़लाइन हैं — सहेजी गई जानकारी दिखाई जा रही है"
    }
  }
};
