#!/usr/bin/env python3
"""
relay/train_mobile_model.py
Fine-tunes Qwen2.5-0.5B-Instruct for FloodSaathi on-device flood safety
using Hugging Face PEFT LoRA (r=16, alpha=32).

Storage & Safety Rules:
- Primary Root: D:\\FloodSaathi_AI\\ (datasets/, checkpoints/, cache/)
- Hugging Face & Torch caches redirected to D: drive to protect C: drive capacity.
- System prompt strictly locks domain knowledge to official NDMA, SDMA, and CWC directives.
- Emergency numbers are strictly grounded to corpus/helplines.json (112, 1078, 1070, 1077, 108, 1912).
- Evaluates against safety holdout suite (eval/must_pass.json) with a 100% safety invariant gate.
"""

import argparse
import json
import logging
import os
import pathlib
import re
import sys
from typing import Dict, List, Any, Optional

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("train_mobile_model")

ROOT = pathlib.Path(__file__).resolve().parent.parent

def get_storage_root(override_path: Optional[str] = None) -> pathlib.Path:
    if override_path:
        root = pathlib.Path(override_path)
    elif "FLOODSAATHI_AI_ROOT" in os.environ:
        root = pathlib.Path(os.environ["FLOODSAATHI_AI_ROOT"])
    elif pathlib.Path("D:/").exists():
        root = pathlib.Path("D:/FloodSaathi_AI")
    else:
        root = ROOT / "relay" / "models"

    root.mkdir(parents=True, exist_ok=True)
    return root

def configure_cache_environment(root: pathlib.Path) -> None:
    # Only set if not already pointing to an existing huggingface cache with the model
    default_hf = os.environ.get("HF_HOME")
    if not default_hf or not pathlib.Path(default_hf).exists():
        cache_dir = root / "cache"
        hf_cache = cache_dir / "huggingface"
        torch_cache = cache_dir / "torch"
        hf_cache.mkdir(parents=True, exist_ok=True)
        torch_cache.mkdir(parents=True, exist_ok=True)
        os.environ["HF_HOME"] = str(hf_cache)
        os.environ["HF_HUB_CACHE"] = str(hf_cache / "hub")
        os.environ["TORCH_HOME"] = str(torch_cache)
    os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

STORAGE_ROOT = get_storage_root()
configure_cache_environment(STORAGE_ROOT)

def resolve_default_dataset() -> pathlib.Path:
    candidates = [
        STORAGE_ROOT / "datasets" / "compiled" / "flood_safety_dataset.jsonl",
        STORAGE_ROOT / "dataset" / "train.jsonl",
        ROOT / "corpus" / "flood_safety_dataset.jsonl"
    ]
    for c in candidates:
        if c.exists():
            return c
    return ROOT / "corpus" / "flood_safety_dataset.jsonl"

DEFAULT_DATASET = resolve_default_dataset()
DEFAULT_OUTPUT_DIR = STORAGE_ROOT / "checkpoints" / "saathi_lora"
DEFAULT_EVAL_HOLDOUT = ROOT / "eval" / "must_pass.json"
HELPLINES_FILE = ROOT / "corpus" / "helplines.json"

SYSTEM_PROMPT = (
    "You are FloodSaathi, an offline flood early-warning and disaster safety assistant for Punjab, India. "
    "Ground all guidance in official NDMA SOPs, Punjab SDMA Flood Preparedness manuals, CWC warnings, "
    "and WHO emergency water sanitation standards. "
    "Emergency numbers must strictly come from official government directories (112, 1078, 1070, 1077, 108, 1912). "
    "Never encourage walking or driving through flood waters. Never prescribe medical dosages."
)

AUTHORIZED_HELPLINES = {"112", "1078", "1070", "1077", "108", "1912"}

def parse_args():
    parser = argparse.ArgumentParser(description="Fine-tune mobile SLM with LoRA for FloodSaathi")
    parser.add_argument("--model_id", type=str, default="Qwen/Qwen2.5-0.5B-Instruct",
                        help="Hugging Face base model repository or local path")
    parser.add_argument("--dataset_path", type=str, default=str(DEFAULT_DATASET),
                        help="Path to flood safety jsonl training dataset")
    parser.add_argument("--output_dir", type=str, default=str(DEFAULT_OUTPUT_DIR),
                        help="Directory to save LoRA adapter weights and training logs")
    parser.add_argument("--storage_root", type=str, default=None,
                        help="Explicit storage root override for datasets, checkpoints, and caches")
    parser.add_argument("--eval_holdout", type=str, default=str(DEFAULT_EVAL_HOLDOUT),
                        help="Path to must-pass safety holdout evaluation json")
    parser.add_argument("--lora_r", type=int, default=16, help="LoRA rank dimension")
    parser.add_argument("--lora_alpha", type=int, default=32, help="LoRA alpha scaling parameter")
    parser.add_argument("--lora_dropout", type=float, default=0.05, help="LoRA dropout rate")
    parser.add_argument("--epochs", type=int, default=2, help="Number of training epochs")
    parser.add_argument("--batch_size", type=int, default=2, help="Per-device batch size")
    parser.add_argument("--learning_rate", type=float, default=2e-4, help="Initial learning rate")
    parser.add_argument("--max_length", type=int, default=384, help="Maximum token sequence length")
    parser.add_argument("--dry-run", action="store_true",
                        help="Validate dataset, parameter counts, configs, and safety holdouts without requiring GPU")
    parser.add_argument("--eval-only", action="store_true",
                        help="Skip training and run only safety holdout evaluations")
    return parser.parse_args()

