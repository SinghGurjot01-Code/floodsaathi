"""
FloodSaathi Live Neural AI Assistant
===================================
Real, local Small Language Model (SLM) powered by Qwen2.5-0.5B-Instruct.
Full Neural Token Generation with verified RAG context grounding and live streaming.
Zero canned/hardcoded responses.
"""

import sys
import os
import time
import json
import re
import argparse
from threading import Thread

# Disable symlink warnings & suppress library noise
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
os.environ["TOKENIZERS_PARALLELISM"] = "false"

try:
    import torch
    from transformers import AutoTokenizer, AutoModelForCausalLM, TextIteratorStreamer, logging as hf_logging
    hf_logging.set_verbosity_error()
except ImportError as e:
    print(f"Error importing ML libraries: {e}")
    print("Please install requirements: pip install torch transformers accelerate")
    sys.exit(1)

MODEL_ID = "Qwen/Qwen2.5-0.5B-Instruct"
CARDS_PATH = os.path.join(os.path.dirname(__file__), "..", "corpus", "cards", "cards.json")

# Load verified knowledge cards for context grounding
SAFETY_CARDS = []
if os.path.exists(CARDS_PATH):
    try:
        with open(CARDS_PATH, "r", encoding="utf-8") as f:
            SAFETY_CARDS = json.load(f)
    except Exception as e:
        pass


def find_relevant_facts(query: str, max_cards: int = 2) -> str:
    """Finds top verified facts using term overlap to ground neural generation."""
    if not SAFETY_CARDS:
        return ""
    
    q_words = set(re.findall(r"\w+", query.lower()))
    scored = []
    
    for card in SAFETY_CARDS:
        card_text = (
            card.get("title_en", "") + " " +
            card.get("title_hi", "") + " " +
            card.get("title_pa", "") + " " +
            " ".join(card.get("bullets_en", [])) + " " +
            " ".join(card.get("bullets_hi", [])) + " " +
            " ".join(card.get("bullets_pa", []))
        )
        card_words = set(re.findall(r"\w+", card_text.lower()))
        overlap = len(q_words.intersection(card_words))
        if overlap > 0:
            scored.append((overlap, card))
            
    scored.sort(key=lambda x: x[0], reverse=True)
    top_cards = [c for _, c in scored[:max_cards]]
    
    if not top_cards:
        return ""
    
    facts = []
    for c in top_cards:
        bullets = c.get("bullets_en", [])
        if bullets:
            facts.append(f"Standard Disaster Procedure ({c.get('title_en', '')}):\n- " + "\n- ".join(bullets[:4]))
            
    return "\n\n".join(facts)


BASE_SYSTEM_PROMPT = """You are FloodSaathi AI, a helpful civil defence and disaster relief advisor for natural floods in Punjab and India.
You provide clear, practical civil protection instructions for flooded households, farmers, and citizens.

Core Guidelines:
1. Domestic Hygiene & Sanitization: You provide standard municipal guidelines for cleaning flood silt, pumping out contaminated well water, and sanitizing tanks and wells with chlorine/bleaching powder as recommended by public health authorities.
2. Moving Water Danger: Never advise walking, swimming, or driving through floodwater. 15 cm sweeps adults, 30 cm floats cars.
3. Electrical Hazards: Submerged electrical switches, motors, or wires must never be touched until disconnected. Call PSPCL Helpline 1912.
4. Helplines: National Emergency: 112, Disaster Helpline: 1078, Punjab SEOC: 1070, District Control Room: 1077.

Be direct, encouraging, practical, and helpful. Always answer the user's specific flood-related question using the official procedure."""


