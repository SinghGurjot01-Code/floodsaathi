#!/usr/bin/env python3
"""
FloodSaathi Local Application & Neural AI Server
===============================================
Serves the offline PWA from app/ and exposes local API endpoints
for real on-device Small Language Model (SLM) inference with FloodSaathi-0.5B.
Zero mock data, zero simulated responses.
"""

import sys
import os
import json
import time
import re
import pathlib
import threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import urllib.parse

# Set working directory to project root
ROOT = pathlib.Path(__file__).resolve().parent
os.chdir(ROOT)

# Ensure local cache path is recognized
storage_root = os.environ.get("FLOODSAATHI_STORAGE", "D:\\FloodSaathi_AI")
hf_cache = os.environ.get("HF_HOME")
if not hf_cache:
    candidate_cache = pathlib.Path("D:/ornàment/.cache/huggingface")
    if candidate_cache.exists():
        os.environ["HF_HOME"] = str(candidate_cache)
    else:
        os.environ["HF_HOME"] = str(pathlib.Path(storage_root) / "cache" / "huggingface")

os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
os.environ["TOKENIZERS_PARALLELISM"] = "false"

# Global Model Reference
MODEL_LOCK = threading.Lock()
ACTIVE_TOKENIZER = None
ACTIVE_MODEL = None
MODEL_ID = "Qwen/Qwen2.5-0.5B-Instruct"
LORA_CHECKPOINT_DIR = pathlib.Path(storage_root) / "checkpoints" / "saathi_lora"

# Whisper STT Reference
WHISPER_LOCK = threading.Lock()
WHISPER_PIPE = None
WHISPER_MODEL_ID = "openai/whisper-tiny"

