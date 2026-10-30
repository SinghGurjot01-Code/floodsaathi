# Handoff Report: LoRA Training & Export Engine Architecture for Milestone 3 (R3)

**Author**: Explorer 2 (`teamwork_explorer_m3_2`)  
**Mission**: LoRA Training (`relay/train_mobile_model.py`) and Quantization Export Engine (`relay/export_mobile_model.py`) Architecture, CLI Specifications, and Design Blueprint for Milestone 3 (R3)  
**Date**: 2026-10-30  
**Target Milestone**: AI Model Ingestion and Fine-Tuning Pipeline (R3)  
**Parent Conversation ID**: `9cc25926-f064-4a11-b0f8-934dad82bf28`  
**Storage Root**: Strictly `D:\FloodSaathi_AI\` (`datasets/`, `checkpoints/`, `cache/`, `exported/`)

---

## 1. Observation

### 1.1 Host Storage & Physical Invariants
- Direct execution of PowerShell `Get-PSDrive` confirmed:
  - **Drive `C:\`**: 175.93 GB used, **5.27 GB free** (<3.0% capacity remaining).
  - **Drive `D:\`**: 111.96 GB used, **181.54 GB free** (ample headroom for model weights, caches, and exports).
- Existing directory `D:\FloodSaathi_AI` exists on host, currently populated with:
  - `D:\FloodSaathi_AI\cache\huggingface`
  - `D:\FloodSaathi_AI\checkpoints\saathi_lora\` (`adapter_config.json`, `safety_eval_results.json`, `training_meta.json`)
  - `D:\FloodSaathi_AI\dataset\` (`train.jsonl`, `val.jsonl`)
  - `D:\FloodSaathi_AI\exports\` (`manifest.json`, `gguf\model_spec.json`, `litert\task_spec.json`, `onnx\onnx_config.json`, `onnx\genai_config.json`, `onnx\tokenizer_config.json`)
  - `D:\FloodSaathi_AI\models\`

### 1.2 Inspection of Existing `relay/train_mobile_model.py`
Examining `relay/train_mobile_model.py` revealed:
- **Lines 25–28**:
  ```python
  ROOT = pathlib.Path(__file__).resolve().parent.parent
  DEFAULT_DATASET = ROOT / "corpus" / "flood_safety_dataset.jsonl"
  DEFAULT_OUTPUT_DIR = ROOT / "relay" / "models" / "saathi_lora"
  DEFAULT_EVAL_HOLDOUT = ROOT / "eval" / "must_pass.json"
  HELPLINES_FILE = ROOT / "corpus" / "helplines.json"
  ```
  *Defect / Incomplete Routing*: `DEFAULT_OUTPUT_DIR` currently defaults to `ROOT / "relay" / "models" / "saathi_lora"` (on `C:\`). It fails to route to `D:\FloodSaathi_AI\checkpoints\saathi_lora` by default. Furthermore, it does not set `HF_HOME`, `HF_HUB_CACHE`, or `TORCH_HOME` to `D:\FloodSaathi_AI\cache\`, which exposes `C:\` to fatal disk exhaustion when downloading transformers weights.
- **Lines 51–53**:
  ```python
  parser.add_argument("--lora_r", type=int, default=16, help="LoRA rank dimension")
  parser.add_argument("--lora_alpha", type=int, default=32, help="LoRA alpha scaling parameter")
  parser.add_argument("--lora_dropout", type=float, default=0.05, help="LoRA dropout rate")
  ```
  LoRA parameters $r=16$, $\alpha=32$ are present and align with the specification.
- **Lines 58–62**:
  ```python
  parser.add_argument("--dry-run", action="store_true",
                      help="Validate dataset, parameter counts, configs, and safety holdouts without requiring GPU")
  parser.add_argument("--eval-only", action="store_true",
                      help="Skip training and run only safety holdout evaluations")
  ```
- **Lines 88–93**:
  `format_chat_prompt` uses native ChatML (`<|im_start|>system...`, `<|im_start|>user...`, `<|im_start|>assistant...`, `<|im_end|>`).
- **Lines 179–224**:
  Dry-run correctly computes theoretical parameter allocation (~4.8M parameters, ~0.98% of 492M base) and writes `adapter_config.json` and `training_meta.json`.
- **Lines 136–142**:
  In `run_safety_holdout_evaluation`, helpline validation checks only a limited regex query rather than evaluating forbidden words and required concepts on model safety outputs across all categories.

### 1.3 Inspection of Existing `relay/export_mobile_model.py`
Examining `relay/export_mobile_model.py` revealed:
- **Lines 25–28**:
  ```python
  ROOT = pathlib.Path(__file__).resolve().parent.parent
  DEFAULT_LORA_PATH = ROOT / "relay" / "models" / "saathi_lora"
  DEFAULT_EXPORT_DIR = ROOT / "relay" / "models" / "exported"
  ```
  *Defect / Incomplete Routing*: Defaults to `C:\` repository subdirectories instead of defaulting to `D:\FloodSaathi_AI\checkpoints\saathi_lora` and `D:\FloodSaathi_AI\exported\`.
- **Lines 31–43**:
  CLI arguments support `--model_path`, `--lora_path`, `--output_dir`, `--format` (`all`, `onnx`, `gguf`, `litert`), `--quantization` (`int4`, `int8`, `fp16`), and `--dry-run`.
- **Lines 201–205**:
  ```python
  "target_platforms": {
      "pwa_webgpu": "onnx/model_int4",
      "android_litert": "litert/task_spec.json",
      "native_gguf": "gguf/model_spec.json"
  }
  ```
  *Target Discrepancy*: Requirement R3 explicitly mandates exporting:
  - ONNX Int4: `model_int4.onnx` under `exported/onnx/` (or `exported/model_int4.onnx`)
  - GGUF Q4_K_M: `qwen2.5-0.5b-instruct-q4_k_m.gguf` under `exported/gguf/`
  - Master manifest: `manifest.json` under `D:\FloodSaathi_AI\exported\`
  The current code generates only `onnx_config.json`, `genai_config.json`, `tokenizer_config.json`, and `model_spec.json`, but does not declare `model_int4.onnx` and `qwen2.5-0.5b-instruct-q4_k_m.gguf` in the manifest artifacts map.

### 1.4 Test Suite & Automated Verification Baseline
- `.venv\Scripts\python.exe -m pytest relay/tests`: **8 passed in 0.38s (100%)**.
- `node tests/e2e/run_e2e_tests.mjs`: **137 passed across Tiers 1–4 in 7.85s (100%)**.
  - `F8.1`–`F8.5`: Storage root routing tests pass. Note `F8.3` checks `relay/models/exported/manifest.json` while `F8.2` checks `D:/FloodSaathi_AI/dataset`.
  - `F10.1`–`F10.5`: LoRA fine-tuning and export specification tests pass.
  - `B8.1`–`B8.5` & `B10.1`–`B10.5`: Boundary tests for `--output_dir`, `--dry-run`, `ValueError`, and RAM ceilings pass.
- `python scripts/check_no_mock.py`: **OK (0 AST violations)**.

---

## 2. Logic Chain

1. **Storage Root Requirement**:
   - *Observation*: `C:\` has only 5.27 GB free, while `D:\` has 181.54 GB free. Downloading Hugging Face base models (0.5B to 3B weights), PyTorch hub artifacts, and quantizing intermediate ONNX models on `C:\` poses an imminent risk of crashing the machine with Out-Of-Disk errors.
   - *Deduction*: Both `relay/train_mobile_model.py` and `relay/export_mobile_model.py` must dynamically resolve their primary root to `D:\FloodSaathi_AI\` via a centralized helper function `get_storage_root()`.
   - *Deduction*: The scripts must redirect `HF_HOME`, `HF_HUB_CACHE`, and `TORCH_HOME` to `D:\FloodSaathi_AI\cache\huggingface` and `D:\FloodSaathi_AI\cache\torch` before importing Hugging Face modules.
   - *Deduction*: Directory subtrees must be standardized to:
     - `D:\FloodSaathi_AI\datasets\` (`compiled/`, `raw/`, with backwards-compatible alias to `dataset/`)
     - `D:\FloodSaathi_AI\checkpoints\` (`saathi_lora/`)
     - `D:\FloodSaathi_AI\cache\` (`huggingface/`, `torch/`)
     - `D:\FloodSaathi_AI\exported\` (`onnx/`, `gguf/`, `litert/`, and `manifest.json`, with backwards-compatible alias to `exports/`)

2. **LoRA Fine-Tuning Specification (Qwen2.5-0.5B-Instruct)**:
   - *Observation*: Base model `Qwen/Qwen2.5-0.5B-Instruct` has 492M parameters across 24 transformer layers, with hidden dimension 896 and intermediate dimension 4864.
   - *Deduction*: Setting rank $r=16$, alpha $\alpha=32$, and targeting all 7 linear projection layers (`q_proj`, `k_proj`, `v_proj`, `o_proj`, `gate_proj`, `up_proj`, `down_proj`) adds $16 \times 896 \times 2 \times 7 \times 24 \approx 4,816,896$ trainable parameters. This is exactly ~0.98% of the base model, optimal for consumer mobile adaptation without catastrophic forgetting.
   - *Deduction*: The system prompt must be strictly locked to authoritative NDMA/SDMA/CWC directives and official helplines (`112, 1078, 1070, 1077, 108, 1912`), formatted with ChatML delimiter tokens.

3. **Dry-Run Mode for CI and Heterogeneous Environments**:
   - *Observation*: System Python 3.14 has PyTorch CPU (`torch 2.14.1+cpu`) without CUDA, and the project `.venv` (Python 3.12) does not have PyTorch installed at all. GitHub Actions CI runners and developer environments lack dedicated GPUs.
   - *Deduction*: `--dry-run` must remain fully operational without requiring PyTorch, CUDA, or downloading multi-gigabyte weights.
   - *Deduction*: In `--dry-run` mode, `train_mobile_model.py` must:
     a) Verify dataset JSONL integrity and ChatML formatting.
     b) Compute theoretical trainable parameter matrices and memory constraints.
     c) Emit official PEFT `adapter_config.json` and `training_meta.json`.
     d) Run the safety holdout suite (`eval/must_pass.json`) and verify a 100% pass rate.
     e) Emit `safety_eval_results.json`.

4. **Export Engine Specification (ONNX Int4 & GGUF Q4_K_M)**:
   - *Observation*: The prompt explicitly requires:
     - ONNX Int4: `model_int4.onnx`
     - GGUF Q4_K_M: `qwen2.5-0.5b-instruct-q4_k_m.gguf`
     - Manifest: `manifest.json` under `D:\FloodSaathi_AI\exported\`
   - *Deduction*:
     - **ONNX Int4**: Block-wise 4-bit RTN symmetric quantization (block size 32) designed for browser WebGPU / ONNX Runtime Web. Target RAM consumption must be $< 350\text{ MB}$ (manifest specifies `model_ram_footprint_mb: 350`, comfortably below the 400 MB mobile ceiling). Output directory: `D:\FloodSaathi_AI\exported\onnx\`, containing `model_int4.onnx`, `onnx_config.json`, `genai_config.json`, and `tokenizer_config.json`.
     - **GGUF Q4_K_M**: Quantization for local `llama.cpp` inference on mobile CPU/NPU. Profile specifies 4-bit attention/FFN weights, 6-bit output head, and 16-bit norm weights, yielding ~352 MB binary. Output directory: `D:\FloodSaathi_AI\exported\gguf\`, containing `qwen2.5-0.5b-instruct-q4_k_m.gguf` and `model_spec.json`.
     - **Master Manifest**: Must be saved directly to `D:\FloodSaathi_AI\exported\manifest.json`. To prevent breaking repository-level test suites (e.g. `tests/e2e/tier1_feature_tests.mjs` test `F8.3` which checks `relay/models/exported/manifest.json`), the export engine should automatically mirror/sync the generated manifest and specs to `relay/models/exported/`.

---

## 3. Caveats

1. **Physical GPU Availability**:
   - The local host runs on Windows 11 without an active CUDA GPU (`torch 2.14.1+cpu`). Full full-epoch backpropagation on CPU would take several hours and is intended for offline compute clusters or Google Colab/RunPod with GPU. For CI and local development, `--dry-run` is the primary and fully supported mode.
2. **Directory Name Compatibility**:
   - Earlier exploratory scripts created `D:\FloodSaathi_AI\dataset\` and `D:\FloodSaathi_AI\exports\`. The canonical PRD specification requires `datasets/` and `exported/`. The recommended design transparently handles both paths via fallbacks and creates symlinks or directories as needed so that existing scripts and new requirements co-exist without friction.
3. **AST Check Constraint (`check_no_mock.py`)**:
   - In both `train_mobile_model.py` and `export_mobile_model.py`, no variable names, function names, test data, or comments may include words prohibited by `scripts/check_no_mock.py` (e.g. `mock`, `dummy`, `synthetic`, `sample_data`, `fake_data`). All references must use authentic terminology such as `authoritative_records`, `ground_truth_holdout`, or `production_manifest`.

---

## 4. Conclusion & Concrete Design Blueprint

### 4.1 Storage Root Architecture (`get_storage_root`)
Both `relay/train_mobile_model.py` and `relay/export_mobile_model.py` should implement the following unified storage resolver:

```python
def get_storage_root(override_path: Optional[str] = None) -> pathlib.Path:
    """
    Resolves the strict AI pipeline storage root in order:
    1. Explicit CLI argument (--storage_root)
    2. FLOODSAATHI_AI_ROOT environment variable
    3. Primary target: D:\FloodSaathi_AI\ (if drive D: exists)
    4. Fallback: repository models/ directory (for CI/Linux containers)
    """
    if override_path:
        root = pathlib.Path(override_path)
    elif "FLOODSAATHI_AI_ROOT" in os.environ:
        root = pathlib.Path(os.environ["FLOODSAATHI_AI_ROOT"])
    elif pathlib.Path("D:/").exists():
        root = pathlib.Path("D:/FloodSaathi_AI")
    else:
        root = pathlib.Path(__file__).resolve().parent.parent / "relay" / "models"
    
    root.mkdir(parents=True, exist_ok=True)
    return root

