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

STOP_WORDS = {"का", "की", "के", "में", "से", "को", "है", "हैं", "हो", "पर", "दा", "ਦੀ", "ਦੇ", "ਵਿੱਚ", "ਨੂੰ", "ਹੈ", "ਹਨ", "the", "is", "in", "to", "and", "or", "of", "a", "an", "what", "how", "can", "should", "i", "we", "my", "our"}

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

        # 1. Electrical Hazard queries (including wire reporting numbers)
        if any(w in q for w in ["wire", "wires", "electric", "power line", "shock", "breaker", "switch", "meter", "current", "pole", "बिजली", "तार", "तारों", "करंट", "स्विच", "खंभा", "खंभे", "खंभों", "मीटर", "ਬਿਜਲੀ", "ਤਾਰਾਂ", "ਤਾਰ", "ਕਰੰਟ", "ਸਵਿੱਚ", "ਖੰਭੇ", "ਖੰਭਾ", "ਪਾਵਰਕਾਮ", "1912"]):
            return ("card-electrical-safety", 70.0)

        # 2. Medical Refusal & Ambulance queries
        if any(w in q for w in ["ambulance", "एंबुलेंस", "एम्बुलेंस", "ਐਂਬੂਲੈਂਸ", "medicine", "doctor", "tablet", "dose", "dosage", "fever", "diarrhea", "vomiting", "antibiotic", "injection", "paracetamol", "cholera", "दवा", "दवाई", "गोली", "खुराक", "बुखार", "दस्त", "उल्टी", "इंजेक्शन", "हैजा", "मरहम", "ਦਵਾਈ", "ਬੁਖ਼ਾਰ", "ਦਸਤ", "ਉਲਟੀਆਂ", "ਟੀਕਾ"]):
            return ("card-medical-refusal", 70.0)

        # 3. Dedicated Helpline queries (General emergency, NDMA, SDMA, DDMA)
        if any(w in q for w in ["helpline", "phone number", "control room", "ndma", "sdma", "ddma", "1078", "1070", "1077", "ਨੰਬਰ", "ਫੋਨ", "हैल्पलाइन", "नंबर", "कंट्रोल रूम", "ਕੰਟਰੋਲ ਰੂਮ"]):
            if any(w in q for w in ["helpline", "number", "ਨੰਬਰ", "नंबर", "phone", "ਕੰਟਰੋਲ", "कंट्रोल", "emergency"]):
                return ("corpus-helpline", 100.0)

        # 4. Drinking water purification queries
        if any(w in q for w in ["drinking water", "boil water", "boil", "purify", "well water", "hand pump", "borewell", "chlorine", "peene ka pani", "ubalna", "हैंडपंप", "बोरवेल", "कुएं", "कुआं", "उबालना", "उबालें", "पीने", "ਪੀਣ ਵਾਲਾ", "ਉਬਾਲਣਾ", "ਉਬਾਲੋ", "ਨਲਕੇ", "ਨਲਕਾ", "ਖੂਹ", "ਕਲੋਰੀਨ", "ਸ਼ੁੱਧ"]):
            return ("card-drinking-water", 70.0)

        # 5. Snake & reptile hazards
        if any(w in q for w in ["snake", "snakebite", "reptile", "scorpion", "saap", "saanp", "katna", "सांप", "सांपों", "बिच्छू", "डंक", "ਸੱਪ", "ਸੱਪਾਂ", "ਬਿੱਛੂ", "ਡੰਗ"]):
            return ("card-snakes-reptiles", 70.0)

        # 6. Livestock & cattle
        if any(w in q for w in ["cattle", "livestock", "cow", "cows", "buffalo", "buffaloes", "animal", "animals", "fodder", "untie", "pashu", "gay", "bhains", "chara", "पशु", "पशुओं", "गाय", "भैंस", "भैंसों", "मवेशी", "मवेशियों", "चारा", "खूंटे", "ਪਸ਼ੂ", "ਪਸ਼ੂਆਂ", "ਮੱਝ", "ਮੱਝਾਂ", "ਗਾਂ", "ਗਾਵਾਂ", "ਪੱਠੇ", "ਤੂੜੀ", "ਕਿੱਲੇ", "ਵਾੜੇ"]):
            return ("card-livestock-protection", 70.0)

        # 7. Evacuation & Go-bag
        if any(w in q for w in ["evacuate", "evacuation", "shelter", "go-bag", "go bag", "pack", "leave home", "documents", "torch", "आपातकालीन बैग", "निकासी", "राहत शिविर", "घर खाली", "ਘਰ ਖਾਲੀ", "ਨਿਕਾਸੀ", "ਰਾਹਤ ਕੈਂਪ", "ਐਮਰਜੈਂਸੀ ਬੈਗ", "ਕਾਗਜ਼ਾਤ"]):
            return ("card-evacuation-readiness", 70.0)

        # 8. Water crossing / driving hazards
        if any(w in q for w in ["cross", "crossing", "walk", "walk through", "wade", "swim", "drive", "car", "tractor", "bike", "motorbike", "vehicle", "knee", "ankle", "deep", "bridge", "causeway", "road", "पुल", "सड़क", "पैदल", "गाड़ी", "कार", "पार", "ਡਿੱਗਣ", "ਗੋਡੇ", "ਤੁਰ", "ਲੰਘ", "ਚਲਾਓ", "ਪੈਦਲ", "ਪਾਰ ਕਰਨਾ", "ਪੁਲ", "ਟਰੈਕਟਰ", "ਗੱਡੀ", "ਮੋਟਰਸਾਈਕਲ"]):
            return ("card-water-crossing", 70.0)

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
