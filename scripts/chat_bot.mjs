// scripts/chat_bot.mjs
// Interactive Terminal CLI to test FloodSaathi AI Assistant & Safety Guard Engine
// Run: node scripts/chat_bot.mjs [optional question]

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import { AskSaathiAssistant } from "../app/js/ai_assistant.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cardsPath = path.resolve(__dirname, "../corpus/cards/cards.json");
const gaugesPath = path.resolve(__dirname, "../app/data/latest/punjab.json");

if (!fs.existsSync(cardsPath)) {
  console.error("Error: cards.json not found at", cardsPath);
  process.exit(1);
}

const cards = JSON.parse(fs.readFileSync(cardsPath, "utf-8"));
let latestGauges = [];
if (fs.existsSync(gaugesPath)) {
  try {
    const data = JSON.parse(fs.readFileSync(gaugesPath, "utf-8"));
    latestGauges = data.gauges || [];
  } catch {}
}

const assistant = new AskSaathiAssistant({ cards });
await assistant.init();

let currentLang = "en";

function formatResponse(res) {
  const line = "─".repeat(60);
  console.log(`\n\x1b[36m${line}\x1b[0m`);
  console.log(`\x1b[1m\x1b[32m🛡️  [${res.mode.toUpperCase()}] ${res.title}\x1b[0m`);
  console.log(`\x1b[90mCategory / Intent: ${res.intent || "safety_guidance"} | Status: ${res.badge || "verified"}\x1b[0m`);
  console.log(`\x1b[36m${line}\x1b[0m\n`);

  if (res.summary) {
    console.log(`\x1b[33mSummary:\x1b[0m ${res.summary}\n`);
  }

  if (res.steps && res.steps.length > 0) {
    console.log(`\x1b[1mActionable Steps:\x1b[0m`);
    res.steps.forEach((step, idx) => {
      console.log(`  \x1b[32m${idx + 1}.\x1b[0m ${step}`);
    });
    console.log();
  }

  if (res.helplines && res.helplines.length > 0) {
    console.log(`\x1b[1m\x1b[31m📞 Verified Emergency Helplines:\x1b[0m`);
    res.helplines.forEach((h) => {
      console.log(`  • \x1b[1m${h.number}\x1b[0m - ${h.name}`);
    });
    console.log();
  }

  if (res.source) {
    console.log(`\x1b[90mSource: ${res.source}\x1b[0m`);
  }
  console.log(`\x1b[36m${line}\x1b[0m\n`);
}

// 1. One-shot command line argument mode
const cliQuery = process.argv.slice(2).join(" ").trim();
if (cliQuery) {
  // Detect Punjabi / Hindi in query
  if (/[\u0A00-\u0A7F]/.test(cliQuery)) currentLang = "pa";
  else if (/[\u0900-\u097F]/.test(cliQuery)) currentLang = "hi";

  const res = await assistant.ask(cliQuery, {
    lang: currentLang,
    gauges: latestGauges
  });
  formatResponse(res);
  process.exit(0);
}

// 2. Interactive REPL mode
console.log(`\x1b[1m\x1b[34m====================================================\x1b[0m`);
console.log(`\x1b[1m\x1b[34m    🌊 FloodSaathi AI Assistant Terminal Test REPL 🤖\x1b[0m`);
console.log(`\x1b[1m\x1b[34m====================================================\x1b[0m`);
console.log(`Active Mode : \x1b[32m${assistant.getMode()}\x1b[0m (Strict Invariant Protection)`);
console.log(`Knowledge   : \x1b[32m${cards.length} verified safety cards loaded\x1b[0m`);
console.log(`Language    : \x1b[32m${currentLang}\x1b[0m (English / Hindi / Punjabi)`);
console.log(`Commands    : Type your question, or \x1b[33m/lang [en|hi|pa]\x1b[0m, or \x1b[33mexit\x1b[0m to quit.\n`);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: `\x1b[1m\x1b[35mAsk Saathi [${currentLang}] > \x1b[0m`
});

rl.prompt();

rl.on("line", async (line) => {
  const input = line.trim();
  if (!input) {
    rl.prompt();
    return;
  }

  if (input === "exit" || input === "quit" || input === "/exit") {
    console.log("Exiting FloodSaathi test session. Stay safe!");
    process.exit(0);
  }

  if (input.startsWith("/lang")) {
    const parts = input.split(" ");
    const nextLang = parts[1]?.toLowerCase();
    if (["en", "hi", "pa"].includes(nextLang)) {
      currentLang = nextLang;
      console.log(`\x1b[32mActive language set to: ${currentLang}\x1b[0m\n`);
      rl.setPrompt(`\x1b[1m\x1b[35mAsk Saathi [${currentLang}] > \x1b[0m`);
    } else {
      console.log("\x1b[31mUsage: /lang en | /lang hi | /lang pa\x1b[0m\n");
    }
    rl.prompt();
    return;
  }

  // Auto-detect script if not forced
  let queryLang = currentLang;
  if (/[\u0A00-\u0A7F]/.test(input)) queryLang = "pa";
  else if (/[\u0900-\u097F]/.test(input)) queryLang = "hi";

  try {
    const res = await assistant.ask(input, {
      lang: queryLang,
      gauges: latestGauges
    });
    formatResponse(res);
  } catch (err) {
    console.error("\x1b[31mError generating response:\x1b[0m", err.message);
  }

  rl.prompt();
});