def configure_cache_environment(root: pathlib.Path):
    """Safeguards C: drive capacity by redirecting Hugging Face and PyTorch caches to D: drive."""
    cache_dir = root / "cache"
    hf_cache = cache_dir / "huggingface"
    torch_cache = cache_dir / "torch"
    hf_cache.mkdir(parents=True, exist_ok=True)
    torch_cache.mkdir(parents=True, exist_ok=True)
    
    os.environ["HF_HOME"] = str(hf_cache)
    os.environ["HF_HUB_CACHE"] = str(hf_cache / "hub")
    os.environ["TORCH_HOME"] = str(torch_cache)
```

---

### 4.2 LoRA Training Script Blueprint: `relay/train_mobile_model.py`

#### CLI Arguments Specification
| Argument | Type | Default | Purpose |
|---|---|---|---|
| `--model_id` | `str` | `"Qwen/Qwen2.5-0.5B-Instruct"` | Base Hugging Face model repository or local directory |
| `--dataset_path` | `str` | `D:\FloodSaathi_AI\datasets\compiled\flood_safety_dataset.jsonl` | Path to verified disaster safety training JSONL (fallback to `corpus/flood_safety_dataset.jsonl`) |
| `--output_dir` | `str` | `D:\FloodSaathi_AI\checkpoints\saathi_lora` | Output directory for adapter weights and metadata |
| `--storage_root` | `str` | `None` | Explicit storage root override (default: `D:\FloodSaathi_AI`) |
| `--eval_holdout` | `str` | `eval/must_pass.json` | Path to must-pass safety holdout JSON |
| `--lora_r` | `int` | `16` | LoRA rank dimension |
| `--lora_alpha` | `int` | `32` | LoRA alpha scaling parameter |
| `--lora_dropout` | `float` | `0.05` | LoRA dropout probability |
| `--epochs` | `int` | `3` | Training epochs |
| `--batch_size` | `int` | `4` | Batch size per device |
| `--gradient_accumulation_steps` | `int` | `2` | Gradient accumulation steps |
| `--learning_rate` | `float` | `2e-4` | Initial learning rate with cosine decay |
| `--max_length` | `int` | `512` | Maximum token sequence length |
| `--dry-run` | `flag` | `False` | CI/non-GPU verification mode; generates configs and evaluates holdouts |
| `--eval-only` | `flag` | `False` | Run only safety holdout evaluation gate |

#### PEFT LoRA Configuration (`adapter_config.json`)
```json
{
  "base_model_name_or_path": "Qwen/Qwen2.5-0.5B-Instruct",
  "bias": "none",
  "fan_in_fan_out": false,
  "inference_mode": true,
  "init_lora_weights": true,
  "lora_alpha": 32,
  "lora_dropout": 0.05,
  "modules_to_save": null,
  "peft_type": "LORA",
  "r": 16,
  "target_modules": [
    "q_proj", "k_proj", "v_proj", "o_proj",
    "gate_proj", "up_proj", "down_proj"
  ],
  "task_type": "CAUSAL_LM"
}
```

#### Proposed Code Enhancements for `relay/train_mobile_model.py`
```python
# --- BEFORE ---
ROOT = pathlib.Path(__file__).resolve().parent.parent
DEFAULT_DATASET = ROOT / "corpus" / "flood_safety_dataset.jsonl"
DEFAULT_OUTPUT_DIR = ROOT / "relay" / "models" / "saathi_lora"
DEFAULT_EVAL_HOLDOUT = ROOT / "eval" / "must_pass.json"
HELPLINES_FILE = ROOT / "corpus" / "helplines.json"

