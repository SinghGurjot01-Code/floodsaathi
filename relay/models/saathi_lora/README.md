---
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
