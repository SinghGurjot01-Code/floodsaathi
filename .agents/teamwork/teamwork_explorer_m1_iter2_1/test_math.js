function estimateDownloadSize(radiusKm) {
  const r = Number(radiusKm);
  if (!Number.isFinite(r) || r <= 0) return 0;

  let mb;
  if (r <= 10) {
    mb = (12 / 10) * r;
  } else if (r <= 25) {
    mb = 12 + ((28 - 12) / (25 - 10)) * (r - 10);
  } else if (r <= 50) {
    mb = 28 + ((65 - 28) / (50 - 25)) * (r - 25);
  } else if (r <= 100) {
    mb = 65 + ((140 - 65) / (100 - 50)) * (r - 50);
  } else {
    mb = 140 + 1.5 * (r - 100);
  }
  return Math.round(mb * 10) / 10;
}

console.log("Presets:", estimateDownloadSize(10), estimateDownloadSize(25), estimateDownloadSize(50), estimateDownloadSize(100));
console.log("15km:", estimateDownloadSize(15));
console.log("Boundary 0, -25, NaN, undef, abc:", estimateDownloadSize(0), estimateDownloadSize(-25), estimateDownloadSize(NaN), estimateDownloadSize(undefined), estimateDownloadSize("abc"));
console.log("String presets:", estimateDownloadSize("10"), estimateDownloadSize("25"), estimateDownloadSize("50"), estimateDownloadSize("100"));

let prev = estimateDownloadSize(1);
let inversions = 0;
for (let i = 2; i <= 150; i++) {
  const cur = estimateDownloadSize(i);
  if (cur < prev) {
    console.error("Inversion at", i, prev, cur);
    inversions++;
  }
  prev = cur;
}
console.log("Inversions 1..150:", inversions);