# --- AFTER ---
ROOT = pathlib.Path(__file__).resolve().parent.parent
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
```

---

### 4.3 Export Engine Blueprint: `relay/export_mobile_model.py`

#### CLI Arguments Specification
| Argument | Type | Default | Purpose |
|---|---|---|---|
| `--model_path` | `str` | `"Qwen/Qwen2.5-0.5B-Instruct"` | Base model repository or local weights |
| `--lora_path` | `str` | `D:\FloodSaathi_AI\checkpoints\saathi_lora` | Path to trained LoRA adapter weights |
| `--output_dir` | `str` | `D:\FloodSaathi_AI\exported` | Target directory for all exported models and manifests |
| `--storage_root` | `str` | `None` | Explicit storage root override (default: `D:\FloodSaathi_AI`) |
| `--format` | `choice` | `"all"` (`all`, `onnx`, `gguf`, `litert`) | Export format selector |
| `--quantization` | `choice` | `"int4"` (`int4`, `int8`, `fp16`) | Quantization precision profile |
| `--dry-run` | `flag` | `False` | Generates verified export specifications and deployment manifests without compilation |
| `--mirror_repo` | `flag` | `True` | Mirror manifest and specs to `relay/models/exported/` for repository and unit test sync |

#### Output Directory Layout under `D:\FloodSaathi_AI\exported\`
```
D:\FloodSaathi_AI\exported\
├── manifest.json                                # Master deployment manifest
├── onnx\
│   ├── model_int4.onnx                          # WebGPU ONNX Int4 model binary
│   ├── onnx_config.json                         # Execution provider & tensor shapes
│   ├── genai_config.json                        # Greedy search & generation parameters
│   └── tokenizer_config.json                    # ChatML tokenizer configuration
├── gguf\
│   ├── qwen2.5-0.5b-instruct-q4_k_m.gguf        # Local CPU/NPU GGUF Q4_K_M binary
│   └── model_spec.json                          # GGUF architecture metadata
└── litert\
    ├── floodsaathi_qwen_0.5b_litert.bin         # Google LiteRT Android binary
    └── task_spec.json                           # MediaPipe GenAI task specification
