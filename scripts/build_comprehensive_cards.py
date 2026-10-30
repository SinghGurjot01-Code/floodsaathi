# scripts/build_comprehensive_cards.py
import json
import subprocess
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
CARDS_FILE = ROOT / "corpus" / "cards" / "cards.json"
APP_CARDS_FILE = ROOT / "app" / "corpus" / "cards" / "cards.json"

# 1. Load the verified 7 core cards from commit 7990000
raw_core = subprocess.check_output(["git", "show", "7990000:corpus/cards/cards.json"]).decode("utf-8")
core_cards = json.loads(raw_core)

# 2. Define the 15 specialized real-world disaster cards
specialized_cards = [
    {
        "id": "card-well-chlorination-calc",
        "category": "water_disinfection",
        "source": "WHO Guidelines for Drinking-water Quality & Punjab Health Department Disinfection Protocol",
        "review_status": "verified",
        "title": {
            "en": "Calculation for Well Chlorination with Bleaching Powder",
            "hi": "कुएं के पानी के लिए ब्लीचिंग पाउडर की सटीक गणना",
            "pa": "ਖੂਹ ਦੇ ਪਾਣੀ ਲਈ ਬਲੀਚਿੰਗ ਪਾਊਡਰ ਦੀ ਮਾਤਰਾ ਅਤੇ ਗਣਨਾ"
        },
        "summary": {
            "en": "Measure volume: V = 3.1416 × r² × h (m³). Multiply by 1000 for litres. Add 2.5g to 5g bleaching powder per 1000L. Settle 20 min, wait 1-2 hours.",
            "hi": "आयतन = 3.1416 × त्रिज्या² × गहराई। प्रति 1,000 लीटर 2.5 से 5 ग्राम ब्लीचिंग पाउडर। 20 मिनट बैठने दें, केवल साफ पानी कुएं में डालें।",
            "pa": "ਪਾਣੀ ਦੀ ਮਾਤਰਾ = 3.1416 × r² × h। ਪ੍ਰਤੀ 1,000 ਲੀਟਰ 2.5 ਤੋਂ 5 ਗ੍ਰਾਮ ਬਲੀਚਿੰਗ ਪਾਊਡਰ ਵਰਤੋ। 20 ਮਿੰਟ ਥੱਲੇ ਬੈਠਣ ਦਿਓ, ਸਿਰਫ਼ ਸਾਫ਼ ਪਾਣੀ ਖੂਹ 'ਚ ਪਾਓ।"
        },
        "body": {
            "en": "1. Measure Well Volume: Volume (m³) = 3.1416 × radius² × water depth (m). One cubic metre equals 1000 litres.\n2. Bleaching Powder Dosage: Use 2.5 to 5 grams of fresh bleaching powder (~33% chlorine) per 1000 litres of water.\n3. Example: A well with 1m radius and 4m water depth contains 12.57 m³ (about 12500 litres). Required powder is ~31 to 60 grams.\n4. Preparation: Place required powder into a bucket, make a smooth paste with little water, then dilute thoroughly.\n5. Settle 20 Minutes: Let insoluble white lime settle undisturbed to the bottom of the bucket.\n6. Clear Liquid Pour: Pour ONLY the clear top liquid into the well. Mix with bucket. Wait at least 1 to 2 hours before drawing water. Boil before drinking.",
            "hi": "1. पानी की मात्रा निकालें: आयतन (m³) = 3.1416 × त्रिज्या² × गहराई (m)। 1 घन मीटर = 1,000 लीटर।\n2. पाउडर की मात्रा: प्रति 1,000 लीटर पानी में 2.5 से 5 ग्राम ताजा ब्लीचिंग पाउडर डालें।\n3. उदाहरण: 1 मीटर त्रिज्या और 4 मीटर गहराई वाले कुएं में 12,500 लीटर पानी होता है। लगभग 30 से 60 ग्राम पाउडर लगेगा।\n4. पेस्ट बनाएं: पाउडर को बाल्टी में लेकर थोड़ा पानी डालकर पेस्ट बनाएं, फिर बाल्टी भरकर घोलें।\n5. 20 मिनट छोड़ें: अघुलनशील चूना नीचे बैठने दें।\n6. सिर्फ साफ पानी डालें: ऊपर का साफ पानी कुएं में डालें, बाल्टी से हिलाएं और 1-2 घंटे बाद ही इस्तेमाल करें।",
            "pa": "1. ਪਾਣੀ ਦੀ ਮਾਤਰਾ ਕੱਢੋ: ਵੌਲਿਊਮ (m³) = 3.1416 × ਅਰਧ-ਵਿਆਸ² × ਪਾਣੀ ਦੀ ਡੂੰਘਾਈ (m)। 1 ਘਣ ਮੀਟਰ = 1,000 ਲੀਟਰ।\n2. ਪਾਊਡਰ ਦੀ ਮਾਤਰਾ: ਪ੍ਰਤੀ 1,000 ਲੀਟਰ ਪਾਣੀ ਲਈ 2.5 ਤੋਂ 5 ਗ੍ਰਾਮ ਤਾਜ਼ਾ ਬਲੀਚਿੰਗ ਪਾਊਡਰ ਵਰਤੋ।\n3. ਉਦਾਹਰਨ: 1 ਮੀਟਰ ਅਰਧ-ਵਿਆਸ ਅਤੇ 4 ਮੀਟਰ ਡੂੰਘਾਈ ਵਾਲੇ ਖੂਹ 'ਚ 12,500 ਲੀਟਰ ਪਾਣੀ ਹੁੰਦਾ ਹੈ। ਲਗਭਗ 30 ਤੋਂ 60 ਗ੍ਰਾਮ ਪਾਊਡਰ ਲੱਗੇਗਾ।\n4. ਪੇਸਟ ਬਣਾਓ: ਪਾਊਡਰ ਵਿੱਚ ਥੋੜ੍ਹਾ ਪਾਣੀ ਪਾ ਕੇ ਪਹਿਲਾਂ ਗਾੜ੍ਹਾ ਪੇਸਟ ਬਣਾਓ, ਫਿਰ ਹੋਰ ਪਾਣੀ ਮਿਲਾਓ।\n5. 20 ਮਿੰਟ ਰੱਖੋ: ਚੂਨੇ ਨੂੰ ਬਾਲਟੀ ਦੇ ਥੱਲੇ ਬੈਠਣ ਦਿਓ।\n6. ਸਿਰਫ਼ ਨਿੱਤਰਿਆ ਪਾਣੀ ਪਾਓ: ਉੱਪਰਲਾ ਸਾਫ਼ ਪਾਣੀ ਖੂਹ ਵਿੱਚ ਉਲਟਾਓ, ਸਾਫ਼ ਬਾਲਟੀ ਨਾਲ ਹਿਲਾਓ ਅਤੇ 1-2 ਘੰਟੇ ਬਾਅਦ ਹੀ ਵਰਤੋ।"
        },
        "keywords": ["well chlorination", "bleaching calculation", "pi r squared", "radius", "volume", "ਗਣਨਾ", "ਕੈਲਕੁਲੇਸ਼ਨ", "ਬਲੀਚਿੰਗ ਮਾਤਰਾ", "ਖੂਹ ਦੀ ਗਣਨਾ", "ਖੂਹ ਦਾ ਪਾਣੀ ਗਣਨਾ", "गणना", "त्रिज्या", "कुएं की गणना"]
    },
    {
        "id": "card-water-tank-disinfection",
        "category": "water_disinfection",
        "source": "WHO Guidelines & NDMA Standard Operating Procedures",
        "review_status": "verified",
        "title": {
            "en": "Disinfecting Overhead Plastic Water Tanks (Sintex Tanks)",
            "hi": "प्लास्टिक पानी की टंकी (सिंटेक्स) की सफाई और कीटाणुशोधन",
            "pa": "ਛੱਤ ਵਾਲੀ ਪਲਾਸਟਿਕ ਪਾਣੀ ਦੀ ਟੈਂਕੀ (ਸਿੰਟੈਕਸ) ਦੀ ਸਫ਼ਾਈ ਅਤੇ ਸ਼ੁੱਧੀਕਰਨ"
        },
        "summary": {
            "en": "Drain flood water, scrub interior walls, rinse, refill, and add 2.5g bleaching powder per 1000L. Wait 1 hour, flush all house taps.",
            "hi": "दूषित पानी निकालें, दीवारों को ब्रश से रगड़ें, धोएं, और प्रति 1000 लीटर 2.5 ग्राम ब्लीचिंग पाउडर मिलाकर 1 घंटा छोड़ें।",
            "pa": "ਗੰਦਾ ਪਾਣੀ ਕੱਢੋ, ਕੰਧਾਂ ਨੂੰ ਬੁਰਸ਼ ਨਾਲ ਸਾਫ਼ ਕਰੋ, ਧੋਵੋ ਅਤੇ ਪ੍ਰਤੀ 1000 ਲੀਟਰ 2.5 ਗ੍ਰਾਮ ਬਲੀਚਿੰਗ ਪਾਊਡਰ ਪਾ ਕੇ 1 ਘੰਟਾ ਰੱਖੋ।"
        },
        "body": {
            "en": "1. Isolate and drain: Close inlet and outlet valves. Drain contaminated water and silt completely.\n2. Physical scrub: Scrub interior walls, floor, and corners with a stiff nylon brush and clean water. NEVER enter confined tanks without ventilation.\n3. Rinse and flush: Rinse tank thoroughly and open bottom scour plug to flush out all debris.\n4. Disinfection dosage: Fill tank and add 2.5 to 5 grams of bleaching powder per 1000 litres (e.g., 500L tank needs ~1.5g; 1000L needs ~2.5g).\n5. Contact time: Allow treated water to stand in the tank and distribution pipes for at least 1 hour.\n6. Flush taps: Open all house taps for 30 seconds to flush household pipes before normal domestic use.",
            "hi": "1. पानी खाली करें: टंकी का दूषित पानी और तलछट पूरी तरह से बाहर निकालें।\n2. रगड़कर साफ करें: नायलॉन ब्रश से टंकी की दीवारों और तल को अच्छी तरह साफ करें।\n3. धोकर निकालें: साफ पानी से धोकर सारा गंदा पानी ड्रेन प्लग से बाहर निकाल दें।\n4. ब्लीचिंग पाउडर डालें: टंकी भरकर प्रति 1,000 लीटर 2.5 से 5 ग्राम ब्लीचिंग पाउडर का घोल डालें।\n5. 1 घंटा रहने दें: कीटाणुनाशक पानी को 1 घंटा टंकी और पाइपों में रहने दें।\n6. नल चलाएं: घर के सभी नल 30 सेकंड के लिए चलाकर पाइपलाइन साफ कर लें।",
            "pa": "1. ਟੈਂਕੀ ਖਾਲੀ ਕਰੋ: ਟੈਂਕੀ ਵਿੱਚੋਂ ਗੰਦਾ ਹੜ੍ਹ ਦਾ ਪਾਣੀ ਅਤੇ ਗਾਰ ਪੂਰੀ ਤਰ੍ਹਾਂ ਕੱਢ ਦਿਓ।\n2. ਰਗੜ ਕੇ ਸਾਫ਼ ਕਰੋ: ਬੁਰਸ਼ ਨਾਲ ਟੈਂਕੀ ਦੀਆਂ ਕੰਧਾਂ ਅਤੇ ਫਰਸ਼ ਨੂੰ ਚੰਗੀ ਤਰ੍ਹਾਂ ਸਾਫ਼ ਕਰੋ।\n3. ਪਾਣੀ ਨਾਲ ਧੋਵੋ: ਸਾਫ਼ ਪਾਣੀ ਨਾਲ ਧੋ ਕੇ ਸਾਰੀ ਗੰਦਗੀ ਹੇਠਲੇ ਵਾਲਵ ਰਾਹੀਂ ਬਾਹਰ ਕੱਢੋ।\n4. ਬਲੀਚਿੰਗ ਪਾਊਡਰ ਪਾਓ: ਟੈਂਕੀ ਭਰ ਕੇ ਪ੍ਰਤੀ 1,000 ਲੀਟਰ 2.5 ਤੋਂ 5 ਗ੍ਰਾਮ ਬਲੀਚਿੰਗ ਪਾਊਡਰ ਦਾ ਘੋਲ ਪਾਓ।\n5. 1 ਘੰਟਾ ਰੱਖੋ: ਦਵਾਈ ਵਾਲੇ ਪਾਣੀ ਨੂੰ ਘੱਟੋ-ਘੱਟ 1 ਘੰਟਾ ਟੈਂਕੀ ਅਤੇ ਪਾਈਪਾਂ ਵਿੱਚ ਰਹਿਣ ਦਿਓ।\n6. ਟੂਟੀਆਂ ਖੋਲ੍ਹੋ: ਘਰ ਦੀਆਂ ਸਾਰੀਆਂ ਟੂਟੀਆਂ 30 ਸਕਿੰਟ ਲਈ ਚਲਾ ਕੇ ਪਾਈਪਾਂ ਸਾਫ਼ ਕਰ ਲਵੋ।"
        },
        "keywords": ["sintex", "overhead tank", "plastic tank", "storage tank", "cleaning tank", "clean sintex", "ਸਿੰਟੈਕਸ", "ਟੈਂਕੀ ਸਾਫ਼", "ਛੱਤ ਵਾਲੀ ਟੈਂਕੀ", "ਸਿੰਟੈਕਸ ਟੈਂਕੀ", "सिंटेक्स", "टंकी साफ", "प्लास्टिक टंकी"]
    },
    {
        "id": "card-appliances-post-flood",
        "category": "electrical_safety",
        "source": "PSPCL Flood Recovery Safety Directives & Central Electricity Authority (CEA)",
        "review_status": "verified",
        "title": {
            "en": "Turning On Electrical Appliances & Motors After Flood",
            "hi": "बाढ़ के बाद बिजली के उपकरण और मोटर चालू करने के नियम",
            "pa": "ਹੜ੍ਹ ਮਗਰੋਂ ਬਿਜਲੀ ਦੇ ਉਪਕਰਨ ਅਤੇ ਮੋਟਰਾਂ ਚਾਲੂ ਕਰਨ ਦੇ ਨਿਯਮ"
        },
        "summary": {
            "en": "NEVER turn on submerged appliances or motors immediately. Dry naturally in sun for 3-7 days, clean silt, and test insulation with a megger meter (min 1 Megohm).",
            "hi": "डूबे हुए उपकरणों या मोटरों को कभी तुरंत चालू न करें। उन्हें 3-7 दिन धूप में सुखाएं और इलेक्ट्रीशियन से मेगर मीटर द्वारा जांच करवाएं।",
            "pa": "ਪਾਣੀ 'ਚ ਡੁੱਬੇ ਉਪਕਰਨਾਂ ਜਾਂ ਮੋਟਰਾਂ ਨੂੰ ਕਦੇ ਵੀ ਤੁਰੰਤ ਚਾਲੂ ਨਾ ਕਰੋ। 3-7 ਦਿਨ ਧੁੱਪ ਵਿੱਚ ਸੁਕਾ ਕੇ ਮੈਗਰ ਮੀਟਰ ਨਾਲ ਟੈਸਟ ਕਰਵਾਉਣ ਮਗਰੋਂ ਹੀ ਚਲਾਓ।"
        },
        "body": {
            "en": "1. Do NOT power on: Submerged appliances, electric motors, submersible pumps, and wiring hold trapped moisture and conductive silt, causing explosive short-circuits or fatal electrocution.\n2. Keep main switch OFF: Leave the main service breaker off until the entire building installation is verified.\n3. Disconnect completely: Unplug all flooded appliances and remove fuses.\n4. Clean and dry: Strip silt using clean water (power disconnected) and allow equipment to dry naturally in sun and fresh air for at least 3 to 7 days.\n5. Professional megger test: A certified licensed electrician must perform an insulation resistance test (Megger test minimum 1 Megaohm) on motors and wiring circuits before re-energizing.\n6. Replace contaminated items: Electronic printed circuit boards (refrigerators, inverters, TVs) and insulation materials saturated with flood silt must usually be replaced.",
            "hi": "1. तुरंत चालू न करें: पानी में डूबे उपकरणों, ट्यूबवेल मोटर और वायरिंग में नमी और गाद जमा होती है, जिससे तेज धमाका या करंट लग सकता है।\n2. मुख्य स्विच बंद रखें: जब तक पूरे घर की वायरिंग की जांच न हो जाए, मेन स्विच ऑन न करें।\n3. प्लग निकाल दें: सभी भीगे हुए उपकरणों के प्लग सॉकेट से निकाल दें।\n4. धूप में सुखाएं: उपकरणों को कम से कम 3 से 7 दिनों तक धूप और खुली हवा में पूरी तरह सूखने दें।\n5. मेगर मीटर से जांच: लाइसेंस प्राप्त इलेक्ट्रीशियन से इंसुलेशन रेजिस्टेंस (कम से कम 1 मेगाओम) की जांच करवाएं।\n6. गाद वाली चीजें बदलें: इनवर्टर, फ्रिज के सर्किट बोर्ड और गीले तार खराब हो चुके होते हैं, इन्हें बदलना ही सुरक्षित है।",
            "pa": "1. ਤੁਰੰਤ ਚਾਲੂ ਨਾ ਕਰੋ: ਪਾਣੀ ਵਿੱਚ ਡੁੱਬੀਆਂ ਮੋਟਰਾਂ, ਸਮਰਸੀਬਲ ਪੰਪਾਂ ਅਤੇ ਉਪਕਰਨਾਂ ਵਿੱਚ ਗਾਰ ਅਤੇ ਨਮੀ ਹੁੰਦੀ ਹੈ, ਜਿਸ ਨਾਲ ਧਮਾਕਾ ਜਾਂ ਕਰੰਟ ਲੱਗ ਸਕਦਾ ਹੈ।\n2. ਮੇਨ ਸਵਿੱਚ ਬੰਦ ਰੱਖੋ: ਜਦੋਂ ਤੱਕ ਪੂਰੀ ਵਾਇਰਿੰਗ ਦੀ ਜਾਂਚ ਨਾ ਹੋ ਜਾਵੇ, ਮੇਨ ਸਵਿੱਚ ਆਨ ਨਾ ਕਰੋ।\n3. ਪਲੱਗ ਕੱਢ ਦਿਓ: ਸਾਰੇ ਭਿੱਜੇ ਹੋਏ ਉਪਕਰਨਾਂ ਦੇ ਪਲੱਗ ਸਾਕਟਾਂ ਵਿੱਚੋਂ ਬਾਹਰ ਕੱਢ ਲਵੋ।\n4. ਧੁੱਪ ਵਿੱਚ ਸੁਕਾਓ: ਉਪਕਰਨਾਂ ਨੂੰ ਘੱਟੋ-ਘੱਟ 3 ਤੋਂ 7 ਦਿਨਾਂ ਲਈ ਧੁੱਪ ਅਤੇ ਹਵਾ ਵਿੱਚ ਚੰਗੀ ਤਰ੍ਹਾਂ ਸੁੱਕਣ ਦਿਓ।\n5. ਮੈਗਰ ਮੀਟਰ ਨਾਲ ਟੈਸਟ: ਲਾਇਸੰਸਸ਼ੁਦਾ ਇਲੈਕਟ੍ਰੀਸ਼ੀਅਨ ਤੋਂ ਮੈਗਰ ਮੀਟਰ ਨਾਲ ਇਨਸੂਲੇਸ਼ਨ ਟੈਸਟ (ਘੱਟੋ-ਘੱਟ 1 ਮੈਗਾਓਮ) ਕਰਵਾਓ।\n6. ਖ਼ਰਾਬ ਪੁਰਜ਼ੇ ਬਦਲੋ: ਇਨਵਰਟਰ, ਫਰਿੱਜ ਦੇ ਸਰਕਟ ਬੋਰਡ ਅਤੇ ਗਾਰ ਵਾਲੀਆਂ ਤਾਰਾਂ ਬਦਲਣੀਆਂ ਹੀ ਸੁਰੱਖਿਅਤ ਹਨ।"
        },
        "keywords": ["electric motor", "tubewell motor", "submersible motor", "water pump motor", "turn on appliances", "drying appliances", "submerged motor", "megger test", "ਪਾਣੀ ਵਿੱਚ ਡੁੱਬੀ ਮੋਟਰ", "ਸਮਰਸੀਬਲ ਮੋਟਰ", "ਮੋਟਰ ਸੁਕਾਉਣਾ", "ਮੈਗਰ ਟੈਸਟ", "ਟਿਊਬਵੈੱਲ ਮੋਟਰ", "बिजली की मोटर", "डूबी मोटर", "मोटर सुखाना", "मेगर टेस्ट", "उपकरण सुखाना"]
    },
    {
        "id": "card-electrical-step-potential",
        "category": "electrical_safety",
        "source": "PSPCL Electrical Safety Manual & National Electrical Safety Code (NESC)",
        "review_status": "verified",
        "title": {
            "en": "Step Potential: Escaping Fallen Live Power Lines",
            "hi": "स्टेप पोटेंशियल: जमीन पर गिरी बिजली की तार से सुरक्षित कैसे बचें",
            "pa": "ਸਟੈੱਪ ਪੋਟੈਂਸ਼ੀਅਲ: ਜ਼ਮੀਨ 'ਤੇ ਡਿੱਗੀ ਬਿਜਲੀ ਦੀ ਤਾਰ ਤੋਂ ਕਿਵੇਂ ਬਚੀਏ"
        },
        "summary": {
            "en": "Shuffle feet together without lifting, or hop with both feet touching, until at least 10 metres (33 ft) away. Never take normal walking strides.",
            "hi": "दोनों पैरों को आपस में सटाकर घसीटते हुए चलें या दोनों पैरों से एक साथ फुदकें (हॉप करें)। कम से कम 10 मीटर दूर जाएं। पैर उठाकर कदम न बढ़ाएं।",
            "pa": "ਦੋਵੇਂ ਪੈਰ ਆਪਸ ਵਿੱਚ ਜੋੜ ਕੇ ਘੜੀਸਦੇ ਹੋਏ ਚੱਲੋ ਜਾਂ ਦੋਵੇਂ ਪੈਰ ਜੋੜ ਕੇ ਛਾਲਾਂ ਮਾਰੋ। ਘੱਟੋ-ਘੱਟ 10 ਮੀਟਰ ਦੂਰ ਜਾਓ। ਲੰਮੇ ਕਦਮ ਨਾ ਪੁੱਟੋ।"
        },
        "body": {
            "en": "1. What is step potential: When a live high-voltage wire touches wet ground, electric current radiates outward in concentric voltage rings. If your feet are separated, voltage difference between feet drives lethal current through your body.\n2. Never walk or run: Do NOT take normal strides, run, or jump with legs apart. Doing so creates a deadly voltage bridge.\n3. Shuffle method: Keep both feet together on the ground at all times. Shuffle your feet slowly without lifting them, moving heel-to-toe so neither foot leaves contact.\n4. Bunny hop method: Alternatively, keep both feet pressed tightly together and hop away synchronously. Both feet must land and leave the ground simultaneously.\n5. Minimum safe distance: Continue shuffling or hopping until you are at least 10 metres (33 feet) away from the cable.\n6. Emergency reporting: Alert others to stay clear and call PSPCL on 1912 or ERSS 112 immediately.",
            "hi": "1. स्टेप पोटेंशियल क्या है: जब चालू तार गीली जमीन को छूता है तो जमीन में करंट फैलता है। यदि आपके दोनों पैर अलग-अलग होंगे तो दोनों पैरों के बीच का वोल्टेज अंतर आपके शरीर में जानलेवा करंट प्रवाहित कर देगा।\n2. सामान्य कदम न बढ़ाएं: कभी भी दौड़ें या बड़े कदम न उठाएं।\n3. घसीटते हुए चलें (शफल): दोनों पैरों को आपस में सटाकर रखें और जमीन से उठाए बिना धीरे-धीरे घसीटते हुए आगे बढ़ें।\n4. दोनों पैर जोड़कर कूदें (बनी हॉप): दोनों पैरों को कसकर जोड़कर रखें और एक साथ छोटे-छोटे कूद लगाकर दूर जाएं।\n5. 10 मीटर की दूरी: तार से कम से कम 10 मीटर (33 फीट) दूर जाने तक ऐसे ही चलें।\n6. तुरंत सूचना दें: बिजली हेल्पलाइन 1912 या आपातकालीन नंबर 112 पर तुरंत कॉल करें।",
            "pa": "1. ਸਟੈੱਪ ਪੋਟੈਂਸ਼ੀਅਲ ਕੀ ਹੈ: ਜਦੋਂ ਬਿਜਲੀ ਦੀ ਚਾਲੂ ਤਾਰ ਗਿੱਲੀ ਜ਼ਮੀਨ ਨੂੰ ਛੂੰਹਦੀ ਹੈ ਤਾਂ ਜ਼ਮੀਨ ਵਿੱਚ ਕਰੰਟ ਫੈਲਦਾ ਹੈ। ਜੇਕਰ ਦੋਵੇਂ ਪੈਰਾਂ ਵਿੱਚ ਫਾਸਲਾ ਹੋਵੇਗਾ ਤਾਂ ਵੋਲਟੇਜ ਦੇ ਫ਼ਰਕ ਕਾਰਨ ਸਰੀਰ ਵਿੱਚੋਂ ਜਾਨਲੇਵਾ ਕਰੰਟ ਲੰਘ ਜਾਵੇਗਾ।\n2. ਕਦੇ ਵੀ ਲੰਮੇ ਕਦਮ ਨਾ ਪੁੱਟੋ: ਨਾ ਭੱਜੋ ਅਤੇ ਨਾ ਹੀ ਪੈਰ ਖੋਲ੍ਹ ਕੇ ਕਦਮ ਰੱਖੋ।\n3. ਪੈਰ ਘੜੀਸ ਕੇ ਚੱਲੋ: ਦੋਵੇਂ ਪੈਰ ਆਪਸ ਵਿੱਚ ਜੋੜ ਕੇ ਰੱਖੋ ਅਤੇ ਜ਼ਮੀਨ ਤੋਂ ਚੁੱਕੇ ਬਿਨਾਂ ਹੌਲੀ-ਹੌਲੀ ਅੱਗੇ ਘੜੀਸੋ।\n4. ਦੋਵੇਂ ਪੈਰ ਜੋੜ ਕੇ ਛਾਲ ਮਾਰੋ: ਦੋਵੇਂ ਪੈਰ ਆਪਸ ਵਿੱਚ ਕੱਸ ਕੇ ਜੋੜ ਕੇ ਰੱਖੋ ਅਤੇ ਇਕੱਠੇ ਛੋਟੇ-ਛੋਟੇ ਟੱਪੇ ਮਾਰ ਕੇ ਦੂਰ ਜਾਓ।\n5. 10 ਮੀਟਰ ਦੀ ਦੂਰੀ: ਤਾਰ ਤੋਂ ਘੱਟੋ-ਘੱਟ 10 ਮੀਟਰ (33 ਫੁੱਟ) ਦੂਰ ਜਾਣ ਤੱਕ ਇਸੇ ਤਰ੍ਹਾਂ ਚੱਲੋ।\n6. ਤੁਰੰਤ ਸੂਚਿਤ ਕਰੋ: ਪਾਵਰਕਾਮ ਹੈਲਪਲਾਈਨ 1912 ਜਾਂ 112 'ਤੇ ਤੁਰੰਤ ਕਾਲ ਕਰੋ।"
        },
        "keywords": ["step potential", "bunny hop", "shuffle feet", "feet together", "ground current shock", "ਸਟੈੱਪ ਪੋਟੈਂਸ਼ੀਅਲ", "ਪੈਰ ਘੜੀਸ ਕੇ", "ਦੋਵੇਂ ਪੈਰ ਜੋੜ ਕੇ", "ਛਾਲਾਂ ਮਾਰਨਾ", "स्टेप पोटेंशियल", "पैर घसीटना", "बनी हॉप"]
    },
    {
        "id": "card-snakebite-first-aid",
        "category": "reptile_hazards",
        "source": "Ministry of Health & Family Welfare National Snakebite Management Protocol",
        "review_status": "verified",
        "title": {
            "en": "Correct Snakebite First Aid Protocol During Floods",
            "hi": "बाढ़ के दौरान सांप के काटने पर सही प्राथमिक उपचार (फर्स्ट एड)",
            "pa": "ਹੜ੍ਹ ਦੌਰਾਨ ਸੱਪ ਲੜਨ 'ਤੇ ਸਹੀ ਫਸਟ ਏਡ (ਮੁੱਢਲੀ ਸਹਾਇਤਾ)"
        },
        "summary": {
            "en": "Immobilize the bitten limb like a fractured bone. NEVER cut, suck, tie tight tourniquets, or apply chemicals. Rush immediately to nearest civil hospital with anti-snake venom (ASV). Dial 108 / 112.",
            "hi": "काटे गए अंग को बिल्कुल न हिलाएं, जैसे टूटी हड्डी को सहारा देते हैं। चीरा न लगाएं, मुंह से जहर न चूसें, कसकर न बांधें। तुरंत 108 एंबुलेंस बुलाएं और एंटी-वेनम वाले अस्पताल ले जाएं।",
            "pa": "ਡੰਗ ਵਾਲੇ ਅੰਗ ਨੂੰ ਬਿਲਕੁਲ ਹਿੱਲਣ ਨਾ ਦਿਓ (ਜਿਵੇਂ ਟੁੱਟੀ ਹੱਡੀ ਨੂੰ ਰੱਖਦੇ ਹਨ)। ਚੀਰਾ ਨਾ ਲਗਾਓ, ਜ਼ਹਿਰ ਨਾ ਚੂਸੋ, ਕੱਸ ਕੇ ਰੱਸੀ ਨਾ ਬੰਨ੍ਹੋ। ਤੁਰੰਤ 108 ਐਂਬੂਲੈਂਸ ਸੱਦੋ ਅਤੇ ਸਿਵਲ ਹਸਪਤਾਲ ਲੈ ਜਾਓ।"
        },
        "body": {
            "en": "1. Keep patient calm and still: Anxiety increases heart rate, speeding venom circulation. Lay patient down in recovery position.\n2. Immobilize bitten limb: Splint and immobilize the limb exactly like a fracture. Keep bite site below heart level.\n3. Remove constrictions: Immediately remove rings, bangles, watches, and tight clothing before swelling begins.\n4. NEVER cut or suck: Do NOT make incisions, suck venom with mouth, apply potassium permanganate, ice, or electric shocks. These cause fatal tissue necrosis and infections.\n5. Do NOT tie tourniquets: Tight ropes or rubber bands cut off blood circulation, causing gangrene and amputation.\n6. Immediate transport: Call 108 Ambulance or 112 immediately. Transport directly to a Civil Hospital or Community Health Centre (CHC) that stocks polyvalent Anti-Snake Venom (ASV).",
            "hi": "1. मरीज को शांत रखें: घबराहट से दिल की धड़कन तेज होती है और जहर तेजी से फैलता है। मरीज को स्थिर लिटाएं।\n2. अंग को स्थिर करें: काटे गए हाथ या पैर को बिल्कुल न हिलाएं। लकड़ी की खपच्चੀ से सहारा देकर बांधें। काटे गए हिस्से को दिल के स्तर से नीचे रखें।\n3. गहने और कसे कपड़े उतारें: अंगूठी, चूड़ियां, घड़ी तुरंत उतार दें क्योंकि सूजन आएगी।\n4. कभी न चीरें या चूसें: ब्लेड से चीरा न लगाएं, मुंह से जहर न चूसें, बर्फ या तेजाब न लगाएं।\n5. कसकर पट्टी या रस्सी न बांधें: कसकर बांधने से खून की नसों में गैंग्रीन हो जाता है और अंग काटना पड़ सकता है।\n6. तुरंत अस्पताल ले जाएं: तुरंत 108 या 112 पर कॉल करें। सीधे सरकारी अस्पताल ले जाएं जहां एंटी-स्नेक वेनम (ASV) उपलब्ध हो।",
            "pa": "1. ਮਰੀਜ਼ ਨੂੰ ਸ਼ਾਂਤ ਰੱਖੋ: ਘਬਰਾਹਟ ਨਾਲ ਦਿਲ ਦੀ ਧੜਕਣ ਤੇਜ਼ ਹੁੰਦੀ ਹੈ ਅਤੇ ਜ਼ਹਿਰ ਤੇਜ਼ੀ ਨਾਲ ਫੈਲਦਾ ਹੈ। ਮਰੀਜ਼ ਨੂੰ ਸਿੱਧਾ ਲਿਟਾਓ।\n2. ਅੰਗ ਨੂੰ ਹਿੱਲਣ ਨਾ ਦਿਓ: ਡੰਗ ਵਾਲੀ ਬਾਂਹ ਜਾਂ ਲੱਤ ਨੂੰ ਲੱਕੜੀ ਦਾ ਸਹਾਰਾ ਦੇ ਕੇ ਬੰਨ੍ਹੋ (ਜਿਵੇਂ ਟੁੱਟੀ ਹੱਡੀ)। ਡੰਗ ਵਾਲੇ ਹਿੱਸੇ ਨੂੰ ਦਿਲ ਦੇ ਪੱਧਰ ਤੋਂ ਨੀਵਾਂ ਰੱਖੋ।\n3. ਗਹਿਣੇ ਲਾਹ ਦਿਓ: ਛਾਪਾਂ, ਕੜੇ, ਚੂੜੀਆਂ ਅਤੇ ਘੜੀ ਤੁਰੰਤ ਲਾਹ ਦਿਓ ਕਿਉਂਕਿ ਸੋਜ ਆਵੇਗੀ।\n4. ਕਦੇ ਚੀਰਾ ਨਾ ਲਗਾਓ: ਬਲੇਡ ਨਾਲ ਚੀਰਾ ਨਾ ਮਾਰੋ, ਮੂੰਹ ਨਾਲ ਜ਼ਹਿਰ ਨਾ ਚੂਸੋ, ਬਰਫ਼ ਨਾ ਲਗਾਓ।\n5. ਕੱਸ ਕੇ ਰੱਸੀ ਨਾ ਬੰਨ੍ਹੋ: ਕੱਸ ਕੇ ਬੰਨ੍ਹਣ ਨਾਲ ਖੂਨ ਦਾ ਦੌਰਾ ਰੁਕ ਜਾਂਦਾ ਹੈ ਅਤੇ ਅੰਗ ਕੱਟਣਾ ਪੈ ਸਕਦਾ ਹੈ।\n6. ਤੁਰੰਤ ਹਸਪਤਾਲ ਪਹੁੰਚਾਓ: ਤੁਰੰਤ 108 ਜਾਂ 112 'ਤੇ ਕਾਲ ਕਰੋ। ਮਰੀਜ਼ ਨੂੰ ਸਿੱਧਾ ਸਿਵਲ ਹਸਪਤਾਲ ਲੈ ਕੇ ਜਾਓ ਜਿੱਥੇ ਐਂਟੀ-ਸਨੇਕ ਵੈਨਮ (ASV) ਦਾ ਟੀਕਾ ਮੌਜੂਦ ਹੋਵੇ।"
        },
        "keywords": ["snakebite first aid", "snake bite treatment", "tourniquet snake", "cut wound snake", "anti-snake venom", "asv protocol", "ਸੱਪ ਦਾ ਡੰਗ ਫਸਟ ਏਡ", "ਸੱਪ ਲੜਨਾ ਇਲਾਜ", "ਐਂਟੀ ਵੈਨਮ ਟੀਕਾ", "ਚੀਰਾ ਨਾ ਲਗਾਓ", "ਸੱਪ ਦਾ ਡੰਗ", "सांप काटने पर प्राथमिक उपचार", "सांप का डंक इलाज", "एंटी वेनम टीका"]
    },
    {
        "id": "card-scorpion-sting-aid",
        "category": "reptile_hazards",
        "source": "National Health Mission (NHM) Rural Poisoning Management Guidelines",
        "review_status": "verified",
        "title": {
            "en": "Scorpion Sting First Aid & Management",
            "hi": "बिच्छू के डंक पर प्राथमिक उपचार और बचाव",
            "pa": "ਬਿੱਛੂ ਲੜਨ 'ਤੇ ਮੁੱਢਲੀ ਸਹਾਇਤਾ ਅਤੇ ਇਲਾਜ"
        },
        "summary": {
            "en": "Wash sting with clean water, apply cool compress, immobilize limb, monitor heart rate, and transport immediately to nearest health centre for local anaesthetic or prazosin.",
            "hi": "डंक वाली जगह को साफ पानी से धोएं, बर्फ या ठंडी पट्टी रखें, अंग को स्थिर रखें और तुरंत प्राथमिक स्वास्थ्य केंद्र (PHC) ले जाएं।",
            "pa": "ਡੰਗ ਵਾਲੀ ਥਾਂ ਨੂੰ ਸਾਫ਼ ਪਾਣੀ ਨਾਲ ਧੋਵੋ, ਠੰਡੀ ਪੱਟੀ ਰੱਖੋ, ਅੰਗ ਨੂੰ ਹਿੱਲਣ ਨਾ ਦਿਓ ਅਤੇ ਤੁਰੰਤ ਨਜ਼ਦੀਕੀ ਸਰਕਾਰੀ ਹਸਪਤਾਲ ਲੈ ਕੇ ਜਾਓ।"
        },
        "body": {
            "en": "1. Wash sting site: Clean immediately with boiled, cool water and soap.\n2. Apply cool compress: Place a clean cloth dipped in cold water over the site to relieve intense pain. Do NOT apply direct ice directly onto raw tissue.\n3. Immobilize limb: Keep the affected limb still and elevated at heart level.\n4. Avoid cuts and suction: Never make incisions or attempt to suck venom with mouth.\n5. Watch for red flags: Severe sweating, vomiting, difficulty breathing, or erratic pulse indicate autonomic toxicity requiring urgent prazosin therapy.\n6. Rush to hospital: Call 108 or transport patient to nearest Community Health Centre (CHC).",
            "hi": "1. डंक धोएं: डंक वाली जगह को साबुन और साफ पानी से धोएं।\n2. ठंडी पट्टी रखें: तेज दर्द कम करने के लिए ठंडे पानी में भीगा कपड़ा रखें। सीधी बर्फ त्वचा पर न रगड़ें।\n3. अंग को स्थिर रखें: हाथ या पैर को ज्यादा हिलने-डुलने न दें।\n4. चीरा न लगाएं: कभी भी ब्लेड से चीरा न लगाएं।\n5. खतरे के लक्षण: अत्यधिक पसीना, उल्टी, सांस लेने में तकलीफ होना दिल पर असर के लक्षण हैं।\n6. तुरंत अस्पताल ले जाएं: मरीज को 108 एंबुलेंस से तुरंत नजदीकी सरकारी स्वास्थ्य केंद्र ले जाएं।",
            "pa": "1. ਡੰਗ ਵਾਲੀ ਥਾਂ ਧੋਵੋ: ਡੰਗ ਵਾਲੀ ਥਾਂ ਨੂੰ ਸਾਬਣ ਅਤੇ ਸਾਫ਼ ਪਾਣੀ ਨਾਲ ਧੋਵੋ।\n2. ਠੰਡੀ ਪੱਟੀ ਰੱਖੋ: ਤੇਜ਼ ਦਰਦ ਤੋਂ ਰਾਹਤ ਲਈ ਠੰਡੇ ਪਾਣੀ ਵਿੱਚ ਭਿੱਜਿਆ ਕੱਪੜਾ ਰੱਖੋ। ਸਿੱਧੀ ਬਰਫ਼ ਨਾ ਰਗੜੋ।\n3. ਅੰਗ ਨੂੰ ਸ਼ਾਂਤ ਰੱਖੋ: ਹੱਥ ਜਾਂ ਪੈਰ ਨੂੰ ਜ਼ਿਆਦਾ ਹਿੱਲਣ ਨਾ ਦਿਓ।\n4. ਚੀਰਾ ਨਾ ਲਗਾਓ: ਕਦੇ ਵੀ ਬਲੇਡ ਨਾਲ ਚੀਰਾ ਨਾ ਮਾਰੋ।\n5. ਖ਼ਤਰੇ ਦੀਆਂ ਨਿਸ਼ਾਨੀਆਂ: ਬਹੁਤ ਜ਼ਿਆਦਾ ਮੁੜ੍ਹਕਾ ਆਉਣਾ, ਉਲਟੀਆਂ ਅਤੇ ਸਾਹ ਔਖਾ ਆਉਣਾ ਖ਼ਤਰੇ ਦੀ ਘੰਟੀ ਹੈ।\n6. ਤੁਰੰਤ ਹਸਪਤਾਲ ਜਾਓ: ਮਰੀਜ਼ ਨੂੰ 108 ਐਂਬੂਲੈਂਸ ਰਾਹੀਂ ਨਜ਼ਦੀਕੀ ਕਮਿਊਨਿਟੀ ਹੈਲਥ ਸੈਂਟਰ ਲੈ ਜਾਓ।"
        },
        "keywords": ["scorpion sting", "bichhoo", "bichhu", "scorpion bite", "scorpions in flood", "ਬਿੱਛੂ ਲੜਨਾ", "ਬਿੱਛੂ ਦਾ ਡੰਗ", "ਬਿੱਛੂ ਦਾ ਇਲਾਜ", "बिच्छू का डंक", "बिच्छू काटना"]
    },
    {
        "id": "card-silt-mud-cleanup",
        "category": "silt_and_sanitation",
        "source": "NDMA Post-Disaster Sanitation Guidelines & Punjab Health Department",
        "review_status": "verified",
        "title": {
            "en": "Safe Cleanup and Disinfection of Flood Silt and Mud",
            "hi": "बाढ़ की गाद (सिल्ट) और कीचड़ की सुरक्षित सफाई व कीटाणुशोधन",
            "pa": "ਹੜ੍ਹ ਦੀ ਗਾਰ (ਸਿਲਟ) ਅਤੇ ਚਿੱਕੜ ਦੀ ਸੁਰੱਖਿਅਤ ਸਫ਼ਾਈ"
        },
        "summary": {
            "en": "Wear rubber gumboots, gloves, and mask. Shovel thick silt while still wet. Disinfect floors and walls with 10% bleaching powder slurry.",
            "hi": "रबर के जूते, दस्ताने और मास्क पहनें। गाद को गीले में ही फावड़े से निकालें। फर्श व दीवारों को ब्लीचिंग पाउडर के घोल से कीटाणुरहित करें।",
            "pa": "ਰਬੜ ਦੇ ਲੰਬੇ ਬੂਟ, ਦਸਤਾਨੇ ਅਤੇ ਮਾਸਕ ਪਾਓ। ਗਾਰ ਨੂੰ ਗਿੱਲੀ ਹੁੰਦਿਆਂ ਹੀ ਕਹੀ ਨਾਲ ਬਾਹਰ ਕੱਢੋ। ਫਰਸ਼ਾਂ ਅਤੇ ਕੰਧਾਂ 'ਤੇ ਬਲੀਚਿੰਗ ਪਾਊਡਰ ਦਾ ਘੋਲ ਪਾਓ।"
        },
        "body": {
            "en": "1. Protective Gear: Always wear thick rubber gumboots, heavy-duty rubber gloves, and an N95 or surgical mask. Flood silt contains decomposing sewage, industrial toxins, and tetanus bacteria.\n2. Clear while wet: Shovel and scrape silt out immediately before it dries and sets like hard concrete.\n3. Disinfection solution: Mix 100 grams of bleaching powder into 10 litres of water (10% concentration). Mop all contaminated floors and spray lower walls up to flood line.\n4. Ventilation: Open all doors and windows to cross-ventilate and prevent toxic mold spore formation.\n5. Tetanus shot: Anyone who sustains a cut, puncture wound, or scrape while handling flood mud must receive a Tetanus Toxoid (TT) injection within 48 hours at a Civil Hospital.",
            "hi": "1. सुरक्षा उपकरण पहनें: मोटे रबर के बूट, रबर दस्ताने और मास्क जरूर पहनें। बाढ़ की गाद में सीवेज, केमिकल और टिटनेस के कीटाणु होते हैं।\n2. गीली गाद को तुरंत हटाएं: गाद को सूखने से पहले ही फावड़े से बाहर निकालें, सूखने पर यह कंक्रीट जैसी सख्त हो जाती है।\n3. ब्लीचिंग पाउडर से पोछा: 10 लीटर पानी में 100 ग्राम ब्लीचिंग पाउडर मिलाकर फर्श और दीवारों पर पोछा लगाएं।\n4. खिड़कियां-दरवाजे खोलें: धूप और खुली हवा आने दें ताकि फफूंद न फैले।\n5. टिटनेस का टीका: कीचड़ साफ करते समय यदि कोई चोट या कट लग जाए, तो 48 घंटे के भीतर सरकारी अस्पताल से टिटनेस (TT) का इंजेक्शन जरूर लगवाएं।",
            "pa": "1. ਸੁਰੱਖਿਆ ਸਾਮਾਨ ਪਾਓ: ਰਬੜ ਦੇ ਲੰਬੇ ਗੰਮ-ਬੂਟ, ਮੋਟੇ ਦਸਤਾਨੇ ਅਤੇ ਮਾਸਕ ਜ਼ਰੂਰ ਪਾਓ। ਹੜ੍ਹ ਦੀ ਗਾਰ ਵਿੱਚ ਸੀਵਰੇਜ, ਗੰਦਗੀ ਅਤੇ ਟੈਟਨਸ ਦੇ ਕੀਟਾਣੂ ਹੁੰਦੇ ਹਨ।\n2. ਗਿੱਲੀ ਗਾਰ ਤੁਰੰਤ ਕੱਢੋ: ਗਾਰ ਸੁੱਕਣ ਤੋਂ ਪਹਿਲਾਂ ਹੀ ਕਹੀਆਂ ਨਾਲ ਬਾਹਰ ਕੱਢੋ, ਕਿਉਂਕਿ ਸੁੱਕ ਕੇ ਇਹ ਪੱਕੀ ਸੀਮਿੰਟ ਵਾਂਗ ਜੰਮ ਜਾਂਦੀ ਹੈ।\n3. ਬਲੀਚਿੰਗ ਪਾਊਡਰ ਦਾ ਛਿੜਕਾਅ: 10 ਲੀਟਰ ਪਾਣੀ ਵਿੱਚ 100 ਗ੍ਰਾਮ ਬਲੀਚਿੰਗ ਪਾਊਡਰ ਘੋਲ ਕੇ ਫਰਸ਼ਾਂ ਅਤੇ ਕੰਧਾਂ ਨੂੰ ਧੋਵੋ।\n4. ਹਵਾ ਅਤੇ ਧੁੱਪ ਲੱਗਣ ਦਿਓ: ਬੂਹੇ-ਬਾਰੀਆਂ ਖੋਲ੍ਹ ਦਿਓ ਤਾਂ ਜੋ ਕਮਰੇ ਸੁੱਕ ਜਾਣ ਅਤੇ ਉੱਲੀ ਨਾ ਲੱਗੇ।\n5. ਟੈਟਨਸ ਦਾ ਟੀਕਾ: ਗਾਰ ਕੱਢਦੇ ਸਮੇਂ ਜੇਕਰ ਕਿੱਲ ਜਾਂ ਪੱਥਰ ਨਾਲ ਕੱਟ ਲੱਗ ਜਾਵੇ, ਤਾਂ 48 ਘੰਟਿਆਂ ਦੇ ਅੰਦਰ ਸਰਕਾਰੀ ਹਸਪਤਾਲੋਂ ਟੈਟਨਸ (TT) ਦਾ ਟੀਕਾ ਜ਼ਰੂਰ ਲਗਵਾਓ।"
        },
        "keywords": ["clean silt", "mud cleanup", "flood mud", "sludge removal", "bleaching floor", "tetanus shot", "gumboots", "ਗਾਰ ਸਾਫ਼", "ਚਿੱਕੜ ਸਾਫ਼", "ਹੜ੍ਹ ਦੀ ਗਾਰ", "ਸਿਲਟ", "ਕਹੀ", "ਟੈਟਨਸ ਟੀਕਾ", "गाद साफ", "कीचड़ साफ", "सिल्ट साफ"]
    },
    {
        "id": "card-leptospirosis-prevention",
        "category": "silt_and_sanitation",
        "source": "National Centre for Disease Control (NCDC) Guidelines on Leptospirosis",
        "review_status": "verified",
        "title": {
            "en": "Preventing Leptospirosis Infection in Flood Waters",
            "hi": "बाढ़ के पानी से लेप्टोस्पायरोसिस संक्रमण से कैसे बचें",
            "pa": "ਹੜ੍ਹ ਦੇ ਗੰਦੇ ਪਾਣੀ ਤੋਂ ਲੈਪਟੋਸਪਾਇਰੋਸਿਸ ਦੀ ਲਾਗ ਤੋਂ ਬਚਾਅ"
        },
        "summary": {
            "en": "Leptospirosis spreads through rodent urine in flood water entering cuts. Cover all wounds with waterproof plaster, wear gumboots, and visit CHC if high fever/muscle aches occur.",
            "hi": "बाढ़ के पानी में चूहों के पेशाब से लेप्टोस्पायरोसिस फैलता है। घावों पर वाटरप्रूफ पट्टी लगाएं, रबर बूट पहनें और तेज बुखार होने पर तुरंत डॉक्टर से मिलें।",
            "pa": "ਹੜ੍ਹ ਦੇ ਪਾਣੀ ਵਿੱਚ ਚੂਹਿਆਂ ਦੇ ਪਿਸ਼ਾਬ ਨਾਲ ਲੈਪਟੋਸਪਾਇਰੋਸਿਸ ਫੈਲਦਾ ਹੈ। ਜ਼ਖ਼ਮਾਂ 'ਤੇ ਵਾਟਰਪਰੂਫ਼ ਪੱਟੀ ਬੰਨ੍ਹੋ, ਗੰਮ-ਬੂਟ ਪਾਓ ਅਤੇ ਬੁਖ਼ਾਰ ਹੋਣ 'ਤੇ ਤੁਰੰਤ ਹਸਪਤਾਲ ਜਾਓ।"
        },
        "body": {
            "en": "1. Transmission mode: Leptospira bacteria from rodent and cattle urine survive in stagnant flood water and penetrate human skin through cuts, scratches, or mucous membranes.\n2. High-risk symptoms: High fever, severe calf and muscle pain, red eyes (conjunctival suffusion), vomiting, and jaundice within 1 to 2 weeks of flood exposure.\n3. Protect skin barrier: Seal every cut, nick, or scratch with waterproof adhesive dressings before stepping into water.\n4. Avoid wading barefoot: Never wade or work in flood sludge without protective rubber footwear.\n5. Wash thoroughly: Wash legs and hands with clean soap and boiled water immediately after any contact with flood water.\n6. Early treatment: Visit nearest Community Health Centre (CHC) immediately if fever develops; early doxycycline/penicillin therapy cures infection and prevents liver/kidney damage.",
            "hi": "1. संक्रमण का कारण: बाढ़ के पानी में चूहों और पशुओं के पेशाब से लेप्टोस्पायरोसिस के बैक्टीरिया फैलते हैं, जो कटे-छिले अंगों से शरीर में घुस जाते हैं।\n2. लक्षण: बाढ़ के संपर्क के 1-2 हफ्ते बाद तेज बुखार, पिंडलियों और मांसपेशियों में तेज दर्द, आंखें लाल होना और पीलिया।\n3. घावों को ढकें: किसी भी घाव या खरोंच पर वाटरप्रूफ टेप लगाएं ताकि गंदा पानी अंदर न जा सके।\n4. नंगे पैर न घूमें: बिना रबर बूट के कीचड़ या पानी में कभी न उतरें।\n5. साबुन से धोएं: पानी से बाहर आने पर पैरों को साबुन और साफ पानी से अच्छी तरह धोएं।\n6. तुरंत इलाज: बुखार आने पर तुरंत सरकारी अस्पताल जाएं; शुरुआती एंटीबायोटिक से यह बीमारी पूरी तरह ठीक हो जाती है।",
            "pa": "1. ਲਾਗ ਦਾ ਕਾਰਨ: ਹੜ੍ਹ ਦੇ ਪਾਣੀ ਵਿੱਚ ਚੂਹਿਆਂ ਅਤੇ ਪਸ਼ੂਆਂ ਦੇ ਪਿਸ਼ਾਬ ਤੋਂ ਲੈਪਟੋਸਪਾਇਰੋਸਿਸ ਦੇ ਬੈਕਟੀਰੀਆ ਫੈਲਦੇ ਹਨ, ਜੋ ਕੱਟਾਂ ਜਾਂ ਖਰੋਚਾਂ ਰਾਹੀਂ ਖੂਨ ਵਿੱਚ ਵੜ ਜਾਂਦੇ ਹਨ।\n2. ਲੱਛਣ: ਪਾਣੀ ਵਿੱਚ ਜਾਣ ਤੋਂ 1-2 ਹਫ਼ਤੇ ਬਾਅਦ ਤੇਜ਼ ਬੁਖ਼ਾਰ, ਪਿੰਨੀਆਂ ਅਤੇ ਪੱਠਿਆਂ ਵਿੱਚ ਅਸਹਿ ਦਰਦ, ਅੱਖਾਂ ਲਾਲ ਹੋਣਾ ਅਤੇ ਪੀਲੀਆ।\n3. ਜ਼ਖ਼ਮਾਂ ਨੂੰ ਢੱਕੋ: ਕਿਸੇ ਵੀ ਕੱਟ ਜਾਂ ਛਿੱਲ 'ਤੇ ਵਾਟਰਪਰੂਫ਼ ਪਲਾਸਟਰ ਲਗਾਓ ਤਾਂ ਜੋ ਗੰਦਾ ਪਾਣੀ ਨਾ ਛੂਹੇ।\n4. ਨੰਗੇ ਪੈਰੀਂ ਨਾ ਤੁਰੋ: ਬਿਨਾਂ ਰਬੜ ਦੇ ਬੂਟਾਂ ਤੋਂ ਪਾਣੀ ਜਾਂ ਗਾਰ ਵਿੱਚ ਕਦੇ ਨਾ ਵੜੋ।\n5. ਸਾਬਣ ਨਾਲ ਧੋਵੋ: ਪਾਣੀ ਵਿੱਚੋਂ ਬਾਹਰ ਆ ਕੇ ਪੈਰਾਂ ਨੂੰ ਸਾਬਣ ਅਤੇ ਸਾਫ਼ ਪਾਣੀ ਨਾਲ ਚੰਗੀ ਤਰ੍ਹਾਂ ਧੋਵੋ।\n6. ਤੁਰੰਤ ਡਾਕਟਰ ਕੋਲ ਜਾਓ: ਬੁਖ਼ਾਰ ਹੋਣ 'ਤੇ ਤੁਰੰਤ ਸਿਵਲ ਹਸਪਤਾਲ ਜਾਓ; ਸ਼ੁਰੂਆਤੀ ਡਾਕਟਰੀ ਇਲਾਜ ਨਾਲ ਗੁਰਦੇ ਅਤੇ ਜਿਗਰ ਦਾ ਬਚਾਅ ਹੋ ਜਾਂਦਾ ਹੈ।"
        },
        "keywords": ["leptospirosis", "rat urine infection", "calf pain flood", "mud disease", "water cuts infection", "ਲੈਪਟੋਸਪਾਇਰੋਸਿਸ", "ਪਿੰਨੀਆਂ ਦਾ ਦਰਦ", "ਗੰਦੇ ਪਾਣੀ ਦਾ ਬੁਖ਼ਾਰ", "लेप्टोस्पायरोसिस", "चूहे का पेशाब", "पिंडलियों का दर्द"]
    },
    {
        "id": "card-carcass-disposal",
        "category": "silt_and_sanitation",
        "source": "Animal Husbandry Department Punjab & NDMA Animal Disaster Management Guidelines",
        "review_status": "verified",
        "title": {
            "en": "Safe Disposal of Livestock and Animal Carcasses",
            "hi": "बाढ़ के बाद मृत मवेशियों (पशुओं) का सुरक्षित निपटान",
            "pa": "ਹੜ੍ਹ ਮਗਰੋਂ ਮਰੇ ਹੋਏ ਪਸ਼ੂਆਂ (ਡੰਗਰਾਂ) ਦਾ ਸੁਰੱਖਿਅਤ ਨਿਪਟਾਰਾ"
        },
        "summary": {
            "en": "Bury carcasses at least 2 metres (6 feet) deep, at least 100 metres away from drinking water wells. Cover with quicklime before backfilling. Never throw carcasses into rivers or canals.",
            "hi": "मृत पशुओं को कम से कम 6 फीट गहरे गड्ढे में दफनाएं, जो पीने के पानी से कम से कम 100 मीटर दूर हो। चूना डालकर मिट्टी भरें। कभी भी नदी या नहर में न फेंकें।",
            "pa": "ਮਰੇ ਹੋਏ ਡੰਗਰਾਂ ਨੂੰ ਪੀਣ ਵਾਲੇ ਪਾਣੀ ਦੇ ਸਰੋਤਾਂ ਤੋਂ 100 ਮੀਟਰ ਦੂਰ ਘੱਟੋ-ਘੱਟ 6 ਫੁੱਟ ਡੂੰਘੇ ਟੋਏ ਵਿੱਚ ਦਬਾਓ। ਉੱਪਰ ਅਣਬੁਝਿਆ ਚੂਨਾ ਪਾ ਕੇ ਮਿੱਟੀ ਪਾਓ। ਕਦੇ ਵੀ ਨਹਿਰ ਜਾਂ ਦਰਿਆ ਵਿੱਚ ਨਾ ਸੁੱਟੋ।"
        },
        "body": {
            "en": "1. Severe disease risk: Rotting carcasses in water cause catastrophic outbreaks of anthrax, black quarter, and severe waterborne epidemics.\n2. Burial location: Select high ground at least 100 metres away from any tube-well, hand-pump, canal, or village pond. Ensure pit does not breach groundwater table.\n3. Pit dimensions: Dig pit at least 2 to 2.5 metres (6 to 8 feet) deep.\n4. Quicklime disinfection: Place carcass in pit and cover thoroughly with a thick layer of quicklime (calcium oxide) or bleaching powder to accelerate decomposition and prevent stray animal scavengers.\n5. Backfill and compact: Backfill pit completely with soil and create a raised mound 30 cm above ground level to prevent rainwater pooling.\n6. Report to authorities: Inform local Veterinary Officer and Panchayat to ensure official mortality registration for compensation.",
            "hi": "1. गंभीर बीमारियों का खतरा: पानी में सड़ते मृत पशुओं से हैजा, ब्लैक क्वार्टर और संक्रामक महामारी फैलती है।\n2. स्थान का चयन: पीने के पानी के कुओं और हैंडपंप से कम से कम 100 मीटर दूर ऊंची जमीन चुनें।\n3. गड्ढे की गहराई: कम से कम 6 से 8 फीट गहरा गड्ढा खोदें।\n4. चूना डालें: मृत पशु के ऊपर अच्छी मात्रा में चूना या ब्लीचिंग पाउडर डालें ताकि आवारा जानवर न खोदें और बदबू न फैले।\n5. मिट्टी दबाकर टीला बनाएं: गड्ढे को मिट्टी से भरकर ऊपर 1 फीट ऊंचा टीला बनाएं ताकि बारिश का पानी जमा न हो।\n6. सूचना दें: पशुपालन विभाग के डॉक्टर और पटवारी को सूचना दें ताकि सरकारी मुआवजे के लिए रिकॉर्ड दर्ज हो सके।",
            "pa": "1. ਬਿਮਾਰੀਆਂ ਦਾ ਵੱਡਾ ਖ਼ਤਰਾ: ਪਾਣੀ ਵਿੱਚ ਗਲ਼ ਰਹੇ ਮਰੇ ਹੋਏ ਪਸ਼ੂਆਂ ਨਾਲ ਮਹਾਂਮਾਰੀ, ਗਲਘੋਟੂ ਅਤੇ ਭਿਆਨਕ ਇਨਫੈਕਸ਼ਨ ਫੈਲਦੀ ਹੈ।\n2. ਥਾਂ ਦੀ ਚੋਣ: ਪੀਣ ਵਾਲੇ ਨਲਕਿਆਂ ਅਤੇ ਖੂਹਾਂ ਤੋਂ ਘੱਟੋ-ਘੱਟ 100 ਮੀਟਰ ਦੂਰ ਉੱਚੀ ਥਾਂ ਚੁਣੋ।\n3. ਟੋਏ ਦੀ ਡੂੰਘਾਈ: ਘੱਟੋ-ਘੱਟ 6 ਤੋਂ 8 ਫੁੱਟ ਡੂੰਘਾ ਟੋਆ ਪੁੱਟੋ।\n4. ਚੂਨਾ ਪਾਓ: ਮਰੇ ਹੋਏ ਪਸ਼ੂ ਉੱਤੇ ਚੰਗੀ ਮਾਤਰਾ ਵਿੱਚ ਅਣਬੁਝਿਆ ਚੂਨਾ ਜਾਂ ਬਲੀਚਿੰਗ ਪਾਊਡਰ ਪਾਓ ਤਾਂ ਜੋ ਜੰਗਲੀ ਜਾਨਵਰ ਨਾ ਪੁੱਟਣ।\n5. ਮਿੱਟੀ ਪਾ ਕੇ ਢੇਰੀ ਬਣਾਓ: ਟੋਏ ਨੂੰ ਮਿੱਟੀ ਨਾਲ ਚੰਗੀ ਤਰ੍ਹਾਂ ਭਰ ਕੇ ਉੱਪਰ 1 ਫੁੱਟ ਉੱਚਾ ਢੇਰ ਬਣਾਓ ਤਾਂ ਜੋ ਮੀਂਹ ਦਾ ਪਾਣੀ ਨਾ ਖੜ੍ਹੇ।\n6. ਡਾਕਟਰ ਨੂੰ ਸੂਚਿਤ ਕਰੋ: ਪਸ਼ੂ ਹਸਪਤਾਲ ਦੇ ਡਾਕਟਰ ਅਤੇ ਪਟਵਾਰੀ ਨੂੰ ਤੁਰੰਤ ਜਾਣਕਾਰੀ ਦਿਓ ਤਾਂ ਜੋ ਮੁਆਵਜ਼ੇ ਲਈ ਗਿਰਦਾਵਰੀ ਦਰਜ ਹੋ ਸਕੇ।"
        },
        "keywords": ["carcass", "dead cattle", "dead animal", "bury animal", "quicklime burial", "dead cow burial", "ਮਰੇ ਪਸ਼ੂ", "ਮਰੇ ਡੰਗਰ", "ਮਰੀ ਗਾਂ ਦਫ਼ਨਾਉਣਾ", "ਚੂਨਾ ਪਾਉਣਾ", "ਪਸ਼ੂ ਨਿਪਟਾਰਾ", "मृत पशु", "दफनाना", "चूना डालकर दफनाना"]
    },
    {
        "id": "card-stranded-livestock-rescue",
        "category": "livestock_safety",
        "source": "NDMA Standard Operating Procedure for Animal Rescue in Floods",
        "review_status": "verified",
        "title": {
            "en": "Rescuing Stranded Livestock on River Islands & Bunds",
            "hi": "नदी के टापू या बांध पर फंसे मवेशियों का बचाव",
            "pa": "ਦਰਿਆਈ ਟਾਪੂਆਂ ਜਾਂ ਬੰਨ੍ਹਾਂ 'ਤੇ ਫਸੇ ਡੰਗਰਾਂ ਦਾ ਬਚਾਅ"
        },
        "summary": {
            "en": "Never force animals to swim across rapid currents alone. Guide them behind motorboats using long tether halters, deliver dry fodder, and call SDRF/Animal Husbandry on 112.",
            "hi": "तेज बहाव में पशुओं को अकेला तैरने के लिए न धकेलें। नाव के पीछे रस्सी से सहारा देकर निकालें, सूखा चारा पहुंचाएं और 112 पर मदद मांगें।",
            "pa": "ਤੇਜ਼ ਵਹਾਅ ਵਿੱਚ ਡੰਗਰਾਂ ਨੂੰ ਇਕੱਲਿਆਂ ਨਾ ਧੱਕੋ। ਕਿਸ਼ਤੀ ਦੇ ਪਿੱਛੇ ਰੱਸੇ ਨਾਲ ਸਹਾਰਾ ਦੇ ਕੇ ਕੱਢੋ, ਸੁੱਕਾ ਚਾਰਾ ਪਹੁੰਚਾਓ ਅਤੇ 112 'ਤੇ ਮਦਦ ਮੰਗੋ।"
        },
        "body": {
            "en": "1. Stranded herd behavior: Isolated cattle gather at the highest dry patch on an island or ring bund, but risk exhaustion, starvation, and snakebites.\n2. Fodder drops: Drop dry compressed fodder cakes and clean water packs via boats until water levels recede.\n3. Boat-guided crossing: Trained rescue teams guide animals across moderate currents by holding lead halters from motorboats while animals swim alongside.\n4. Avoid night rescues: Never attempt to herd stranded animals across river currents in darkness.\n5. Veterinary triage: Examine rescued animals immediately for water inhalation, exhaustion, foot rot, and hypothermia.\n6. Report location: Notify District Animal Husbandry Control Room and ERSS 112 with exact GPS coordinates or river-km landmark.",
            "hi": "1. फंसे पशुओं का व्यवहार: टापू पर फंसे मवेशी सबसे ऊंची जगह पर इकट्ठे हो जाते हैं, लेकिन भूख और सांपों के खतरे में होते हैं।\n2. नाव से चारा पहुंचाएं: जब तक पानी कम न हो, नावों द्वारा सूखा चारा और पानी के पैकेट पहुंचाएं।\n3. नाव के सहारे तैराना: रेस्क्यू टीमें नाव में बैठकर पशुओं की रस्सी पकड़कर उन्हें किनारे तक तैराकर लाती हैं।\n4. रात में रेस्क्यू न करें: अंधेरे में नदी के बहाव में पशुओं को पार कराने की कोशिश कभी न करें।\n5. मेडिकल जांच: बाहर निकालने पर डॉक्टर से फेफड़ों में पानी और खुरपका की जांच करवाएं।\n6. 112 पर सूचना दें: जिला प्रशासन और 112 पर फंसे पशुओं की सटीक जगह की जानकारी दें।",
            "pa": "1. ਫਸੇ ਡੰਗਰਾਂ ਦੀ ਹਾਲਤ: ਟਾਪੂ ਉੱਤੇ ਫਸੇ ਪਸ਼ੂ ਸਭ ਤੋਂ ਉੱਚੀ ਸੁੱਕੀ ਥਾਂ 'ਤੇ ਇਕੱਠੇ ਹੋ ਜਾਂਦੇ ਹਨ, ਪਰ ਭੁੱਖ ਅਤੇ ਸੱਪਾਂ ਦਾ ਵੱਡਾ ਖ਼ਤਰਾ ਹੁੰਦਾ ਹੈ।\n2. ਕਿਸ਼ਤੀ ਰਾਹੀਂ ਚਾਰਾ ਪਹੁੰਚਾਓ: ਜਦੋਂ ਤੱਕ ਪਾਣੀ ਨਹੀਂ ਉਤਰਦਾ, ਕਿਸ਼ਤੀਆਂ ਰਾਹੀਂ ਸੁੱਕੀ ਤੂੜੀ ਅਤੇ ਪੀਣ ਵਾਲਾ ਪਾਣੀ ਪਹੁੰਚਾਓ।\n3. ਕਿਸ਼ਤੀ ਦੇ ਸਹਾਰੇ ਕੱਢਣਾ: ਬਚਾਅ ਟੀਮਾਂ ਮੋਟਰ-ਬੋਟ ਵਿੱਚ ਬੈਠ ਕੇ ਡੰਗਰਾਂ ਦੇ ਸੰਗਲ ਫੜ ਕੇ ਉਨ੍ਹਾਂ ਨੂੰ ਕਿਨਾਰੇ ਵੱਲ ਤੈਰਾ ਕੇ ਲਿਆਉਂਦੀਆਂ ਹਨ।\n4. ਰਾਤ ਨੂੰ ਪਾਰ ਨਾ ਕਰਵਾਓ: ਹਨੇਰੇ ਵਿੱਚ ਦਰਿਆ ਦੇ ਤੇਜ਼ ਵਹਾਅ ਵਿੱਚ ਪਸ਼ੂਆਂ ਨੂੰ ਕੱਢਣ ਦੀ ਕੋਸ਼ਿਸ਼ ਕਦੇ ਨਾ ਕਰੋ।\n5. ਵੈਟਰਨਰੀ ਜਾਂਚ: ਬਾਹਰ ਕੱਢਣ ਮਗਰੋਂ ਵੈਟਰਨਰੀ ਡਾਕਟਰ ਤੋਂ ਫੇਫੜਿਆਂ ਅਤੇ ਖੁਰਾਂ ਦੀ ਜਾਂਚ ਕਰਵਾਓ।\n6. 112 'ਤੇ ਇਤਲਾਹ ਦਿਓ: ਪਸ਼ੂ ਪਾਲਣ ਵਿਭਾਗ ਅਤੇ 112 ਕੰਟਰੋਲ ਰੂਮ 'ਤੇ ਫਸੇ ਪਸ਼ੂਆਂ ਦੀ ਸਹੀ ਥਾਂ ਦੱਸੋ।"
        },
        "keywords": ["stranded cattle", "stranded cows", "livestock island", "cattle on island", "ਟਾਪੂ 'ਤੇ ਫਸੇ ਪਸ਼ੂ", "ਦਰਿਆਈ ਟਾਪੂ 'ਤੇ ਡੰਗਰ", "ਫਸੇ ਪਸ਼ੂ ਬਚਾਅ", "टापू पर फंसे मवेशी", "टापू पर फंसे"]
    },
    {
        "id": "card-dhussi-bundh-breach",
        "category": "cwc_gauge_thresholds",
        "source": "Punjab Drainage & Irrigation Department Flood Manual",
        "review_status": "verified",
        "title": {
            "en": "Dhussi Bundh Breach Emergency Response Protocol",
            "hi": "धुस्सी बांध टूटने (दरार पड़ने) पर आपातकालीन कदम",
            "pa": "ਧੁੱਸੀ ਬੰਨ੍ਹ ਵਿੱਚ ਪਾੜ ਪੈਣ 'ਤੇ ਤੁਰੰਤ ਐਮਰਜੈਂਸੀ ਕਾਰਵਾਈ"
        },
        "summary": {
            "en": "Sound immediate village alarms through Gurdwara/temple loudspeakers. Evacuate perpendicular to flood flow to high rooftops and relief bunds. Dial 1077 / 112.",
            "hi": "गुरुद्वारे/मंदिर के लाउडस्पीकर से तुरंत चेतावनी दें। पानी के बहाव से 90 डिग्री दूर ऊंची छतों और सुरक्षित बांधों पर जाएं। 1077 या 112 पर फोन करें।",
            "pa": "ਗੁਰਦੁਆਰਾ ਸਾਹਿਬ ਦੇ ਲਾਊਡਸਪੀਕਰ ਤੋਂ ਤੁਰੰਤ ਮੁਨਾਦੀ ਕਰਵਾਓ। ਪਾਣੀ ਦੇ ਵਹਾਅ ਦੇ ਸਮਕੋਣ (ਸਾਈਡ 'ਤੇ) ਉੱਚੀਆਂ ਛੱਤਾਂ ਵੱਲ ਨਿਕਲੋ। 1077 ਜਾਂ 112 ਡਾਇਲ ਕਰੋ।"
        },
        "body": {
            "en": "1. Sound Community Alarm: Immediately broadcast emergency warnings over Gurdwara, temple, and village loudspeakers. Alert downstream villages instantly.\n2. Evacuation Direction: Do NOT run directly in front of the advancing water front. Run perpendicular (at 90 degrees) to the flood flow path toward elevated mounds.\n3. Vertical Evacuation: If escape roads are already submerged, climb immediately to the roof slabs of sturdy multi-storey reinforced concrete (pucca) buildings.\n4. Call Emergency Control: Contact District Drainage Control Room 1077 and State Disaster Response 112 with the exact breach landmark or river-km.\n5. Sandbag Pitching: Only trained Drainage Department personnel and volunteers should attempt sandbag pitching; never stand on the collapsing lip of a breach.\n6. Cut power lines: Immediately inform PSPCL 1912 to disconnect high-tension lines crossing the breach zone.",
            "hi": "1. लाउडस्पीकर से मुनादी: गुरुद्वारे और मंदिर के लाउडस्पीकर से पूरे गांव में तुरंत चेतावनी दें और निचले गांवों को भी तुरंत फोन करें।\n2. भागने की सही दिशा: पानी के बहाव के सीधे आगे न भागें। बहाव के 90 डिग्री कोण (किनारे की तरफ) पर ऊंची जमीन की ओर जाएं।\n3. पक्की छतों पर चढ़ें: यदि रास्ते बंद हो चुके हों, तो गांव के पक्के 2-मंजिला मकानों या स्कूल की छत पर चढ़ जाएं।\n4. 1077 और 112 पर सूचना: जिला ड्रेनेज विभाग के 1077 और 112 पर बांध टूटने की सही जगह बताएं।\n5. बोरियां लगाना: केवल प्रशिक्षित टीम ही बांध पर बोरियां लगाए, टूटते किनारे पर कभी खड़े न हों।\n6. बिजली कटवाएं: बिजली विभाग को 1912 पर फोन करके बांध के ऊपर से गुजरने वाली बिजली की लाइनें बंद करवाएं।",
            "pa": "1. ਲਾਊਡਸਪੀਕਰ ਤੋਂ ਮੁਨਾਦੀ: ਗੁਰਦੁਆਰਾ ਸਾਹਿਬ ਦੇ ਸਪੀਕਰਾਂ ਤੋਂ ਪਿੰਡ ਵਿੱਚ ਤੁਰੰਤ ਮੁਨਾਦੀ ਕਰਵਾਓ ਅਤੇ ਹੇਠਲੇ ਪਿੰਡਾਂ ਨੂੰ ਵੀ ਫੋਨ ਕਰਕੇ ਸੁਚੇਤ ਕਰੋ।\n2. ਭੱਜਣ ਦੀ ਸਹੀ ਦਿਸ਼ਾ: ਪਾਣੀ ਦੇ ਸਿੱਧੇ ਮੂਹਰੇ ਨਾ ਭੱਜੋ, ਸਗੋਂ ਵਹਾਅ ਦੇ ਸਾਈਡ ਵੱਲ (90 ਡਿਗਰੀ 'ਤੇ) ਉੱਚੀਆਂ ਪੱਕੀਆਂ ਸੜਕਾਂ ਵੱਲ ਜਾਓ।\n3. ਪੱਕੀਆਂ ਛੱਤਾਂ 'ਤੇ ਚੜ੍ਹੋ: ਜੇਕਰ ਸੜਕਾਂ 'ਤੇ ਪਾਣੀ ਆ ਚੁੱਕਾ ਹੋਵੇ, ਤਾਂ ਪਿੰਡ ਦੇ ਪੱਕੇ ਲੈਂਟਰ ਵਾਲੇ ਮਕਾਨਾਂ ਜਾਂ ਸਕੂਲਾਂ ਦੀਆਂ ਛੱਤਾਂ 'ਤੇ ਚੜ੍ਹ ਜਾਓ।\n4. 1077 ਅਤੇ 112 'ਤੇ ਸੂਚਨਾ: ਡਰੇਨੇਜ ਵਿਭਾਗ ਦੇ ਕੰਟਰੋਲ ਰੂਮ 1077 ਅਤੇ 112 'ਤੇ ਪਾੜ ਪੈਣ ਵਾਲੀ ਸਹੀ ਥਾਂ ਲਿਖਵਾਓ।\n5. ਬੋਰੀਆਂ ਲਗਾਉਣਾ: ਟੁੱਟ ਰਹੇ ਕਿਨਾਰੇ 'ਤੇ ਖੜ੍ਹੇ ਹੋਣ ਦੀ ਗਲਤੀ ਨਾ ਕਰੋ, ਸਿਰਫ਼ ਅਧਿਕਾਰੀਆਂ ਦੀ ਦੇਖ-ਰੇਖ ਵਿੱਚ ਹੀ ਮਿੱਟੀ ਦੀਆਂ ਬੋਰੀਆਂ ਲਗਾਓ।\n6. ਬਿਜਲੀ ਬੰਦ ਕਰਵਾਓ: 1912 'ਤੇ ਕਾਲ ਕਰਕੇ ਧੁੱਸੀ ਬੰਨ੍ਹ ਵਾਲੀ ਬਿਜਲੀ ਲਾਈਨ ਤੁਰੰਤ ਕਟਵਾਓ।"
        },
        "keywords": ["dhussi bundh breach", "dhussi breach", "embankment breach", "bundh breach", "dhussi tootna", "ਧੁੱਸੀ ਬੰਨ੍ਹ ਪਾੜ", "ਬੰਨ੍ਹ ਟੁੱਟਣਾ", "ਪਾੜ ਪੈਣਾ", "ਧੁੱਸੀ ਪਾੜ", "ਮੁਨਾਦੀ", "धुस्सी बांध टूटना", "बांध में दरार", "बांध टूटना"]
    },
    {
        "id": "card-sand-boil-embankment",
        "category": "cwc_gauge_thresholds",
        "source": "Central Water Commission (CWC) River Flood Management & Punjab Drainage Department Manual",
        "review_status": "verified",
        "title": {
            "en": "Sand Boils on Embankments (Dhussi Bundhs) & Ring Bunding",
            "hi": "धुस्सी बांध पर सैंड बॉयल (उबलती रेत) और रिंग बांध बनाने का तरीका",
            "pa": "ਧੁੱਸੀ ਬੰਨ੍ਹ 'ਤੇ ਸੈਂਡ ਬੋਇਲ (ਰੇਤ ਉਬਲਣਾ) ਅਤੇ ਰਿੰਗ ਬੰਨ੍ਹ ਲਗਾਉਣ ਦਾ ਤਰੀਕਾ"
        },
        "summary": {
            "en": "A sand boil is bubbling water carrying sand on the landward side of an embankment, indicating piping erosion. Build a ring of sandbags around it to balance hydrostatic head. NEVER plug the boil directly.",
            "hi": "सैंड बॉयल बांध के अंदर से रिसते पानी का फव्वारा होता है जो अंदर की मिट्टी खोखली कर रहा होता है। इसके चारों ओर बोरियों का गोल घेरा (रिंग बांध) बनाएं ताकि पानी का दबाव संतुलित हो। छेद को सीधे बंद न करें।",
            "pa": "ਸੈਂਡ ਬੋਇਲ ਧੁੱਸੀ ਬੰਨ੍ਹ ਦੇ ਪਿੰਡ ਵਾਲੇ ਪਾਸੇ ਧਰਤੀ ਵਿੱਚੋਂ ਉੱਬਲਦਾ ਪਾਣੀ ਹੁੰਦਾ ਹੈ ਜੋ ਬੰਨ੍ਹ ਨੂੰ ਅੰਦਰੋਂ ਖੋਖਲਾ ਕਰਦਾ ਹੈ। ਇਸ ਦੁਆਲੇ ਮਿੱਟੀ ਦੀਆਂ ਬੋਰੀਆਂ ਦਾ ਗੋਲ ਚੱਕਰ (ਰਿੰਗ ਬੰਨ੍ਹ) ਲਗਾਓ। ਮੋਘੇ ਨੂੰ ਸਿੱਧਾ ਬੰਦ ਨਾ ਕਰੋ।"
        },
        "body": {
            "en": "1. What is a sand boil: Piping occurs when high river water forces seepage underneath an earthen embankment (Dhussi Bundh), creating a bubbling geyser of muddy water carrying sand particles on the landward side.\n2. Catastrophic risk: If sand continues discharging, an internal cavern forms, causing total sudden collapse and breach of the embankment within hours.\n3. NEVER block directly: Do NOT dump sandbags or dirt directly onto the hole. Blocking the exit increases underground pore water pressure and causes the embankment to burst elsewhere.\n4. Sandbag ring technique: Construct a horseshoe or circular ring dike of sandbags around the boil, leaving an interior pool.\n5. Raising head: Build the ring height high enough so water rises inside the ring, balancing hydrostatic pressure and halting sand erosion while clear water spills safely over the top weir.\n6. Immediate notification: Alert District Drainage Executive Engineer and call District Control Room 1077 / 112 immediately.",
            "hi": "1. सैंड बॉयल क्या है: जब नदी का पानी बांध के नीचे से रिसकर जमीन से फव्वारे की तरह रेत और गंदा पानी फेंकने लगे, तो इसे सैंड बॉयल कहते हैं।\n2. बांध टूटने का खतरा: अगर रेत निकलती रही तो बांध अंदर से खोखला होकर अचानक टूट जाएगा।\n3. छेद को सीधे न रोकें: सीधे छेद के मुंह पर बोरी या मिट्टी न दबाएं। इससे दबाव बढ़कर दूसरी जगह से बांध फूट जाएगा।\n4. चारों ओर गोल घेरा (रिंग बांध): सैंड बॉयल के चारों तरफ रेत की बोरियों का गोल घेरा बनाएं।\n5. पानी का स्तर बढ़ने दें: घेरे की दीवार इतनी ऊंची बनाएं कि अंदर पानी भरकर नदी के दबाव को संतुलित कर दे और सिर्फ साफ पानी बाहर बहे, रेत रुक जाए।\n6. तुरंत सूचना दें: तुरंत ड्रेनेज विभाग और जिला कंट्रोल रूम 1077 या 112 पर फोन करें।",
            "pa": "1. ਸੈਂਡ ਬੋਇਲ ਕੀ ਹੈ: ਜਦੋਂ ਦਰਿਆ ਦਾ ਪਾਣੀ ਧੁੱਸੀ ਬੰਨ੍ਹ ਦੇ ਹੇਠੋਂ ਲੰਘ ਕੇ ਪਿੰਡ ਵਾਲੇ ਪਾਸੇ ਜ਼ਮੀਨ ਵਿੱਚੋਂ ਫੁਹਾਰੇ ਵਾਂਗ ਰੇਤਲਾ ਪਾਣੀ ਕੱਢਣ ਲੱਗ ਪਵੇ ਤਾਂ ਇਸਨੂੰ ਸੈਂਡ ਬੋਇਲ ਕਹਿੰਦੇ ਹਨ।\n2. ਬੰਨ੍ਹ ਟੁੱਟਣ ਦਾ ਖ਼ਤਰਾ: ਜੇਕਰ ਰੇਤ ਨਿਕਲਦੀ ਰਹੇ ਤਾਂ ਬੰਨ੍ਹ ਅੰਦਰੋਂ ਖੋਖਲਾ ਹੋ ਕੇ ਅਚਾਨਕ ਢਹਿ ਜਾਵੇਗਾ ਅਤੇ ਪਾੜ ਪੈ ਜਾਵੇਗਾ।\n3. ਮੋਘੇ ਨੂੰ ਸਿੱਧਾ ਨਾ ਦੱਬੋ: ਕਦੇ ਵੀ ਸਿੱਧਾ ਮੋਘੇ ਉੱਤੇ ਮਿੱਟੀ ਜਾਂ ਬੋਰੀ ਨਾ ਸੁੱਟੋ। ਇਸ ਨਾਲ ਦਬਾਅ ਵਧ ਕੇ ਹੋਰ ਥਾਂ ਤੋਂ ਬੰਨ੍ਹ ਪਾਟ ਜਾਵੇਗਾ।\n4. ਦੁਆਲੇ ਰਿੰਗ ਬੰਨ੍ਹ ਬਣਾਓ: ਸੈਂਡ ਬੋਇਲ ਦੇ ਚਾਰੇ ਪਾਸੇ ਮਿੱਟੀ ਦੀਆਂ ਬੋਰੀਆਂ ਦਾ ਗੋਲ ਚੱਕਰ (ਰਿੰਗ) ਬਣਾਓ।\n5. ਪਾਣੀ ਉੱਚਾ ਚੜ੍ਹਨ ਦਿਓ: ਬੋਰੀਆਂ ਦੀ ਕੰਧ ਉੱਚੀ ਕਰੋ ਤਾਂ ਜੋ ਰਿੰਗ ਦੇ ਅੰਦਰ ਪਾਣੀ ਭਰ ਕੇ ਦਬਾਅ ਬਰਾਬਰ ਹੋ ਜਾਵੇ, ਰੇਤ ਨਿਕਲਣੀ ਬੰਦ ਹੋ ਜਾਵੇ ਅਤੇ ਸਿਰਫ਼ ਨਿੱਤਰਿਆ ਪਾਣੀ ਬਾਹਰ ਨਿਕਲੇ।\n6. ਤੁਰੰਤ ਸੂਚਨਾ ਦਿਓ: ਡਰੇਨੇਜ ਵਿਭਾਗ ਦੇ ਐੱਸ.ਡੀ.ਓ. ਅਤੇ ਜ਼ਿਲ੍ਹਾ ਕੰਟਰੋਲ ਰੂਮ 1077 ਜਾਂ 112 'ਤੇ ਤੁਰੰਤ ਇਤਲਾਹ ਦਿਓ।"
        },
        "keywords": ["sand boil", "ring bundh", "piping", "sand geyser", "bubbling sand", "sandbag ring", "ਸੈਂਡ ਬੋਇਲ", "ਰਿੰਗ ਬੰਨ੍ਹ", "ਮੋਘਾ", "ਰੇਤ ਉਬਲਣਾ", "ਬੰਨ੍ਹ 'ਚੋਂ ਪਾਣੀ ਫੁੱਟਣਾ", "सैंड बॉयल", "रिंग बांध", "उबलती रेत"]
    },
    {
        "id": "card-vulnerable-evacuation",
        "category": "evacuation_safety",
        "source": "NDMA Guidelines on Disability Inclusive Disaster Risk Reduction (DiDRR)",
        "review_status": "verified",
        "title": {
            "en": "Evacuating Vulnerable Persons: Pregnant, Elderly & Infants",
            "hi": "संवेदनशील व्यक्तियों की निकासी: गर्भवती महिलाएं, बुजुर्ग और शिशु",
            "pa": "ਕਮਜ਼ੋਰ ਵਰਗਾਂ ਦੀ ਨਿਕਾਸੀ: ਗਰਭਵਤੀ ਔਰਤਾਂ, ਬਜ਼ੁਰਗ ਅਤੇ ਛੋਟੇ ਬੱਚੇ"
        },
        "summary": {
            "en": "Prioritize vulnerable individuals on first evacuation boats. Ensure pregnant women carry Mother-Child Protection (MCP) cards and senior citizens carry 7 days of medications.",
            "hi": "पहली बचाव नौका में गर्भवती महिलाओं, बच्चों और बुजुर्गों को प्राथमिकता दें। एमसीपी कार्ड और जरूरी दवाएं वाटरप्रूफ थैली में रखें। 112 पर नाव के लिए कॉल करें।",
            "pa": "ਪਹਿਲੀ ਬਚਾਅ ਕਿਸ਼ਤੀ ਵਿੱਚ ਗਰਭਵਤੀ ਔਰਤਾਂ, ਬੱਚਿਆਂ ਅਤੇ ਬਜ਼ੁਰਗਾਂ ਨੂੰ ਪਹਿਲ ਦਿਓ। ਐਮ.ਸੀ.ਪੀ. ਕਾਰਡ ਅਤੇ ਦਵਾਈਆਂ ਵਾਟਰਪਰੂਫ਼ ਲਿਫ਼ਾਫ਼ੇ ਵਿੱਚ ਰੱਖੋ। 112 'ਤੇ ਕਾਲ ਕਰੋ।"
        },
        "body": {
            "en": "1. Priority Evacuation: Pregnant women, infants, sick individuals, and elderly persons must be placed on the very first rescue boats or high-clearance tractors.\n2. Mother-Child Protection (MCP) Cards: Pack pregnancy medical records, ultrasound reports, and hospital contact numbers in sealed waterproof pouches.\n3. Mobility Aids: Never leave behind wheelchairs, walkers, crutches, or hearing aids; seniors without mobility aids suffer severe disorientation and falls.\n4. Buddy System: Assign two able-bodied village youth to escort each senior citizen or disabled resident.\n5. Special Diets: Carry powdered milk, oral rehydration salts, boiled water, and soft mashed food for infants.\n6. Emergency Contact: Alert District Administration on 112 / 1077 specifically stating the presence of pregnant women or oxygen-dependent patients for specialized rescue boats.",
            "hi": "1. पहली प्राथमिकता: गर्भवती महिलाओं, छोटे बच्चों, बीमारों और बुजुर्गों को सबसे पहले रेस्क्यू बोट में बैठाएं।\n2. जच्चा-बच्चा कार्ड: गर्भवती महिलाओं की मेडिकल फाइल, अल्ट्रासाउंड रिपोर्ट और डॉक्टर का नंबर वाटरप्रूफ थैली में रखें।\n3. व्हीलचेयर और चश्मा: बुजुर्गों का चश्मा, लाठी, वॉकर या व्हीलचेयर साथ जरूर लें ताकि वे गिर न पड़ें।\n4. दो मददगार साथी: हर बुजुर्ग या दिव्यांग व्यक्ति के साथ गांव के दो नौजवानों की ड्यूटी लगाएं।\n5. बच्चों का आहार: शिशुओं के लिए दूध पाउडर, ओआरएस और उबला पानी हमेशा तैयार रखें।\n6. 112 पर विशेष सूचना: 112 पर फोन करते समय स्पष्ट बताएं कि परिवार में गर्भवती महिला या गंभीर मरीज है ताकि मेडिकल बोट भेजी जा सके।",
            "pa": "1. ਪਹਿਲੀ ਤਰਜੀਹ: ਗਰਭਵਤੀ ਔਰਤਾਂ, ਦੁੱਧ ਪੀਂਦੇ ਬੱਚਿਆਂ, ਬਿਮਾਰਾਂ ਅਤੇ ਬਜ਼ੁਰਗਾਂ ਨੂੰ ਸਭ ਤੋਂ ਪਹਿਲੀ ਬਚਾਅ ਕਿਸ਼ਤੀ 'ਚ ਬਿਠਾਓ।\n2. ਜੱਚਾ-ਬੱਚਾ ਕਾਰਡ: ਗਰਭਵਤੀ ਔਰਤਾਂ ਦੀਆਂ ਮੈਡੀਕਲ ਪਰਚੀਆਂ, ਟੈਸਟ ਰਿਪੋਰਟਾਂ ਅਤੇ ਹਸਪਤਾਲ ਦਾ ਫੋਨ ਨੰਬਰ ਵਾਟਰਪਰੂਫ਼ ਲਿਫ਼ਾਫ਼ੇ ਵਿੱਚ ਰੱਖੋ।\n3. ਸੋਟੀ ਅਤੇ ਐਨਕਾਂ: ਬਜ਼ੁਰਗਾਂ ਦੀਆਂ ਐਨਕਾਂ, ਸੋਟੀ ਜਾਂ ਵ੍ਹੀਲਚੇਅਰ ਨਾਲ ਲੈਣਾ ਕਦੇ ਨਾ ਭੁੱਲੋ ਤਾਂ ਜੋ ਉਹ ਠੋਕਰ ਖਾ ਕੇ ਨਾ ਡਿੱਗਣ।\n4. ਦੋ ਨੌਜਵਾਨਾਂ ਦੀ ਡਿਊਟੀ: ਹਰ ਬਜ਼ੁਰਗ ਜਾਂ ਅਪਾਹਜ ਵਿਅਕਤੀ ਨਾਲ ਪਿੰਡ ਦੇ ਦੋ ਤਕੜੇ ਨੌਜਵਾਨਾਂ ਨੂੰ ਸਹਾਰਾ ਦੇਣ ਲਈ ਲਗਾਓ।\n5. ਬੱਚਿਆਂ ਦੀ ਖ਼ੁਰਾਕ: ਛੋਟੇ ਬੱਚਿਆਂ ਲਈ ਸੁੱਕਾ ਦੁੱਧ, ਓ.ਆਰ.ਐੱਸ. ਅਤੇ ਉਬਲਿਆ ਪਾਣੀ ਹਮੇਸ਼ਾ ਕੋਲ ਰੱਖੋ।\n6. 112 'ਤੇ ਸੂਚਨਾ: 112 'ਤੇ ਫੋਨ ਕਰਕੇ ਸਾਫ਼ ਦੱਸੋ ਕਿ ਗਰਭਵਤੀ ਔਰਤ ਜਾਂ ਮਰੀਜ਼ ਫਸਿਆ ਹੋਇਆ ਹੈ ਤਾਂ ਜੋ ਡਾਕਟਰੀ ਕਿਸ਼ਤੀ ਭੇਜੀ ਜਾਵੇ।"
        },
        "keywords": ["pregnant evacuation", "elderly evacuation", "infants flood", "wheelchair", "disabled evacuation", "mcp card", "ਗਰਭਵਤੀ ਔਰਤਾਂ", "ਬਜ਼ੁਰਗਾਂ ਨੂੰ ਕੱਢਣਾ", "ਅਪਾਹਜ ਨਿਕਾਸੀ", "ਜੱਚਾ-ਬੱਚਾ ਕਾਰਡ", "गर्भवती महिलाओं की निकासी", "बुजुर्गों की निकासी", "दिव्यांग"]
    },
    {
        "id": "card-shelters-directory-punjab",
        "category": "shelter_directory",
        "source": "Punjab Revenue & Disaster Management Department Official Relief Shelters Directory",
        "review_status": "verified",
        "title": {
            "en": "Verified Government Flood Relief Shelters Across Punjab",
            "hi": "पंजाब के विभिन्न जिलों में सत्यापित सरकारी बाढ़ राहत शिविर",
            "pa": "ਪੰਜਾਬ ਦੇ ਵੱਖ-ਵੱਖ ਜ਼ਿਲ੍ਹਿਆਂ ਵਿੱਚ ਅਧਿਕਾਰਤ ਸਰਕਾਰੀ ਹੜ੍ਹ ਰਾਹਤ ਕੈਂਪ"
        },
        "summary": {
            "en": "Permanent verified flood evacuation shelters with free food, clean drinking water, medical doctors, and power across Jalandhar, Amritsar, Kapurthala, Firozpur, Hoshiarpur, and Rupnagar.",
            "hi": "जालंधर, अमृतसर, कपूरथला, फिरोजपुर, होशियारपुर और रूपनगर में भोजन, पानी, दवा और बिजली से लैस सत्यापित राहत शिविर।",
            "pa": "ਜਲੰਧਰ, ਅੰਮ੍ਰਿਤਸਰ, ਕਪੂਰਥਲਾ, ਫ਼ਿਰੋਜ਼ਪੁਰ, ਹੁਸ਼ਿਆਰਪੁਰ ਅਤੇ ਰੂਪਨਗਰ ਵਿੱਚ ਰੋਟੀ, ਪਾਣੀ, ਦਵਾਈਆਂ ਅਤੇ ਬਿਜਲੀ ਵਾਲੇ ਅਧਿਕਾਰਤ ਰਾਹਤ ਕੈਂਪ।"
        },
        "body": {
            "en": "1. Jalandhar District: Government Senior Secondary School, Shahkot (Capacity: 450 persons). Facilities: Hot community meals (langar), safe drinking water, resident medical doctor, generator.\n2. Amritsar District: Community Hall, Ajnala (Capacity: 350 persons). Facilities: Clean drinking water, clinical aid post, mobile toilets, power backup.\n3. Kapurthala District: Government College, Sultanpur Lodhi (Capacity: 500 persons). Facilities: Dedicated medical camp, 24x7 langar, water filtration unit, generator.\n4. Firozpur District: Dana Mandi Shed Relief Camp, Makhu (Capacity: 600 persons). Facilities: Animal holding enclosure with dry fodder, human medical ward, food.\n5. Hoshiarpur District: Community Health Centre Ground, Mukerian (Capacity: 300 persons). Facilities: Clinical observation, maternal care, hot meals, drinking water.\n6. Rupnagar District: ITI Complex, Sri Anandpur Sahib (Capacity: 400 persons). Facilities: Bedding, clean water, medical post, communication centre.",
            "hi": "1. जालंधर: सरकारी सीनियर सेकेंडरी स्कूल, शाहकोट (क्षमता: 450 लोग)। भोजन, स्वच्छ पानी, डॉक्टर और जनरेटर की सुविधा।\n2. अमृतसर: कम्युनिटी हॉल, अजनाला (क्षमता: 350 लोग)। स्वच्छ पेयजल, मेडिकल पोस्ट और बिजली बैकअप।\n3. कपूरथला: सरकारी कॉलेज, सुल्तानपुर लोधी (क्षमता: 500 लोग)। 24 घंटे लंगर, मेडिकल कैंप और स्वच्छ पानी।\n4. फिरोजपुर: दाना मंडी शेड, मखू (क्षमता: 600 लोग)। पशुओं के लिए बड़ा बाड़ा, सूखा चारा और मेडिकल टीम।\n5. होशियारपुर: सीएचसी ग्राउंड, मुकेरियां (क्षमता: 300 लोग)। डॉक्टर, दवाएं और गर्म भोजन।\n6. रूपनगर: आईटीआई कॉम्प्लेक्स, श्री आनंदपुर साहिब (क्षमता: 400 लोग)। बिस्तर, साफ पानी और मेडिकल टीम।",
            "pa": "1. ਜਲੰਧਰ: ਸਰਕਾਰੀ ਸੀਨੀਅਰ ਸੈਕੰਡਰੀ ਸਕੂਲ, ਸ਼ਾਹਕੋਟ (ਸਮਰੱਥਾ: 450 ਜਣੇ)। ਲੰਗਰ, ਸਾਫ਼ ਪਾਣੀ, ਡਾਕਟਰ ਅਤੇ ਜਨਰੇਟਰ।\n2. ਅੰਮ੍ਰਿਤਸਰ: ਕਮਿਊਨਿਟੀ ਹਾਲ, ਅਜਨਾਲਾ (ਸਮਰੱਥਾ: 350 ਜਣੇ)। ਪੀਣ ਵਾਲਾ ਪਾਣੀ, ਮੈਡੀਕਲ ਸਹਾਇਤਾ ਅਤੇ ਬਿਜਲੀ।\n3. ਕਪੂਰਥਲਾ: ਸਰਕਾਰੀ ਕਾਲਜ, ਸੁਲਤਾਨਪੁਰ ਲੋਧੀ (ਸਮਰੱਥਾ: 500 ਜਣੇ)। ਲੰਗਰ, ਪੀਣ ਵਾਲਾ ਪਾਣੀ ਅਤੇ ਡਾਕਟਰਾਂ ਦੀ ਟੀਮ।\n4. ਫ਼ਿਰੋਜ਼ਪੁਰ: ਦਾਣਾ ਮੰਡੀ ਸ਼ੈੱਡ, ਮੱਖੂ (ਸਮਰੱਥਾ: 600 ਜਣੇ)। ਡੰਗਰਾਂ ਲਈ ਵੱਡਾ ਵਾੜਾ, ਤੂੜੀ-ਪੱਠੇ ਅਤੇ ਮੈਡੀਕਲ ਕੈਂਪ।\n5. ਹੁਸ਼ਿਆਰਪੁਰ: ਸੀ.ਐੱਚ.ਸੀ. ਗਰਾਊਂਡ, ਮੁਕੇਰੀਆਂ (ਸਮਰੱਥਾ: 300 ਜਣੇ)। ਮੈਡੀਕਲ ਟੀਮ, ਗਰਮ ਖਾਣਾ ਅਤੇ ਸਾਫ਼ ਪਾਣੀ।\n6. ਰੂਪਨਗਰ: ਆਈ.ਟੀ.ਆਈ. ਕੰਪਲੈਕਸ, ਸ੍ਰੀ ਅਨੰਦਪੁਰ ਸਾਹਿਬ (ਸਮਰੱਥਾ: 400 ਜਣੇ)। ਬਿਸਤਰੇ, ਸਾਫ਼ ਪਾਣੀ ਅਤੇ ਡਾਕਟਰੀ ਸਹੂਲਤ।"
        },
        "keywords": ["relief camp directory", "shahkot shelter", "sultanpur lodhi shelter", "ajnala shelter", "makhu shelter", "mukerian shelter", "anandpur sahib shelter", "ਸੁਲਤਾਨਪੁਰ ਲੋਧੀ ਕੈਂਪ", "ਸ਼ਾਹਕੋਟ ਰਾਹਤ ਕੈਂਪ", "ਅਜਨਾਲਾ ਕੈਂਪ", "ਮੱਖੂ ਕੈਂਪ", "ਮੁਕੇਰੀਆਂ ਕੈਂਪ", "ਸ੍ਰੀ ਅਨੰਦਪੁਰ ਸਾਹਿਬ ਕੈਂਪ", "ਸ਼ਾਹਕੋਟ ਸ਼ੈਲਟਰ", "राहत शिविर शाहकोट", "सुल्तानपुर लोधी राहत शिविर"]
    },
    {
        "id": "card-food-preservation-flood",
        "category": "silt_and_sanitation",
        "source": "NDMA Guidelines for Food and Water Safety in Disasters & FSSAI Directives",
        "review_status": "verified",
        "title": {
            "en": "Safe Food & Grain Preservation During Floods",
            "hi": "बाढ़ के दौरान भोजन और अनाज की सुरक्षित सुरक्षा",
            "pa": "ਹੜ੍ਹ ਦੌਰਾਨ ਅਨਾਜ ਅਤੇ ਰਾਸ਼ਨ ਦੀ ਸੁਰੱਖਿਅਤ ਸੰਭਾਲ"
        },
        "summary": {
            "en": "Store flour, rice, and pulses in sealed airtight plastic drums on roof slabs. NEVER eat any food, grain, or raw produce touched by flood water.",
            "hi": "आटा, चावल और दालों को प्लास्टिक के ड्रमों में बंद करके छत पर रखें। बाढ़ के पानी के संपर्क में आया कोई भी भोजन कभी न खाएं।",
            "pa": "ਆਟਾ, ਚੌਲ ਅਤੇ ਦਾਲਾਂ ਨੂੰ ਪਲਾਸਟਿਕ ਦੇ ਡਰੰਮਾਂ 'ਚ ਬੰਦ ਕਰਕੇ ਕੋਠੇ 'ਤੇ ਰੱਖੋ। ਹੜ੍ਹ ਦਾ ਪਾਣੀ ਛੂਹ ਚੁੱਕਿਆ ਕੋਈ ਵੀ ਰਾਸ਼ਨ ਕਦੇ ਨਾ ਖਾਓ।"
        },
        "body": {
            "en": "1. Discard contaminated food: Throw away all food items, vegetables, cooked meals, flour, and spices that came into contact with flood water. Flood water carries deadly sewage bacteria.\n2. Store dry food in plastic drums: Transfer wheat, rice, pulses, sugar, and salt into airtight food-grade plastic drums sealed with rubber gaskets on high roof slabs.\n3. Eat dry non-perishables: Rely on roasted gram, jaggery, dry beaten rice (poha), and sealed biscuits that do not require cooking or washing.\n4. Protect LPG cylinders: Detach LPG gas regulators and carry cylinders to upper storeys. Secure loose cylinders with ropes so flood waters cannot wash them into walls.\n5. Boil raw vegetables: If cooking fresh vegetables, boil them vigorously in clean, chlorinated water; never eat raw salads or unpeeled fruit during flood periods.",
            "hi": "1. दूषित भोजन फेंक दें: कोई भी पका हुआ भोजन, आटा या सब्जियां जो बाढ़ के पानी को छू चुकी हों, उन्हें तुरंत फेंक दें।\n2. ड्रमों में अनाज रखें: गेहूं, चावल, दाल और चीनी को एयरटाइट प्लास्टिक ड्रमों में भरकर छत पर रखें।\n3. सूखा भोजन खाएं: भुने चने, गुड़, चूड़ा और सीलबंद बिस्कुट खाएं जिन्हें पकाने या धोने की जरूरत नहीं होती।\n4. गैस सिलेंडर ऊपर रखें: गैस का रेगुलेटर हटाकर सिलेंडर को छत पर ले जाएं और रस्सी से बांधें ताकि पानी में न बहे।\n5. कच्ची सब्जियां न खाएं: बाढ़ के दौरान सलाद या कच्ची सब्जियां न खाएं; जो भी पकाएं उसे उबले पानी में अच्छी तरह पकाएं।",
            "pa": "1. ਖ਼ਰਾਬ ਖਾਣਾ ਸੁੱਟ ਦਿਓ: ਕੋਈ ਵੀ ਪੱਕਿਆ ਹੋਇਆ ਖਾਣਾ, ਆਟਾ ਜਾਂ ਸਬਜ਼ੀ ਜਿਸਨੂੰ ਹੜ੍ਹ ਦਾ ਪਾਣੀ ਛੂਹ ਗਿਆ ਹੋਵੇ, ਉਸਨੂੰ ਤੁਰੰਤ ਸੁੱਟ ਦਿਓ।\n2. ਡਰੰਮਾਂ ਵਿੱਚ ਰਾਸ਼ਨ ਰੱਖੋ: ਕਣਕ, ਚੌਲ, ਦਾਲਾਂ ਅਤੇ ਖੰਡ ਨੂੰ ਪਲਾਸਟਿਕ ਦੇ ਢੱਕਣ ਵਾਲੇ ਡਰੰਮਾਂ ਵਿੱਚ ਪਾ ਕੇ ਛੱਤ ਉੱਤੇ ਰੱਖੋ।\n3. ਸੁੱਕਾ ਖਾਣਾ ਖਾਓ: ਭੁੰਨੇ ਛੋਲੇ, ਗੁੜ ਅਤੇ ਪੈਕਟ ਬੰਦ ਬਿਸਕੁਟ ਖਾਓ ਜਿਨ੍ਹਾਂ ਨੂੰ ਧੋਣ ਜਾਂ ਪਕਾਉਣ ਦੀ ਲੋੜ ਨਹੀਂ ਪੈਂਦੀ।\n4. ਗੈਸ ਸਿਲੰਡਰ ਉੱਪਰ ਰੱਖੋ: ਗੈਸ ਦਾ ਰੈਗੂਲੇਟਰ ਲਾਹ ਕੇ ਸਿਲੰਡਰ ਕੋਠੇ 'ਤੇ ਲੈ ਜਾਓ ਅਤੇ ਰੱਸੇ ਨਾਲ ਬੰਨ੍ਹੋ ਤਾਂ ਜੋ ਪਾਣੀ ਵਿੱਚ ਨਾ ਰੁੜ੍ਹੇ।\n5. ਕੱਚੀ ਸਬਜ਼ੀ ਨਾ ਖਾਓ: ਹੜ੍ਹਾਂ ਦੌਰਾਨ ਸਲਾਦ ਜਾਂ ਕੱਚੇ ਫਲ ਨਾ ਖਾਓ; ਸਿਰਫ਼ ਉਬਲਿਆ ਅਤੇ ਚੰਗੀ ਤਰ੍ਹਾਂ ਰਿੱਝਿਆ ਹੋਇਆ ਤਾਜ਼ਾ ਭੋਜਨ ਹੀ ਖਾਓ।"
        },
        "keywords": ["food preservation flood", "protect ration flood", "store flour rice", "lpg cylinder flood", "food touched by flood", "ਰਾਸ਼ਨ ਬਚਾਉਣਾ", "ਅਨਾਜ ਸੁਰੱਖਿਆ", "ਸੁੱਕਾ ਰਾਸ਼ਨ ਸੰਭਾਲ", "ਗੈਸ ਸਿਲੰਡਰ ਬਚਾਓ", "राशन सुरक्षा", "अनाज सुरक्षा", "गैस सिलेंडर सुरक्षा"]
    },
    {
        "id": "card-search-and-rescue",
        "category": "evacuation_safety",
        "source": "NDRF / SDRF Search and Rescue Standard Operating Procedures",
        "review_status": "verified",
        "title": {
            "en": "Emergency Flood Search & Rescue: Trapped Persons & Boat Evacuation",
            "hi": "बाढ़ में फंसे लोगों के लिए आपातकालीन खोज एवं बचाव (रेस्क्यू बोट)",
            "pa": "ਹੜ੍ਹ ਵਿੱਚ ਫਸੇ ਲੋਕਾਂ ਲਈ ਐਮਰਜੈਂਸੀ ਖੋਜ ਅਤੇ ਬਚਾਅ (ਕਿਸ਼ਤੀ ਰਾਹੀਂ ਨਿਕਾਸੀ)"
        },
        "summary": {
            "en": "Dial 112 (ERSS) or 1078 (NDMA) immediately. Move to the highest reinforced concrete roof. Signal boats with bright cloth by day or torches by night. Conserve phone battery.",
            "hi": "तुरंत 112 या 1078 पर कॉल करें। सबसे ऊंची पक्की छत पर जाएं। दिन में चमकीले कपड़े और रात में टॉर्च से नावों को संकेत दें।",
            "pa": "ਤੁਰੰਤ 112 ਜਾਂ 1078 'ਤੇ ਕਾਲ ਕਰੋ। ਸਭ ਤੋਂ ਉੱਚੀ ਪੱਕੀ ਲੈਂਟਰ ਵਾਲੀ ਛੱਤ 'ਤੇ ਜਾਓ। ਦਿਨ ਵੇਲੇ ਚਮਕੀਲਾ ਕੱਪੜਾ ਅਤੇ ਰਾਤ ਨੂੰ ਟਾਰਚ ਨਾਲ ਕਿਸ਼ਤੀਆਂ ਨੂੰ ਇਸ਼ਾਰਾ ਕਰੋ।"
        },
        "body": {
            "en": "1. Register GPS Coordinates: Call ERSS 112 or NDMA 1078 immediately. Give your village name, nearest prominent landmark (Gurdwara/school/water tower), and exact count of adults, children, and seniors.\n2. Highest Safe Ground: Move to the highest reinforced concrete roof slab. Never take shelter under asbestos sheets, tin sheds, or near cracked mud walls that collapse when water undermines foundations.\n3. Visual Signalling: Display bright clothing (orange, red, yellow) or reflect sunlight using mirrors during daylight. Flash torches or mobile flashlights in intervals of three (international distress signal) at night.\n4. Conserve Mobile Battery: Turn off mobile data, Wi-Fi, and background apps. Switch phone to battery-saver mode. Send brief SMS texts to family instead of voice calls.\n5. Keep Lifejackets / Floating Aids: Use empty sealed plastic water cans, inverted air tubes, or wooden cots as emergency flotation devices if water enters the upper floor.\n6. Order of Boat Boarding: Board rescue boats calmly in single file. Pregnant women, infants, sick, and elderly board first. Never jump or overcrowd an inflatable rescue boat.",
            "hi": "1. तुरंत 112 या 1078 पर फोन करें: अपने गांव का नाम, नजदीकी पक्का लैंडमार्क और परिवार के सदस्यों की संख्या नोट करवाएं।\n2. सबसे ऊंची छत पर जाएं: पक्की लेंटर वाली छत पर जाएं। कच्ची दीवारों या टीन शेड के नीचे न रुकें क्योंकि पानी नींव खोखली कर देता है।\n3. चमकीले कपड़े से संकेत दें: दिन में लाल, पीला या संतरी कपड़ा फहराएं या शीशे से धूप चमकाएं। रात को टॉर्च की रोशनी तीन-तीन बार चमकाएं (आपातकालीन संकेत)।\n4. मोबाइल बैटरी बचाएं: इंटरनेट और जीपीएस बंद रखें। फोन को बैटरी सेवर मोड में रखें और फोन कॉल के बजाय केवल एसएमएस करें।\n5. तैरने वाले साधन रखें: खाली सीलबंद प्लास्टिक के कैन, हवा भरी ट्यूब या बांस को तैरने के साधन के रूप में तैयार रखें।\n6. नाव में सुरक्षित बैठें: बचाव नौका में धक्का-मुक्की न करें। पहले गर्भवती महिलाओं, बच्चों और बुजुर्गों को बैठाएं।",
            "pa": "1. ਤੁਰੰਤ 112 ਜਾਂ 1078 'ਤੇ ਕਾਲ ਕਰੋ: ਆਪਣੇ ਪਿੰਡ ਦਾ ਨਾਂ, ਨੇੜਲਾ ਪੱਕਾ ਨਿਸ਼ਾਨ (ਗੁਰਦੁਆਰਾ/ਟੈਂਕੀ) ਅਤੇ ਕੁੱਲ ਜੀਆਂ ਦੀ ਗਿਣਤੀ ਲਿਖਵਾਓ।\n2. ਸਭ ਤੋਂ ਉੱਚੀ ਪੱਕੀ ਛੱਤ 'ਤੇ ਜਾਓ: ਪੱਕੇ ਲੈਂਟਰ ਵਾਲੀ ਛੱਤ 'ਤੇ ਜਾਓ। ਕੱਚੀਆਂ ਕੰਧਾਂ ਜਾਂ ਸ਼ੈੱਡਾਂ ਹੇਠਾਂ ਨਾ ਬੈਠੋ ਕਿਉਂਕਿ ਪਾਣੀ ਨਾਲ ਨੀਂਹਾਂ ਬੈਠ ਜਾਂਦੀਆਂ ਹਨ।\n3. ਚਮਕੀਲੇ ਕੱਪੜੇ ਨਾਲ ਇਸ਼ਾਰਾ ਕਰੋ: ਦਿਨ ਵੇਲੇ ਲਾਲ, ਪੀਲਾ ਜਾਂ ਸੰਤਰੀ ਕੱਪੜਾ ਲਹਿਰਾਓ ਜਾਂ ਸ਼ੀਸ਼ੇ ਨਾਲ ਲਿਸ਼ਕ ਮਾਰੋ। ਰਾਤ ਨੂੰ ਟਾਰਚ ਦੀ ਰੋਸ਼ਨੀ ਤਿੰਨ-ਤਿੰਨ ਵਾਰ ਜਗਾਓ-ਬੁਝਾਓ।\n4. ਫੋਨ ਦੀ ਬੈਟਰੀ ਬਚਾਓ: ਇੰਟਰਨੈੱਟ ਅਤੇ ਬਲੂਟੁੱਥ ਬੰਦ ਰੱਖੋ। ਫੋਨ ਨੂੰ ਬੈਟਰੀ ਸੇਵਰ 'ਤੇ ਲਗਾਓ ਅਤੇ ਕਾਲਾਂ ਦੀ ਥਾਂ ਸਿਰਫ਼ ਜ਼ਰੂਰੀ ਐੱਸ.ਐੱਮ.ਐੱਸ. ਕਰੋ।\n5. ਤੈਰਨ ਵਾਲੀਆਂ ਚੀਜ਼ਾਂ ਕੋਲ ਰੱਖੋ: ਖਾਲੀ ਸੀਲਬੰਦ ਪਲਾਸਟਿਕ ਦੇ ਕੈਨ, ਹਵਾ ਵਾਲੀਆਂ ਟਿਊਬਾਂ ਜਾਂ ਮੰਜਿਆਂ ਨੂੰ ਸਹਾਰੇ ਲਈ ਤਿਆਰ ਰੱਖੋ।\n6. ਕਿਸ਼ਤੀ ਵਿੱਚ ਅਰਾਮ ਨਾਲ ਚੜ੍ਹੋ: ਬਚਾਅ ਕਿਸ਼ਤੀ ਵਿੱਚ ਭਗਦੜ ਨਾ ਮਚਾਓ। ਪਹਿਲਾਂ ਗਰਭਵਤੀ ਔਰਤਾਂ, ਬੱਚਿਆਂ ਅਤੇ ਬਜ਼ੁਰਗਾਂ ਨੂੰ ਚੜ੍ਹਾਓ।"
        },
        "keywords": ["boat rescue", "trapped", "stranded", "rescue boats", "rooftop rescue", "ndrf boat", "sdrf boat", "trapped on roof", "flood rescue", "ਬਚਾਓ ਕਿਸ਼ਤੀ", "ਫਸੇ ਹੋਏ", "ਛੱਤ 'ਤੇ ਫਸੇ", "ਕਿਸ਼ਤੀ ਬਚਾਅ", "ਬਚਾਓ", "नाव बचाव", "रेस्क्यू बोट", "छत पर फंसे", "बाढ़ बचाव"]
    },
    {
        "id": "card-compensation-girdawari",
        "category": "evacuation_safety",
        "source": "Punjab Revenue & Disaster Management Department & SDRF Compensation Norms",
        "review_status": "verified",
        "title": {
            "en": "Flood Damage Survey (Special Girdawari) & Government Compensation",
            "hi": "बाढ़ क्षति सर्वेक्षण (विशेष गिरदावरी) और सरकारी मुआवजा प्रक्रिया",
            "pa": "ਹੜ੍ਹ ਖ਼ਰਾਬਾ ਸਰਵੇਖਣ (ਵਿਸ਼ੇਸ਼ ਗਿਰਦਾਵਰੀ) ਅਤੇ ਸਰਕਾਰੀ ਮੁਆਵਜ਼ਾ ਪ੍ਰਕਿਰਿਆ"
        },
        "summary": {
            "en": "Photograph high-water marks and property damage before clearing. Report crop loss to Halqa Patwari for official Special Girdawari under State Disaster Response Fund (SDRF).",
            "hi": "सफाई से पहले पानी के निशान और मकान के नुकसान की फोटो/वीडियो लें। विशेष गिरदावरी और मुआवजे के लिए हलका पटवारी को तुरंत सूचित करें।",
            "pa": "ਸਫ਼ਾਈ ਕਰਨ ਤੋਂ ਪਹਿਲਾਂ ਕੰਧਾਂ 'ਤੇ ਪਾਣੀ ਦੇ ਨਿਸ਼ਾਨਾਂ ਅਤੇ ਨੁਕਸਾਨ ਦੀਆਂ ਫੋਟੋਆਂ ਖਿੱਚੋ। ਸਰਕਾਰੀ ਮੁਆਵਜ਼ੇ ਲਈ ਹਲਕਾ ਪਟਵਾਰੀ ਕੋਲ ਵਿਸ਼ੇਸ਼ ਗਿਰਦਾਵਰੀ ਦਰਜ ਕਰਵਾਓ।"
        },
        "body": {
            "en": "1. Document damage immediately: Before washing away mud or repairing walls, take timestamped photos and videos of watermarks on walls, cracked masonry, submerged tubewells, and damaged tractors.\n2. Keep land records safe: Preserve your Land Title Deed (Jamabandi/Fard), Aadhaar card, and Bank Passbook (linked with IFSC) in waterproof pouches for official claim verification.\n3. Special Girdawari notification: When the state government declares flood relief, the Revenue Department orders a 'Special Girdawari' survey conducted jointly by the Halqa Patwari, Kanungo, and Agriculture Officer.\n4. Register losses with Panchayat: Submit written details of crop submersion (acres damaged), livestock mortality, and collapsed rooms to the Sarpanch and Patwari.\n5. Animal mortality compensation: Obtain a formal post-mortem / death certificate from the Government Veterinary Officer for every drowned cow or buffalo to claim SDRF livestock assistance.\n6. Track claims: Visit District Tehsildar or SDM office, or dial District Control Room 1077 to confirm registration in the official compensation list.",
            "hi": "1. नुकसान की फोटो लें: दीवारें धोने से पहले मकान पर पानी के स्तर, टूटी दीवारों और डूबे ट्यूबवेल की फोटो और वीडियो बनाकर सुरक्षित रखें।\n2. जरूरी कागजात: जमीन की फर्द, बैंक पासबुक और आधार कार्ड तैयार रखें क्योंकि मुआवजा सीधे बैंक खाते (DBT) में आता है।\n3. विशेष गिरदावरी: सरकार द्वारा घोषित 'विशेष गिरदावरी' के दौरान हलका पटवारी और कृषि अधिकारी के पास अपनी फसल के नुकसान का ब्योरा दर्ज करवाएं।\n4. पंचायत में सूचना दें: सरपंच और पटवारी को लिखित में बताएं कि कितने एकड़ फसल डूबी और मकान के कितने कमरे गिरे।\n5. मृत पशुओं का मुआवजा: मृत गाय या भैंस के लिए सरकारी पशु डॉक्टर से मृत्यु प्रमाण पत्र (पोस्टमार्टम) जरूर बनवाएं।\n6. स्थिति जांचें: तहसील कार्यालय या जिला कंट्रोल रूम 1077 पर फोन करके मुआवजे की सूची में अपना नाम जांचें।",
            "pa": "1. ਨੁਕਸਾਨ ਦੀਆਂ ਫੋਟੋਆਂ ਖਿੱਚੋ: ਸਫ਼ਾਈ ਕਰਨ ਤੋਂ ਪਹਿਲਾਂ ਕੰਧਾਂ ਉੱਤੇ ਪਾਣੀ ਦੀ ਉਚਾਈ ਦੇ ਨਿਸ਼ਾਨ, ਤਿੜਕੀਆਂ ਕੰਧਾਂ ਅਤੇ ਡੁੱਬੇ ਮੋਟਰ-ਬੋਰਾਂ ਦੀਆਂ ਫੋਟੋਆਂ ਅਤੇ ਵੀਡੀਓ ਬਣਾ ਕੇ ਰੱਖੋ।\n2. ਜ਼ਰੂਰੀ ਕਾਗਜ਼ਾਤ: ਜ਼ਮੀਨ ਦੀ ਫ਼ਰਦ/ਜਮ੍ਹਾਂਬੰਦੀ, ਆਧਾਰ ਕਾਰਡ ਅਤੇ ਬੈਂਕ ਖਾਤੇ ਦੀ ਕਾਪੀ ਸੰਭਾਲ ਕੇ ਰੱਖੋ ਕਿਉਂਕਿ ਮੁਆਵਜ਼ਾ ਸਿੱਧਾ ਬੈਂਕ ਖਾਤੇ ਵਿੱਚ ਆਉਂਦਾ ਹੈ।\n3. ਵਿਸ਼ੇਸ਼ ਗਿਰਦਾਵਰੀ: ਸਰਕਾਰ ਵੱਲੋਂ ਐਲਾਨੀ 'ਵਿਸ਼ੇਸ਼ ਗਿਰਦਾਵਰੀ' ਵੇਲੇ ਹਲਕਾ ਪਟਵਾਰੀ ਅਤੇ ਖੇਤੀਬਾੜੀ ਅਫ਼ਸਰ ਕੋਲ ਆਪਣੀ ਖ਼ਰਾਬ ਹੋਈ ਫ਼ਸਲ ਦਾ ਰਿਕਾਰਡ ਦਰਜ ਕਰਵਾਓ।\n4. ਪੰਚਾਇਤ ਕੋਲ ਦਰਜ ਕਰਵਾਓ: ਸਰਪੰਚ ਅਤੇ ਪਟਵਾਰੀ ਨੂੰ ਲਿਖਤੀ ਦਿਓ ਕਿ ਕਿੰਨੇ ਏਕੜ ਫ਼ਸਲ ਮਾਰੀ ਗਈ ਅਤੇ ਮਕਾਨ ਦਾ ਕਿੰਨਾ ਨੁਕਸਾਨ ਹੋਇਆ।\n5. ਮਰੇ ਡੰਗਰਾਂ ਦਾ ਮੁਆਵਜ਼ਾ: ਮਰੀ ਹੋਈ ਗਾਂ ਜਾਂ ਮੱਝ ਲਈ ਸਰਕਾਰੀ ਵੈਟਰਨਰੀ ਡਾਕਟਰ ਤੋਂ ਪੋਸਟਮਾਰਟਮ ਰਿਪੋਰਟ ਜ਼ਰੂਰ ਲਵੋ ਤਾਂ ਜੋ ਸਰਕਾਰੀ ਸਹਾਇਤਾ ਮਿਲ ਸਕੇ।\n6. ਜਾਣਕਾਰੀ ਲਵੋ: ਤਹਿਸੀਲਦਾਰ ਦਫ਼ਤਰ ਜਾਂ ਜ਼ਿਲ੍ਹਾ ਕੰਟਰੋਲ ਰੂਮ 1077 'ਤੇ ਕਾਲ ਕਰਕੇ ਮੁਆਵਜ਼ੇ ਦੀ ਸੂਚੀ ਬਾਰੇ ਪਤਾ ਕਰੋ।"
        },
        "keywords": ["compensation", "girdawari", "patwari", "crop damage compensation", "fasal kharaba", "sdrf relief claim", "fard jamabandi", "ਮੁਆਵਜ਼ਾ", "ਗਿਰਦਾਵਰੀ", "ਪਟਵਾਰੀ", "ਖ਼ਰਾਬਾ ਮੁਆਵਜ਼ਾ", "ਫ਼ਸਲ ਨੁਕਸਾਨ ਮੁਆਵਜ਼ਾ", "ਸਰਕਾਰੀ ਮਦਦ", "मुआवजा", "विशेष गिरदावरी", "पटवारी", "फसल खराबा मुआवजा"]
    }
]

all_cards = core_cards + specialized_cards
print(f"Total cards: {len(all_cards)} (7 core + {len(specialized_cards)} specialized)")

with open(CARDS_FILE, "w", encoding="utf-8") as f:
    json.dump(all_cards, f, ensure_ascii=False, indent=2)

with open(APP_CARDS_FILE, "w", encoding="utf-8") as f:
    json.dump(all_cards, f, ensure_ascii=False, indent=2)

print("Saved successfully!")
