#!/usr/bin/env node
// tests/e2e/run_e2e_tests.mjs
// Master E2E Test Suite Runner for FloodSaathi
// Executes 4-Tier Opaque-Box E2E Tests (Feature Coverage, Boundary, Cross-Feature, Real-World)
// Pure ES module, zero external dependencies

import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "../..");

const TIERS = [
  {
    id: "Tier 1",
    name: "Feature Coverage (F1-F12)",
    file: "tier1_feature_tests.mjs",
    expectedCount: 60,
    minCount: 60,
    desc: ">=5 tests per feature for all 12 core requirements"
  },
  {
    id: "Tier 2",
    name: "Boundary & Corner Cases",
    file: "tier2_boundary_tests.mjs",
    expectedCount: 60,
    minCount: 60,
    desc: ">=5 boundary and edge condition tests per feature"
  },
  {
    id: "Tier 3",
    name: "Cross-Feature Interactions",
    file: "tier3_cross_feature_tests.mjs",
    expectedCount: 12,
    minCount: 10,
    desc: "Pairwise interaction matrix across UI, offline cache, AI, telemetry"
  },
  {
    id: "Tier 4",
    name: "Real-World Workload Scenarios",
    file: "tier4_real_world_tests.mjs",
    expectedCount: 5,
    minCount: 5,
    desc: "End-to-end multi-step emergency and field responder journeys"
  }
];

function runTier(tier) {
  const filePath = path.join(__dirname, tier.file);
  const startTime = Date.now();
  let passed = 0;
  let failed = 0;
  let stdout = "";
  let stderr = "";
  let exitCode = 0;

  try {
    // Run with node's test runner in clean child environment
    stdout = execSync(`node --test "${filePath}"`, {
      cwd: PROJECT_ROOT,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"]
    });
    exitCode = 0;
  } catch (err) {
    exitCode = err.status || 1;
    stdout = err.stdout ? err.stdout.toString() : "";
    stderr = err.stderr ? err.stderr.toString() : err.message;
  }

  const durationMs = Date.now() - startTime;
  const combinedOutput = stdout + "\n" + stderr;

  // Parse pass/fail counts from node test output
  const passMatch = combinedOutput.match(/ℹ pass (\d+)/i) || combinedOutput.match(/pass (\d+)/i);
  const failMatch = combinedOutput.match(/ℹ fail (\d+)/i) || combinedOutput.match(/fail (\d+)/i);

  if (passMatch) {
    passed = parseInt(passMatch[1], 10);
  } else {
    // Count checkmarks
    const checkmarks = (combinedOutput.match(/✔/g) || []).length;
    passed = checkmarks;
  }

  if (failMatch) {
    failed = parseInt(failMatch[1], 10);
  } else {
    const crosses = (combinedOutput.match(/✖/g) || []).length;
    failed = crosses;
  }

  // If exit code is non-zero and failed count was 0, mark at least 1 failure
  if (exitCode !== 0 && failed === 0) {
    failed = 1;
  }

  return {
    tierId: tier.id,
    name: tier.name,
    file: tier.file,
    expectedCount: tier.expectedCount,
    minCount: tier.minCount,
    passed,
    failed,
    total: passed + failed,
    durationMs,
    exitCode,
    status: exitCode === 0 && failed === 0 ? "PASS" : "FAIL",
    output: combinedOutput
  };
}

function printHeader() {
  console.log("===============================================================================");
  console.log("             FloodSaathi Opaque-Box E2E Master Test Suite                      ");
  console.log("===============================================================================");
  console.log(" Mode: Development / Offline-First / Zero-Mock                                ");
  console.log(" Project Root: " + PROJECT_ROOT);
  console.log(" Timestamp: " + new Date().toISOString());
  console.log("===============================================================================\n");
}

function main() {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes("--json");
  const selectedTier = args.find((a) => a.startsWith("--tier="))?.split("=")[1];

  if (!jsonOutput) {
    printHeader();
  }

  const targetTiers = selectedTier
    ? TIERS.filter((t) => t.id.toLowerCase().includes(selectedTier.toLowerCase()))
    : TIERS;

  const results = [];
  let allPassed = true;
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  const totalStartTime = Date.now();

  for (const tier of targetTiers) {
    if (!jsonOutput) {
      process.stdout.write(`>> Executing [${tier.id}] ${tier.name}... `);
    }
    const res = runTier(tier);
    results.push(res);

    totalTests += res.total;
    totalPassed += res.passed;
    totalFailed += res.failed;

    if (res.status !== "PASS") {
      allPassed = false;
    }

    if (!jsonOutput) {
      if (res.status === "PASS") {
        console.log(`[PASS] (${res.passed}/${res.expectedCount} passed, ${(res.durationMs / 1000).toFixed(2)}s)`);
      } else {
        console.log(`[FAIL] (${res.failed} failed, ${res.passed} passed)`);
      }
    }
  }

  const totalDurationMs = Date.now() - totalStartTime;

  if (jsonOutput) {
    console.log(JSON.stringify({
      status: allPassed ? "PASS" : "FAIL",
      totalTests,
      totalPassed,
      totalFailed,
      durationMs: totalDurationMs,
      results
    }, null, 2));
    process.exit(allPassed ? 0 : 1);
  }

  // Print Summary Table
  console.log("\n===============================================================================");
  console.log("                             TEST SUITE SUMMARY                                ");
  console.log("===============================================================================");
  console.log(" Tier    Name                             Target   Passed   Failed  Status  Time");
  console.log("-------------------------------------------------------------------------------");
  for (const r of results) {
    const tierPadded = r.tierId.padEnd(7, " ");
    const namePadded = r.name.padEnd(32, " ");
    const targetPadded = String(r.expectedCount).padStart(6, " ");
    const passPadded = String(r.passed).padStart(8, " ");
    const failPadded = String(r.failed).padStart(8, " ");
    const statusPadded = r.status.padStart(6, " ");
    const timePadded = `${(r.durationMs / 1000).toFixed(2)}s`.padStart(7, " ");
    console.log(` ${tierPadded} ${namePadded} ${targetPadded} ${passPadded} ${failPadded}  ${statusPadded} ${timePadded}`);
  }
  console.log("===============================================================================");
  console.log(` TOTAL   4 Tiers Across F1-F12            ${String(totalTests).padStart(6, " ")} ${String(totalPassed).padStart(8, " ")} ${String(totalFailed).padStart(8, " ")}  ${allPassed ? "PASS" : "FAIL"}  ${(totalDurationMs / 1000).toFixed(2)}s`);
  console.log("===============================================================================");

  if (allPassed) {
    console.log("\n[SUCCESS] All 4 Tiers passed 100% with zero failures.");
    console.log(`Total tests executed: ${totalTests}. Pass rate: 100.0%.\n`);
    process.exit(0);
  } else {
    console.error(`\n[FAILURE] Test suite encountered ${totalFailed} failures.\n`);
    for (const r of results) {
      if (r.status !== "PASS") {
        console.error(`--- Failure in ${r.tierId} (${r.file}) ---`);
        console.error(r.output);
      }
    }
    process.exit(1);
  }
}

main();
