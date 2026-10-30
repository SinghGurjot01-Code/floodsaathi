// app/test/ai_assistant.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AskSaathiAssistant, AUTHORIZED_HELPLINES } from "../js/ai_assistant.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cardsPath = path.resolve(__dirname, "../../corpus/cards/cards.json");
const cards = JSON.parse(fs.readFileSync(cardsPath, "utf-8"));

test("AI Assistant: Default mode is deterministic_m5 for offline safety", async () => {
  const assistant = new AskSaathiAssistant({ cards });
  await assistant.init();
  assert.equal(assistant.getMode(), "deterministic_m5");
  assert.equal(assistant.isWebGPUSupported(), false); // Node environment has no WebGPU
});

test("AI Assistant: Helpline inquiries strictly return authorized verified numbers", async () => {
  const assistant = new AskSaathiAssistant({ cards });
  const res = await assistant.ask("What is the flood helpline number to call for boat rescue?");
  assert.equal(res.intent, "helpline_routing");
  assert.ok(res.steps.length >= 4);

  // Every single helpline returned must be in AUTHORIZED_HELPLINES
  const authorizedNums = new Set(AUTHORIZED_HELPLINES.map((h) => h.number));
  for (const h of res.helplines) {
    assert.ok(authorizedNums.has(h.number), `Unauthorized helpline detected: ${h.number}`);
  }

  // Must include national 112 and state 1070
  assert.ok(authorizedNums.has("112"));
  assert.ok(authorizedNums.has("1070"));
});

test("AI Assistant: Punjabi helpline query returns Gurmukhi instructions with verified numbers", async () => {
  const assistant = new AskSaathiAssistant({ cards });
  const res = await assistant.ask("ਹੜ੍ਹ ਕੰਟਰੋਲ ਰੂਮ ਦਾ ਫੋਨ ਨੰਬਰ ਕੀ ਹੈ?", { lang: "pa" });
  assert.equal(res.intent, "helpline_routing");
  assert.ok(res.title.includes("ਐਮਰਜੈਂਸੀ ਹੈਲਪਲਾਈਨ"));
  assert.ok(res.steps.some((s) => s.includes("112")));
  assert.ok(res.steps.some((s) => s.includes("1070")));
});

test("AI Assistant: Water crossing queries return strict safety warning (Never walk or drive)", async () => {
  const assistant = new AskSaathiAssistant({ cards });
  
  // English
  const resEn = await assistant.ask("Is it safe to drive my tractor through 1 foot of moving river water?");
  assert.equal(resEn.intent, "hazard_warning");
  assert.ok(resEn.steps.some((s) => s.includes("15 cm")));
  assert.ok(resEn.steps.some((s) => s.includes("sweep away") || s.includes("TURN AROUND")));

  // Punjabi
  const resPa = await assistant.ask("ਕੀ ਮੈਂ ਗੋਡੇ-ਗੋਡੇ ਪਾਣੀ ਵਿੱਚੋਂ ਗੱਡੀ ਕੱਢ ਸਕਦਾ ਹਾਂ?", { lang: "pa" });
  assert.equal(resPa.intent, "hazard_warning");
  assert.ok(resPa.title.includes("ਖ਼ਤਰਾ"));
  assert.ok(resPa.steps.some((s) => s.includes("15 ਸੈਂਟੀਮੀਟਰ")));

  // Hindi
  const resHi = await assistant.ask("क्या मैं पानी भरी सड़क से कार निकाल लूं?", { lang: "hi" });
  assert.equal(resHi.intent, "hazard_warning");
  assert.ok(resHi.steps.some((s) => s.includes("15 सेमी")));
});

test("AI Assistant: Medical queries trigger refusal and direct to doctor and 108 ambulance", async () => {
  const assistant = new AskSaathiAssistant({ cards });
  const res = await assistant.ask("What antibiotic dose should I take for diarrhea from dirty water?");
  assert.equal(res.intent, "medical_refusal");
  assert.ok(res.steps.some((s) => s.includes("cannot prescribe")));
  assert.ok(res.steps.some((s) => s.includes("108")));
  assert.ok(res.steps.some((s) => s.includes("ORS")));
});

test("AI Assistant: Electrical queries require 10m distance and PSPCL 1912", async () => {
  const assistant = new AskSaathiAssistant({ cards });
  const res = await assistant.ask("A power line wire is broken and touching water in our street!");
  assert.equal(res.intent, "electrical_safety");
  assert.ok(res.steps.some((s) => s.includes("10 metres")));
  assert.ok(res.steps.some((s) => s.includes("1912")));
});

test("AI Assistant: River gauge questions bind directly to live verified context", async () => {
  const assistant = new AskSaathiAssistant({ cards });
  const gauges = [
    { river: "Beas", station: "Harike Pattan", level_m: 215.4, danger_m: 216.0, trend: "Rising" }
  ];
  const res = await assistant.ask("What is the current river level of Beas?", { lang: "en", gauges });
  assert.equal(res.intent, "gauge_telemetry");
  assert.ok(res.title.includes("Harike Pattan"));
  assert.ok(res.steps.some((s) => s.includes("215.4 m")));
  assert.ok(res.steps.some((s) => s.includes("216 m")));
  assert.ok(res.steps.some((s) => s.includes("Rising")));
});

test("AI Assistant: Well drinking water queries retrieve bleaching powder ratios", async () => {
  const assistant = new AskSaathiAssistant({ cards });
  const res = await assistant.ask("How to purify drinking well water?");
  assert.equal(res.cardId, "card-drinking-water");
  assert.ok(res.steps.some((s) => s.includes("Boil water") || s.includes("boil")));
  assert.equal(res.verified, true);
});

test("AI Assistant: Mode switching between deterministic and SLM", () => {
  const assistant = new AskSaathiAssistant({ cards });
  assert.equal(assistant.getMode(), "deterministic_m5");
  assistant.setMode("webgpu_slm");
  assert.equal(assistant.getMode(), "webgpu_slm");
  assistant.setMode("deterministic_m5");
  assert.equal(assistant.getMode(), "deterministic_m5");
});
