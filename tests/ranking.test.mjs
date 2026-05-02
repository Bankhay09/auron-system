import assert from "node:assert/strict";
import test from "node:test";

function calculateRank(xp) {
  if (xp >= 100000) return "SSS";
  if (xp >= 50000) return "SS";
  if (xp >= 25000) return "S";
  if (xp >= 10000) return "A";
  if (xp >= 5000) return "B";
  if (xp >= 2000) return "C";
  if (xp >= 500) return "D";
  return "E";
}

test("calcula rank por XP nos thresholds do Auron System", () => {
  assert.equal(calculateRank(0), "E");
  assert.equal(calculateRank(500), "D");
  assert.equal(calculateRank(2000), "C");
  assert.equal(calculateRank(5000), "B");
  assert.equal(calculateRank(10000), "A");
  assert.equal(calculateRank(25000), "S");
  assert.equal(calculateRank(50000), "SS");
  assert.equal(calculateRank(100000), "SSS");
});
