# models/guidance/retriever.py
"""
BM25 Multilingual Card Retriever with M5 Router & Guard (PRD Section 10A & Phase 6).
Indexes verified disaster management cards in English, Hindi, and Punjabi.
Integrates rule-based M5 intent router for hazard priority and safety invariance.
"""
import json
import math
import pathlib
import re
from typing import List, Dict, Any, Tuple

ROOT = pathlib.Path(__file__).resolve().parent.parent.parent
CARDS_FILE = ROOT / "corpus" / "cards" / "cards.json"
HELPLINES_FILE = ROOT / "corpus" / "helplines.json"

def tokenize(text: str) -> List[str]:
    """Multilingual whitespace and punctuation tokenizer."""
    if not text:
        return []
    text = text.lower()
    tokens = re.findall(r"[\w\u0900-\u097F\u0A00-\u0A7F]+", text)
    return tokens

STOP_WORDS = {
    "का", "की", "के", "में", "से", "को", "है", "हैं", "हो", "पर", "और", "या", "तो", "भी", "ने", "एक",
    "ਦਾ", "ਦੀ", "ਦੇ", "ਵਿੱਚ", "ਨੂੰ", "ਹੈ", "ਹਨ", "ਅਤੇ", "ਜਾਂ", "ਨੇ", "ਇੱਕ", "ਤਾਂ", "ਕੀ", "ਕਿਵੇਂ", "ਕਰਨਾ",
    "the", "is", "in", "to", "and", "or", "of", "a", "an", "what", "how", "can", "should", "i", "we", "my", "our", "do", "if", "for", "on", "at", "by", "from", "with"
}

