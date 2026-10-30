#!/usr/bin/env python3
"""
Safety & Card Retriever Evaluation (PRD Section 13, 14 & Phase 6).
Evaluates BM25 card retrieval over 100 queries (Top-1 >= 85%, Top-3 >= 95%)
and enforces 100% pass rate on 40 must-pass safety-critical items.
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from models.guidance.retriever import CardRetriever, HELPLINES_FILE

AUTHORIZED_HELPLINES = {"112", "1078", "1070", "1077", "108", "1912"}

def run_retrieval_benchmark():
    retriever = CardRetriever()
    queries_file = ROOT / "eval" / "queries_100.json"
    if not queries_file.exists():
        raise FileNotFoundError(f"Missing {queries_file}")

    queries = json.loads(queries_file.read_text(encoding="utf-8"))
    top1_correct = 0
    top3_correct = 0
    total = len(queries)

    by_lang = {"en": {"total": 0, "top1": 0}, "hi": {"total": 0, "top1": 0}, "pa": {"total": 0, "top1": 0}}

    for item in queries:
        qid = item["id"]
        lang = item["lang"]
        q_text = item["query"]
        target = item["target_card"]

        results = retriever.retrieve(q_text, top_k=3)
        top_cards = [r[0]["id"] for r in results]

        by_lang[lang]["total"] += 1

        if top_cards and top_cards[0] == target:
            top1_correct += 1
            by_lang[lang]["top1"] += 1

        if target in top_cards:
            top3_correct += 1

    top1_acc = (top1_correct / total) * 100.0 if total > 0 else 0.0
    top3_acc = (top3_correct / total) * 100.0 if total > 0 else 0.0

    return {
        "total_queries": total,
        "top1_accuracy": round(top1_acc, 2),
        "top3_accuracy": round(top3_acc, 2),
        "by_language": {
            k: {"total": v["total"], "top1_accuracy": round((v["top1"] / v["total"] * 100.0) if v["total"] > 0 else 0.0, 1)}
            for k, v in by_lang.items()
        }
    }

def run_must_pass_eval():
    retriever = CardRetriever()
    mp_file = ROOT / "eval" / "must_pass.json"
    if not mp_file.exists():
        raise FileNotFoundError(f"Missing {mp_file}")

    items = json.loads(mp_file.read_text(encoding="utf-8"))
    helplines_data = json.loads(HELPLINES_FILE.read_text(encoding="utf-8"))
    verified_numbers = {h["number"] for h in helplines_data["items"]}
    verified_numbers.add("1912") # PSPCL electricity emergency

    failures = []

    for item in items:
        item_id = item["id"]
        q_text = item["query"]
        lang = item["lang"]
        cat = item["category"]
        expected_card = item["expected_card"]
        forbidden_words = item.get("forbidden_words", [])
        required_concepts = item.get("required_concepts", [])

        # Retrieve card
        results = retriever.retrieve(q_text, top_k=1)
        if not results:
            failures.append(f"{item_id}: No card retrieved for query '{q_text}'")
            continue

        card, score = results[0]
        card_id = card["id"]

        if card_id != expected_card:
            failures.append(f"{item_id}: Retrieved '{card_id}' instead of expected '{expected_card}' for query '{q_text}'")
            continue

        # Extract text content from card in query's language
        title = card.get("title", {}).get(lang, "")
        summary = card.get("summary", {}).get(lang, "")
        body = card.get("body", {}).get(lang, "")
        full_text = f"{title} {summary} {body}".lower()

        # Check forbidden words
        for fw in forbidden_words:
            if fw.lower() in full_text:
                failures.append(f"{item_id}: Card text contains forbidden phrase '{fw}'")

        # Check phone numbers: Any phone numbers mentioned must be in authorized helplines
        found_phones = re.findall(r"\b\d{3,10}\b", full_text)
        for ph in found_phones:
            if ph not in verified_numbers and ph not in {"10", "15", "30", "60", "12", "33"}: # exclude metric numbers
                failures.append(f"{item_id}: Card text contains unauthorized phone number '{ph}' (Must be from corpus/helplines.json)")

    return {
        "total_must_pass": len(items),
        "failures_count": len(failures),
        "failures": failures,
        "pass_rate_pct": round(((len(items) - len(failures)) / len(items)) * 100.0, 1)
    }

def main():
    print("=" * 65)
    print("FLOODSAATHI SAFETY & CARD RETRIEVAL EVALUATION (PHASE 6)")
    print("=" * 65)

    print("\n1. Running Multilingual Retrieval Benchmark (100 Queries)...")
    bench = run_retrieval_benchmark()
    print(f"Total Evaluated: {bench['total_queries']} queries")
    print(f"Top-1 Accuracy:  {bench['top1_accuracy']}% (Gate: >= 85%)")
    print(f"Top-3 Accuracy:  {bench['top3_accuracy']}% (Gate: >= 95%)")
    for lang, stats in bench["by_language"].items():
        print(f"  * Language '{lang}': {stats['top1_accuracy']}% Top-1 ({stats['total']} queries)")

    print("\n2. Running 40 Must-Pass Safety Invariant Tests...")
    mp = run_must_pass_eval()
    print(f"Must-Pass Tests: {mp['total_must_pass']}")
    print(f"Failures:        {mp['failures_count']} (REQUIRED: 0)")
    print(f"Pass Rate:       {mp['pass_rate_pct']}% (Gate: 100.0%)")

    if mp["failures"]:
        print("\nFAILURES DETECTED:")
        for f in mp["failures"]:
            print(f"  [X] {f}")

    # Check Gates
    top1_pass = bench["top1_accuracy"] >= 85.0
    top3_pass = bench["top3_accuracy"] >= 95.0
    safety_pass = mp["failures_count"] == 0

    all_pass = top1_pass and top3_pass and safety_pass

    summary = {
        "retrieval_benchmark": bench,
        "must_pass_evaluation": mp,
        "gates_passed": all_pass
    }

    out_file = ROOT / "eval" / "cards_eval_results.json"
    out_file.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(f"\nSaved results to {out_file}")

    if not all_pass:
        print("\nERROR: Safety gates or retrieval accuracy failed!")
        sys.exit(1)

    print("\nALL SAFETY INVARIANTS AND RETRIEVAL GATES PASSED (100%)!")

if __name__ == "__main__":
    main()
