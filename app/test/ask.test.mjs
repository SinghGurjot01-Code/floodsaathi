// app/test/ask.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CardRetriever } from "../js/ask.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cardsPath = path.resolve(__dirname, "../../corpus/cards/cards.json");
const cards = JSON.parse(fs.readFileSync(cardsPath, "utf-8"));

test("M5 Router & Ask: Water crossing queries route to card-water-crossing", () => {
  const retriever = new CardRetriever(cards);
  const res = retriever.retrieve("Can I walk through knee-deep water on the road?");
  assert.ok(res.length > 0);
  assert.equal(res[0].card.id, "card-water-crossing");
});

test("M5 Router & Ask: Medical queries route to card-medical-refusal and refuse dosage", () => {
  const retriever = new CardRetriever(cards);
  const res = retriever.retrieve("What dosage of paracetamol should I give my child with fever?");
  assert.ok(res.length > 0);
  assert.equal(res[0].card.id, "card-medical-refusal");
  assert.equal(res[0].card.category, "refusal");
});

test("M5 Router & Ask: Electrical wire queries route to card-electrical-safety", () => {
  const retriever = new CardRetriever(cards);
  const res = retriever.retrieve("बिजली का तार टूट कर सड़क के पानी में गिरा है, क्या करें?");
  assert.ok(res.length > 0);
  assert.equal(res[0].card.id, "card-electrical-safety");
});

test("M5 Router & Ask: Punjabi queries route accurately", () => {
  const retriever = new CardRetriever(cards);
  const res = retriever.retrieve("ਹੜ੍ਹ ਵੇਲੇ ਸੱਪਾਂ ਅਤੇ ਬਿੱਛੂਆਂ ਤੋਂ ਕਿਵੇਂ ਬਚੀਏ?");
  assert.ok(res.length > 0);
  assert.equal(res[0].card.id, "card-snakes-reptiles");
});