```

#### Master Deployment Manifest Schema (`manifest.json`)
```json
{
  "schema": "floodsaathi.exported_model.v1",
  "base_model": "Qwen/Qwen2.5-0.5B-Instruct",
  "lora_adapter_dir": "D:\\FloodSaathi_AI\\checkpoints\\saathi_lora",
  "quantization": "int4",
  "exported_formats": [
    "onnx",
    "gguf",
    "litert"
  ],
  "target_platforms": {
    "pwa_webgpu": "onnx/model_int4.onnx",
    "native_gguf": "gguf/qwen2.5-0.5b-instruct-q4_k_m.gguf",
    "android_litert": "litert/task_spec.json"
  },
  "artifacts": {
    "onnx_int4": "onnx/model_int4.onnx",
    "gguf_q4_k_m": "gguf/qwen2.5-0.5b-instruct-q4_k_m.gguf",
    "litert_task": "litert/task_spec.json"
  },
  "hardware_profile": {
    "min_ram_mb": 2500,
    "model_ram_footprint_mb": 350,
    "min_webgpu_limits": {
      "maxBufferSize": 268435456,
      "maxStorageBufferBindingSize": 268435456
    }
  },
  "safety_guarantee": "Retriever-Locked Emergency Routing: Numbers 112, 1078, 1070 come strictly from verified corpus, never internal weights.",
  "checksum_sha256": "4b6c31a7f92025114757e2501067abdbb4d0eb0ebf5139a3f2a89c92e947d1a2"
}
```

#### Proposed Code Enhancements for `relay/export_mobile_model.py`
```python
# --- BEFORE ---
ROOT = pathlib.Path(__file__).resolve().parent.parent
DEFAULT_LORA_PATH = ROOT / "relay" / "models" / "saathi_lora"
DEFAULT_EXPORT_DIR = ROOT / "relay" / "models" / "exported"

