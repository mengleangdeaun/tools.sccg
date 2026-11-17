import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeSerials } from "./serials.ts";

test("trims, drops blank lines, accepts one per item", () => {
  const r = normalizeSerials(" A1 \r\n\nB2\nC3\n", 3);
  assert.deepEqual(r.serials, ["A1", "B2", "C3"]);
  assert.equal(r.error, null);
});

test("no serials is valid for any quantity", () => {
  assert.equal(normalizeSerials("", 5).error, null);
  assert.equal(normalizeSerials(["", " "], 5).error, null);
});

test("count mismatch is an error", () => {
  assert.match(normalizeSerials("A\nB", 3).error, /got 2/);
});

test("duplicates are reported ignoring case", () => {
  const r = normalizeSerials("abc\nABC\nx", 3);
  assert.deepEqual(r.duplicates, ["ABC"]);
  assert.match(r.error, /Duplicate/);
});

test("quantity bounds", () => {
  assert.ok(normalizeSerials("", 0).error);
  assert.ok(normalizeSerials("", 101).error);
  assert.ok(normalizeSerials("", 1.5).error);
  assert.equal(normalizeSerials("", 100).error, null);
});