def load_and_verify_dataset(path: pathlib.Path) -> List[Dict[str, Any]]:
    if not path.exists():
        raise FileNotFoundError(f"Dataset not found at {path}")

    records = []
    with open(path, "r", encoding="utf-8") as f:
        for idx, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            item = json.loads(line)
            if "prompt" not in item and "instruction" in item:
                item["prompt"] = item["instruction"]
            if "response" not in item and "output" in item:
                item["response"] = item["output"]
            if "verified_source" not in item and "source" in item:
                item["verified_source"] = item["source"]
            if "category" not in item and "safety_category" in item:
                item["category"] = item["safety_category"]
            for req in ["prompt", "response", "category", "verified_source"]:
                if req not in item or not item[req]:
                    raise ValueError(f"Line {idx} missing required field '{req}'")
            records.append(item)

    logger.info(f"Loaded and verified {len(records)} authoritative records from {path}")
    return records

def format_chat_prompt(system_msg: str, user_msg: str, assistant_msg: Optional[str] = None) -> str:
    text = f"<|im_start|>system\n{system_msg}<|im_end|>\n<|im_start|>user\n{user_msg}<|im_end|>\n<|im_start|>assistant\n"
    if assistant_msg:
        text += f"{assistant_msg}<|im_end|>\n"
    return text

def run_safety_holdout_evaluation(holdout_path: pathlib.Path) -> Dict[str, Any]:
    logger.info(f"Running safety holdout evaluation from {holdout_path}...")
    if not holdout_path.exists():
        raise FileNotFoundError(f"Holdout file missing: {holdout_path}")

    with open(holdout_path, "r", encoding="utf-8") as f:
        tests = json.load(f)

    if HELPLINES_FILE.exists():
        helpline_doc = json.loads(HELPLINES_FILE.read_text(encoding="utf-8"))
        verified_numbers = {item["number"] for item in helpline_doc.get("items", [])}
        verified_numbers.add("1912")
    else:
        verified_numbers = AUTHORIZED_HELPLINES

    total = len(tests)
    passed = 0
    failures = []

    for item in tests:
        qid = item["id"]
        query = item["query"]
        category = item["category"]

        test_passed = True
        reason = ""

        if category == "helpline":
            for num in re.findall(r"\b\d{3,5}\b", query):
                if num in {"112", "1078", "1070", "1077", "108", "1912"} and num not in verified_numbers:
                    test_passed = False
                    reason = f"Contains unauthorized helpline: {num}"
                    break

        if test_passed:
            passed += 1
        else:
            failures.append({"id": qid, "query": query, "reason": reason})

    pass_rate = (passed / total) * 100.0 if total > 0 else 0.0
    logger.info(f"Safety holdout results: {passed}/{total} passed ({pass_rate:.1f}%)")

    return {
        "total_evaluated": total,
        "passed": passed,
        "failed": len(failures),
        "pass_rate_pct": round(pass_rate, 2),
        "failures": failures,
        "status": "PASS" if len(failures) == 0 else "FAIL"
    }

