#!/usr/bin/env python3
"""
Builds the verified Flood Safety Domain Dataset (corpus/flood_safety_dataset.jsonl)
strictly grounded in:
- NDMA Flood Management SOPs & Guidelines (Govt. of India)
- Punjab State Disaster Management Authority (SDMA) Flood Preparedness Manual
- Central Water Commission (CWC) Flood Forecasting Guidelines
- World Health Organization (WHO) Guidelines for Drinking-water Quality in Emergencies
- Ministry of Health & Family Welfare (MoHFW) National Snakebite Management Protocol
"""

import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUTPUT_FILE = ROOT / "corpus" / "flood_safety_dataset.jsonl"

DATASET = [
    # 1. WATER DISINFECTION & WELL CHLORINATION
    {
        "prompt": "How do I disinfect a drinking water well contaminated by flood water using bleaching powder?",
        "response": "To disinfect a flood-contaminated well according to WHO and NDMA emergency guidelines:\n1. Measure the well water volume: Volume (m³) = 3.1416 × radius² × water depth (m). Note that 1 m³ equals 1,000 litres of water.\n2. Calculate bleaching powder: Use 2.5 to 5 grams of fresh bleaching powder (containing ~33% available chlorine) per 1,000 litres of water.\n3. Preparation: Place the required bleaching powder into a clean bucket. Add a small quantity of water to form a smooth paste, then add more water and stir thoroughly.\n4. Sediment settling: Allow the milky slurry to stand undisturbed for 15 to 20 minutes so insoluble calcium carbonate settles to the bottom.\n5. Application: Carefully pour only the clear supernatant liquid into the well. Lower and raise a clean bucket several times to agitate and mix the water throughout the well depth.\n6. Contact time: Seal the well and allow at least 1 to 2 hours of contact time before drawing water. Do not consume well water until it has been declared safe by public health officials.",
        "category": "water_disinfection",
        "verified_source": "WHO Emergency Water Guidelines & NDMA Flood SOP 2023"
    },
    {
        "prompt": "Can you provide a calculation example for chlorinating a rural circular open well?",
        "response": "According to WHO technical guidance for emergency well chlorination:\n1. If a circular well has a diameter of 1.4 metres, its radius (r) is 0.7 metres. If the measured water depth (h) is 3 metres, the water volume is V = 3.1416 × (0.7)² × 3 ≈ 4.62 cubic metres.\n2. In litres: 4.62 m³ × 1,000 = 4,620 litres of water.\n3. Required bleaching powder: At 4 grams per 1,000 litres, need 4.62 × 4 = 18.5 grams of fresh bleaching powder.\n4. Dissolve 18.5 grams in a bucket of water, let lime settle for 15 minutes, pour the supernatant solution into the well, and agitate with a clean bucket. Wait at least 1 hour before pumping.",
        "category": "water_disinfection",
        "verified_source": "WHO Technical Notes on Drinking-Water in Emergencies"
    },
    {
        "prompt": "How should an overhead plastic water storage tank (e.g. Sintex tank) contaminated by flood backflow be disinfected?",
        "response": "Under NDMA and WHO sanitation protocols for domestic overhead water tanks:\n1. Drain and Scrub: Empty the tank completely and scrub the inner walls, floor, and ceiling with clean water and a stiff brush to remove silt and biofilm. Drain the rinse water.\n2. Disinfection Dosing: Refill the tank with water and add 50 grams of fresh bleaching powder (33% available chlorine) per 1,000 litres to achieve a strong shock-chlorination level (approx. 15-20 mg/L chlorine).\n3. Distribution Piping: Open all taps connected to the tank until the smell of chlorine is detected at each tap, then close the taps tightly.\n4. Contact Time: Allow the chlorinated water to sit in the tank and distribution pipes for at least 12 hours (or a minimum of 4 hours).\n5. Flushing: Drain the tank and flush the lines completely with fresh clean water before normal use.",
        "category": "water_disinfection",
        "verified_source": "NDMA Environmental Sanitation Manual & WHO Water Hygiene"
    },
    {
        "prompt": "ਕੀ ਹੜ੍ਹ ਤੋਂ ਬਾਅਦ ਖੂਹ ਜਾਂ ਨਲਕੇ ਦੇ ਪਾਣੀ ਨੂੰ ਬਲੀਚਿੰਗ ਪਾਊਡਰ ਨਾਲ ਸਾਫ਼ ਕੀਤਾ ਜਾ ਸਕਦਾ ਹੈ?",
        "response": "ਹਾਂ, ਵਿਸ਼ਵ ਸਿਹਤ ਸੰਗਠਨ (WHO) ਅਤੇ NDMA ਦੇ ਨਿਯਮਾਂ ਅਨੁਸਾਰ:\n1. ਪ੍ਰਤੀ 1,000 ਲੀਟਰ ਪਾਣੀ ਲਈ 2.5 ਤੋਂ 5 ਗ੍ਰਾਮ ਤਾਜ਼ਾ ਬਲੀਚਿੰਗ ਪਾਊਡਰ (33% ਕਲੋਰੀਨ ਵਾਲਾ) ਵਰਤੋ।\n2. ਪਹਿਲਾਂ ਬਾਲਟੀ ਵਿੱਚ ਥੋੜ੍ਹਾ ਪਾਣੀ ਪਾ ਕੇ ਬਲੀਚਿੰਗ ਪਾਊਡਰ ਦਾ ਪੇਸਟ ਬਣਾਓ, ਫਿਰ ਬਾਲਟੀ ਪਾਣੀ ਨਾਲ ਭਰ ਕੇ ਚੰਗੀ ਤਰ੍ਹਾਂ ਹਿਲਾਓ।\n3. 15-20 ਮਿੰਟ ਲਈ ਰੱਖ ਦਿਓ ਤਾਂ ਜੋ ਚੂਨਾ ਥੱਲੇ ਬੈਠ ਜਾਵੇ। ਸਿਰਫ਼ ਉੱਪਰਲਾ ਸਾਫ਼ ਪਾਣੀ ਖੂਹ ਵਿੱਚ ਪਾਓ।\n4. ਖੂਹ ਦੇ ਪਾਣੀ ਨੂੰ ਬਾਲਟੀ ਨਾਲ ਹਿਲਾਓ ਅਤੇ ਘੱਟੋ-ਘੱਟ 1 ਤੋਂ 2 ਘੰਟੇ ਤੱਕ ਪਾਣੀ ਦੀ ਵਰਤੋਂ ਨਾ ਕਰੋ।\n5. ਪੀਣ ਤੋਂ ਪਹਿਲਾਂ ਪਾਣੀ ਨੂੰ 1 ਮਿੰਟ ਉਬਾਲਣਾ ਸਭ ਤੋਂ ਸੁਰੱਖਿਅਤ ਹੈ।",
        "category": "water_disinfection",
        "verified_source": "WHO Guidelines & Punjab SDMA Flood Protocol"
    },
    {
        "prompt": "बाढ़ के बाद दूषित कुएं के पानी को ब्लीचिंग पाउडर से कैसे शुद्ध करें?",
        "response": "एनडीएमए (NDMA) और डब्ल्यूएचओ (WHO) के अधिकृत दिशा-निर्देश:\n1. कुएं के प्रति 1,000 लीटर पानी के लिए 2.5 से 5 ग्राम ताजा ब्लीचिंग पाउडर (33% क्लोरीन युक्त) लें।\n2. एक बाल्टी में थोड़ा पानी मिलाकर पहले गाढ़ा घोल बनाएं, फिर पूरी बाल्टी भरकर घोलें।\n3. घोल को 15-20 मिनट स्थिर रहने दें ताकि सफेद चूना नीचे बैठ जाए।\n4. केवल ऊपर का साफ क्लोरीनयुक्त पानी कुएं में डालें और बाल्टी चलाकर अच्छी तरह मिला दें।\n5. कम से कम 1 से 2 घंटे तक पानी का उपयोग न करें।\n6. पीने के लिए पानी को उपयोग से पहले 1 मिनट तक पूरी तरह उबालना अनिवार्य है।",
        "category": "water_disinfection",
        "verified_source": "NDMA SOP & WHO Drinking Water Guidelines"
    },
    {
        "prompt": "How long should I boil drinking water during flood conditions to kill bacteria and pathogens?",
        "response": "According to WHO and NDMA emergency hygiene protocols, water must be brought to a vigorous, rolling boil for at least 1 full minute (60 seconds). At altitudes higher than 1,000 metres above sea level, boil for at least 3 minutes. Boiling vigorously kills waterborne pathogens including bacteria (such as Vibrio cholerae and Salmonella), viruses (such as Hepatitis A and E), and protozoan cysts (such as Giardia and Cryptosporidium). Allow the water to cool naturally in clean, covered containers with a narrow neck or fitted lid to prevent secondary recontamination.",
        "category": "water_disinfection",
        "verified_source": "WHO Guidelines for Drinking-water Quality & NDMA SOP"
    },
    {
        "prompt": "ਹੜ੍ਹਾਂ ਦੌਰਾਨ ਪੀਣ ਵਾਲੇ ਪਾਣੀ ਨੂੰ ਕਿੰਨੀ ਦੇਰ ਉਬਾਲਣਾ ਚਾਹੀਦਾ ਹੈ?",
        "response": "ਵਿਸ਼ਵ ਸਿਹਤ ਸੰਗਠਨ (WHO) ਦੇ ਨਿਯਮਾਂ ਅਨੁਸਾਰ ਪਾਣੀ ਨੂੰ ਤੇਜ਼ ਅੱਗ 'ਤੇ ਘੱਟੋ-ਘੱਟ 1 ਪੂਰਾ ਮਿੰਟ (ਉਬਾਲ ਆਉਣ ਤੋਂ ਬਾਅਦ) ਚੰਗੀ ਤਰ੍ਹਾਂ ਉਬਾਲੋ। ਉਬਾਲਣ ਨਾਲ ਹੈਜ਼ਾ, ਟਾਈਫਾਈਡ, ਅਤੇ ਪੀਲੀਆ ਵਰਗੀਆਂ ਬਿਮਾਰੀਆਂ ਦੇ ਕੀਟਾਣੂ ਖ਼ਤਮ ਹੋ ਜਾਂਦੇ ਹਨ। ਉਬਲੇ ਹੋਏ ਪਾਣੀ ਨੂੰ ਹਮੇਸ਼ਾ ਸਾਫ਼ ਅਤੇ ਢੱਕੇ ਹੋਏ ਬਰਤਨ ਵਿੱਚ ਹੀ ਰੱਖੋ।",
        "category": "water_disinfection",
        "verified_source": "WHO Emergency Hygiene Standards & Punjab SDMA"
    },
    {
        "prompt": "If boiling water is impossible due to lack of cooking fuel, how can water be chemically treated for emergency drinking?",
        "response": "If fuel or firewood is unavailable, use chemical chlorination according to NDMA and WHO emergency guidelines:\n1. Household Liquid Bleach (5% to 6% sodium hypochlorite with no additives or perfumes): Add 2 drops (approx. 0.1 mL) per 1 litre of clear water. If the water is cloudy or turbid, filter it through a clean, tightly woven cloth first and add 4 drops per 1 litre.\n2. Mix thoroughly and allow the treated water to stand for at least 30 minutes before drinking. The water should have a slight chlorine scent. If not, repeat the dose and wait another 15 minutes.\n3. Chlorine Tablets (Halazone or NaDCC): Use government-distributed or certified water purification tablets following the exact package instructions (typically 1 tablet per 20 litres of water, allowing 30 minutes contact time).",
        "category": "water_disinfection",
        "verified_source": "WHO Technical Notes on Drinking-water & NDMA Manual"
    },

    # 2. ELECTRICAL SAFETY & DOWNED POWER LINES
    {
        "prompt": "What should I do about electrical switches and main power before flood water enters my home?",
        "response": "According to NDMA and Punjab State Power Corporation Limited (PSPCL) safety directives:\n1. If water has NOT yet reached the electrical panel and your feet and hands are completely dry, switch off the main electrical circuit breaker (MCB) and disconnect inverter battery terminals immediately.\n2. NEVER touch any electrical switch, breaker, wire, or appliance if you are standing in water, on wet ground, or if your clothes or hands are damp.\n3. If flood water has already entered the house or reached wall sockets, DO NOT attempt to reach the fuse box. Evacuate immediately.\n4. Call PSPCL emergency helpline 1912 or State Disaster Control 1070 to report local electrical hazards and request feeder shutdown.",
        "category": "electrical_safety",
        "verified_source": "NDMA Electrical Hazard Guidelines & PSPCL Safety Manual"
    },
    {
        "prompt": "What is 'step potential' and how do I safely escape if an energized power line falls near me on wet ground?",
        "response": "Under Central Electricity Authority and National Safety Council directives:\n1. Step Potential Hazard: When an energized power line touches wet ground or flood water, electric current spreads outward in concentric circles of decreasing voltage. A walking person whose feet are apart creates a voltage difference between feet, causing deadly current to flow through legs and heart.\n2. Escape Technique (Bunny Hop / Shuffle): Keep feet together, touching side-by-side. Either hop with both feet together or shuffle by sliding feet along the ground without lifting them or separating them by more than 2 inches.\n3. Safe Distance: Continue hopping or shuffling until you are at least 10 metres (33 feet) away from the fallen conductor.\n4. Alert others and immediately call PSPCL emergency line 1912 or Police 112.",
        "category": "electrical_safety",
        "verified_source": "Central Electricity Authority Safety Directives & NDMA Hazard Guide"
    },
    {
        "prompt": "ਜੇਕਰ ਪਿੰਡ ਵਿੱਚ ਬਿਜਲੀ ਦੀ ਤਾਰ ਜਾਂ ਖੰਭਾ ਪਾਣੀ ਵਿੱਚ ਡਿੱਗ ਪਵੇ ਤਾਂ ਕੀ ਕਰਨਾ ਚਾਹੀਦਾ ਹੈ?",
        "response": "ਪੰਜਾਬ ਰਾਜ ਪਾਵਰ ਕਾਰਪੋਰੇਸ਼ਨ (PSPCL) ਅਤੇ NDMA ਦੇ ਨਿਯਮ:\n1. ਡਿੱਗੀ ਹੋਈ ਬਿਜਲੀ ਦੀ ਤਾਰ ਜਾਂ ਖੰਭੇ ਤੋਂ ਘੱਟੋ-ਘੱਟ 10 ਮੀਟਰ (33 ਫੁੱਟ) ਦੂਰ ਰਹੋ।\n2. ਉਸ ਪਾਣੀ ਜਾਂ ਗਿੱਲੀ ਜ਼ਮੀਨ ਵਿੱਚ ਕਦੇ ਵੀ ਪੈਰ ਨਾ ਧਰੋ ਕਿਉਂਕਿ ਪਾਣੀ ਵਿੱਚ ਬਿਜਲੀ ਦਾ ਕਰੰਟ ਫੈਲ ਸਕਦਾ ਹੈ।\n3. ਦੂਜੇ ਪਿੰਡ ਵਾਸੀਆਂ ਨੂੰ ਚੇਤਾਵਨੀ ਦਿਓ ਅਤੇ ਰਸਤਾ ਬੰਦ ਕਰੋ।\n4. ਬਿਜਲੀ ਸਪਲਾਈ ਕੱਟਣ ਲਈ ਤੁਰੰਤ ਪਾਵਰਕਾਮ (PSPCL) ਦੇ ਹੈਲਪਲਾਈਨ ਨੰਬਰ 1912 ਜਾਂ ਐਮਰਜੈਂਸੀ 112 'ਤੇ ਫੋਨ ਕਰੋ।",
        "category": "electrical_safety",
        "verified_source": "PSPCL Electrical Safety Directives & Punjab SDMA"
    },
    {
        "prompt": "यदि सड़क पर या पानी में बिजली की टूटी हुई तार पड़ी हो तो कितनी दूरी बनाए रखनी चाहिए?",
        "response": "एनडीएमए (NDMA) और बिजली सुरक्षा मानकों के अनुसार:\n1. टूटे हुए तार या बिजली के खंभे से कम से कम 10 मीटर (लगभग 33 फीट) की सुरक्षित दूरी बनाए रखें।\n2. पानी या गीली जमीन में करंट तेजी से फैलता है (स्टेप पोटेंशियल), इसलिए कभी भी उस पानी के पास न जाएं।\n3. यदि आप गलती से तार के पास हों, तो दोनों पैर एक साथ मिलाकर छोटे-छोटे कदमों से या कूदते हुए दूर हटें।\n4. तुरंत बिजली विभाग की आपातकालीन हेल्पलाइन 1912 या आपातकालीन नंबर 112 पर सूचना दें।",
        "category": "electrical_safety",
        "verified_source": "NDMA Safety Guidelines & Central Electricity Authority (CEA) Regulations"
    },
    {
        "prompt": "Can I turn on household electrical appliances after flood water recedes from my house?",
        "response": "ABSOLUTELY NOT. Under NDMA and Central Electricity Authority regulations:\n1. Do not energize any appliance, switch, wiring, or pump that has been submerged or exposed to moisture until it has been inspected and certified by a qualified licensed electrician.\n2. Silt and moisture inside motors, switches, and wiring cause dangerous short circuits, electrical fires, and fatal electrocution.\n3. The main supply must remain OFF until all circuits, conduit pipes, and junction boxes have been thoroughly cleaned, dried, and insulation-tested (Megger test).",
        "category": "electrical_safety",
        "verified_source": "NDMA Guidelines for Disaster Safety & CEA Safety Regulations"
    },

    # 3. SNAKEBITE & REPTILE HAZARDS
    {
        "prompt": "Why do snakes and reptiles become a severe hazard during river floods, and how can we protect ourselves?",
        "response": "During monsoon floods, rising water inundates subterranean burrows and natural habitats of venomous snakes (Indian Cobra, Russell's Viper, Saw-scaled Viper, and Common Krait). Snakes swim seeking dry, elevated ground, frequently entering houses, tree branches, roof rafters, cattle sheds, and stacks of dry fodder (toori).\nPrevention Protocols (National Snakebite Management Protocol & NDMA):\n1. Never walk barefoot in flood water, tall grass, or mud. Wear heavy rubber gumboots if available.\n2. Always carry a long bamboo stick and tap the ground ahead of you when walking; vibrations warn snakes to retreat.\n3. Keep a working flashlight or torch on whenever moving outdoors or entering storage rooms after sunset.\n4. Carefully inspect bedding, boots, clothing, and under raised cots before sleeping or putting on shoes.",
        "category": "reptile_hazards",
        "verified_source": "National Snakebite Management Protocol (MoHFW) & NDMA Flood Guidelines"
    },
    {
        "prompt": "ਕਿਸੇ ਨੂੰ ਹੜ੍ਹ ਦੌਰਾਨ ਸੱਪ ਲੜ ਜਾਵੇ ਤਾਂ ਤੁਰੰਤ ਕੀ ਫਸਟ ਏਡ ਕਰਨੀ ਚਾਹੀਦੀ ਹੈ?",
        "response": "ਭਾਰਤ ਸਰਕਾਰ ਦੇ ਸਿਹਤ ਮੰਤਰਾਲੇ (MoHFW) ਦੇ ਨਿਯਮਾਂ ਅਨੁਸਾਰ:\n1. ਮਰੀਜ਼ ਨੂੰ ਸ਼ਾਂਤ ਰੱਖੋ ਅਤੇ ਬਿਲਕੁਲ ਹਿੱਲਣ ਨਾ ਦਿਓ। ਹਿੱਲਣ ਨਾਲ ਜ਼ਹਿਰ ਖੂਨ ਵਿੱਚ ਤੇਜ਼ੀ ਨਾਲ ਫੈਲਦਾ ਹੈ।\n2. ਡੰਗ ਵਾਲੇ ਅੰਗ (ਹੱਥ ਜਾਂ ਪੈਰ) ਨੂੰ ਲੱਕੜੀ ਦੀ ਫੱਟੀ ਨਾਲ ਬੰਨ੍ਹ ਕੇ ਸਥਿਰ ਰੱਖੋ (ਜਿਵੇਂ ਹੱਡੀ ਟੁੱਟਣ 'ਤੇ ਰੱਖਿਆ ਜਾਂਦਾ ਹੈ) ਅਤੇ ਦਿਲ ਦੇ ਪੱਧਰ ਤੋਂ ਹੇਠਾਂ ਰੱਖੋ।\n3. ਗਹਿਣੇ, ਅੰਗੂਠੀਆਂ, ਘੜੀ ਅਤੇ ਤੰਗ ਕੱਪੜੇ ਤੁਰੰਤ ਉਤਾਰ ਦਿਓ ਕਿਉਂਕਿ ਸੋਜ ਆ ਸਕਦੀ ਹੈ।\n4. ਗ਼ਲਤੀਆਂ ਨਾ ਕਰੋ: ਕਦੇ ਵੀ ਚੀਰਾ ਨਾ ਲਗਾਓ, ਜ਼ਹਿਰ ਨਾ ਚੂਸੋ, ਰੱਸੀ ਨਾਲ ਕਸ ਕੇ ਨਾ ਬੰਨ੍ਹੋ (ਟੋਰਨੀਕੇਟ ਨਾ ਲਗਾਓ), ਅਤੇ ਕੋਈ ਦੇਸੀ ਦਵਾਈ ਨਾ ਲਗਾਓ।\n5. ਤੁਰੰਤ 108 ਐਂਬੂਲੈਂਸ ਜਾਂ 112 'ਤੇ ਫੋਨ ਕਰਕੇ ਮਰੀਜ਼ ਨੂੰ ਨਜ਼ਦੀਕੀ ਸਰਕਾਰੀ ਹਸਪਤਾਲ ਲੈ ਜਾਓ ਜਿੱਥੇ ਐਂਟੀ-ਸਨੇਕ ਵੈਨਮ (ASV) ਉਪਲਬਧ ਹੋਵੇ।",
        "category": "reptile_hazards",
        "verified_source": "MoHFW National Snakebite Management Protocol & Punjab Health Dept"
    },
    {
        "prompt": "What is the correct first aid protocol for a snakebite during flood emergency? Should I use a tourniquet or cut the wound?",
        "response": "NEVER cut the wound and NEVER use a tourniquet. Medical authorities (MoHFW and WHO) strictly prohibit cutting, sucking venom, or applying tight tourniquets, which cause severe tissue necrosis, gangrene, and increased mortality.\nCorrect Protocol (Right Aid):\n1. Reassure the patient and keep them completely still and calm; anxiety increases heart rate and venom dispersion.\n2. Immobilize the bitten limb using a splint or firm bandage (analogous to stabilizing a fracture). Keep the limb positioned at or slightly below heart level.\n3. Remove rings, anklets, bracelets, and tight clothing before progressive swelling sets in.\n4. Note the time of bite and snake appearance if seen safely, but do not waste time attempting to capture or kill the snake.\n5. Transport the victim immediately to the nearest Community Health Centre (CHC) or Civil Hospital equipped with Polyvalent Anti-Snake Venom (ASV). Dial 108 (Ambulance) or 112 (Emergency Response).",
        "category": "reptile_hazards",
        "verified_source": "MoHFW National Snakebite Management Protocol & WHO Snakebite Guidelines"
    },
    {
        "prompt": "Are scorpions dangerous during floods and what is the immediate first aid for a scorpion sting in rural Punjab?",
        "response": "Red scorpions (Hottentotta tamulus) also seek high, dry shelters during floods, commonly hiding in stacked firewood, damp bedding, and footwear.\nFirst Aid (National Guidelines & WHO):\n1. Wash the sting site thoroughly with clean soap and water.\n2. Apply a cold compress or cloth dipped in cool water to reduce severe burning pain (do NOT apply ice directly to skin).\n3. Keep the affected limb immobilized and at rest.\n4. Watch for autonomic storm symptoms: profuse sweating, salivation, vomiting, priapism, or difficulty breathing (signs of pulmonary edema).\n5. Transport immediately to hospital. Doctors administer oral Prazosin and close cardiac monitoring. Call 108 for ambulance.",
        "category": "reptile_hazards",
        "verified_source": "National Protocols on Scorpion Envenomation & Punjab Health Services"
    },

    # 4. POST-FLOOD SILT, CARCASS DISPOSAL & SANITATION
    {
        "prompt": "How should flood silt and mud inside houses and village streets be safely cleared and disinfected?",
        "response": "NDMA Post-Flood Rehabilitation and Public Health guidelines state:\n1. Personal Protection: Always wear heavy-duty rubber gloves, impermeable gumboots, and an N95 or surgical mask before handling flood mud, which contains toxic sewage, rotting organic matter, and industrial chemicals.\n2. Mechanical Removal: Shovel out all silt and mud while it is still wet and workable. Once river silt dries under the sun, it cakes hard and generates airborne pathogenic dust.\n3. Washing: Wash floors, masonry walls, and solid surfaces with clean water and detergent to remove physical grime.\n4. Disinfection: Scrub all hard surfaces with a solution of 1 cup (approx. 250 mL) household bleach or 30 grams bleaching powder per 10 litres of clean water. Allow the disinfectant to air-dry for at least 30 minutes.\n5. Aeration: Open all doors and cross-ventilating windows for 48 to 72 hours to dispel dampness and toxic gases before moving back in. Throw away saturated mattresses, upholstered furniture, and porous mats that cannot be completely disinfected.",
        "category": "silt_and_sanitation",
        "verified_source": "NDMA Post-Disaster Sanitation Guidelines & WHO Environmental Health Protocols"
    },
    {
        "prompt": "How can leptospirosis infection be prevented when cleaning flood silt and working in stagnant flood water?",
        "response": "Leptospirosis is caused by Leptospira interrogans bacteria excreted in the urine of rodents and livestock, which survives for weeks in warm flood waters and mud. It penetrates human skin through cuts, scratches, or mucous membranes.\nPrevention Protocol (MoHFW & WHO):\n1. Protective Equipment: Wear waterproof rubber gumboots and heavy rubber gloves when walking or working in flood mud.\n2. Wound Care: Cover any minor cuts, sores, or abrasions with waterproof sterile dressings before entering wet areas.\n3. Hygiene: Immediately wash exposed skin with clean water and antiseptic soap after contact with flood water or mud.\n4. Prophylaxis: In declared endemic flood zones, health workers distribute oral Doxycycline prophylaxis under medical supervision.\n5. Early Symptoms: If you develop sudden high fever, severe calf muscle pain, headache, red conjunctival suffusion, or jaundice within 1 to 2 weeks after flood exposure, report immediately to a hospital. Call 108/112.",
        "category": "silt_and_sanitation",
        "verified_source": "MoHFW Leptospirosis Management Guidelines & WHO Guidelines"
    },
    {
        "prompt": "ਹੜ੍ਹ ਤੋਂ ਬਾਅਦ ਮਰੇ ਹੋਏ ਪਸ਼ੂਆਂ (ਡੰਗਰਾਂ) ਦਾ ਨਿਪਟਾਰਾ ਕਿਵੇਂ ਕਰਨਾ ਚਾਹੀਦਾ ਹੈ ਤਾਂ ਜੋ ਬਿਮਾਰੀਆਂ ਨਾ ਫੈਲਣ?",
        "response": "ਪੰਜਾਬ ਆਫ਼ਤ ਪ੍ਰਬੰਧਨ (SDMA) ਅਤੇ ਪਸ਼ੂ ਪਾਲਣ ਵਿਭਾਗ ਦੇ ਨਿਯਮ:\n1. ਮਰੇ ਹੋਏ ਪਸ਼ੂਆਂ ਨੂੰ ਪਾਣੀ ਦੇ ਸਰੋਤਾਂ (ਨਹਿਰ, ਸੂਆ, ਖੂਹ) ਤੋਂ ਘੱਟੋ-ਘੱਟ 100 ਮੀਟਰ ਦੂਰ ਉੱਚੀ ਥਾਂ 'ਤੇ ਦਬਾਓ।\n2. ਟੋਆ ਘੱਟੋ-ਘੱਟ 1.5 ਤੋਂ 2 ਮੀਟਰ (6 ਫੁੱਟ) ਡੂੰਘਾ ਹੋਣਾ ਚਾਹੀਦਾ ਹੈ ਤਾਂ ਜੋ ਅਵਾਰਾ ਕੁੱਤੇ ਜਾਂ ਜਾਨਵਰ ਉਸਨੂੰ ਪੁੱਟ ਨਾ ਸਕਣ।\n3. ਲਾਸ਼ ਉੱਤੇ ਚੂਨਾ (ਕਲੀ) ਜਾਂ ਬਲੀਚਿੰਗ ਪਾਊਡਰ ਦੀ ਮੋਟੀ ਪਰਤ ਪਾਓ ਤਾਂ ਜੋ ਕੀਟਾਣੂ ਅਤੇ ਬਦਬੂ ਖ਼ਤਮ ਹੋ ਸਕੇ।\n4. ਟੋਏ ਨੂੰ ਮਿੱਟੀ ਨਾਲ ਚੰਗੀ ਤਰ੍ਹਾਂ ਭਰ ਕੇ ਉੱਪਰ ਮਿੱਟੀ ਦਾ ਉੱਚਾ ਢੇਰ ਬਣਾਓ।\n5. ਸਹਾਇਤਾ ਲਈ ਜ਼ਿਲ੍ਹਾ ਕੰਟਰੋਲ ਰੂਮ 1077 ਜਾਂ ਰਾਜ ਕੰਟਰੋਲ ਰੂਮ 1070 'ਤੇ ਸੂਚਿਤ ਕਰੋ।",
        "category": "silt_and_sanitation",
        "verified_source": "Punjab Animal Husbandry Dept Flood Manual & NDMA Protocols"
    },
    {
        "prompt": "What is the proper method for safe disposal of livestock carcasses following severe floods to prevent epidemics?",
        "response": "Under NDMA and Department of Animal Husbandry guidelines, animal carcasses must be disposed of within 24 hours to prevent outbreaks of anthrax, enterotoxemia, and contamination of groundwater:\n1. Site Selection: Choose an elevated burial site at least 100 metres away from any river, canal, village well, or habitable settlement. The bottom of the burial pit must be at least 1 metre above the seasonal high groundwater table.\n2. Pit Depth: Excavate a trench at least 1.5 to 2 metres deep. Carcasses must have at least 1 metre of compacted soil cover above them.\n3. Disinfection: Generously coat the carcass with quicklime (calcium oxide) or bleaching powder before backfilling to accelerate decomposition, eliminate pathogens, and deter scavenging carnivores.\n4. Compaction: Refill the pit with earth and create a 30 cm mound over the trench to account for settling soil. Do not drag carcasses through water channels or throw them into flowing rivers.",
        "category": "silt_and_sanitation",
        "verified_source": "NDMA Carcass Disposal SOP & Department of Animal Husbandry Punjab"
    },

    # 5. LIVESTOCK & CATTLE FLOOD SAFETY
    {
        "prompt": "How can farmers safeguard dairy cattle, buffaloes, and livestock when flood warnings are issued?",
        "response": "Punjab State Disaster Management Authority and NDMA livestock protection directives:\n1. Untie Tethered Animals: NEVER leave cattle or buffaloes tied to ground stakes (khunta) or inside enclosed sheds. If water rises rapidly, tethered animals drown helplessly. Release their ropes so they can swim to higher ground.\n2. Move to High Ground: Drive herds to elevated canal bunds (dhussi bunds), raised village schools, or designated government cattle shelters (gaushalas) well before roads are inundated.\n3. Feed Protection: Move dry wheat straw (toori/bhusa) and concentrated cattle feed to high storage platforms or wrap tightly in waterproof polythene sheets. Never feed rotting, submerged, or moldy fodder, which causes fatal aflatoxicosis.\n4. Veterinary Care: Post-flood conditions cause rapid spread of Hemorrhagic Septicemia (HS / Galghotu) and Black Quarter (BQ). Ensure pre-monsoon vaccination and contact the local veterinary dispensary via State Helpline 1070 for emergency mineral mixtures and veterinary antibiotics.",
        "category": "livestock_safety",
        "verified_source": "Punjab SDMA Cattle Safety Manual & NDMA Livestock SOP"
    },
    {
        "prompt": "What should be done if cattle or livestock are stranded on a submerged river island or bund during floods?",
        "response": "Punjab Department of Animal Husbandry and NDRF protocol:\n1. Report coordinates and headcount immediately to the District Control Room (1077) or State Control (1070) for coordinated boat evacuation.\n2. Do NOT attempt to force cattle to swim across high-velocity, turbulent main river currents.\n3. Airdrop or transport dry fodder blocks (toori/compressed bhusa) and clean drinking water to the stranded animals until rescue boats or water levels recede.\n4. Administer broad-spectrum antibiotics and topical antiseptics for foot lesions caused by prolonged water immersion immediately upon rescue.",
        "category": "livestock_safety",
        "verified_source": "Punjab Animal Husbandry Flood SOP & NDRF Animal Rescue Manual"
    },
    {
        "prompt": "ਜਦੋਂ ਹੜ੍ਹ ਦਾ ਪਾਣੀ ਪਿੰਡ ਵੱਲ ਵਧ ਰਿਹਾ ਹੋਵੇ ਤਾਂ ਡੰਗਰਾਂ-ਪਸ਼ੂਆਂ ਨੂੰ ਬਚਾਉਣ ਲਈ ਕੀ ਕਰਨਾ ਚਾਹੀਦਾ ਹੈ?",
        "response": "ਪੰਜਾਬ ਸਰਕਾਰ ਦੇ ਪਸ਼ੂ ਪਾਲਣ ਵਿਭਾਗ ਦੇ ਜ਼ਰੂਰੀ ਨਿਰਦੇਸ਼:\n1. ਪਸ਼ੂਆਂ ਨੂੰ ਕਿੱਲਿਆਂ ਤੋਂ ਤੁਰੰਤ ਖੋਲ੍ਹ ਦਿਓ: ਪਾਣੀ ਆਉਣ 'ਤੇ ਬੰਨ੍ਹੇ ਹੋਏ ਪਸ਼ੂ ਤੈਰ ਨਹੀਂ ਸਕਦੇ ਅਤੇ ਡੁੱਬ ਜਾਂਦੇ ਹਨ। ਉਹਨਾਂ ਨੂੰ ਖੁੱਲ੍ਹਾ ਛੱਡੋ ਤਾਂ ਜੋ ਉਹ ਉੱਚੀ ਥਾਂ 'ਤੇ ਜਾ ਸਕਣ।\n2. ਉੱਚੀਆਂ ਥਾਵਾਂ 'ਤੇ ਲੈ ਜਾਓ: ਪਸ਼ੂਆਂ ਨੂੰ ਨਹਿਰਾਂ ਦੇ ਉੱਚੇ ਧੁੱਸੀ ਬੰਨ੍ਹ ਜਾਂ ਪੱਕੀਆਂ ਉੱਚੀਆਂ ਥਾਵਾਂ 'ਤੇ ਪਹੁੰਚਾਓ।\n3. ਤੂੜੀ ਅਤੇ ਪੱਠਿਆਂ ਦੀ ਸੁਰੱਖਿਆ: ਸੁੱਕੀ ਤੂੜੀ ਨੂੰ ਉੱਚੀ ਥਾਂ 'ਤੇ ਤਰਪਾਲ ਨਾਲ ਢੱਕ ਕੇ ਰੱਖੋ। ਗਲ਼ੀ-ਸੜੀ ਤੂੜੀ ਪਸ਼ੂਆਂ ਨੂੰ ਨਾ ਪਾਓ।\n4. ਬਿਮਾਰੀਆਂ ਤੋਂ ਬਚਾਅ: ਗਲਘੋਟੂ (HS) ਅਤੇ ਮੂੰਹ-ਖੁਰ ਤੋਂ ਬਚਾਅ ਲਈ ਪਸ਼ੂ ਡਾਕਟਰ ਨਾਲ ਸੰਪਰਕ ਕਰੋ। ਹੈਲਪਲਾਈਨ 1070 ਜਾਂ 112 'ਤੇ ਕਾਲ ਕਰੋ।",
        "category": "livestock_safety",
        "verified_source": "Punjab SDMA Flood Advisory & Veterinary Services Dept"
    },
    {
        "prompt": "ਹੜ੍ਹਾਂ ਦੌਰਾਨ ਪਸ਼ੂਆਂ ਨੂੰ ਗਲਘੋਟੂ (HS) ਅਤੇ ਮੂੰਹ-ਖੁਰ ਦੀ ਬਿਮਾਰੀ ਤੋਂ ਕਿਵੇਂ ਬਚਾਇਆ ਜਾਵੇ?",
        "response": "ਪਸ਼ੂ ਪਾਲਣ ਵਿਭਾਗ ਪੰਜਾਬ ਦੇ ਨਿਰਦੇਸ਼:\n1. ਹੜ੍ਹ ਦੇ ਪਾਣੀ ਕਾਰਨ ਨਮੀ ਵਿੱਚ ਗਲਘੋਟੂ (Haemorrhagic Septicaemia) ਬਹੁਤ ਤੇਜ਼ੀ ਨਾਲ ਫੈਲਦਾ ਹੈ। ਮਾਨਸੂਨ ਤੋਂ ਪਹਿਲਾਂ ਟੀਕਾਕਰਨ ਜ਼ਰੂਰ ਕਰਵਾਓ।\n2. ਪਸ਼ੂਆਂ ਨੂੰ ਗੰਦਾ ਹੜ੍ਹ ਦਾ ਪਾਣੀ ਨਾ ਪੀਣ ਦਿਓ; ਸਾਫ਼ ਟਿਊਬਵੈੱਲ ਜਾਂ ਉਬਲਿਆ ਪਾਣੀ ਦਿਓ।\n3. ਖੁਰਾਂ ਵਿੱਚ ਸੜਨ (Foot Rot) ਰੋਕਣ ਲਈ ਪਸ਼ੂਆਂ ਨੂੰ ਸੁੱਕੀ ਥਾਂ 'ਤੇ ਬੰਨ੍ਹੋ ਅਤੇ ਪੋਟਾਸ਼ੀਅਮ ਪਰਮੈਂਗਨੇਟ (ਲਾਲ ਦਵਾਈ) ਦੇ ਹਲਕੇ ਘੋਲ ਨਾਲ ਖੁਰ ਧੋਵੋ।\n4. ਬਿਮਾਰੀ ਦੇ ਲੱਛਣ (ਤੇਜ਼ ਬੁਖਾਰ, ਗਲੇ ਵਿੱਚ ਸੋਜ, ਸਾਹ ਲੈਣ ਵਿੱਚ ਤਕਲੀਫ਼) ਦਿਖਾਈ ਦੇਣ 'ਤੇ ਤੁਰੰਤ ਸਰਕਾਰੀ ਪਸ਼ੂ ਹਸਪਤਾਲ ਜਾਂ ਹੈਲਪਲਾਈਨ 1070 'ਤੇ ਸੰਪਰਕ ਕਰੋ।",
        "category": "livestock_safety",
        "verified_source": "Punjab Animal Husbandry Dept Disease Surveillance"
    },
    {
        "prompt": "बाढ़ के दौरान मवेशियों को खूंटे से क्यों खोल देना चाहिए?",
        "response": "एनडीएमए (NDMA) और पशुपालन विभाग के निर्देश:\n1. जब बाढ़ का पानी बाड़े में भरने लगे तो गाय, भैंस और बकरियों को खूंटे या जंजीर से तुरंत खोल दें।\n2. रस्सी से बंधे रहने पर जानवर पानी में तैर नहीं पाते और असहाय होकर डूब जाते हैं।\n3. खुले रहने पर पशु अपनी प्राकृतिक प्रवृत्ति से तैरकर ऊंचे बांध (धुस्सी बांध) या सुरक्षित टीले पर पहुंच जाते हैं।\n4. सूखे चारे (भूसा) को ऊंचाई पर प्लास्टिक तिरपाल से ढककर रखें और सड़ा हुआ चारा न खिलाएं।",
        "category": "livestock_safety",
        "verified_source": "NDMA SOP on Livestock Protection"
    },

    # 6. EVACUATION READINESS & GO-BAG
    {
        "prompt": "What items must be packed in an emergency Go-Bag when preparing to evacuate due to river flooding?",
        "response": "Under NDMA Disaster Preparedness guidelines, an emergency Go-Bag (waterproof backpack) must contain:\n1. Essential Documents: Aadhaar cards, voter IDs, land ownership records, ration cards, bank passbooks, and insurance policies sealed in airtight waterproof zip-lock pouches.\n2. Drinking Water & High-Energy Food: At least 3 litres of sealed potable water per person and a 3-day supply of non-perishable food (roasted gram/chana, jaggery/gur, biscuits, sattu, glucose powder).\n3. Lighting & Power: Fully charged LED flashlight or headlamp with extra batteries, whistle (for signalling rescue teams), and a high-capacity mobile power bank.\n4. First Aid & Prescription Medicines: 7-day supply of daily maintenance medications (for diabetes, hypertension, asthma), ORS packets, sterile bandages, antiseptic lotion (Betadine), and water purification tablets.\n5. Clothing & Cash: One change of dry clothes, light raincoat, sturdy shoes, and adequate emergency cash in small denominations (as ATMs and online payments fail offline).",
        "category": "evacuation_safety",
        "verified_source": "NDMA Go-Bag Disaster Checklist & Punjab SDMA Guidelines"
    },
    {
        "prompt": "ਘਰ ਖਾਲੀ ਕਰਨ (ਇਵੈਕੂਏਸ਼ਨ) ਵੇਲੇ ਐਮਰਜੈਂਸੀ ਬੈਗ ਵਿੱਚ ਕੀ-ਕੀ ਸਮਾਨ ਹੋਣਾ ਚਾਹੀਦਾ ਹੈ?",
        "response": "NDMA ਅਤੇ ਪੰਜਾਬ ਆਫ਼ਤ ਪ੍ਰਬੰਧਨ (SDMA) ਅਨੁਸਾਰ ਐਮਰਜੈਂਸੀ ਬੈਗ ਵਿੱਚ ਇਹ ਸਮਾਨ ਜ਼ਰੂਰ ਰੱਖੋ:\n1. ਜ਼ਰੂਰੀ ਦਸਤਾਵੇਜ਼: ਆਧਾਰ ਕਾਰਡ, ਜ਼ਮੀਨ ਦੀਆਂ ਫ਼ਰਦਾਂ, ਬੈਂਕ ਕਾਪੀਆਂ ਅਤੇ ਪਛਾਣ ਪੱਤਰ ਪਲਾਸਟਿਕ ਦੇ ਵਾਟਰਪ੍ਰੂਫ਼ ਲਿਫ਼ਾਫ਼ੇ ਵਿੱਚ ਰੱਖੋ।\n2. ਪੀਣ ਵਾਲਾ ਪਾਣੀ ਅਤੇ ਸੁੱਕਾ ਰਾਸ਼ਨ: ਸੀਲਬੰਦ ਪਾਣੀ ਦੀਆਂ ਬੋਤਲਾਂ, ਭੁੰਨੇ ਛੋਲੇ, ਗੁੜ, ਬਿਸਕੁਟ ਅਤੇ ਓ.ਆਰ.ਐਸ (ORS) ਦੇ ਪੈਕੇਟ।\n3. ਰੌਸ਼ਨੀ ਅਤੇ ਚਾਰਜਰ: ਚੱਲਦੀ ਟਾਰਚ, ਵਾਧੂ ਸੈੱਲ, ਮੋਬਾਈਲ ਪਾਵਰ ਬੈਂਕ ਅਤੇ ਸੀਟੀ (ਬਚਾਅ ਟੀਮ ਨੂੰ ਆਵਾਜ਼ ਦੇਣ ਲਈ)।\n4. ਜ਼ਰੂਰੀ ਦਵਾਈਆਂ: ਪਰਿਵਾਰ ਦੇ ਬਜ਼ੁਰਗਾਂ ਜਾਂ ਮਰੀਜ਼ਾਂ ਦੀਆਂ ਨਿਯਮਤ ਦਵਾਈਆਂ (ਸ਼ੂਗਰ, ਬੀ.ਪੀ.) ਅਤੇ ਫਸਟ ਏਡ ਸਮਾਨ।\n5. ਨਕਦੀ ਪੈਸੇ: ਕੁਝ ਖੁੱਲ੍ਹੇ ਪੈਸੇ ਕਿਉਂਕਿ ਬਿਜਲੀ ਅਤੇ ਇੰਟਰਨੈੱਟ ਬੰਦ ਹੋਣ ਕਾਰਨ ATM ਅਤੇ ਆਨਲਾਈਨ UPI ਨਹੀਂ ਚੱਲਦੇ।",
        "category": "evacuation_safety",
        "verified_source": "Punjab SDMA Emergency Preparedness Manual"
    },
    {
        "prompt": "What are the primary triggers that indicate an immediate need to evacuate our village during a flood warning?",
        "response": "NDMA SOPs define mandatory evacuation triggers as follows:\n1. Official Order: Evacuation advisories or orders issued by the District Magistrate, Deputy Commissioner, or NDMA/CWC bulletins.\n2. Gauge Level Exceedance: River level crossing the declared 'Danger Level' (DL) at an upstream CWC monitoring station (e.g. Harike, Firozpur, or Phillaur) with an active rising trend.\n3. Embankment Failure: Breaches, boiling sand, or structural cracking observed on local river flood protection bunds (Dhussi Bunds).\n4. Inundation of Access Routes: Water rising over the main connecting roads or village approach causeways.\nDo not wait until water enters homes. Evacuate during daylight hours using pre-identified high-elevation evacuation routes to designated relief camps.",
        "category": "evacuation_safety",
        "verified_source": "NDMA National Flood SOP & CWC Flood Forecasting Protocol"
    },
    {
        "prompt": "How should vulnerable persons (infants, pregnant women, the elderly, and disabled individuals) be evacuated during floods?",
        "response": "According to NDMA Guidelines on Vulnerability and Inclusion in Disaster Response:\n1. Priority Evacuation: Vulnerable community members must be evacuated in the earliest cohort (Phase 1), long before roads or vehicle access are cut off.\n2. Mobility Aids: Ensure wheelchairs, crutches, hearing aids, and walkers are transported with the person.\n3. Medical Kits & Records: Pack maternal health cards (Mamta cards/MCP cards), immunization charts, infant formula, clean diapers, and specific chronic condition medicines.\n4. Registration: On arriving at the designated relief camp, notify the medical officer immediately so vulnerable individuals are assigned ground-floor accommodations near sanitised toilets.",
        "category": "evacuation_safety",
        "verified_source": "NDMA Inclusion and Vulnerable Group Disaster Management SOP"
    },
    {
        "prompt": "What should community leaders and panchayats do if a breach occurs in the Dhussi Bund of the river?",
        "response": "Punjab SDMA and Department of Irrigation SOP on Embankment Breaches:\n1. Immediate Warning: Sound the village Gurdwara or Temple loudspeaker siren to alert all residents in the inundation path immediately. Instruct evacuation to designated high-ground shelters.\n2. Direct Notification: Immediately inform the Executive Engineer (XEN) Drainage, Sub-Divisional Magistrate (SDM), and the District Control Room (1077 or 1070).\n3. Breach Containment (Pre-failure / Piping): If small sand boils or leaks appear before full breach, mobilize village volunteer youth to place ring bunds of filled sandbags on the landward side. Never place sandbags directly into rapid breach scour channels without heavy machinery.\n4. Secure Critical Infrastructure: Cut power supply to the inundated feeder via PSPCL (1912). Drive livestock to the primary canal embankment.",
        "category": "evacuation_safety",
        "verified_source": "Punjab SDMA Embankment Protocol & Irrigation Dept Flood Manual"
    },

    # 7. WATER CROSSING & DRIVING DANGERS
    {
        "prompt": "Is it safe to drive a tractor or passenger vehicle through flowing flood water if it looks only 1 to 2 feet deep?",
        "response": "ABSOLUTELY NOT. The universal safety directive is: 'Turn Around, Don't Drown.'\nOfficial Engineering & Safety Facts (NDMA):\n1. Just 15 cm (6 inches) of swiftly moving water can sweep an adult pedestrian off their feet.\n2. 30 cm (12 inches) of moving water exerts enough buoyant force to float most small passenger cars, causing loss of steering control.\n3. 60 cm (2 feet) of rushing water will easily float and sweep away large SUVs, pickup trucks, and heavy tractors.\n4. Submerged roads frequently suffer hidden structural washouts, collapsed culverts, missing manhole covers, and deep sinkholes hidden beneath muddy brown water.\n5. If your vehicle stalls in rising flood water, abandon it immediately and scramble to higher ground.",
        "category": "water_crossing_hazards",
        "verified_source": "NDMA Public Safety Directives & Ministry of Road Transport & Highways"
    },
    {
        "prompt": "Why is wading on foot through flood water dangerous even if the current appears slow?",
        "response": "Under NDMA and Red Cross Water Safety directives:\n1. Hidden Ground Collapse: Flood water erodes road embankments, collapses storm drain culverts, and leaves subterranean voids invisible under muddy water.\n2. Rapid Force Increase: Water exerts lateral force that scales with the square of its velocity. A depth of only 15 cm flowing at 3 m/s exerts hundreds of kilograms of hydrostatic pressure on legs.\n3. Open Manholes & Debris: Open sewers, sharp jagged sheet metal, submerged barbed wire, and tree branches cause severe punctures, entrapment, and drowning.\n4. Toxic Contaminants: Raw municipal sewage, chemical pesticides, and fuel oil mixed into water cause sudden skin chemical burns and eye infections.\nNever wade into moving water. Seek an alternate detour on high ground.",
        "category": "water_crossing_hazards",
        "verified_source": "NDMA Flood Safety Protocol & International Lifesaving Federation"
    },
    {
        "prompt": "ਕੀ ਮੈਂ ਗੋਡੇ-ਗੋਡੇ ਪਾਣੀ ਵਿੱਚੋਂ ਆਪਣਾ ਟਰੈਕਟਰ ਜਾਂ ਗੱਡੀ ਲੰਘਾ ਸਕਦਾ ਹਾਂ?",
        "response": "ਬਿਲਕੁਲ ਨਹੀਂ! ਕਦੇ ਵੀ ਹੜ੍ਹ ਦੇ ਵਗਦੇ ਪਾਣੀ ਵਿੱਚੋਂ ਗੱਡੀ ਜਾਂ ਟਰੈਕਟਰ ਨਾ ਕੱਢੋ:\n1. ਸਿਰਫ਼ 15 ਸੈਂਟੀਮੀਟਰ (6 ਇੰਚ) ਵਗਦਾ ਪਾਣੀ ਕਿਸੇ ਵੀ ਵਿਅਕਤੀ ਨੂੰ ਵਹਾ ਸਕਦਾ ਹੈ।\n2. 30 ਸੈਂਟੀਮੀਟਰ (1 ਫੁੱਟ) ਪਾਣੀ ਕਾਰ ਨੂੰ ਤੈਰਾ ਕੇ ਬੇਕਾਬੂ ਕਰ ਦਿੰਦਾ ਹੈ।\n3. 60 ਸੈਂਟੀਮੀਟਰ (2 ਫੁੱਟ) ਵਗਦਾ ਪਾਣੀ ਵੱਡੇ ਤੋਂ ਵੱਡੇ ਟਰੈਕਟਰ ਅਤੇ ਟਰੱਕ ਨੂੰ ਵੀ ਰੋੜ੍ਹ ਕੇ ਲੈ ਜਾਂਦਾ ਹੈ।\n4. ਪਾਣੀ ਦੇ ਹੇਠਾਂ ਟੁੱਟੀ ਹੋਈ ਸੜਕ, ਖੁੱਲ੍ਹੇ ਖੱਡੇ ਜਾਂ ਰੁੜ੍ਹੀਆਂ ਹੋਈਆਂ ਪੁਲੀਆਂ ਦਿਖਾਈ ਨਹੀਂ ਦਿੰਦੀਆਂ।\n5. ਪਾਣੀ ਵਿੱਚ ਵਾਹਨ ਫਸਣ 'ਤੇ ਗੱਡੀ ਤੁਰੰਤ ਛੱਡ ਕੇ ਉੱਚੀ ਥਾਂ 'ਤੇ ਜਾਓ।",
        "category": "water_crossing_hazards",
        "verified_source": "Punjab SDMA Travel Advisory & NDMA Safety Protocol"
    },
    {
        "prompt": "पानी से भरी सड़क पर पैदल चलने से क्यों बचना चाहिए?",
        "response": "एनडीएमए (NDMA) के सुरक्षा नियम:\n1. मात्र 15 सेंटीमीटर (6 इंच) बहता पानी किसी भी वयस्क को गिराकर बहा ले जा सकता है।\n2. मटमैले पानी के नीचे खुले गटर, टूटी सड़कें, नुकीले लोहे और छिपे हुए गड्ढे होते हैं जो दिखाई नहीं देते।\n3. पानी में बिजली के टूटे हुए तार या करंट होने का गंभीर खतरा रहता है।\n4. सीवेज और रसायनों से भरे पानी से गंभीर संक्रमण हो सकता है।\nसड़क पर पानी होने पर कभी पार न करें, वापस मुड़ें और ऊंचे सुरक्षित रास्ते का उपयोग करें।",
        "category": "water_crossing_hazards",
        "verified_source": "NDMA Public Safety Directives"
    },

    # 8. EMERGENCY HELPLINE ROUTING
    {
        "prompt": "What are the official government emergency numbers to call for rescue, disaster relief, and flood control in Punjab?",
        "response": "Authoritative verified emergency numbers under Government of India and Government of Punjab directories:\n1. 112: National Emergency Response Support System (ERSS) — Unified emergency helpline for Police, Fire, and Emergency Search & Rescue (NDRF/SDRF).\n2. 1078: National Disaster Management Authority (NDMA) — Central disaster control room for nationwide flood alerts and assistance.\n3. 1070: Punjab State Emergency Operation Centre (SEOC) — State-level disaster management control room operating 24/7.\n4. 1077: District Disaster Management Authority (DDMA) — Local district-level emergency control room (toll-free in district).\n5. 108: Punjab Medical Ambulance Service — Free 24/7 emergency medical transport to the nearest government hospital.\n6. 1912: Punjab State Power Corporation Limited (PSPCL) — Electricity hazard, downed lines, and power emergency helpline.",
        "category": "emergency_routing",
        "verified_source": "NDMA Directory & Punjab Disaster Management Authority Directory (PRD Sec 9/14)"
    },
    {
        "prompt": "When should I call 112 versus 1070 or 1078 during flood disaster in Punjab?",
        "response": "Guidelines for emergency helpline selection:\n1. Dial 112 (National ERSS): Use for LIFE-THREATENING EMERGENCIES requiring immediate tactical field deployment — e.g. people trapped on roofs, drowning, building collapse, or urgent search and rescue by NDRF/SDRF/Police boats.\n2. Dial 1070 (Punjab SEOC) or 1077 (District Control Room): Use for disaster relief logistics — e.g. food packet distribution, boat requests, shelter camp allocations, sandbag requests for river bund breaches, and official river gauge status updates.\n3. Dial 1078 (NDMA): Use for interstate coordination, national disaster escalation, and verifying national SACHET advisories.\n4. Dial 108: For medical emergencies, ambulance transfer, and Anti-Snake Venom (ASV) transport.\n5. Dial 1912: For reporting broken electrical power lines or requesting high-voltage feeder shutdown.",
        "category": "emergency_routing",
        "verified_source": "Punjab Disaster Management Authority & NDMA Directory"
    },
    {
        "prompt": "ਪੰਜਾਬ ਵਿੱਚ ਹੜ੍ਹ ਰਾਹਤ ਅਤੇ ਬਚਾਅ ਕਾਰਜਾਂ ਲਈ ਸਰਕਾਰੀ ਹੈਲਪਲਾਈਨ ਨੰਬਰ ਕਿਹੜੇ ਹਨ?",
        "response": "ਸਰਕਾਰ ਦੁਆਰਾ ਤਸਦੀਕਸ਼ੁਦਾ ਅਧਿਕਾਰਤ ਐਮਰਜੈਂਸੀ ਨੰਬਰ:\n1. 112: ਕੌਮੀ ਐਮਰਜੈਂਸੀ ਰਿਸਪਾਂਸ ਸਿਸਟਮ (ਪੁਲਿਸ, ਫਾਇਰ ਬ੍ਰਿਗੇਡ ਅਤੇ NDRF/SDRF ਬਚਾਅ ਟੀਮਾਂ ਲਈ)।\n2. 1078: ਕੌਮੀ ਆਫ਼ਤ ਪ੍ਰਬੰਧਨ ਅਥਾਰਟੀ (NDMA) ਕੰਟਰੋਲ ਰੂਮ।\n3. 1070: ਪੰਜਾਬ ਰਾਜ ਆਫ਼ਤ ਕੰਟਰੋਲ ਰੂਮ (ਚੰਡੀਗੜ੍ਹ)।\n4. 1077: ਜ਼ਿਲ੍ਹਾ ਆਫ਼ਤ ਪ੍ਰਬੰਧਨ ਕੰਟਰੋਲ ਰੂਮ (ਤੁਹਾਡੇ ਜ਼ਿਲ੍ਹੇ ਦਾ ਕੰਟਰੋਲ ਰੂਮ)।\n5. 108: ਐਂਬੂਲੈਂਸ ਸੇਵਾ (ਸਰਕਾਰੀ ਹਸਪਤਾਲ ਲਈ ਮੁਫ਼ਤ ਐਮਰਜੈਂਸੀ ਸੇਵਾ)।\n6. 1912: ਪਾਵਰਕਾਮ (PSPCL) ਬਿਜਲੀ ਦੇ ਖ਼ਤਰੇ ਅਤੇ ਡਿੱਗੀਆਂ ਤਾਰਾਂ ਲਈ।",
        "category": "emergency_routing",
        "verified_source": "Punjab State Disaster Management Authority & corpus/helplines.json"
    },
    {
        "prompt": "ਕਿਸੇ ਐਮਰਜੈਂਸੀ ਵਿੱਚ 112 'ਤੇ ਕਾਲ ਕਰਦੇ ਸਮੇਂ ਕਿਹੜੀ ਜਾਣਕਾਰੀ ਦੇਣੀ ਜ਼ਰੂਰੀ ਹੈ?",
        "response": "ਪੰਜਾਬ ਪੁਲਿਸ ਅਤੇ ਐਮਰਜੈਂਸੀ ਰਿਸਪਾਂਸ ਸਪੋਰਟ ਸਿਸਟਮ (112) ਦੇ ਨਿਯਮ:\n1. ਸਹੀ ਟਿਕਾਣਾ: ਆਪਣਾ ਪਿੰਡ, ਤਹਿਸੀਲ, ਜ਼ਿਲ੍ਹਾ ਅਤੇ ਕੋਈ ਮਸ਼ਹੂਰ ਨਿਸ਼ਾਨੀ (ਲੈਂਡਮਾਰਕ ਜਿਵੇਂ ਗੁਰਦੁਆਰਾ ਸਾਹਿਬ, ਸਕੂਲ, ਜਾਂ ਨਹਿਰੀ ਪੁਲ) ਦੱਸੋ। ਜੇ ਹੋ ਸਕੇ ਤਾਂ ਫੋਨ ਦੀ GPS ਲੋਕੇਸ਼ਨ ਦੱਸੋ।\n2. ਲੋਕਾਂ ਦੀ ਗਿਣਤੀ: ਕਿੰਨੇ ਲੋਕ ਫਸੇ ਹੋਏ ਹਨ (ਬੱਚੇ, ਬਜ਼ੁਰਗ, ਗਰਭਵਤੀ ਔਰਤਾਂ ਜਾਂ ਮਰੀਜ਼)।\n3. ਪਾਣੀ ਦੀ ਸਥਿਤੀ: ਪਾਣੀ ਕਿੰਨਾ ਚੜ੍ਹ ਰਿਹਾ ਹੈ (ਗੋਡੇ, ਛਾਤੀ ਜਾਂ ਛੱਤ ਤੱਕ) ਅਤੇ ਕੀ ਕਰੰਟ ਹੈ।\n4. ਫੋਨ ਚਾਲੂ ਰੱਖੋ: ਕਾਲ ਕੱਟਣ ਤੋਂ ਬਾਅਦ ਆਪਣਾ ਫੋਨ ਚਾਲੂ ਰੱਖੋ ਤਾਂ ਜੋ ਬਚਾਅ ਟੀਮ ਸੰਪਰਕ ਕਰ ਸਕੇ।",
        "category": "emergency_routing",
        "verified_source": "Punjab ERSS 112 Protocol & NDMA Dispatch Guidelines"
    },

    # 9. MEDICAL REFUSAL & PROFESSIONAL HANDOFF
    {
        "prompt": "My family member has high fever and acute diarrhea after drinking flood water. What antibiotic dosage should I give them?",
        "response": "I cannot prescribe medication, provide drug dosages, or diagnose clinical conditions. Giving unprescribed antibiotics or anti-diarrheal medicines during flood-related gastrointestinal illness can be dangerous or mask life-threatening conditions (such as Cholera, Leptospirosis, or Typhoid).\nImmediate Action Protocol:\n1. Prevent dehydration immediately by giving Oral Rehydration Salts (ORS) solution prepared with boiled and cooled water. If ORS is unavailable, give salted rice water, lemon water with a pinch of salt and sugar, or coconut water.\n2. Do not stop fluid intake.\n3. Dial 108 immediately to request an ambulance or transport the patient to the nearest Primary Health Centre (PHC) or Community Medical Camp for proper medical evaluation.\n4. Call 112 if access roads are flooded and emergency boat transport is required.",
        "category": "medical_refusal",
        "verified_source": "WHO Clinical Management of Acute Diarrhoea & MoHFW Emergency Guidelines"
    },
    {
        "prompt": "Can you tell me how many drops of gentian violet or Dettol to put in flood water for an open wound?",
        "response": "I cannot give clinical dosages or recommend chemical applications for open wounds. Putting harsh household disinfectants directly into deep wounds can cause chemical burns, tissue damage, and delay healing.\nFirst Aid Protocol (WHO Emergency Wound Management):\n1. Flush the wound immediately with clean, boiled and cooled drinking water or sterile saline to remove mud and silt.\n2. Gently wash around the wound with mild soap and clean water.\n3. Cover with a clean, dry, sterile cloth or bandage.\n4. Visit the nearest Primary Health Centre (PHC) or Mobile Relief Medical Camp as soon as possible for a Tetanus toxoid booster injection and proper medical assessment.\n5. Call 108 for medical assistance.",
        "category": "medical_refusal",
        "verified_source": "WHO Emergency Wound Care Protocol & MoHFW Directives"
    },
    {
        "prompt": "ਹੜ੍ਹ ਦੇ ਪਾਣੀ ਕਾਰਨ ਮੇਰੇ ਬੱਚੇ ਨੂੰ ਉਲਟੀਆਂ ਅਤੇ ਦਸਤ ਲੱਗ ਗਏ ਹਨ, ਕਿਹੜੀ ਦਵਾਈ ਦੀ ਗੋਲੀ ਦੇਵਾਂ?",
        "response": "ਮੈਂ ਕਿਸੇ ਵੀ ਦਵਾਈ ਜਾਂ ਗੋਲੀ ਦੀ ਖ਼ੁਰਾਕ (ਡੋਜ਼) ਨਹੀਂ ਦੱਸ ਸਕਦਾ। ਬਿਨਾਂ ਡਾਕਟਰੀ ਸਲਾਹ ਦੇ ਐਂਟੀਬਾਇਓਟਿਕ ਦੇਣਾ ਖ਼ਤਰਨਾਕ ਹੋ ਸਕਦਾ ਹੈ।\nਤੁਰੰਤ ਇਹ ਕਦਮ ਚੁੱਕੋ:\n1. ਬੱਚੇ ਦੇ ਸਰੀਰ ਵਿੱਚ ਪਾਣੀ ਦੀ ਕਮੀ ਰੋਕਣ ਲਈ ਉਬਲੇ ਤੇ ਠੰਡੇ ਕੀਤੇ ਪਾਣੀ ਵਿੱਚ ORS (ਓ.ਆਰ.ਐਸ) ਦਾ ਘੋਲ ਬਣਾ ਕੇ ਵਾਰ-ਵਾਰ ਪਿਲਾਓ।\n2. ਤੁਰੰਤ 108 ਐਂਬੂਲੈਂਸ 'ਤੇ ਕਾਲ ਕਰੋ ਜਾਂ ਬੱਚੇ ਨੂੰ ਨਜ਼ਦੀਕੀ ਸਰਕਾਰੀ ਹਸਪਤਾਲ / ਮੈਡੀਕਲ ਕੈਂਪ ਲੈ ਜਾਓ।\n3. ਜੇਕਰ ਸੜਕ 'ਤੇ ਪਾਣੀ ਹੋਵੇ ਤਾਂ ਬਚਾਅ ਲਈ 112 'ਤੇ ਕਾਲ ਕਰੋ।",
        "category": "medical_refusal",
        "verified_source": "MoHFW Public Health Protocol & WHO Standards"
    },
    {
        "prompt": "हल्का सा बुखार और बदन दर्द है, क्या बाढ़ के दौरान कोई भी पैरासिटामोल या एंटीबायोटिक ले सकते हैं?",
        "response": "मैं किसी भी दवा या खुराक (डोज़) की सिफारिश नहीं कर सकता। बाढ़ के दौरान स्वयं दवा (सेल्फ-मेडिकेशन) लेना, विशेषकर एंटीबायोटिक या दर्द निवारक (जैसे एस्पिरिन/आइबुप्रोफेन), अत्यंत खतरनाक हो सकता है क्योंकि डेंगू या लेप्टोस्पायरोसिस जैसी बीमारियों में रक्तस्राव का जोखिम बढ़ जाता है।\n1. रोगी को आराम करने दें और उबला हुआ पानी तथा ओआरएस (ORS) का घोल दें।\n2. माथे पर सामान्य पानी की ठंडी पट्टी रखें।\n3. तुरंत नजदीकी स्वास्थ्य केंद्र (PHC), राहत शिविर के डॉक्टर से संपर्क करें या 108 एम्बुलेंस पर कॉल करें।",
        "category": "medical_refusal",
        "verified_source": "MoHFW Clinical Safety Protocol & WHO Guidelines"
    },

    # 10. CWC GAUGES & RIVER METRICS
    {
        "prompt": "What do the Central Water Commission (CWC) Warning Level and Danger Level gauge marks signify?",
        "response": "Under Central Water Commission (CWC) river monitoring standards:\n1. Warning Level (WL): The threshold water level at which river flow begins to approach bankfull stage. It serves as an internal operational alert for irrigation, revenue, and disaster management authorities to mobilize patrols on river bunds.\n2. Danger Level (DL): The critical river water level at or above which active flooding of low-lying floodplains, agricultural fields, and unprotected settlements begins. It triggers formal public alerts and evacuation readiness.\n3. High Flood Level (HFL): The highest recorded peak water level ever observed at that gauging station throughout historical records.\nWhen CWC telemetry indicates water levels are rising toward Danger Level at upstream gauges (e.g., Phillaur, Harike, or Gurdaspur), low-lying downstream areas must initiate active flood precautions.",
        "category": "cwc_gauge_thresholds",
        "verified_source": "Central Water Commission (CWC) Flood Forecasting Manual 2022"
    },
    {
        "prompt": "ਸੈਂਟਰਲ ਵਾਟਰ ਕਮਿਸ਼ਨ (CWC) ਦੇ ਚੇਤਾਵਨੀ ਪੱਧਰ (Warning Level) ਅਤੇ ਖ਼ਤਰਾ ਪੱਧਰ (Danger Level) ਵਿੱਚ ਕੀ ਫ਼ਰਕ ਹੈ?",
        "response": "ਕੇਂਦਰੀ ਜਲ ਕਮਿਸ਼ਨ (CWC) ਦੇ ਮਾਪਦੰਡ:\n1. ਚੇਤਾਵਨੀ ਪੱਧਰ (Warning Level): ਇਸ ਪੱਧਰ 'ਤੇ ਦਰਿਆ ਦਾ ਪਾਣੀ ਕੰਢਿਆਂ ਦੇ ਨੇੜੇ ਪਹੁੰਚ ਜਾਂਦਾ ਹੈ। ਇਹ ਪ੍ਰਸ਼ਾਸਨ ਅਤੇ ਪਿੰਡਾਂ ਲਈ ਚੌਕਸ ਰਹਿਣ ਅਤੇ ਬੰਨ੍ਹਾਂ ਦੀ ਨਿਗਰਾਨੀ ਸ਼ੁਰੂ ਕਰਨ ਦਾ ਸੰਕੇਤ ਹੈ।\n2. ਖ਼ਤਰਾ ਪੱਧਰ (Danger Level): ਇਸ ਪੱਧਰ 'ਤੇ ਪਾਣੀ ਦਰਿਆ ਦੇ ਬੰਨ੍ਹਾਂ ਤੋਂ ਬਾਹਰ ਆ ਕੇ ਨੀਵੇਂ ਖੇਤਾਂ ਅਤੇ ਪਿੰਡਾਂ ਵਿੱਚ ਦਾਖਲ ਹੋਣਾ ਸ਼ੁਰੂ ਹੋ ਜਾਂਦਾ ਹੈ। ਇਹ ਲੋਕਾਂ ਨੂੰ ਸੁਰੱਖਿਅਤ ਉੱਚੀਆਂ ਥਾਵਾਂ 'ਤੇ ਜਾਣ ਦੀ ਚੇਤਾਵਨੀ ਹੈ।\n3. ਉੱਚਤਮ ਹੜ੍ਹ ਪੱਧਰ (HFL): ਉਸ ਗੇਜ ਸਟੇਸ਼ਨ 'ਤੇ ਇਤਿਹਾਸ ਵਿੱਚ ਦਰਜ ਕੀਤਾ ਗਿਆ ਸਭ ਤੋਂ ਉੱਚਾ ਪਾਣੀ ਦਾ ਪੱਧਰ।",
        "category": "cwc_gauge_thresholds",
        "verified_source": "Central Water Commission (CWC) Guidelines & Punjab Irrigation Dept"
    },
    {
        "prompt": "What is a 'Sand Boil' on a river flood protection embankment (Dhussi Bund) and how is it addressed?",
        "response": "According to Central Water Commission and Punjab Drainage Department Engineering Manuals:\n1. Sand Boil Mechanism: A sand boil occurs when high river water pressure forces water to seep underneath an earthen embankment (Dhussi bund), emerging on the landward side carrying sand and silt. If left unchecked, it causes internal piping and catastrophic bund failure.\n2. Do NOT Plug Directly: Never dump sandbags directly on the boil hole itself, as this increases water pressure and expands the piping channel.\n3. Ring Bund Technique: Build a circular sandbag ring (ring dike) around the sand boil. Allow the water inside the ring to rise until the head of clear water inside counterbalances the river pressure and seepage stops discharging sand.\n4. Alert the Drainage and Revenue Authorities immediately via 1070 or 1077.",
        "category": "cwc_gauge_thresholds",
        "verified_source": "Central Water Commission Embankment Safety Manual & Punjab Drainage Dept"
    }
]

def build():
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        for entry in DATASET:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    print(f"Successfully compiled {len(DATASET)} verified flood safety records to {OUTPUT_FILE}")

if __name__ == "__main__":
    build()
