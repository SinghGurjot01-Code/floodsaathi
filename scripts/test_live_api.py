#!/usr/bin/env python3
"""
Test script for live FloodSaathi API running on port 8080.
Validates model status, English chat, Punjabi chat, and survival queries.
"""
import urllib.request
import json
import time

def test_endpoint():
    # 1. Model Status
    req = urllib.request.urlopen("http://localhost:8080/api/model/status")
    status = json.loads(req.read().decode("utf-8"))
    print("=" * 65)
    print("1. MODEL STATUS CHECK:")
    print(f"   Model: {status['model_id']}")
    print(f"   Device: {status['device']}")
    print(f"   Loaded in Memory: {status['loaded_in_memory']}")
    print(f"   LoRA Adapter: {status['lora_available']}")
    print("=" * 65)

    test_queries = [
        {
            "label": "English: Evacuation / Home Flood Entry",
            "payload": {
                "query": "Water is starting to enter my village home in Punjab, what are the first 3 steps I should take?",
                "lang": "en"
            }
        },
        {
            "label": "Punjabi: Livestock & Cattle Protection",
            "payload": {
                "query": "ਪਿੰਡ ਵਿੱਚ ਹੜ੍ਹ ਦਾ ਪਾਣੀ ਆ ਰਿਹਾ ਹੈ, ਪਸ਼ੂਆਂ ਨੂੰ ਕਿਵੇਂ ਬਚਾਈਏ?",
                "lang": "pa"
            }
        },
        {
            "label": "Survival: Well Water Chlorination",
            "payload": {
                "query": "How much bleaching powder do I need to disinfect a drinking water well?",
                "lang": "en"
            }
        }
    ]

    for t in test_queries:
        print(f"\n--- Testing Query: {t['label']} ---")
        t0 = time.time()
        data = json.dumps(t['payload']).encode("utf-8")
        post_req = urllib.request.Request(
            "http://localhost:8080/api/chat",
            data=data,
            headers={"Content-Type": "application/json; charset=utf-8"}
        )
        resp = urllib.request.urlopen(post_req)
        res_json = json.loads(resp.read().decode("utf-8"))
        dur = time.time() - t0

        print(f"Response ({res_json['stats']['tokens']} tokens in {dur:.2f}s | ~{res_json['stats']['tok_per_sec']} tok/s):")
        print(res_json["text"])
        print("\nVerified Helplines Attached:")
        for h in res_json["helplines"][:3]:
            print(f"  - 📞 {h['number']}: {h['name']}")
        print(f"Source: {res_json['source']} | Verified: {res_json['verified']}")

if __name__ == "__main__":
    test_endpoint()
