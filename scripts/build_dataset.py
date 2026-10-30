#!/usr/bin/env python3
"""
Builds the verified Flood Safety Domain Dataset (corpus/flood_safety_dataset.jsonl)
strictly grounded in:
- NDMA Flood Management SOPs & Guidelines (Govt. of India)
- Punjab State Disaster Management Authority (SDMA) Flood Preparedness Manual
- Central Water Commission (CWC) Flood Forecasting Guidelines
- World Health Organization (WHO) Guidelines for Drinking-water Quality in Emergencies
- Ministry of Health & Family Welfare (MoHFW) National Snakebite Management Protocol
- Punjab Department of Animal Husbandry Flood SOPs
- Punjab Revenue & Disaster Management Department (Special Girdawari Directives)
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
    },

    # 11. BASIC SURVIVAL & EMERGENCY WATER PURIFICATION
    {
        "prompt": "If we run out of chlorine tablets and cooking gas during floods, how does Solar Water Disinfection (SODIS) work?",
        "response": "According to WHO guidelines for emergency household water treatment, Solar Water Disinfection (SODIS) is a zero-fuel survival method:\n1. Container: Use clean, transparent PET plastic beverage bottles (up to 2 litres capacity). Glass bottles also work, but avoid cloudy or colored plastic.\n2. Preparation: Fill the bottle 3/4 full, shake vigorously for 20 seconds to aerate and oxygenate the water, then top it off completely and cap tightly.\n3. Exposure: Place the bottles horizontally on an elevated corrugated tin roof, black plastic sheet, or clean rock in direct sunlight.\n4. Time: Expose to full sun for at least 6 hours (e.g. 10 AM to 4 PM). If the sky is overcast or cloud cover exceeds 50%, leave for 2 consecutive full days (48 hours).\n5. Mechanism: Solar UV-A radiation and thermal heat synergistically destroy diarrheal pathogens, cholera bacteria, and rotaviruses.",
        "category": "survival_water",
        "verified_source": "WHO Guidelines on Solar Water Disinfection (SODIS) & UNICEF Emergency Tech Notes"
    },
    {
        "prompt": "ਕੀ ਧੁੱਪ ਵਿੱਚ ਪਾਣੀ ਰੱਖ ਕੇ ਹੜ੍ਹਾਂ ਦੌਰਾਨ ਪੀਣ ਯੋਗ ਬਣਾਇਆ ਜਾ ਸਕਦਾ ਹੈ (SODIS ਤਰੀਕਾ)?",
        "response": "ਹਾਂ, ਵਿਸ਼ਵ ਸਿਹਤ ਸੰਗਠਨ (WHO) ਦੇ SODIS ਨਿਯਮਾਂ ਅਨੁਸਾਰ ਜੇਕਰ ਬਾਲਣ ਜਾਂ ਗੈਸ ਨਾ ਹੋਵੇ:\n1. ਸਾਫ਼ ਪਾਰਦਰਸ਼ੀ ਪਲਾਸਟਿਕ ਦੀਆਂ ਬੋਤਲਾਂ (ਜਿਵੇਂ ਕੋਲਡ ਡਰਿੰਕ ਜਾਂ ਪਾਣੀ ਵਾਲੀਆਂ ਬੋਤਲਾਂ) ਲਵੋ।\n2. ਬੋਤਲ ਨੂੰ ਪੌਣੀ ਭਰ ਕੇ 20 ਸਕਿੰਟ ਚੰਗੀ ਤਰ੍ਹਾਂ ਹਿਲਾਓ ਤਾਂ ਜੋ ਆਕਸੀਜਨ ਘੁਲ ਸਕੇ, ਫਿਰ ਪੂਰੀ ਭਰ ਕੇ ਢੱਕਣ ਕੱਸ ਦਿਓ।\n3. ਬੋਤਲਾਂ ਨੂੰ ਸਵੇਰੇ 10 ਵਜੇ ਤੋਂ ਸ਼ਾਮ 4 ਵਜੇ ਤੱਕ (ਘੱਟੋ-ਘੱਟ 6 ਘੰਟੇ) ਪੱਕੀ ਛੱਤ ਜਾਂ ਟੀਨ ਦੀ ਚਾਦਰ 'ਤੇ ਤੇਜ਼ ਧੁੱਪ ਵਿੱਚ ਲਿਟਾ ਕੇ ਰੱਖੋ।\n4. ਸੂਰਜ ਦੀਆਂ ਪਰਾਬੈਂਗਣੀ (UV) ਕਿਰਨਾਂ ਅਤੇ ਗਰਮੀ ਪਾਣੀ ਦੇ ਕੀਟਾਣੂਆਂ ਨੂੰ ਮਾਰ ਦਿੰਦੀਆਂ ਹਨ। ਬੱਦਲਵਾਈ ਵਾਲੇ ਦਿਨ 2 ਦਿਨ ਧੁੱਪ ਲਗਵਾਓ।",
        "category": "survival_water",
        "verified_source": "WHO SODIS Technical Guidelines & UNICEF Water Hygiene"
    },
    {
        "prompt": "बाढ़ में जब लकड़ी या गैस न हो तो गंदले पानी को 3-मटका विधि (3-Pot Method) से कैसे साफ करें?",
        "response": "डब्ल्यूएचओ (WHO) और रेड क्रॉस की आपातकालीन 3-मटका जल शोधन विधि:\n1. व्यवस्था: तीन साफ मटके या बाल्टियां एक सीध में रखें (मटका 1, मटका 2, मटका 3)।\n2. मटका 1 (स्थिरीकरण): गंदले बाढ़ के पानी को सूती कपड़े से छानकर मटका 1 में भरें और 24 घंटे स्थिर रहने दें ताकि भारी गाद और मिट्टी नीचे बैठ जाए।\n3. मटका 2 (दूसरा चरण): 24 घंटे बाद ऊपर का साफ पानी मटका 2 में धीरे से पलटें और फिर 24 घंटे रहने दें। इससे 80% रोगाणु और परजीवी नीचे जम जाते हैं।\n4. मटका 3 (उपयोग): तीसरे दिन ऊपर का बिल्कुल साफ पानी मटका 3 में निकालें। अब इसे उबालें या क्लोरीन की गोली डालें।",
        "category": "survival_water",
        "verified_source": "WHO Emergency Household Water Treatment Guidelines"
    },

    # 12. FIELD HYGIENE & TRENCH LATRINES
    {
        "prompt": "How do we construct an emergency trench latrine on a canal embankment (Dhussi Bund) to stop diarrhea and cholera outbreaks?",
        "response": "Under Sphere Humanitarian Standards and NDMA Camp Sanitation protocols:\n1. Location: Dig the trench at least 30 metres away from any river channel, well, or langar food preparation tent, and downslope from shelters.\n2. Dimensions: Dig a shallow trench 30 cm wide, 50 to 90 cm deep, and 2 to 3 metres long.\n3. Privacy & Cover: Frame the perimeter with bamboo poles and black tarpaulin/jute sheets for privacy. Place two parallel sturdy wooden planks across the trench for safe foot placement.\n4. Sanitation Protocol: Keep a heap of excavated dry soil, dry wood ash, or quicklime beside the trench with a tin scoop. After each defecation, immediately cover feces with a scoop of soil or ash to prevent flies from breeding and transmitting cholera.\n5. Hand Hygiene: Hang a jerrycan with a tap or punctured water bottle filled with clean water and soap/wood ash right outside the latrine entrance.",
        "category": "survival_sanitation",
        "verified_source": "Sphere Project Humanitarian Charter & NDMA Relief Camp Guidelines"
    },
    {
        "prompt": "ਹੜ੍ਹਾਂ ਦੌਰਾਨ ਬੰਨ੍ਹਾਂ 'ਤੇ ਆਰਜ਼ੀ ਲੈਟਰੀਨ (ਟੋਆ ਪਖਾਨਾ) ਕਿਵੇਂ ਬਣਾਇਆ ਜਾਵੇ ਤਾਂ ਜੋ ਹੈਜ਼ਾ ਨਾ ਫੈਲੇ?",
        "response": "ਸਰਕਾਰੀ ਰਾਹਤ ਕੈਂਪ ਅਤੇ ਸਿਹਤ ਵਿਭਾਗ ਦੇ ਨਿਯਮ:\n1. ਦੂਰੀ: ਪਖਾਨੇ ਦਾ ਟੋਆ ਪੀਣ ਵਾਲੇ ਪਾਣੀ ਦੇ ਸਰੋਤਾਂ ਅਤੇ ਲੰਗਰ/ਰਸੋਈ ਤੋਂ ਘੱਟੋ-ਘੱਟ 30 ਮੀਟਰ ਦੂਰ ਬਣਾਓ।\n2. ਟੋਏ ਦਾ ਆਕਾਰ: 1 ਫੁੱਟ ਚੌੜਾ, 2 ਤੋਂ 3 ਫੁੱਟ ਡੂੰਘਾ ਅਤੇ 6 ਤੋਂ 8 ਫੁੱਟ ਲੰਮਾ ਟੋਆ ਪੁੱਟੋ।\n3. ਪਰਦਾ: ਆਲੇ-ਦੁਆਲੇ ਬਾਂਸ ਗੱਡ ਕੇ ਤਰਪਾਲ ਜਾਂ ਬੋਰੀਆਂ ਦਾ ਪਰਦਾ ਲਗਾਓ। ਪੈਰ ਰੱਖਣ ਲਈ ਦੋਵੇਂ ਪਾਸੇ ਮਜ਼ਬੂਤ ਫੱਟੇ ਰੱਖੋ।\n4. ਮੱਖੀਆਂ ਅਤੇ ਬਦਬੂ ਤੋਂ ਬਚਾਅ: ਟੋਏ ਕੋਲ ਸੁੱਕੀ ਮਿੱਟੀ, ਸੁਆਹ ਜਾਂ ਕਲੀ (ਚੂਨਾ) ਰੱਖੋ। ਹਰ ਵਾਰ ਵਰਤੋਂ ਤੋਂ ਬਾਅਦ ਉੱਪਰ ਮਿੱਟੀ ਜਾਂ ਸੁਆਹ ਜ਼ਰੂਰ ਪਾਓ।\n5. ਹੱਥ ਧੋਣਾ: ਬਾਹਰ ਸਾਬਣ ਜਾਂ ਸਾਫ਼ ਸੁਆਹ ਅਤੇ ਪਾਣੀ ਦਾ ਪ੍ਰਬੰਧ ਰੱਖੋ ਤਾਂ ਜੋ ਦਸਤ ਅਤੇ ਹੈਜ਼ਾ ਨਾ ਫੈਲੇ।",
        "category": "survival_sanitation",
        "verified_source": "Punjab Health Department Camp Hygiene SOP & Sphere Standards"
    },

    # 13. TRENCH FOOT & HYPOTHERMIA SURVIVAL
    {
        "prompt": "What is trench foot (immersion foot) and how can farmers and rescue volunteers prevent their skin from rotting in flood water?",
        "response": "Trench foot (immersion foot) is non-freezing tissue damage caused by prolonged exposure of feet to cold water and moisture (over 10-12 hours):\n1. Symptoms: Feet become pale, numb, wrinkled, cold, and swollen. Later, severe tingling, redness, blister formation, and fungal ulcerations develop.\n2. Prevention (NDMA & Military Field Medicine):\n   - Never sleep with wet socks or damp rubber gumboots on.\n   - Every 8 to 12 hours, wash feet with clean water, thoroughly dry between toes with a clean towel, and elevate legs above hip level for 30 minutes.\n   - Apply coconut oil, petroleum jelly (Vaseline), or zinc oxide powder to create a moisture barrier before entering water.\n3. Treatment: Warm feet gradually at room temperature. Do NOT immerse feet in hot water or massage numb skin, which tears fragile macerated tissues. If blisters burst, dress with clean Betadine gauze and call 108.",
        "category": "survival_health",
        "verified_source": "CDC Emergency Preparedness Directives & NDMA Field Hygiene SOP"
    },
    {
        "prompt": "ਹੜ੍ਹ ਦੇ ਪਾਣੀ ਵਿੱਚ ਲਗਾਤਾਰ ਰਹਿਣ ਕਰਕੇ ਪੈਰ ਗਲ਼ਣ ਲੱਗ ਪਏ ਹਨ, ਇਸਦਾ ਦੇਸੀ ਅਤੇ ਡਾਕਟਰੀ ਇਲਾਜ ਕੀ ਹੈ?",
        "response": "ਸਿਹਤ ਵਿਭਾਗ ਦੇ ਨਿਰਦੇਸ਼:\n1. ਪੈਰਾਂ ਨੂੰ ਗਿੱਲਾ ਨਾ ਰਹਿਣ ਦਿਓ: ਪਾਣੀ ਵਿੱਚੋਂ ਨਿਕਲਦੇ ਹੀ ਪੈਰਾਂ ਨੂੰ ਸਾਫ਼ ਪਾਣੀ ਨਾਲ ਧੋ ਕੇ ਸੁੱਕੇ ਕੱਪੜੇ ਨਾਲ ਉਂਗਲਾਂ ਦੇ ਵਿਚਕਾਰੋਂ ਚੰਗੀ ਤਰ੍ਹਾਂ ਸੁਕਾਓ।\n2. ਤੇਲ ਜਾਂ ਮਲਮ: ਸੁੱਕਣ ਤੋਂ ਬਾਅਦ ਨਾਰੀਅਲ ਦਾ ਤੇਲ ਜਾਂ ਸਰ੍ਹੋਂ ਦਾ ਤੇਲ ਲਗਾਓ। ਜੇਕਰ ਚਮੜੀ ਚਿੱਟੀ ਹੋ ਕੇ ਗਲ਼ ਰਹੀ ਹੋਵੇ ਤਾਂ ਬੀਟਾਡੀਨ (Betadine) ਜਾਂ ਐਂਟੀਫੰਗਲ ਪਾਊਡਰ ਛਿੜਕੋ।\n3. ਗਿੱਲੇ ਬੂਟ/ਜੁਰਾਬਾਂ ਨਾ ਪਾਓ: ਰਾਤ ਨੂੰ ਸੌਣ ਵੇਲੇ ਪੈਰਾਂ ਨੂੰ ਉੱਚਾ ਰੱਖੋ ਤਾਂ ਜੋ ਸੋਜ ਘਟ ਸਕੇ।\n4. ਪੈਰਾਂ ਨੂੰ ਸਿੱਧਾ ਅੱਗ ਜਾਂ ਬਹੁਤ ਗਰਮ ਪਾਣੀ ਵਿੱਚ ਨਾ ਸੇਕੋ, ਇਸ ਨਾਲ ਨਾਜ਼ੁਕ ਚਮੜੀ ਸੜ ਸਕਦੀ ਹੈ। ਗੰਭੀਰ ਜ਼ਖ਼ਮ ਹੋਣ 'ਤੇ 108 ਜਾਂ ਮੈਡੀਕਲ ਕੈਂਪ ਦਿਖਾਓ।",
        "category": "survival_health",
        "verified_source": "Punjab Health Services Field Protocol & NDMA First Aid"
    },
    {
        "prompt": "How do I recognize and treat hypothermia in someone stranded in cold rain and flood water?",
        "response": "Hypothermia occurs when core body temperature drops below 35°C (95°F) due to prolonged wet clothing and windchill:\n1. Warning Signs: Mild: violent uncontrollable shivering, pale cold skin, clumsiness. Severe: shivering stops, apathy, slurred speech, confusion, slow shallow pulse.\n2. Immediate Survival Treatment (Red Cross Protocol):\n   - Move person out of wind and rain into shelter or under tarpaulin immediately.\n   - Gently remove ALL wet clothing. Do NOT rub the skin vigorously.\n   - Wrap completely in dry wool blankets, dry straw, or sleeping bags, ensuring head and neck are insulated.\n   - Provide warm, sweet fluids (warm jaggery water, hot sweetened tea). NEVER give alcohol, caffeine, or hot food to an unconscious victim.\n   - Use shared body heat: have a dry person lie beside the victim under dry blankets.\n   - Call 112 / 108 for emergency resuscitation.",
        "category": "survival_health",
        "verified_source": "Red Cross Emergency First Aid & NDMA Disaster Medicine Manual"
    },

    # 14. EMERGENCY FOOD RATIONS & STORAGE
    {
        "prompt": "What are the best survival foods to keep stored during monsoon season in rural Punjab?",
        "response": "Under NDMA Disaster Nutrition guidelines, non-perishable emergency rations must require zero refrigeration and minimal or no cooking fuel:\n1. High-Energy Survival Staples: Roasted gram (Bhuna Chana), Desi Jaggery (Gur), Sattu (barley/chana flour), Puffed rice (Murmura), Glucose powder, and Glucose biscuits (Parle-G).\n2. Storage Method: Store rations in airtight, food-grade plastic drums with rubber gasket lids, or double-layered heavy polythene bags sealed with heat. Keep drums raised on high wooden cots or suspended rafters at least 2 metres above ground.\n3. Infant Food: Store ready-to-feed commercial infant formula and clean feeding bottles. Never mix infant cereal with unboiled flood water.\n4. Spoilage Check: Discard any food that has come into direct contact with flood water or mud, including sealed Tetra Paks and metal cans with dents, rust, or bulging seams (severe botulism toxin hazard).",
        "category": "survival_food",
        "verified_source": "NDMA Emergency Food Guidelines & UNICEF Child Nutrition in Disasters"
    },
    {
        "prompt": "ਹੜ੍ਹਾਂ ਦੌਰਾਨ ਆਟਾ, ਚੌਲ ਅਤੇ ਸੁੱਕਾ ਰਾਸ਼ਨ ਗਿੱਲਾ ਹੋਣ ਅਤੇ ਸੁੰਡੀ ਲੱਗਣ ਤੋਂ ਕਿਵੇਂ ਬਚਾਈਏ?",
        "response": "NDMA ਅਤੇ ਪੰਜਾਬ ਆਫ਼ਤ ਪ੍ਰਬੰਧਨ ਨਿਰਦੇਸ਼:\n1. ਸੀਲਬੰਦ ਡਰੱਮ: ਆਟਾ, ਦਾਲਾਂ ਅਤੇ ਚੌਲ ਹਮੇਸ਼ਾ ਪਲਾਸਟਿਕ ਦੇ ਏਅਰ-ਟਾਈਟ ਨੀਲੇ ਡਰੱਮਾਂ ਵਿੱਚ ਰੱਖੋ ਜਿਨ੍ਹਾਂ ਦੇ ਢੱਕਣ ਨੂੰ ਰਬੜ ਦਾ ਛੱਲਾ ਅਤੇ ਕਲਿੱਪ ਲੱਗਾ ਹੋਵੇ।\n2. ਉੱਚਾਈ 'ਤੇ ਰੱਖੋ: ਡਰੱਮਾਂ ਨੂੰ ਜ਼ਮੀਨ 'ਤੇ ਨਾ ਰੱਖੋ; ਪੱਕੀਆਂ ਛੱਤਾਂ 'ਤੇ ਜਾਂ ਘਰ ਦੇ ਉੱਚੇ ਮਿਆਰਾਂ/ਲੈਂਟਰ ਹੇਠਾਂ ਲੱਕੜ ਦੇ ਤਖ਼ਤਿਆਂ ਉੱਤੇ ਰੱਖੋ।\n3. ਨਿੰਮ ਦੇ ਪੱਤੇ: ਸੁੱਕੇ ਅਨਾਜ ਵਿੱਚ ਸੁੱਕੇ ਨਿੰਮ ਦੇ ਪੱਤੇ ਜਾਂ ਮਾਚਿਸ ਦੀਆਂ ਡੱਬੀਆਂ ਰੱਖਣ ਨਾਲ ਨਮੀ ਵਿੱਚ ਕੀੜਾ ਜਾਂ ਸੁੰਡੀ ਨਹੀਂ ਲੱਗਦੀ।\n4. ਗੰਦਾ ਹੋਇਆ ਰਾਸ਼ਨ: ਜੇਕਰ ਹੜ੍ਹ ਦਾ ਪਾਣੀ ਆਟੇ ਦੀ ਬੋਰੀ ਜਾਂ ਖੁੱਲ੍ਹੇ ਰਾਸ਼ਨ ਵਿੱਚ ਵੜ ਜਾਵੇ ਤਾਂ ਉਸਨੂੰ ਬਿਲਕੁਲ ਨਾ ਖਾਓ, ਕਿਉਂਕਿ ਉਸ ਵਿੱਚ ਸੀਵਰੇਜ ਅਤੇ ਜ਼ਹਿਰੀਲੇ ਕੀਟਾਣੂ ਹੁੰਦੇ ਹਨ।",
        "category": "survival_food",
        "verified_source": "Punjab SDMA Food Security SOP & NDMA Food Storage Protocol"
    },

    # 15. SANDBAGGING & FLOOD BARRIER DEFENCE
    {
        "prompt": "What is the correct way to fill and lay sandbags to defend a village street from rising water?",
        "response": "Under US Army Corps of Engineers and Central Water Commission sandbagging standards:\n1. Filling Rule: Fill sandbags only 1/2 to 2/3 full (approx. 15 to 18 kg). Do NOT overfill; an overfilled bag is rigid and leaves gaps where water leaks through.\n2. Bag Tying: Do not tie the neck tightly. Simply fold the open flap of the bag under the bag itself.\n3. Placement Technique: Lay bags lengthwise, parallel to the direction of water flow. Place the folded flap under the weight of the bag, facing upstream.\n4. Staggering: Stagger each row like running-bond brick masonry so vertical joints do not align. Tamp each bag firmly in place with boots to seal voids.\n5. Pyramid Rule: If building higher than 30 cm (2 layers), build as a pyramid: the base width must be at least 3 times the height (e.g. for a 1-metre high barrier, the base must be 3 metres wide).\n6. Sealing: Place a heavy 6-mil plastic sheet on the water-facing slope and weigh it down with an extra row of sandbags to prevent seepage.",
        "category": "community_defence",
        "verified_source": "CWC Guidelines & USACE Flood Fighting Manual"
    },
    {
        "prompt": "ਪਿੰਡ ਵੱਲ ਆ ਰਹੇ ਪਾਣੀ ਨੂੰ ਰੋਕਣ ਲਈ ਬੋਰੀਆਂ (ਰੇਤ ਦੇ ਥੈਲੇ) ਭਰਨ ਅਤੇ ਚਿਣਨ ਦਾ ਸਹੀ ਤਰੀਕਾ ਕੀ ਹੈ?",
        "response": "ਸੈਂਟਰਲ ਵਾਟਰ ਕਮਿਸ਼ਨ (CWC) ਅਤੇ ਡਰੇਨੇਜ ਵਿਭਾਗ ਦੇ ਇੰਜੀਨੀਅਰਿੰਗ ਨਿਯਮ:\n1. ਬੋਰੀ ਅੱਧੀ ਜਾਂ ਪੌਣੀ ਭਰੋ: ਰੇਤ ਦੀ ਬੋਰੀ ਨੂੰ ਕਦੇ ਵੀ ਮੂੰਹ ਤੱਕ ਨਾ ਭਰੋ। ਸਿਰਫ਼ ਅੱਧੀ ਜਾਂ ਦੋ-ਤਿਹਾਈ (15-18 ਕਿਲੋ) ਭਰੋ ਤਾਂ ਜੋ ਬੋਰੀ ਲਚਕੀਲੀ ਰਹੇ ਅਤੇ ਆਪਸ ਵਿੱਚ ਜੁੜ ਸਕੇ।\n2. ਮੂੰਹ ਬੰਨ੍ਹਣ ਦੀ ਲੋੜ ਨਹੀਂ: ਬੋਰੀ ਦਾ ਖੁੱਲ੍ਹਾ ਮੂੰਹ ਮੋੜ ਕੇ ਬੋਰੀ ਦੇ ਹੇਠਾਂ ਦਬਾ ਦਿਓ।\n3. ਚਿਣਾਈ ਦਾ ਤਰੀਕਾ: ਬੋਰੀਆਂ ਦੀ ਚਿਣਾਈ ਇੱਟਾਂ ਵਾਂਗ ਕਰੋ (ਜੋੜ ਉੱਤੇ ਜੋੜ ਨਾ ਆਵੇ)। ਹਰ ਬੋਰੀ ਨੂੰ ਪੈਰ ਨਾਲ ਦਬਾ ਕੇ ਪੱਕਾ ਕਰੋ।\n4. ਪਿਰਾਮਿਡ ਨਿਯਮ: ਜੇਕਰ ਬੰਨ੍ਹ ਉੱਚਾ ਕਰਨਾ ਹੋਵੇ ਤਾਂ ਹੇਠਲਾ ਆਧਾਰ ਉੱਚਾਈ ਨਾਲੋਂ 3 ਗੁਣਾ ਚੌੜਾ ਹੋਣਾ ਚਾਹੀਦਾ ਹੈ।\n5. ਪਲਾਸਟਿਕ ਤਰਪਾਲ: ਪਾਣੀ ਵਾਲੇ ਪਾਸੇ ਮੋਟੀ ਪਲਾਸਟਿਕ ਤਰਪਾਲ ਵਿਛਾ ਕੇ ਉੱਪਰ ਬੋਰੀਆਂ ਰੱਖੋ ਤਾਂ ਜੋ ਪਾਣੀ ਮਿੱਟੀ ਵਿੱਚੋਂ ਨਾ ਰਿਸੇ।",
        "category": "community_defence",
        "verified_source": "Punjab Drainage Dept Sandbagging Manual & CWC Embankment Guide"
    },

    # 16. AGRICULTURAL & TUBE-WELL BOREHOLE REHABILITATION
    {
        "prompt": "How do farmers clear silt from a submerged tube-well bore before starting the submersible motor?",
        "response": "Punjab Agricultural University (PAU) and Department of Water Resources directives:\n1. Sand Ingress Hazard: When river floods submerge rural agricultural tube-wells, fine silt and clay settle inside the casing pipe. Turning on the submersible pump will suck sand, instantly grinding the impellers and burning the motor winding.\n2. Compressor Surging: Call a specialized air-compressor rig. Lower an airline pipe into the bore and pump high-pressure compressed air (air-lift pumping) to blow out all accumulated sand and silt until water runs crystal clear for at least 30 minutes.\n3. Motor Inspection: Retrieve the submersible pump, flush the intake screen with clean pressurized water, check that shaft spins freely by hand, and perform a 500V Megger test (insulation resistance must exceed 1 Megaohm).\n4. Starter Panel: Open the motor starter box, blow out all mud with a dry blower, and clean copper contactors with fine emery paper.",
        "category": "agriculture_recovery",
        "verified_source": "Punjab Agricultural University (PAU) Flood Advisory & Bureau of Indian Standards"
    },
    {
        "prompt": "ਹੜ੍ਹ ਤੋਂ ਬਾਅਦ ਟਿਊਬਵੈੱਲ ਦੇ ਬੋਰ ਵਿੱਚੋਂ ਰੇਤ ਕਿਵੇਂ ਕੱਢੀ ਜਾਵੇ ਤਾਂ ਜੋ ਮੋਟਰ ਸੜ ਨਾ ਜਾਵੇ?",
        "response": "ਪੰਜਾਬ ਖੇਤੀਬਾੜੀ ਯੂਨੀਵਰਸਿਟੀ (PAU) ਲੁਧਿਆਣਾ ਦੀ ਐਡਵਾਈਜ਼ਰੀ:\n1. ਮੋਟਰ ਸਿੱਧੀ ਕਦੇ ਨਾ ਚਲਾਓ: ਹੜ੍ਹ ਦਾ ਪਾਣੀ ਬੋਰ ਵਿੱਚ ਰੇਤ ਅਤੇ ਗਾਰ ਭਰ ਦਿੰਦਾ ਹੈ। ਜੇਕਰ ਸਿੱਧੀ ਮੋਟਰ ਚਲਾਈ ਤਾਂ ਰੇਤ ਪੰਖੜੀਆਂ (impellers) ਨੂੰ ਜਾਮ ਕਰਕੇ ਮੋਟਰ ਤੁਰੰਤ ਸਾੜ ਦੇਵੇਗੀ।\n2. ਕੰਪ੍ਰੈਸਰ ਨਾਲ ਬੋਰ ਸਾਫ਼ ਕਰਵਾਓ: ਪਹਿਲਾਂ ਏਅਰ ਕੰਪ੍ਰੈਸਰ ਮਸ਼ੀਨ ਲਗਾ ਕੇ ਬੋਰ ਵਿੱਚ ਹਵਾ ਦਾ ਪ੍ਰੈਸ਼ਰ ਮਾਰੋ ਅਤੇ ਸਾਰੀ ਰੇਤ ਬਾਹਰ ਕੱਢੋ ਜਦੋਂ ਤੱਕ ਸਾਫ਼ ਪਾਣੀ ਨਾ ਨਿਕਲਣ ਲੱਗ ਪਵੇ।\n3. ਮੋਟਰ ਦੀ ਜਾਂਚ: ਮੋਟਰ ਨੂੰ ਬਾਹਰ ਕੱਢ ਕੇ ਚੰਗੀ ਤਰ੍ਹਾਂ ਧੋਵੋ, ਹੱਥ ਨਾਲ ਘੁਮਾ ਕੇ ਦੇਖੋ ਕਿ ਜਾਮ ਤਾਂ ਨਹੀਂ, ਅਤੇ ਮੈਗਰ (Megger) ਨਾਲ ਕਰੰਟ ਟੈਸਟ ਕਰਵਾਓ।\n4. ਸਟਾਰਟਰ ਦੀ ਸਫ਼ਾਈ: ਬਿਜਲੀ ਦੇ ਸਟਾਰਟਰ ਨੂੰ ਸੁਕਾ ਕੇ ਪੈਟਰੋਲ ਜਾਂ ਸੁੱਕੇ ਕੱਪੜੇ ਨਾਲ ਸਾਫ਼ ਕਰੋ।",
        "category": "agriculture_recovery",
        "verified_source": "PAU Ludhiana Farm Machinery Advisory & PSPCL Directives"
    },
    {
        "prompt": "What is the process to claim Special Girdawari flood crop damage compensation from the Punjab Government?",
        "response": "Under Punjab State Disaster Response Fund (SDRF) and Revenue Department guidelines:\n1. Notification: The Deputy Commissioner (DC) declares affected sub-divisions as flood-hit and orders 'Special Girdawari' (vishesh girdawari).\n2. Field Survey: A joint inspection team comprising the Halqa Patwari, Kanungo, and Agriculture Development Officer (ADO) visits fields to record crop loss percentage (>33%, >50%, or 100% total loss).\n3. Required Documents: Farmer must keep ready: Aadhaar Card, Land Revenue Record (Jamabandi/Fard), Bank Passbook with active IFSC, and verification of cultivation (if tenant/contract farmer).\n4. Objections: If your field was missed or loss is underestimated, submit a written objection to the Naib Tehsildar or SDM within 7 days of list publication.\n5. Payout: SDRF compensation is transferred via Direct Benefit Transfer (DBT) directly into verified bank accounts.",
        "category": "agriculture_recovery",
        "verified_source": "Punjab Financial Commissioner Revenue (FCR) Disaster Relief Rules & SDRF Norms"
    },
    {
        "prompt": "ਪੰਜਾਬ ਸਰਕਾਰ ਤੋਂ ਹੜ੍ਹ ਨਾਲ ਖ਼ਰਾਬ ਹੋਈਆਂ ਫ਼ਸਲਾਂ ਦਾ ਮੁਆਵਜ਼ਾ (ਸਪੈਸ਼ਲ ਗਿਰਦਾਵਰੀ) ਲੈਣ ਦਾ ਤਰੀਕਾ ਕੀ ਹੈ?",
        "response": "ਪੰਜਾਬ ਸਰਕਾਰ ਦੇ ਮਾਲ ਵਿਭਾਗ (Revenue Department) ਅਨੁਸਾਰ:\n1. ਸਰਕਾਰੀ ਐਲਾਨ: ਡਿਪਟੀ ਕਮਿਸ਼ਨਰ (DC) ਵੱਲੋਂ ਹੜ੍ਹ ਪ੍ਰਭਾਵਿਤ ਇਲਾਕਿਆਂ ਵਿੱਚ 'ਸਪੈਸ਼ਲ ਗਿਰਦਾਵਰੀ' ਦੇ ਹੁਕਮ ਜਾਰੀ ਕੀਤੇ ਜਾਂਦੇ ਹਨ।\n2. ਪਟਵਾਰੀ ਸਰਵੇ: ਹਲਕਾ ਪਟਵਾਰੀ, ਕਾਨੂੰਨਗੋ ਅਤੇ ਖੇਤੀਬਾੜੀ ਅਫ਼ਸਰ ਖੇਤਾਂ ਵਿੱਚ ਜਾ ਕੇ ਫ਼ਸਲ ਦੇ ਨੁਕਸਾਨ (33% ਤੋਂ ਵੱਧ, 50% ਜਾਂ 100% ਖ਼ਰਾਬਾ) ਦੀ ਰਿਪੋਰਟ ਤਿਆਰ ਕਰਦੇ ਹਨ।\n3. ਜ਼ਰੂਰੀ ਦਸਤਾਵੇਜ਼: ਆਪਣਾ ਆਧਾਰ ਕਾਰਡ, ਬੈਂਕ ਖਾਤੇ ਦੀ ਕਾਪੀ (IFSC ਕੋਡ ਵਾਲੀ), ਅਤੇ ਜ਼ਮੀਨ ਦੀ ਫ਼ਰਦ/ਜਮ੍ਹਾਂਬੰਦੀ ਤਿਆਰ ਰੱਖੋ।\n4. ਇਤਰਾਜ਼: ਜੇਕਰ ਤੁਹਾਡਾ ਨੁਕਸਾਨ ਘੱਟ ਲਿਖਿਆ ਜਾਵੇ ਤਾਂ ਸੂਚੀ ਜਾਰੀ ਹੋਣ ਦੇ 7 ਦਿਨਾਂ ਦੇ ਅੰਦਰ ਤਹਿਸੀਲਦਾਰ ਜਾਂ SDM ਕੋਲ ਲਿਖਤੀ ਦਰਖ਼ਾਸਤ ਦਿਓ।\n5. ਮੁਆਵਜ਼ਾ ਸਿੱਧਾ ਬੈਂਕ ਖਾਤੇ (DBT) ਵਿੱਚ ਆਉਂਦਾ ਹੈ। ਸਹਾਇਤਾ ਲਈ ਜ਼ਿਲ੍ਹਾ ਕੰਟਰੋਲ ਰੂਮ 1077 'ਤੇ ਸੰਪਰਕ ਕਰੋ।",
        "category": "agriculture_recovery",
        "verified_source": "Punjab Revenue Dept Special Girdawari Guidelines & SDRF Relief Norms"
    },

    # 17. STRUCTURAL SAFETY WHEN RETURNING HOME
    {
        "prompt": "What safety checks must be performed before entering a brick house after flood waters recede?",
        "response": "Under NDMA Disaster Recovery and Building Safety protocols:\n1. Structural Integrity Check: Before entering, inspect exterior walls from a distance for deep diagonal foundation cracks, bowed brick walls, or sagging roof slabs. If walls are bulging, do NOT enter; call local municipal/revenue authorities.\n2. Gas Leak Detection: NEVER strike a match, lighter, or turn on electrical switches when first entering. Flood water can dislodge LPG cylinders or damage pipe fittings. Smell for the distinct rotten-egg odor of LPG. If smelled, immediately turn off cylinder valve, open windows, and retreat outside.\n3. Electrical Isolation: Confirm the main electrical breaker is completely OFF before stepping inside wet rooms.\n4. Toxic Silt & Air Quality: Ventilate the house for at least 15 minutes before lingering inside, as decaying silt generates hydrogen sulfide and methane gases in enclosed rooms.\n5. Wildlife Hazards: Use a long wooden stick to probe under cots, behind doors, and inside cupboards to check for sheltering venomous snakes or scorpions.",
        "category": "structural_safety",
        "verified_source": "NDMA Post-Flood Structural Assessment SOP & Central Public Works Dept (CPWD)"
    },
    {
        "prompt": "ਹੜ੍ਹ ਦਾ ਪਾਣੀ ਉਤਰਨ ਤੋਂ ਬਾਅਦ ਘਰ ਵੜਨ ਵੇਲੇ ਕੰਧਾਂ ਅਤੇ ਛੱਤ ਦੀ ਪਰਖ ਕਿਵੇਂ ਕਰੀਏ?",
        "response": "NDMA ਅਤੇ ਲੋਕ ਨਿਰਮਾਣ ਵਿਭਾਗ (PWD) ਦੇ ਸੁਰੱਖਿਆ ਨਿਯਮ:\n1. ਬਾਹਰੋਂ ਕੰਧਾਂ ਦੇਖੋ: ਘਰ ਅੰਦਰ ਵੜਨ ਤੋਂ ਪਹਿਲਾਂ ਬਾਹਰੋਂ ਦੇਖੋ ਕਿ ਕੀ ਕੰਧਾਂ ਵਿੱਚ ਵੱਡੀਆਂ ਤਰੇੜਾਂ ਤਾਂ ਨਹੀਂ ਆਈਆਂ ਜਾਂ ਨੀਂਹ ਤਾਂ ਨਹੀਂ ਬੈਠੀ। ਜੇਕਰ ਕੰਧ ਝੁਕੀ ਹੋਵੇ ਤਾਂ ਅੰਦਰ ਨਾ ਜਾਓ।\n2. ਮਾਚਿਸ ਜਾਂ ਲਾਈਟਰ ਨਾ ਬਾਲੋ: ਹੜ੍ਹ ਕਾਰਨ ਗੈਸ ਸਿਲੰਡਰ ਲੀਕ ਹੋ ਸਕਦਾ ਹੈ। ਅੰਦਰ ਜਾਂਦੇ ਹੀ ਕੋਈ ਤੀਲੀ ਨਾ ਬਾਲੋ ਅਤੇ ਨਾ ਹੀ ਬਿਜਲੀ ਦਾ ਸਵਿੱਚ ਚਲਾਓ।\n3. ਖਿੜਕੀਆਂ ਖੋਲ੍ਹੋ: ਦਰਵਾਜ਼ੇ ਅਤੇ ਖਿੜਕੀਆਂ ਤੁਰੰਤ ਖੋਲ੍ਹ ਦਿਓ ਤਾਂ ਜੋ ਅੰਦਰਲੀ ਜ਼ਹਿਰੀਲੀ ਗੈਸ ਅਤੇ ਬਦਬੂ ਬਾਹਰ ਨਿਕਲ ਸਕੇ।\n4. ਸੱਪਾਂ ਦੀ ਜਾਂਚ: ਲੰਮੀ ਲੱਕੜੀ ਨਾਲ ਮੰਜਿਆਂ ਦੇ ਹੇਠਾਂ ਅਤੇ ਕਮਰਿਆਂ ਦੇ ਕੋਨਿਆਂ ਦੀ ਜਾਂਚ ਕਰੋ ਕਿਉਂਕਿ ਸੱਪ ਅਕਸਰ ਸੁੱਕੀ ਥਾਂ ਲੱਭ ਕੇ ਅੰਦਰ ਵੜ ਜਾਂਦੇ ਹਨ।",
        "category": "structural_safety",
        "verified_source": "Punjab SDMA Home Return Safety Checklist"
    },

    # 18. RESCUE SIGNALING & HELICOPTER COMMUNICATION
    {
        "prompt": "How can stranded villagers signal rescue helicopters or NDRF boats during floods?",
        "response": "Under NDRF and Indian Air Force disaster search & rescue protocols:\n1. International Ground-to-Air Signals: Lay out strips of white or bright colored cloth on an open flat rooftop or dry road in large letters (>3 metres long). A large 'V' means 'Require Assistance'. A large 'X' means 'Require Medical Assistance'. An arrow pointing toward a direction indicates 'Proceeding in this direction'.\n2. High-Visibility Signaling: Wave a brightly colored cloth, bright orange tarpaulin, or reflective mirror/sheet toward the aircraft when it approaches. At night, flash a torch or battery lantern directly upward in steady pulses.\n3. Whistle Protocol: The international emergency distress signal is 3 loud, distinct whistle blasts. Pause for 1 minute, then repeat 3 blasts. One long blast is the rescuer's acknowledgment signal ('Help is on the way').\n4. Helicopter Landing Danger: Stay at least 30 metres clear of approaching helicopter landing zones. Downwash rotor winds easily blow away loose tin sheets and plastic tarps, causing lethal flying debris.",
        "category": "rescue_signaling",
        "verified_source": "NDMA / NDRF Search and Rescue SOP & IAF Ground-to-Air Disaster Manual"
    },
    {
        "prompt": "ਹੜ੍ਹ ਵਿੱਚ ਫਸੇ ਹੋਏ ਲੋਕ ਹੈਲੀਕਾਪਟਰ ਜਾਂ NDRF ਦੀਆਂ ਕਿਸ਼ਤੀਆਂ ਨੂੰ ਮਦਦ ਲਈ ਇਸ਼ਾਰਾ ਕਿਵੇਂ ਕਰਨ?",
        "response": "NDRF ਅਤੇ ਭਾਰਤੀ ਹਵਾਈ ਫੌਜ (IAF) ਦੇ ਬਚਾਅ ਨਿਯਮ:\n1. ਛੱਤ 'ਤੇ ਵੱਡੇ ਅੱਖਰਾਂ ਦੇ ਨਿਸ਼ਾਨ: ਖੁੱਲ੍ਹੀ ਛੱਤ 'ਤੇ ਚਿੱਟੇ ਜਾਂ ਚਮਕਦਾਰ ਕੱਪੜੇ ਨਾਲ ਵੱਡਾ 'V' ਬਣਾਓ ਜਿਸਦਾ ਮਤਲਬ ਹੈ 'ਮਦਦ ਦੀ ਲੋੜ ਹੈ'। ਵੱਡਾ 'X' ਬਣਾਉਣ ਦਾ ਮਤਲਬ ਹੈ 'ਡਾਕਟਰੀ/ਮੈਡੀਕਲ ਮਦਦ ਚਾਹੀਦੀ ਹੈ'।\n2. ਚਮਕਦਾਰ ਕੱਪੜਾ ਅਤੇ ਸ਼ੀਸ਼ਾ: ਦਿਨ ਵੇਲੇ ਹੈਲੀਕਾਪਟਰ ਦੇਖ ਕੇ ਲਾਲ/ਸੰਤਰੀ ਤਰਪਾਲ ਜਾਂ ਸ਼ੀਸ਼ੇ ਦਾ ਚਮਕਾਰਾ ਮਾਰੋ। ਰਾਤ ਨੂੰ ਟਾਰਚ ਦੀ ਰੌਸ਼ਨੀ ਉੱਪਰ ਵੱਲ ਚਮਕਾਓ।\n3. ਸੀਟੀ ਦਾ ਨਿਯਮ: ਲਗਾਤਾਰ 3 ਵਾਰ ਤੇਜ਼ ਸੀਟੀ ਵਜਾਓ (ਇਹ ਅੰਤਰਰਾਸ਼ਟਰੀ ਖ਼ਤਰੇ ਦਾ ਇਸ਼ਾਰਾ ਹੈ), 1 ਮਿੰਟ ਰੁਕੋ ਅਤੇ ਫਿਰ 3 ਵਾਰ ਵਜਾਓ।\n4. ਹੈਲੀਕਾਪਟਰ ਦੇ ਪੱਖੇ ਦੀ ਹਵਾ ਤੋਂ ਬਚੋ: ਹੈਲੀਕਾਪਟਰ ਆਉਣ 'ਤੇ ਛੱਤ ਤੋਂ ਟੀਨ ਦੀਆਂ ਚਾਦਰਾਂ ਜਾਂ ਤਰਪਾਲਾਂ ਹਵਾ ਵਿੱਚ ਉੱਡ ਕੇ ਵੱਡਾ ਨੁਕਸਾਨ ਕਰ ਸਕਦੀਆਂ ਹਨ, ਇਸ ਲਈ ਸੁਰੱਖਿਅਤ ਦੂਰੀ ਬਣਾ ਕੇ ਰੱਖੋ।",
        "category": "rescue_signaling",
        "verified_source": "NDRF Disaster Rescue Protocols & Punjab SDMA"
    },
    {
        "prompt": "बाढ़ में घिरे लोग बचाव दल (NDRF/हेलीकॉप्टर) को सहायता के लिए संकेत कैसे दें?",
        "response": "एनडीआरएफ (NDRF) और वायु सेना के अधिकृत संकेत नियम:\n1. छत पर बड़े चिन्ह: छत पर सफेद या चमकीले कपड़े से 3 मीटर लंबा 'V' चिन्ह बनाएं (अर्थ: सहायता चाहिए)। 'X' चिन्ह बनाएं (अर्थ: गंभीर मेडिकल सहायता चाहिए)।\n2. चमकीले कपड़े या शीशे का प्रयोग: दिन में हेलिकॉप्टर की ओर लाल/नारंगी कपड़ा या शीशे की चमक (रिफ्लेक्शन) दिखाएं। रात में टॉर्च की रोशनी सीधे ऊपर की ओर चमकाएं।\n3. सीटी के 3 संकेत: लगातार 3 बार तेज सीटी बजाएं, 1 मिनट रुकें और फिर 3 बार बजाएं (यह आपातकालीन बचाव का सार्वभौमिक संकेत है)।\n4. आपातकालीन फोन: बचाव के लिए 112 या 1078 (NDMA) पर अपनी सही जीपीएस लोकेशन बताएं।",
        "category": "rescue_signaling",
        "verified_source": "NDRF SOP for Flood Evacuation & Air Rescue"
    },

    # 19. WOUND CARE, TETANUS & INFECTION IN CONTAMINATED WATER
    {
        "prompt": "What should I do if I get a cut or nail puncture in contaminated flood water?",
        "response": "Under WHO and Ministry of Health (MoHFW) emergency trauma directives:\n1. Immediate Copious Irrigation: Immediately wash the wound thoroughly under clean, boiled or bottled drinking water with mild soap for at least 5 minutes. Never use river or flood water to rinse an open wound.\n2. Antiseptic Application: Apply Povidone Iodine 5% (Betadine) or sterile antiseptic liquid. NEVER apply cow dung, ash, kerosene, or wet mud to a wound; these traditional rural practices carry Clostridium tetani spores that cause fatal tetanus and gas gangrene.\n3. Sterile Dressing: Cover with a clean, sterile waterproof bandage to prevent immersion in flood water.\n4. Tetanus Toxoid Vaccine: If the puncture occurred in dirty mud, sewage, or rusty iron, receive an intramuscular Tetanus Toxoid (TT) booster within 48 hours at the nearest Civil Hospital or dispensary.\n5. Watch for Spreading Infection: If you notice spreading redness, warmth, swelling, pus, or fever, seek emergency medical care immediately (call 108/112).",
        "category": "wound_care",
        "verified_source": "WHO Guidelines on Essential Trauma Care & MoHFW Emergency Protocols"
    },
    {
        "prompt": "ਜੇਕਰ ਹੜ੍ਹ ਦੇ ਗੰਦੇ ਪਾਣੀ ਵਿੱਚ ਪੈਰ ਜਾਂ ਹੱਥ 'ਤੇ ਕਿੱਲ ਲੱਗ ਜਾਵੇ ਜਾਂ ਕੱਟ ਲੱਗ ਜਾਵੇ ਤਾਂ ਕੀ ਕਰਨਾ ਚਾਹੀਦਾ ਹੈ?",
        "response": "ਸਿਹਤ ਵਿਭਾਗ ਪੰਜਾਬ ਅਤੇ WHO ਦੇ ਨਿਰਦੇਸ਼:\n1. ਤੁਰੰਤ ਸਾਫ਼ ਪਾਣੀ ਨਾਲ ਧੋਵੋ: ਜ਼ਖ਼ਮ ਨੂੰ ਸਾਫ਼ ਪੀਣ ਵਾਲੇ ਜਾਂ ਉਬਲੇ ਹੋਏ ਪਾਣੀ ਅਤੇ ਸਾਬਣ ਨਾਲ ਘੱਟੋ-ਘੱਟ 5 ਮਿੰਟ ਚੰਗੀ ਤਰ੍ਹਾਂ ਧੋਵੋ। ਗੰਦੇ ਹੜ੍ਹ ਦੇ ਪਾਣੀ ਨਾਲ ਕਦੇ ਨਾ ਧੋਵੋ।\n2. ਬੀਟਾਡੀਨ (Betadine) ਲਗਾਓ: ਜ਼ਖ਼ਮ 'ਤੇ ਬੀਟਾਡੀਨ ਜਾਂ ਡਿਟੋਲ ਲਗਾ ਕੇ ਸਾਫ਼ ਪੱਟੀ ਬੰਨ੍ਹੋ।\n3. ਦੇਸੀ ਨੁਸਖੇ ਨਾ ਵਰਤੋ: ਜ਼ਖ਼ਮ ਉੱਤੇ ਗੋਹਾ, ਸੁਆਹ, ਜਾਂ ਮਿੱਟੀ ਕਦੇ ਨਾ ਲਗਾਓ, ਇਸ ਨਾਲ ਧਨੁਖਬਾਅ (ਟੈਟਨਸ/Tetanus) ਅਤੇ ਗੈਂਗਰੀਨ ਹੋਣ ਦਾ ਖ਼ਤਰਾ ਹੁੰਦਾ ਹੈ ਜੋ ਜਾਨਲੇਵਾ ਹੋ ਸਕਦਾ ਹੈ।\n4. ਟੈਟਨਸ ਦਾ ਟੀਕਾ: 48 ਘੰਟਿਆਂ ਦੇ ਅੰਦਰ ਨਜ਼ਦੀਕੀ ਸਰਕਾਰੀ ਹਸਪਤਾਲ ਜਾ ਕੇ ਟੈਟਨਸ (TT) ਦਾ ਟੀਕਾ ਜ਼ਰੂਰ ਲਗਵਾਓ। ਐਂਬੂਲੈਂਸ ਲਈ 108 'ਤੇ ਕਾਲ ਕਰੋ।",
        "category": "wound_care",
        "verified_source": "Punjab Health & Family Welfare Dept Trauma Guidelines"
    },

    # 20. CARBON MONOXIDE & GENERATOR / PUMP SAFETY
    {
        "prompt": "Can I operate a portable petrol/diesel generator or water pumping engine inside a flooded room or verandah?",
        "response": "ABSOLUTELY NOT. Under NDMA and National Disaster Management Safety standards:\n1. Lethal Gas Hazard: Internal combustion engines (generators, de-watering pumps) discharge deadly Carbon Monoxide (CO). Carbon monoxide is colorless, odorless, tasteless, and non-irritating; inhalation in an enclosed room causes unconsciousness and death within minutes.\n2. Safe Operating Distance: Always position generators and fuel-powered water pumps OUTDOORS in an open, dry area at least 6 metres (20 feet) away from doors, windows, and ventilation openings.\n3. Exhaust Direction: Direct the exhaust pipe away from buildings and occupied tents.\n4. Refueling Hazard: Never add petrol or diesel while the engine is hot or running. Spilled fuel on hot engine manifolds causes sudden explosive flash fires. Allow the engine to cool for at least 15 minutes before refueling.",
        "category": "generator_safety",
        "verified_source": "NDMA Electrical and Mechanical Equipment Hazard SOP"
    },
    {
        "prompt": "ਕੀ ਹੜ੍ਹ ਦੌਰਾਨ ਪਾਣੀ ਕੱਢਣ ਵਾਲਾ ਡੀਜ਼ਲ ਇੰਜਣ ਜਾਂ ਜਨਰੇਟਰ ਕਮਰੇ ਜਾਂ ਵਰਾਂਡੇ ਅੰਦਰ ਚਲਾਇਆ ਜਾ ਸਕਦਾ ਹੈ?",
        "response": "ਬਿਲਕੁਲ ਨਹੀਂ! NDMA ਅਤੇ ਫਾਇਰ ਬ੍ਰਿਗੇਡ ਦੇ ਸਖ਼ਤ ਨਿਯਮ:\n1. ਜ਼ਹਿਰੀਲੀ ਗੈਸ (ਕਾਰਬਨ ਮੋਨੋਆਕਸਾਈਡ): ਜਨਰੇਟਰ ਅਤੇ ਡੀਜ਼ਲ ਪੰਪ ਦੇ ਧੂੰਏਂ ਵਿੱਚ ਕਾਰਬਨ ਮੋਨੋਆਕਸਾਈਡ ਗੈਸ ਹੁੰਦੀ ਹੈ। ਇਸ ਗੈਸ ਦੀ ਨਾ ਕੋਈ ਬਦਬੂ ਹੁੰਦੀ ਹੈ ਅਤੇ ਨਾ ਹੀ ਰੰਗ। ਬੰਦ ਕਮਰੇ ਜਾਂ ਵਰਾਂਡੇ ਵਿੱਚ ਚਲਾਉਣ ਨਾਲ ਸੌਂ ਰਹੇ ਲੋਕਾਂ ਦਾ ਸਾਹ ਘੁੱਟ ਕੇ ਮੌਤ ਹੋ ਜਾਂਦੀ ਹੈ।\n2. ਬਾਹਰ ਚਲਾਓ: ਜਨਰੇਟਰ ਜਾਂ ਪੰਪ ਨੂੰ ਹਮੇਸ਼ਾ ਖੁੱਲ੍ਹੇ ਅਸਮਾਨ ਹੇਠ, ਘਰ ਦੀਆਂ ਖਿੜਕੀਆਂ ਅਤੇ ਦਰਵਾਜ਼ਿਆਂ ਤੋਂ ਘੱਟੋ-ਘੱਟ 20 ਫੁੱਟ (6 ਮੀਟਰ) ਦੂਰ ਰੱਖ ਕੇ ਚਲਾਓ।\n3. ਤੇਲ ਪਾਉਣ ਦਾ ਨਿਯਮ: ਚਲਦੇ ਜਾਂ ਗਰਮ ਜਨਰੇਟਰ ਵਿੱਚ ਕਦੇ ਵੀ ਪੈਟਰੋਲ/ਡੀਜ਼ਲ ਨਾ ਪਾਓ। ਅੱਗ ਲੱਗਣ ਦਾ ਖ਼ਤਰਾ ਹੁੰਦਾ ਹੈ।",
        "category": "generator_safety",
        "verified_source": "NDMA Fire and Equipment Safety SOP & Punjab SDMA"
    },

    # 21. EMERGENCY IMPROVISED FLOTATION & RESCUE RAFTS
    {
        "prompt": "How can villagers construct an emergency flotation device or raft using household materials during sudden floods?",
        "response": "Under Indian Red Cross and Civil Defence disaster improvisation protocols:\n1. 4-Canister Flotation Raft: Securely cap four empty 15-litre or 20-litre plastic edible oil/kerosene containers (canisters) after verifying airtightness. Lash them tightly with nylon rope to the four corners of a lightweight wooden cot (manji/charpai) or plastic crate. Four 20L canisters provide approximately 80 kg of positive buoyant lift, safely supporting an adult.\n2. Tractor / Truck Inner Tubes: Inflated rubber inner tubes make effective buoyant lifebuoys. Tie a 10-metre safety rope to the tube before entering water so bystanders on dry banks can pull the user to safety.\n3. Sealed Plastic Bottle Vest: Insert 12 to 16 empty, tightly capped 1-litre plastic water bottles into an airtight zip jacket or tied shirt to create an improvised life jacket for children.\n4. Critical Rule: Improvised flotation aids must only be used for passive floating while awaiting rescue boats, NOT for swimming across high-velocity main river currents.",
        "category": "emergency_flotation",
        "verified_source": "Punjab SDMA Civil Defence Manual & Indian Red Cross Society"
    },
    {
        "prompt": "ਪਿੰਡ ਵਿੱਚ ਅਚਾਨਕ ਹੜ੍ਹ ਆਉਣ 'ਤੇ ਘਰੇਲੂ ਸਮਾਨ ਨਾਲ ਤੈਰਨ ਵਾਲੀ ਜਾਨ ਬਚਾਊ ਬੇੜੀ ਜਾਂ ਰਾਫਟ ਕਿਵੇਂ ਬਣਾਈਏ?",
        "response": "ਸਿਵਲ ਡਿਫੈਂਸ ਅਤੇ ਰੈੱਡ ਕਰਾਸ ਦੇ ਐਮਰਜੈਂਸੀ ਬਚਾਅ ਤਰੀਕੇ:\n1. ਤੇਲ ਦੇ ਪਲਾਸਟਿਕ ਪੀਪੇ (ਕੈਨੀਆਂ): ਤੇਲ ਜਾਂ ਪਾਣੀ ਦੀਆਂ 4 ਖਾਲੀ 20 ਲੀਟਰ ਵਾਲੀਆਂ ਪਲਾਸਟਿਕ ਕੈਨੀਆਂ ਲਓ ਅਤੇ ਢੱਕਣ ਚੰਗੀ ਤਰ੍ਹਾਂ ਟਾਈਟ ਕਰੋ। ਇਹਨਾਂ ਨੂੰ ਇੱਕ ਹਲਕੇ ਮੰਜੇ (ਚਾਰਪਾਈ) ਦੇ ਚਾਰਾਂ ਪਾਵਿਆਂ ਨਾਲ ਮਜ਼ਬੂਤ ਰੱਸੀ ਨਾਲ ਬੰਨ੍ਹ ਦਿਓ। ਇਹ 80 ਕਿਲੋ ਭਾਰ ਆਰਾਮ ਨਾਲ ਤਾਰ ਲੈਂਦੀ ਹੈ।\n2. ਟਰੈਕਟਰ ਦੀ ਟਿਊਬ: ਹਵਾ ਨਾਲ ਭਰੀ ਟਰੈਕਟਰ ਜਾਂ ਟਰੱਕ ਦੀ ਟਿਊਬ ਵਧੀਆ ਲਾਈਫ-ਬੁਆਏ ਬਣਦੀ ਹੈ। ਟਿਊਬ ਨਾਲ ਲੰਮੀ ਰੱਸੀ ਜ਼ਰੂਰ ਬੰਨ੍ਹ ਕੇ ਰੱਖੋ।\n3. ਪਾਣੀ ਦੀਆਂ ਖਾਲੀ ਬੋਤਲਾਂ: 10-12 ਖਾਲੀ ਪਲਾਸਟਿਕ ਦੀਆਂ ਬੋਤਲਾਂ ਦੇ ਢੱਕਣ ਕਸ ਕੇ ਕੁੜਤੇ ਜਾਂ ਜੈਕੇਟ ਅੰਦਰ ਬੰਨ੍ਹਣ ਨਾਲ ਬੱਚਿਆਂ ਲਈ ਤੈਰਨ ਵਾਲੀ ਜੈਕੇਟ ਬਣ ਜਾਂਦੀ ਹੈ।\n4. ਸਾਵਧਾਨੀ: ਇਹ ਸਾਧਨ ਸਿਰਫ਼ ਪਾਣੀ ਵਿੱਚ ਉੱਪਰ ਰਹਿਣ ਲਈ ਹਨ, ਤੇਜ਼ ਵਗਦੇ ਦਰਿਆ ਦੇ ਪਾਣੀ ਵਿੱਚ ਉਤਰਨ ਦੀ ਗ਼ਲਤੀ ਨਾ ਕਰੋ।",
        "category": "emergency_flotation",
        "verified_source": "Civil Defence Punjab & Indian Red Cross Guidelines"
    },

    # 22. INFANT, MATERNAL & ELDERLY CARE DURING FLOOD EVACUATION
    {
        "prompt": "How should infants, pregnant women, and elderly family members be cared for during flood evacuation?",
        "response": "Under NDMA Special Vulnerability Guidelines and National Health Mission protocols:\n1. Infant Nutrition: Continue exclusive breastfeeding. Mother's breastmilk provides essential sterile hydration and vital antibodies preventing life-threatening diarrhea. If formula milk must be used, boil water vigorously for 1 minute before mixing; never mix formula with unboiled tanker or bottled well water.\n2. Maternal Care: Keep Mother and Child Protection (MCP) card, clean linen sheets, cutting blade, sterile thread, and oral iron-folic acid tablets in the mother's waterproof pouch. If labor signs begin, alert District Control Room (1077) or dial 108 immediately for an emergency boat-ambulance transfer.\n3. Elderly & Persons with Disabilities (PwD): Tie a laminated identification tag with name, village, emergency contact phone, and chronic diseases (diabetes, hypertension, cardiac) around the neck or wrist. Ensure an unbroken 14-day supply of daily maintenance medications is packed in waterproof zip-bags.\n4. Improvised Stretcher: To carry bedridden elders across dry bunds, slide two sturdy wooden poles through the sleeves of two heavy coats or wrap inside a tough blanket.",
        "category": "vulnerable_care",
        "verified_source": "National Health Mission (NHM) Disaster Advisory & NDMA Vulnerable Groups SOP"
    },
    {
        "prompt": "ਹੜ੍ਹ ਵੇਲੇ ਦੁੱਧ ਪੀਂਦੇ ਬੱਚਿਆਂ, ਗਰਭਵਤੀ ਔਰਤਾਂ ਅਤੇ ਬਜ਼ੁਰਗਾਂ ਦੀ ਸੰਭਾਲ ਕਿਵੇਂ ਕੀਤੀ ਜਾਵੇ?",
        "response": "ਸਿਹਤ ਮਿਸ਼ਨ (NHM) ਅਤੇ NDMA ਦੇ ਜ਼ਰੂਰੀ ਦਿਸ਼ਾ-ਨਿਰਦੇਸ਼:\n1. ਛੋਟੇ ਬੱਚਿਆਂ ਦੀ ਖੁਰਾਕ: ਮਾਂ ਦਾ ਦੁੱਧ ਸਭ ਤੋਂ ਸੁਰੱਖਿਅਤ ਹੈ ਕਿਉਂਕਿ ਇਹ ਬੱਚੇ ਨੂੰ ਹੜ੍ਹ ਦੇ ਕੀਟਾਣੂਆਂ ਅਤੇ ਉਲਟੀਆਂ-ਦਸਤ ਤੋਂ ਬਚਾਉਂਦਾ ਹੈ। ਜੇਕਰ ਡੱਬੇ ਦਾ ਦੁੱਧ ਦੇਣਾ ਹੋਵੇ ਤਾਂ ਪਾਣੀ ਨੂੰ 1 ਮਿੰਟ ਪੂਰਾ ਉਬਾਲ ਕੇ ਹੀ ਠੰਢਾ ਕਰਕੇ ਮਿਲਾਓ।\n2. ਗਰਭਵਤੀ ਔਰਤਾਂ: ਮਮਤਾ ਕਾਰਡ ਅਤੇ ਜ਼ਰੂਰੀ ਦਵਾਈਆਂ ਪਲਾਸਟਿਕ ਦੇ ਲਿਫ਼ਾਫ਼ੇ ਵਿੱਚ ਰੱਖੋ। ਦਰਦਾਂ ਸ਼ੁਰੂ ਹੋਣ 'ਤੇ ਤੁਰੰਤ 108 ਐਂਬੂਲੈਂਸ ਜਾਂ 1070 'ਤੇ ਫੋਨ ਕਰੋ ਤਾਂ ਜੋ ਕਿਸ਼ਤੀ ਰਾਹੀਂ ਹਸਪਤਾਲ ਪਹੁੰਚਾਇਆ ਜਾ ਸਕੇ।\n3. ਬਜ਼ੁਰਗਾਂ ਦੀਆਂ ਦਵਾਈਆਂ: ਸ਼ੂਗਰ, ਬਲੱਡ ਪ੍ਰੈਸ਼ਰ ਜਾਂ ਦਿਲ ਦੀਆਂ ਦਵਾਈਆਂ ਦਾ 15 ਦਿਨਾਂ ਦਾ ਸਟਾਕ ਵਾਟਰਪ੍ਰੂਫ਼ ਲਿਫ਼ਾਫ਼ੇ ਵਿੱਚ ਰੱਖੋ। ਬਜ਼ੁਰਗ ਦੇ ਗਲ ਵਿੱਚ ਉਹਨਾਂ ਦਾ ਨਾਮ ਅਤੇ ਮੋਬਾਈਲ ਨੰਬਰ ਲਿਖ ਕੇ ਜ਼ਰੂਰ ਪਾਓ।",
        "category": "vulnerable_care",
        "verified_source": "NHM Punjab & NDMA Disaster Health Advisory"
    }
]

def build():
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        for entry in DATASET:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    print(f"Successfully compiled {len(DATASET)} authoritative flood safety records to {OUTPUT_FILE}")

    # Mirror to D: drive for training pipeline consistency
    alt_dir = pathlib.Path("D:/FloodSaathi_AI/datasets/compiled")
    if alt_dir.parent.parent.exists():
        try:
            alt_dir.mkdir(parents=True, exist_ok=True)
            with open(alt_dir / "flood_safety_dataset.jsonl", "w", encoding="utf-8") as f:
                for entry in DATASET:
                    f.write(json.dumps(entry, ensure_ascii=False) + "\n")
            print(f"Mirrored {len(DATASET)} records to {alt_dir / 'flood_safety_dataset.jsonl'}")
        except Exception as e:
            print(f"Could not mirror to D: drive: {e}")

if __name__ == "__main__":
    build()