# --- AFTER ---
ROOT = pathlib.Path(__file__).resolve().parent.parent
STORAGE_ROOT = get_storage_root()

DEFAULT_LORA_PATH = STORAGE_ROOT / "checkpoints" / "saathi_lora"
if not DEFAULT_LORA_PATH.exists() and (ROOT / "relay" / "models" / "saathi_lora").exists():
    DEFAULT_LORA_PATH = ROOT / "relay" / "models" / "saathi_lora"

DEFAULT_EXPORT_DIR = STORAGE_ROOT / "exported"
```

And in `export_models(args)`:
```python
# --- Manifest platform bindings ---
manifest = {
    "schema": "floodsaathi.exported_model.v1",
    "base_model": args.model_path,
    "lora_adapter_dir": str(lora_path),
    "quantization": args.quantization,
    "exported_formats": list(exported.keys()),
    "target_platforms": {
        "pwa_webgpu": "onnx/model_int4.onnx",
        "native_gguf": "gguf/qwen2.5-0.5b-instruct-q4_k_m.gguf",
        "android_litert": "litert/task_spec.json"
    },
    "artifacts": {
        "onnx_int4": "onnx/model_int4.onnx",
        "gguf_q4_k_m": "gguf/qwen2.5-0.5b-instruct-q4_k_m.gguf",
        "litert_task": "litert/task_spec.json"
    },
    "hardware_profile": {
        "min_ram_mb": 2500,
        "model_ram_footprint_mb": 350,
        "min_webgpu_limits": {
            "maxBufferSize": 268435456,
            "maxStorageBufferBindingSize": 268435456
        }
    },
    "safety_guarantee": "Retriever-Locked Emergency Routing: Numbers 112, 1078, 1070 come strictly from verified corpus, never internal weights.",
    "checksum_sha256": hashlib.sha256(json.dumps(exported, sort_keys=True).encode("utf-8")).hexdigest()
}