def load_model(model_name: str = MODEL_ID):
    device = "cuda" if torch.cuda.is_available() else "cpu"
    dtype = torch.float16 if device == "cuda" else torch.float32
    print(f"\n[FloodSaathi AI] Initializing neural model: {model_name} on {device} ({dtype})...")
    start_t = time.time()
    
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        torch_dtype=dtype,
        low_cpu_mem_usage=True
    )
    if device == "cuda":
        model = model.to("cuda")

    # Check for fine-tuned LoRA
    lora_dir = "D:\\FloodSaathi_AI\\checkpoints\\saathi_lora"
    if os.path.exists(os.path.join(lora_dir, "adapter_model.safetensors")):
        try:
            from peft import PeftModel
            model = PeftModel.from_pretrained(model, lora_dir)
            print(f"[FloodSaathi AI] Attached fine-tuned LoRA adapter from {lora_dir}.")
        except Exception as e:
            print(f"[FloodSaathi AI] LoRA attach note: {e}")

    model.eval()
    
    param_count = sum(p.numel() for p in model.parameters()) / 1e6
    print(f"[FloodSaathi AI] Model ready on {device} in {time.time() - start_t:.2f}s ({param_count:.1f}M parameters). Ready!")
    return tokenizer, model


def generate_response(tokenizer, model, conversation_history, user_query: str, max_new_tokens=300, temperature=0.6, top_p=0.9):
    relevant_facts = find_relevant_facts(user_query)
    
    system_content = BASE_SYSTEM_PROMPT
    if relevant_facts:
        system_content += f"\n\nOfficial Reference Facts:\n{relevant_facts}"
        
    messages = [{"role": "system", "content": system_content}]
    for turn in conversation_history[-4:]:
        messages.append(turn)
    messages.append({"role": "user", "content": user_query})
    
    prompt_text = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True
    )
    
    device = next(model.parameters()).device
    inputs = tokenizer([prompt_text], return_tensors="pt").to(device)
    streamer = TextIteratorStreamer(tokenizer, skip_prompt=True, skip_special_tokens=True)
    
    generation_kwargs = dict(
        **inputs,
        streamer=streamer,
        max_new_tokens=max_new_tokens,
        temperature=temperature,
        top_p=top_p,
        do_sample=True,
    )
    
    thread = Thread(target=model.generate, kwargs=generation_kwargs)
    thread.start()
    
    generated_text = ""
    token_count = 0
    t0 = time.time()
    first_token_t = None
    
    for new_text in streamer:
        if first_token_t is None:
            first_token_t = time.time()
        print(new_text, end="", flush=True)
        generated_text += new_text
        token_count += 1
        
    thread.join()
    t_end = time.time()
    duration = t_end - (first_token_t or t0)
    tok_per_sec = (token_count / duration) if duration > 0 else 0
    
    print(f"\n\n[Stats: {token_count} neural tokens generated in {duration:.2f}s (~{tok_per_sec:.1f} tok/s)]")
    return generated_text.strip()


def run_interactive(tokenizer, model):
    print("=" * 72)
    print("    FloodSaathi Neural AI Assistant (FloodSaathi Neural SLM)")
    print("    Live Neural Token Generation | Grounded Safety RAG | Offline")
    print("    Commands: 'exit' to quit | 'clear' to reset conversation")
    print("=" * 72 + "\n")
    
    history = []
    
    while True:
        try:
            user_input = input("\nYou: ").strip()
            if not user_input:
                continue
            if user_input.lower() in ("exit", "quit", "q"):
                print("\n[FloodSaathi AI] Stay safe! Exiting.")
                break
            if user_input.lower() == "clear":
                history = []
                print("\n[FloodSaathi AI] Chat history reset.")
                continue
                
            print("\nFloodSaathi AI: ", end="", flush=True)
            response = generate_response(tokenizer, model, history, user_input)
            
            history.append({"role": "user", "content": user_input})
            history.append({"role": "assistant", "content": response})
            
            if len(history) > 6:
                history = history[-6:]
                
        except KeyboardInterrupt:
            print("\n\n[FloodSaathi AI] Exiting. Stay safe!")
            break


def main():
    parser = argparse.ArgumentParser(description="FloodSaathi Live Neural Assistant")
    parser.add_argument("--prompt", type=str, help="Single prompt to answer")
    parser.add_argument("--model", type=str, default=MODEL_ID, help="Model ID or local path")
    args = parser.parse_args()
    
    tokenizer, model = load_model(args.model)
    
    if args.prompt:
        print(f"\nPrompt: {args.prompt}")
        print("Response: ", end="", flush=True)
        generate_response(tokenizer, model, [], args.prompt)
    else:
        run_interactive(tokenizer, model)


if __name__ == "__main__":
    main()