class CardRetriever:
    def __init__(self, cards_path: pathlib.Path = CARDS_FILE):
        self.cards_path = cards_path
        self.cards = self._load_cards()
        self.doc_count = len(self.cards)
        self.avg_doc_len = 0.0
        self.doc_lengths = []
        self.doc_token_counts = []
        self.df = {}
        self._build_index()

    def _load_cards(self) -> List[Dict[str, Any]]:
        if not self.cards_path.exists():
            return []
        data = json.loads(self.cards_path.read_text(encoding="utf-8"))
        return data

    def _build_index(self):
        total_len = 0
        for card in self.cards:
            weighted_tokens = []
            
            # Keywords get 4x weight
            for kw in card.get("keywords", []):
                for t in tokenize(kw):
                    if t not in STOP_WORDS:
                        weighted_tokens.extend([t] * 4)

            # Titles get 3x weight
            for lang in ["en", "hi", "pa"]:
                title_text = card.get("title", {}).get(lang, "")
                for t in tokenize(title_text):
                    if t not in STOP_WORDS:
                        weighted_tokens.extend([t] * 3)

            # Summaries get 2x weight
            for lang in ["en", "hi", "pa"]:
                summary_text = card.get("summary", {}).get(lang, "")
                for t in tokenize(summary_text):
                    if t not in STOP_WORDS:
                        weighted_tokens.extend([t] * 2)

            # Body get 1x weight
            for lang in ["en", "hi", "pa"]:
                body_text = card.get("body", {}).get(lang, "")
                for t in tokenize(body_text):
                    if t not in STOP_WORDS:
                        weighted_tokens.append(t)

            doc_len = len(weighted_tokens)
            self.doc_lengths.append(doc_len)
            total_len += doc_len

            counts = {}
            for t in weighted_tokens:
                counts[t] = counts.get(t, 0) + 1
            self.doc_token_counts.append(counts)

            for t in set(weighted_tokens):
                self.df[t] = self.df.get(t, 0) + 1

        if self.doc_count > 0:
            self.avg_doc_len = total_len / self.doc_count

    def route_intent(self, query: str) -> Tuple[str, float]:
        """
        M5 Router + Guard (PRD Section 10A).
        Detects primary safety hazard and routes directly or boosts target.
        """
        q = query.lower()

        # ----------------------------------------------------------------------
        # 1. WATER CROSSING HAZARDS (TURN AROUND DON'T DROWN - HIGHEST SAFETY)
        # ----------------------------------------------------------------------
        # Includes motorbikes/tractors/cars/walking through flood water
        # Excludes snake sightings, electrical wires in water, or post-flood appliance drying
        if any(w in q for w in ["cross", "crossing", "walk", "walk through", "wade", "swim", "drive", "car", "tractor", "bike", "motorbike", "motorcycle", "vehicle", "knee", "ankle", "deep", "bridge", "causeway", "road", "पुल", "सड़क", "पैदल", "गाड़ी", "कार", "पार", "ਡਿੱਗਣ", "ਗੋਡੇ", "ਤੁਰ", "ਲੰਘ", "ਚਲਾਓ", "ਪੈਦਲ", "ਪਾਰ ਕਰਨਾ", "ਪੁਲ", "ਟਰੈਕਟਰ", "ਗੱਡੀ", "ਮੋਟਰਸਾਈਕਲ", "ਨਾਲਿਆਂ", "ਖੁੱਲ੍ਹੇ ਨਾਲਿਆਂ", "ਖ਼ਤਰੇ", "छिपे खतरे", "खेल सकते"]):
            if not any(w in q for w in ["snake", "saap", "saanp", "ਸੱਪ", "सांप", "wire", "electric", "power line", "बिजली", "तार", "ਬਿਜਲੀ", "ਤਾਰ", "1912", "step potential", "dry motor", "megger", "repair", "tether", "khunta", "breach"]):
                return ("card-water-crossing", 70.0)

        # ----------------------------------------------------------------------
        # 2. DEDICATED HELPLINE ROUTING
        # ----------------------------------------------------------------------
        if any(w in q for w in ["helpline", "phone number", "control room", "ndma", "sdma", "ddma", "1078", "1070", "1077", "ਫੋਨ ਨੰਬਰ", "ਹੈਲਪਲਾਈਨ", "ਕੰਟਰੋਲ ਰੂਮ", "कंट्रोल रूम", "नियंत्रण कक्ष", "हेल्पलाइन", "फोन नंबर"]):
            return ("corpus-helpline", 100.0)

        # ----------------------------------------------------------------------
        # 3. MEDICAL REFUSAL & AMBULANCE (DIAL 108)
        # ----------------------------------------------------------------------
        if any(w in q for w in ["ambulance", "एंबुलेंस", "एम्बुलेंस", "ਐਂਬੂਲੈਂਸ", "medicine", "doctor", "tablet", "dose", "dosage", "fever", "diarrhea", "vomiting", "antibiotic", "injection", "paracetamol", "cholera", "दवा", "दवाई", "गोली", "खुराक", "बुखार", "दस्त", "उल्टी", "इंजेक्शन", "हैजा", "मरहम", "ਦਵਾਈ", "ਬੁਖ਼ਾਰ", "ਦਸਤ", "ਉਲਟੀਆਂ", "ਟੀਕਾ"]):
            if not any(w in q for w in ["purify", "chlorine tablet", "aquatabs"]):
                return ("card-medical-refusal", 70.0)

        # ----------------------------------------------------------------------
        # 4. SPECIFIC DISASTER SUB-TOPICS (High Precision)
        # ----------------------------------------------------------------------

        # A. Electrical: Appliances & Motors Post-Flood (Must not trigger on motorbike)
        is_motor_query = (
            ("motor" in q and not any(mb in q for mb in ["motorbike", "motorcycle", "motor bike"])) or
            ("ਮੋਟਰ" in q and "ਮੋਟਰਸਾਈਕਲ" not in q) or
            ("मोटर" in q and "मोटरसाइकिल" not in q) or
            any(w in q for w in ["appliance", "appliances", "fridge", "television", "inverter", "megger", "submersible", "tubewell", "dry motor", "ਉਪਕਰਨ", "ਸਮਰਸੀਬਲ", "ਟਿਊਬਵੈੱਲ", "ਮੈਗਰ", "उपकरण", "मेगर", "समरसिबल", "ट्यूबवेल"])
        )
        if is_motor_query:
            return ("card-appliances-post-flood", 75.0)

        # B. Electrical: Step Potential & Hopping/Shuffling
        if any(w in q for w in ["step potential", "hopping", "bunny hop", "shuffle", "feet together", "ground current", "ਸਟੈੱਪ ਪੋਟੈਂਸ਼ੀਅਲ", "ਪੈਰ ਘੜੀਸ", "ਦੋਵੇਂ ਪੈਰ ਜੋੜ", "ਛਾਲਾਂ ਮਾਰ", "स्टेप पोटेंशियल", "पैर घसीट", "कूदते हुए"]):
            return ("card-electrical-step-potential", 75.0)

        # C. Water: Well Chlorination Math & Calculations
        if any(w in q for w in ["calculation", "formula", "pi r", "radius", "volume", "depth", "cubic metre", "12,500", "ਗਣਨਾ", "ਕੈਲਕੁਲੇਸ਼ਨ", "ਅਰਧ-ਵਿਆਸ", "ਸੂਤਰ", "ਫਾਰਮੂਲਾ", "ਖੂਹ ਦੀ ਗਣਨਾ", "ਕਿੰਨਾ ਬਲੀਚਿੰਗ", "ਕਿੰਨਾ ਪਾਊਡਰ", "गणना", "त्रिज्या", "कुएं की गणना", "कितना ब्लीचिंग"]):
            return ("card-well-chlorination-calc", 75.0)

        # D. Water: Overhead Sintex / Plastic Storage Tanks
        if any(w in q for w in ["sintex", "overhead tank", "plastic tank", "storage tank", "cleaning tank", "clean tank", "ਸਿੰਟੈਕਸ", "ਟੈਂਕੀ ਸਾਫ਼", "ਛੱਤ ਵਾਲੀ ਟੈਂਕੀ", "ਸਿੰਟੈਕਸ ਟੈਂਕੀ", "ਪਲਾਸਟਿਕ ਟੈਂਕੀ", "सिंटेक्स", "टंकी साफ", "प्लास्टिक टंकी"]):
            return ("card-water-tank-disinfection", 75.0)

        # E. Reptiles: Snakebite First Aid & ASV
        if any(w in q for w in ["first aid", "tourniquet", "anti-venom", "asv", "cut wound", "suck venom", "treatment", "ਕੱਟਣਾ", "ਫਸਟ ਏਡ", "ਐਂਟੀ ਵੈਨਮ", "ਸੱਪ ਦਾ ਇਲਾਜ", "ਚੀਰਾ", "ਰੱਸੀ ਬੰਨ੍ਹ", "प्राथमिक उपचार", "एंटी वेनम", "चीरा लगाना"]) and any(s in q for s in ["snake", "snakebite", "bite", "ਸੱਪ", "ਸੱਪ ਲੜ", "ਡੰਗ", "सांप", "डंक"]):
            return ("card-snakebite-first-aid", 75.0)

        # F. Reptiles: Scorpion Stings (Requires sting/bite keyword)
        if any(w in q for w in ["scorpion sting", "scorpion bite", "ਬਿੱਛੂ ਦਾ ਡੰਗ", "ਬਿੱਛੂ ਲੜ", "बिच्छू का डंक", "बिच्छू काटना"]):
            return ("card-scorpion-sting-aid", 75.0)

        # G. Sanitation: Silt & Flood Mud Cleanup
        if any(w in q for w in ["clean silt", "mud cleanup", "flood mud", "sludge", "cleaning house", "shovel", "ਗਾਰ ਸਾਫ਼", "ਚਿੱਕੜ ਸਾਫ਼", "ਹੜ੍ਹ ਦੀ ਗਾਰ", "ਸਿਲਟ", "ਕਹੀ", "गाद साफ", "कीचड़ साफ", "सिल्ट साफ"]):
            return ("card-silt-mud-cleanup", 75.0)

        # H. Sanitation: Leptospirosis Prevention
        if any(w in q for w in ["leptospirosis", "rat urine", "stagnant water infection", "calf pain", "mud disease", "water infection", "ਲੈਪਟੋਸਪਾਇਰੋਸਿਸ", "ਪਿੰਨੀਆਂ ਦਾ ਦਰਦ", "ਲੇਪਟੋਸਪਾਇਰੋਸਿਸ", "ਚੂਹੇ ਦਾ ਪਿਸ਼ਾਬ", "लेप्टोस्पायरोसिस", "चूहे का पेशाब", "पिंडलियों का दर्द"]):
            return ("card-leptospirosis-prevention", 75.0)

        # I. Sanitation: Livestock Carcass Disposal
        if any(w in q for w in ["carcass", "dead cattle", "dead animal", "dead cow", "dead buffalo", "quicklime", "bury carcass", "burial pit", "dead livestock", "ਮਰੇ ਪਸ਼ੂ", "ਮਰੇ ਡੰਗਰ", "ਮਰੀ ਗਾਂ", "ਦਫ਼ਨਾਉਣਾ", "ਚੂਨਾ ਪਾਉਣਾ", "ਮਰੇ ਹੋਏ ਪਸ਼ੂ", "ਪਸ਼ੂ ਦਬਾਉਣਾ", "मृत पशु", "दफनाना", "चूना डालकर"]):
            return ("card-carcass-disposal", 75.0)

        # J. Livestock: Stranded Livestock on Islands / Bunds
        if any(w in q for w in ["stranded cattle", "stranded cows", "livestock island", "cattle on island", "fodder drop", "ਟਾਪੂ 'ਤੇ ਫਸੇ ਪਸ਼ੂ", "ਦਰਿਆਈ ਟਾਪੂ 'ਤੇ ਡੰਗਰ", "ਫਸੇ ਪਸ਼ੂ", "ਟਾਪੂ", "टापू पर फंसे मवेशी", "टापू पर फंसे"]):
            return ("card-stranded-livestock-rescue", 75.0)

        # K. Embankments: Dhussi Bundh Breach Response
        if any(w in q for w in ["dhussi bundh breach", "dhussi breach", "embankment breach", "bundh breach", "dhussi tootna", "ਧੁੱਸੀ ਬੰਨ੍ਹ ਪਾੜ", "ਬੰਨ੍ਹ ਟੁੱਟ", "ਪਾੜ ਪੈਣਾ", "ਧੁੱਸੀ ਪਾੜ", "ਮੁਨਾਦੀ", "ਧੁੱਸੀ ਟੁੱਟ", "धुस्सी बांध टूटना", "बांध में दरार", "बांध टूटना"]):
            return ("card-dhussi-bundh-breach", 75.0)

        # L. Embankments: Sand Boil Ring Bunding
        if any(w in q for w in ["sand boil", "ring bundh", "piping", "sand geyser", "bubbling sand", "sandbag ring", "sandboil", "ਸੈਂਡ ਬੋਇਲ", "ਰਿੰਗ ਬੰਨ੍ਹ", "ਮੋਘਾ", "ਰੇਤ ਉਬਲ", "ਬੰਨ੍ਹ 'ਚੋਂ ਪਾਣੀ", "सैंड बॉयल", "रिंग बांध", "उबलती रेत"]):
            return ("card-sand-boil-embankment", 75.0)

        # M. Evacuation: Vulnerable Populations (Pregnant, Elderly, Infants)
        if any(w in q for w in ["pregnant", "pregnancy", "wheelchair", "handicapped", "mcp card", "disabled", "infant", "infants", "elderly", "ਬਜ਼ੁਰਗ", "ਗਰਭਵਤੀ", "ਅਪਾਹਜ", "ਸੋਟੀ", "ਐਨਕਾਂ", "ਜੱਚਾ-ਬੱਚਾ", "ਬੱਚਿਆਂ ਨੂੰ ਬਚਾਓ", "गर्भवती", "दिव्यांग", "बुजुर्ग", "शिशु"]):
            return ("card-vulnerable-evacuation", 75.0)

        # N. Evacuation: Government Relief Shelters Directory
        if any(w in q for w in ["shahkot", "sultanpur lodhi", "ajnala", "makhu", "mukerian", "anandpur sahib", "jalandhar shelter", "kapurthala shelter", "amritsar shelter", "firozpur shelter", "shelter address", "which shelter", "relief shelter", "ਸੁਲਤਾਨਪੁਰ ਲੋਧੀ", "ਸ਼ਾਹਕੋਟ", "ਅਜਨਾਲਾ", "ਮੱਖੂ", "ਮੁਕੇਰੀਆਂ", "ਸ੍ਰੀ ਅਨੰਦਪੁਰ ਸਾਹਿਬ", "ਕਿਹੜਾ ਰਾਹਤ ਕੈਂਪ", "ਰਾਹਤ ਸ਼ਿਵਿਰ", "ਸ਼ੈਲਟਰ ਕਿੱਥੇ", "ਕੈਂਪ ਕਿੱਥੇ", "राहत शिविर कहां", "कैंप कहां"]):
            return ("card-shelters-directory-punjab", 75.0)

        # O. Food: Food & Grain Preservation
        if any(w in q for w in ["food storage", "protect food", "protect ration", "safe food", "flour", "rice", "dry food", "food touched", "gas cylinder", "lpg cylinder", "ration", "ਰਾਸ਼ਨ ਬਚਾਉਣਾ", "ਅਨਾਜ ਸੁਰੱਖਿਆ", "ਸੁੱਕਾ ਰਾਸ਼ਨ", "ਗੈਸ ਸਿਲੰਡਰ ਬਚਾਓ", "ਰਾਸ਼ਨ", "ਅਨਾਜ", "ਖਾਣਾ", "राशन सुरक्षा", "अनाज सुरक्षा", "गैस सिलेंडर", "भोजन", "खाना"]):
            return ("card-food-preservation-flood", 75.0)

        # P. Recovery: Damage Survey & Girdawari Compensation
        if any(w in q for w in ["compensation", "girdawari", "patwari", "crop damage", "fasal kharaba", "loss money", "sdrf", "fard", "jamabandi", "damage survey", "claim money", "ਮੁਆਵਜ਼ਾ", "ਗਿਰਦਾਵਰੀ", "ਪਟਵਾਰੀ", "ਖ਼ਰਾਬਾ", "ਫ਼ਸਲ ਨੁਕਸਾਨ", "ਸਰਕਾਰੀ ਮਦਦ", "ਫ਼ਰਦ", "ਮੁਆਵਜ਼ਾ ਕਿਵੇਂ", "मुआवजा", "गिरदावरी", "पटवारी", "फसल खराबा"]):
            return ("card-compensation-girdawari", 75.0)

        # Q. Search & Rescue: Trapped Persons & Boat Evacuation
        if any(w in q for w in ["boat", "rescue", "trapped", "stranded", "stuck", "roof", "ndrf", "sdrf", "ਕਿਸ਼ਤੀ", "ਬਚਾਓ", "ਫਸੇ", "ਛੱਤ", "ਮਦਦ", "नाव", "बचाव", "फंसे", "छत"]):
            if not any(w in q for w in ["cattle", "cow", "buffalo", "ਪਸ਼ੂ", "ਡੰਗਰ", "animal", "fodder"]):
                return ("card-search-and-rescue", 75.0)

        # ----------------------------------------------------------------------
        # 5. CORE HAZARD FALLBACKS (BROAD)
        # ----------------------------------------------------------------------

        # A. Electrical Safety
        if any(w in q for w in ["wire", "wires", "electric", "power line", "shock", "breaker", "switch", "meter", "current", "pole", "transformer", "बिजली", "तार", "तारों", "करंट", "स्विच", "खंभा", "खंभे", "खंभों", "मीटर", "ਬਿਜਲੀ", "ਤਾਰਾਂ", "ਤਾਰ", "ਕਰੰਟ", "ਸਵਿੱਚ", "ਖੰਭੇ", "ਖੰਭਾ", "ਪਾਵਰਕਾਮ", "1912"]):
            return ("card-electrical-safety", 70.0)

        # B. Drinking Water
        if any(w in q for w in ["drinking water", "boil water", "boil", "purify", "well water", "hand pump", "borewell", "chlorine", "peene ka pani", "ubalna", "हैंडपंप", "बोरवेल", "कुएं", "कुआं", "उबालना", "उबालें", "पीने", "ਪੀਣ ਵਾਲਾ", "ਉਬਾਲਣਾ", "ਉਬਾਲੋ", "ਨਲਕੇ", "ਨਲਕਾ", "ਖੂਹ", "ਕਲੋਰੀਨ", "ਸ਼ੁੱਧ"]):
            return ("card-drinking-water", 70.0)

        # C. Snake & Reptile Hazards
        if any(w in q for w in ["snake", "snakebite", "reptile", "scorpion", "saap", "saanp", "katna", "सांप", "सांपों", "बिच्छू", "डंक", "ਸੱਪ", "ਸੱਪਾਂ", "ਬਿੱਛੂ", "ਡੰਗ"]):
            return ("card-snakes-reptiles", 70.0)

        # D. Livestock & Cattle Safety
        if any(w in q for w in ["cattle", "livestock", "cow", "cows", "buffalo", "buffaloes", "animal", "animals", "fodder", "untie", "pashu", "gay", "bhains", "chara", "पशु", "पशुओं", "गाय", "भैंस", "भैंसों", "मवेशी", "मवेशियों", "चारा", "ਖੂਟੇ", "ਪਸ਼ੂ", "ਪਸ਼ੂਆਂ", "ਮੱਝ", "ਮੱਝਾਂ", "ਗਾਂ", "ਗਾਵਾਂ", "ਪੱਠੇ", "ਤੂੜੀ", "ਕਿੱਲੇ", "ਵਾੜੇ"]):
            return ("card-livestock-protection", 70.0)

        # E. Evacuation & Go-bag
        if any(w in q for w in ["evacuate", "evacuation", "shelter", "go-bag", "go bag", "pack", "leave home", "documents", "torch", "आपातकालीन बैग", "निकासी", "राहत शिविर", "घर खाली", "ਘਰ ਖਾਲੀ", "ਨਿਕਾਸੀ", "ਰਾਹਤ ਕੈਂਪ", "ਐਮਰਜੈਂਸੀ ਬੈਗ", "ਕਾਗਜ਼ਾਤ", "ਬੈਗ", "ਕੀ-ਕੀ ਰੱਖੀਏ"]):
            return ("card-evacuation-readiness", 70.0)

        return (None, 0.0)

    def retrieve(self, query: str, top_k: int = 3) -> List[Tuple[Dict[str, Any], float]]:
        """Compute BM25 relevance scores with M5 router assistance."""
        routed_target, router_boost = self.route_intent(query)
        if routed_target == "corpus-helpline":
            helpline_card = {
                "id": "corpus-helpline",
                "title": {"en": "Emergency Helplines", "hi": "आपातकालीन हेल्पलाइन", "pa": "ਐਮਰਜੈਂਸੀ ਹੈਲਪਲਾਈਨ"},
                "category": "helpline",
                "review_status": "verified"
            }
            return [(helpline_card, 100.0)]

        q_tokens = [t for t in tokenize(query) if t not in STOP_WORDS]
        if not q_tokens or self.doc_count == 0:
            return []

        k1 = 1.5
        b = 0.75
        scores = []

        for idx, card in enumerate(self.cards):
            score = 0.0
            doc_len = self.doc_lengths[idx]
            counts = self.doc_token_counts[idx]

            for t in q_tokens:
                if t in counts:
                    tf = counts[t]
                    doc_freq = self.df.get(t, 1)
                    idf = math.log((self.doc_count - doc_freq + 0.5) / (doc_freq + 0.5) + 1.0)
                    numerator = tf * (k1 + 1.0)
                    denominator = tf + k1 * (1.0 - b + b * (doc_len / self.avg_doc_len))
                    score += idf * (numerator / denominator)

            # Apply router boost if routed_target matches
            if routed_target and card["id"] == routed_target:
                score += router_boost

            scores.append((card, score))

        scores.sort(key=lambda x: x[1], reverse=True)
        return scores[:top_k]