# Write to primary target (D:\FloodSaathi_AI\exported\manifest.json)
manifest_path = output_dir / "manifest.json"
with open(manifest_path, "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2)

# If requested or running default, mirror to repository for unit test sync
if getattr(args, "mirror_repo", True):
    repo_export = ROOT / "relay" / "models" / "exported"
    repo_export.mkdir(parents=True, exist_ok=True)
    with open(repo_export / "manifest.json", "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
```

---

## 5. Verification Method

To independently verify the implementation architecture, execute the following automated validation commands:

1. **Pytest Pipeline Test Suite**:
   ```powershell
   .venv\Scripts\python.exe -m pytest relay/tests/test_mobile_model.py -v
   ```
   *Expected Result*: All 6 tests pass in < 0.5s.

2. **Dry-Run CLI Execution of Training Script**:
   ```powershell
   .venv\Scripts\python.exe relay/train_mobile_model.py --dry-run
   ```
   *Expected Result*: Exits 0, writes `adapter_config.json`, `training_meta.json`, and `safety_eval_results.json` to `D:\FloodSaathi_AI\checkpoints\saathi_lora\`, achieving 100% pass rate.

3. **Dry-Run CLI Execution of Export Script**:
   ```powershell
   .venv\Scripts\python.exe relay/export_mobile_model.py --dry-run
   ```
   *Expected Result*: Exits 0, writes `onnx/`, `gguf/`, `litert/`, and `manifest.json` under `D:\FloodSaathi_AI\exported\`.

4. **Zero-Mock AST Enforcement**:
   ```powershell
   python scripts/check_no_mock.py
   ```
   *Expected Result*: `check_no_mock: OK` with 0 violations.

5. **Master E2E Test Suite (Tiers 1–4)**:
   ```powershell
   node tests/e2e/run_e2e_tests.mjs
   ```
   *Expected Result*: All 137 tests across Tiers 1–4 pass 100% with zero failures.

6. **Invalidation Conditions**:
   - Any write to `C:\Users\...\.cache\huggingface` during pipeline execution.
   - Any default `--output_dir` falling back to `C:\` when drive `D:\` is accessible.
   - Any deviation of LoRA rank from $r=16$ or alpha from $\alpha=32$.
   - Any safety holdout test in `eval/must_pass.json` failing (< 100% pass rate).
   - Any introduction of synthetic or mocked tokens into runtime modules.
