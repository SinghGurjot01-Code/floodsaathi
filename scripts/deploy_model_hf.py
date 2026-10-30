#!/usr/bin/env python3
"""
Upload FloodSaathi Fine-Tuned Model Weights & Card to Hugging Face
Repo: SinghGurjot01/FloodSaathi
"""
import os
import pathlib
from huggingface_hub import HfApi

def main():
    api = HfApi()
    repo_id = "SinghGurjot01/FloodSaathi"
    print(f"Deploying FloodSaathi model to Hugging Face ({repo_id})...")

    checkpoint_dir = pathlib.Path("D:/FloodSaathi_AI/checkpoints/saathi_lora")
    if not checkpoint_dir.exists():
        checkpoint_dir = pathlib.Path("relay/models/saathi_lora")

    print(f"Source directory: {checkpoint_dir}")
    
    # Create README model card if needed
    readme_path = checkpoint_dir / "README.md"
    readme_content = """---
language:
- en
- hi
- pa
license: apache-2.0
tags:
- floodsaathi
- disaster-response
- flood-safety
- emergency-early-warning
- qwen2.5
base_model: Qwen/Qwen2.5-0.5B-Instruct
pipeline_tag: text-generation
---

# FloodSaathi: Offline-First Small Language Model (SLM) for Flood Safety & Early Warning

FloodSaathi is an offline-first disaster early-warning model fine-tuned from `Qwen/Qwen2.5-0.5B-Instruct` for India (pilot: Punjab).
It provides concise, safety-verified protocols for drinking water purification, electrical wire hazards, road crossings, snakebite first aid, evacuation prep, and livestock safety in English, Hindi, and Punjabi.

## Key Safety Invariants
- Grounded in verified NDMA, Punjab SDMA, and CWC flood safety protocols.
- Emergency helplines (112, 1078, 1070, 1077) are cited with zero hallucination.
- Never gives false safety guarantees; provides honest empirical guidance.

## Model Details
- **Architecture**: Qwen2.5-0.5B-Instruct with LoRA adapters (Rank 16, Alpha 32)
- **Parameters**: 494M base + 18.4M trainable adapter parameters (~35 MB safetensors)
- **Target Hardware**: Runs on mobile devices, low-power edge devices, or offline laptops.
"""
    with open(readme_path, "w", encoding="utf-8") as f:
        f.write(readme_content)

    print("Uploading folder to Hugging Face...")
    api.upload_folder(
        folder_path=str(checkpoint_dir),
        repo_id=repo_id,
        repo_type="model"
    )
    print(f"Successfully deployed FloodSaathi model to https://huggingface.co/{repo_id}")

if __name__ == "__main__":
    main()