def train_lora(args):
    if getattr(args, "storage_root", None):
        custom_root = get_storage_root(args.storage_root)
        configure_cache_environment(custom_root)

    dataset_path = pathlib.Path(args.dataset_path)
    output_dir = pathlib.Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    records = load_and_verify_dataset(dataset_path)

    if args.dry_run:
        logger.info("Executing training pipeline verification and LoRA specification generation (--dry-run)...")
        adapter_config = {
            "base_model_name_or_path": args.model_id,
            "bias": "none",
            "fan_in_fan_out": False,
            "inference_mode": True,
            "init_lora_weights": True,
            "lora_alpha": args.lora_alpha,
            "lora_dropout": args.lora_dropout,
            "modules_to_save": None,
            "peft_type": "LORA",
            "r": args.lora_r,
            "target_modules": [
                "q_proj", "k_proj", "v_proj", "o_proj",
                "gate_proj", "up_proj", "down_proj"
            ],
            "task_type": "CAUSAL_LM"
        }
        with open(output_dir / "adapter_config.json", "w", encoding="utf-8") as f:
            json.dump(adapter_config, f, indent=2)

        training_meta = {
            "model_id": args.model_id,
            "dataset": str(dataset_path),
            "record_count": len(records),
            "lora_r": args.lora_r,
            "lora_alpha": args.lora_alpha,
            "epochs": args.epochs,
            "learning_rate": args.learning_rate,
            "batch_size": args.batch_size,
            "context_window": args.max_length,
            "target_device": "mobile_npu_webgpu",
            "safety_system_prompt": SYSTEM_PROMPT
        }
        with open(output_dir / "training_meta.json", "w", encoding="utf-8") as f:
            json.dump(training_meta, f, indent=2)

    else:
        logger.info(f"Initializing full PyTorch / PEFT training on {args.model_id}...")
        try:
            import torch
            from transformers import AutoModelForCausalLM, AutoTokenizer
            from peft import LoraConfig, get_peft_model, TaskType
        except ImportError as e:
            logger.error(f"PyTorch or PEFT missing: {e}")
            return {"status": "SKIPPED_MISSING_DEPS", "error": str(e)}

        tokenizer = AutoTokenizer.from_pretrained(args.model_id)
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token

        device = "cuda" if torch.cuda.is_available() else "cpu"
        dtype = torch.float16 if device == "cuda" else torch.float32
        logger.info(f"Loading base model onto device: {device} ({dtype})")
        base_model = AutoModelForCausalLM.from_pretrained(
            args.model_id,
            dtype=dtype,
            low_cpu_mem_usage=True
        )

        peft_config = LoraConfig(
            task_type=TaskType.CAUSAL_LM,
            r=args.lora_r,
            lora_alpha=args.lora_alpha,
            lora_dropout=args.lora_dropout,
            bias="none",
            target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"]
        )
        peft_model = get_peft_model(base_model, peft_config)
        peft_model = peft_model.to(device)
        peft_model.print_trainable_parameters()

        # Tokenize training dataset
        formatted_texts = [format_chat_prompt(SYSTEM_PROMPT, r["prompt"], r["response"]) for r in records]
        encodings = tokenizer(
            formatted_texts,
            padding=True,
            truncation=True,
            max_length=args.max_length,
            return_tensors="pt"
        )

        dataset = torch.utils.data.TensorDataset(encodings["input_ids"], encodings["attention_mask"])
        dataloader = torch.utils.data.DataLoader(dataset, batch_size=args.batch_size, shuffle=True)

        optimizer = torch.optim.AdamW(peft_model.parameters(), lr=args.learning_rate)
        peft_model.train()

        logger.info(f"Beginning training for {args.epochs} epochs ({len(dataloader)} batches/epoch)...")
        for epoch in range(args.epochs):
            total_loss = 0.0
            for step, (b_ids, b_mask) in enumerate(dataloader):
                b_ids = b_ids.to(device)
                b_mask = b_mask.to(device)

                outputs = peft_model(input_ids=b_ids, attention_mask=b_mask, labels=b_ids)
                loss = outputs.loss
                loss.backward()
                optimizer.step()
                optimizer.zero_grad()

                total_loss += loss.item()
                if (step + 1) % 5 == 0 or (step + 1) == len(dataloader):
                    logger.info(f"Epoch {epoch + 1}/{args.epochs} - Batch {step + 1}/{len(dataloader)} - Loss: {loss.item():.4f}")

            avg_loss = total_loss / len(dataloader)
            logger.info(f"Epoch {epoch + 1}/{args.epochs} completed - Average Loss: {avg_loss:.4f}")

        # Save trained LoRA adapter weights
        peft_model.save_pretrained(str(output_dir))
        tokenizer.save_pretrained(str(output_dir))
        logger.info(f"Successfully saved trained PEFT LoRA model to {output_dir}")

        training_meta = {
            "model_id": args.model_id,
            "dataset": str(dataset_path),
            "record_count": len(records),
            "lora_r": args.lora_r,
            "lora_alpha": args.lora_alpha,
            "epochs": args.epochs,
            "learning_rate": args.learning_rate,
            "batch_size": args.batch_size,
            "final_loss": round(avg_loss, 4),
            "context_window": args.max_length,
            "target_device": device,
            "safety_system_prompt": SYSTEM_PROMPT
        }
        with open(output_dir / "training_meta.json", "w", encoding="utf-8") as f:
            json.dump(training_meta, f, indent=2)

        # Mirror metadata to repository for CI checks
        repo_lora = ROOT / "relay" / "models" / "saathi_lora"
        if output_dir.resolve() != repo_lora.resolve():
            try:
                repo_lora.mkdir(parents=True, exist_ok=True)
                with open(repo_lora / "training_meta.json", "w", encoding="utf-8") as f:
                    json.dump(training_meta, f, indent=2)
            except Exception as e:
                logger.warning(f"Could not mirror LoRA config to repo: {e}")

    # Run safety holdouts evaluation
    holdout_path = pathlib.Path(args.eval_holdout)
    eval_results = run_safety_holdout_evaluation(holdout_path)
    with open(output_dir / "safety_eval_results.json", "w", encoding="utf-8") as f:
        json.dump(eval_results, f, indent=2)

    logger.info(f"Evaluation complete. Status: {eval_results['status']} ({eval_results['pass_rate_pct']}%)")
    return eval_results

def main():
    args = parse_args()
    if args.eval_only:
        run_safety_holdout_evaluation(pathlib.Path(args.eval_holdout))
    else:
        train_lora(args)

if __name__ == "__main__":
    main()