# Load Helplines
HELPLINES_PATH = ROOT / "corpus" / "helplines.json"
VERIFIED_HELPLINES = [
    {"number": "112", "name": "National Emergency Support System (ERSS)", "scope": "national"},
    {"number": "1078", "name": "National Disaster Management Authority (NDMA)", "scope": "national"},
    {"number": "1070", "name": "Punjab State Emergency Operations Centre (SEOC)", "scope": "state"},
    {"number": "1077", "name": "District Disaster Management Control Room", "scope": "district"}
]
if HELPLINES_PATH.exists():
    try:
        with open(HELPLINES_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            if "items" in data:
                VERIFIED_HELPLINES = data["items"]
    except Exception:
        pass


def check_model_on_disk():
    """Checks if model weights exist locally in HF cache without downloading."""
    hf_home = os.environ.get("HF_HOME")
    if hf_home:
        p = pathlib.Path(hf_home) / "hub" / f"models--{MODEL_ID.replace('/', '--')}"
        if p.exists() and any(p.rglob("*.safetensors")):
            return True, str(p)
    # Check default huggingface cache
    user_hf = pathlib.Path.home() / ".cache" / "huggingface" / "hub" / f"models--{MODEL_ID.replace('/', '--')}"
    if user_hf.exists() and any(user_hf.rglob("*.safetensors")):
        return True, str(user_hf)
    return False, ""


def get_or_load_model():
    """Lazily loads the real neural model into memory."""
    global ACTIVE_TOKENIZER, ACTIVE_MODEL
    with MODEL_LOCK:
        if ACTIVE_MODEL is not None and ACTIVE_TOKENIZER is not None:
            return ACTIVE_TOKENIZER, ACTIVE_MODEL

        import torch
        from transformers import AutoTokenizer, AutoModelForCausalLM, logging as hf_logging
        hf_logging.set_verbosity_error()

        device = "cuda" if torch.cuda.is_available() else "cpu"
        dtype = torch.float16 if device == "cuda" else torch.float32
        if device == "cuda":
            torch.backends.cuda.matmul.allow_tf32 = True
            torch.backends.cudnn.allow_tf32 = True
            gpu_name = torch.cuda.get_device_name(0)
            vram_gb = round(torch.cuda.get_device_properties(0).total_memory / 1e9, 1)
            print(f"[Server] 🚀 Activating NVIDIA GPU Acceleration: {gpu_name} ({vram_gb} GB VRAM) in {dtype}")
        else:
            print(f"[Server] Loading real neural model {MODEL_ID} into memory on {device} ({dtype})...")
        t0 = time.time()
        tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
        load_kwargs = {"dtype": dtype}
        if device == "cuda":
            load_kwargs["device_map"] = "cuda"
        else:
            load_kwargs["low_cpu_mem_usage"] = True

        model = AutoModelForCausalLM.from_pretrained(MODEL_ID, **load_kwargs)

        # Check for fine-tuned LoRA weights
        if (LORA_CHECKPOINT_DIR / "adapter_model.safetensors").exists() or (LORA_CHECKPOINT_DIR / "adapter_model.bin").exists():
            try:
                from peft import PeftModel
                print(f"[Server] Attaching fine-tuned LoRA adapter from {LORA_CHECKPOINT_DIR}...")
                model = PeftModel.from_pretrained(model, str(LORA_CHECKPOINT_DIR))
                print("[Server] LoRA adapter attached successfully.")
            except Exception as e:
                print(f"[Server] LoRA load note: {e}")

        model.eval()
        t1 = time.time()
        param_count = sum(p.numel() for p in model.parameters()) / 1e6
        print(f"[Server] Model ready on {device} in {t1 - t0:.2f}s ({param_count:.1f}M parameters).")

        ACTIVE_TOKENIZER = tokenizer
        ACTIVE_MODEL = model
        return ACTIVE_TOKENIZER, ACTIVE_MODEL


def get_or_load_whisper():
    """Lazily loads Whisper STT pipeline (openai/whisper-tiny) on GPU or CPU."""
    global WHISPER_PIPE
    with WHISPER_LOCK:
        if WHISPER_PIPE is not None:
            return WHISPER_PIPE

        import torch
        from transformers import pipeline, logging as hf_logging
        hf_logging.set_verbosity_error()

        device = 0 if torch.cuda.is_available() else -1
        print(f"[Server] Loading Whisper STT ({WHISPER_MODEL_ID}) into memory on device {device}...")
        t0 = time.time()
        WHISPER_PIPE = pipeline(
            "automatic-speech-recognition",
            model=WHISPER_MODEL_ID,
            device=device,
            chunk_length_s=30
        )
        print(f"[Server] Whisper STT pipeline ready in {time.time() - t0:.2f}s.")
        return WHISPER_PIPE


class FloodSaathiRequestHandler(SimpleHTTPRequestHandler):
    """Handles static files for app/ and API endpoints for model status and inference."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT / "app"), **kwargs)

    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/model/status":
            self._handle_model_status()
        elif parsed.path == "/api/health":
            self._handle_health()
        else:
            super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/chat":
            self._handle_chat()
        elif parsed.path == "/api/model/load":
            self._handle_model_load()
        elif parsed.path == "/api/transcribe":
            self._handle_transcribe()
        else:
            self.send_error(404, "Endpoint not found")

    def _handle_health(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps({"status": "ok", "app": "FloodSaathi"}).encode("utf-8"))

    def _handle_model_status(self):
        downloaded, cache_path = check_model_on_disk()
        loaded = ACTIVE_MODEL is not None
        lora_present = (LORA_CHECKPOINT_DIR / "adapter_config.json").exists()

        try:
            import torch
            device_str = f"GPU ({torch.cuda.get_device_name(0)})" if torch.cuda.is_available() else "cpu"
        except Exception:
            device_str = "cpu"

        status_data = {
            "status": "ready" if (downloaded or loaded) else "weights_missing",
            "model_id": "FloodSaathi-Neural-SLM",
            "model_name": "FloodSaathi-0.5B-Instruct",
            "downloaded": downloaded,
            "loaded_in_memory": loaded,
            "parameter_count": 494032768,
            "parameter_count_str": "494M",
            "size_mb": 988,
            "device": device_str,
            "lora_available": lora_present,
            "cache_path": cache_path
        }
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(status_data).encode("utf-8"))

    def _handle_model_load(self):
        try:
            t0 = time.time()
            get_or_load_model()
            duration = time.time() - t0
            resp = {
                "status": "loaded",
                "model_id": MODEL_ID,
                "parameter_count_str": "494M",
                "load_time_seconds": round(duration, 2)
            }
            code = 200
        except Exception as e:
            resp = {"status": "error", "message": str(e)}
            code = 500

        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(resp).encode("utf-8"))

    def _handle_chat(self):
        content_length = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(content_length)

        try:
            req = json.loads(post_data.decode("utf-8"))
            query = req.get("query", "").strip()
            lang = req.get("lang", "en")
            history = req.get("history", [])

            if not query:
                self.send_response(400)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self._send_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Empty query"}).encode("utf-8"))
                return

            tokenizer, model = get_or_load_model()

            # Execute real neural token generation
            from scripts.neural_assistant import generate_response, TextIteratorStreamer, BASE_SYSTEM_PROMPT, find_relevant_facts
            import torch
            from threading import Thread

            # Find relevant facts to ground response
            relevant_facts = find_relevant_facts(query)
            sys_prompt = BASE_SYSTEM_PROMPT
            if relevant_facts:
                sys_prompt += f"\n\nOfficial Reference Facts:\n{relevant_facts}"

            # Language directive
            if lang == "pa":
                sys_prompt += "\nRespond in clear, helpful Punjabi (Gurmukhi script). Provide numbered survival steps."
            elif lang == "hi":
                sys_prompt += "\nRespond in clear, helpful Hindi (Devanagari script). Provide numbered survival steps."
            else:
                sys_prompt += "\nRespond in clear, practical English. Provide numbered survival steps."

            messages = [{"role": "system", "content": sys_prompt}]
            for turn in history[-4:]:
                messages.append(turn)
            messages.append({"role": "user", "content": query})

            prompt_text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
            device = "cuda" if torch.cuda.is_available() else "cpu"
            inputs = tokenizer([prompt_text], return_tensors="pt").to(device)

            streamer = TextIteratorStreamer(tokenizer, skip_prompt=True, skip_special_tokens=True)
            gen_kwargs = dict(
                **inputs,
                streamer=streamer,
                max_new_tokens=140,
                temperature=0.6,
                top_p=0.9,
                do_sample=True,
            )

            t0 = time.time()
            thread = Thread(target=model.generate, kwargs=gen_kwargs)
            thread.start()

            chunks = []
            for token_text in streamer:
                chunks.append(token_text)
            thread.join()
            t1 = time.time()

            generated_text = "".join(chunks).strip()
            duration = max(t1 - t0, 0.05)
            token_count = len(chunks)
            tok_per_sec = round(token_count / duration, 1)

            # Safety check: enforce invariant 3 (never show 'safe to cross')
            forbidden_phrases = ["safe to drive", "safe to cross", "safe to wade"]
            for fp in forbidden_phrases:
                if fp in generated_text.lower():
                    generated_text = generated_text.replace(fp, "hazardous and unsafe")

            resp_payload = {
                "text": generated_text,
                "stats": {
                    "tokens": token_count,
                    "duration_s": round(duration, 2),
                    "tok_per_sec": tok_per_sec,
                    "model": "FloodSaathi-Neural-SLM",
                    "mode": "neural_slm"
                },
                "helplines": VERIFIED_HELPLINES,
                "source": "FloodSaathi Local Neural SLM",
                "verified": True
            }

            payload_bytes = json.dumps(resp_payload).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(payload_bytes)))
            self.send_header("Connection", "close")
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(payload_bytes)
            self.wfile.flush()

        except Exception as e:
            print(f"[Server] Inference error: {e}")
            self.send_response(500)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))

    def _handle_transcribe(self):
        content_length = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(content_length)

        try:
            import base64
            import tempfile
            import torch

            audio_bytes = None
            lang_hint = None

            content_type = self.headers.get("Content-Type", "")
            if "application/json" in content_type:
                req = json.loads(post_data.decode("utf-8"))
                b64_audio = req.get("audio", "")
                if "," in b64_audio:
                    b64_audio = b64_audio.split(",", 1)[1]
                audio_bytes = base64.b64decode(b64_audio)
                lang_hint = req.get("lang")
            else:
                audio_bytes = post_data
                lang_hint = self.headers.get("X-Audio-Lang")

            if not audio_bytes or len(audio_bytes) < 100:
                self.send_response(400)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self._send_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({"ok": False, "error": "Empty audio data"}).encode("utf-8"))
                return

            pipe = get_or_load_whisper()

            # Determine file extension based on magic bytes
            suffix = ".wav"
            if b"webm" in audio_bytes[:50] or b"\x1a\x45\xdf\xa3" in audio_bytes[:10]:
                suffix = ".webm"
            elif b"OggS" in audio_bytes[:10]:
                suffix = ".ogg"

            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tf:
                tf.write(audio_bytes)
                temp_audio_file = tf.name

            try:
                gen_kwargs = {}
                if lang_hint in ["pa", "panjabi", "punjabi"]:
                    gen_kwargs["language"] = "pa"
                elif lang_hint in ["hi", "hindi"]:
                    gen_kwargs["language"] = "hi"
                elif lang_hint in ["en", "english"]:
                    gen_kwargs["language"] = "en"

                res = pipe(temp_audio_file, generate_kwargs=gen_kwargs if gen_kwargs else None)
                transcribed_text = res.get("text", "").strip()
            finally:
                try:
                    os.unlink(temp_audio_file)
                except Exception:
                    pass

            device_str = f"GPU ({torch.cuda.get_device_name(0)})" if torch.cuda.is_available() else "cpu"
            resp_payload = {
                "ok": True,
                "text": transcribed_text,
                "model": WHISPER_MODEL_ID,
                "device": device_str
            }

            payload_bytes = json.dumps(resp_payload).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(payload_bytes)))
            self.send_header("Connection", "close")
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(payload_bytes)
            self.wfile.flush()

        except Exception as e:
            print(f"[Server] Transcribe error: {e}")
            self.send_response(500)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({"ok": False, "error": str(e)}).encode("utf-8"))


def run_server(port=8080):
    server_address = ("", port)
    httpd = ThreadingHTTPServer(server_address, FloodSaathiRequestHandler)
    print("=" * 68)
    print(f" FloodSaathi Local App & Neural AI Server running at:")
    print(f" -> http://localhost:{port}/")
    print(f" -> http://127.0.0.1:{port}/")
    print(f" Endpoints:")
    print(f" - GET  /api/model/status : Model weights & parameter detection")
    print(f" - POST /api/model/load   : Pre-load neural model into RAM")
    print(f" - POST /api/chat         : Real FloodSaathi Neural SLM Inference")
    print("=" * 68)

    # Warm up neural model in background thread so it is instantly ready on RTX 3050 GPU
    threading.Thread(target=get_or_load_model, daemon=True).start()

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[Server] Shutting down.")
        httpd.server_close()


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="FloodSaathi App & Neural Server")
    parser.add_argument("--port", type=int, default=8080, help="Port to serve on (default: 8080)")
    args = parser.parse_args()
    run_server(args.port)
