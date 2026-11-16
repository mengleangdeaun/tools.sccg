import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SheetError,
  cellToString,
  columnLetter,
  createQueue,
  errorStatus,
  missingColumns,
  parseBool,
  parseNumber,
  pickFields,
  recordToCells,
  rowToRecord,
  withRetry,
} from "./core.ts";

const noWait = async () => {};

test("columnLetter handles columns past Z", () => {
  assert.equal(columnLetter(0), "A");
  assert.equal(columnLetter(25), "Z");
  assert.equal(columnLetter(26), "AA");
  assert.equal(columnLetter(51), "AZ");
  assert.equal(columnLetter(52), "BA");
});

test("rows map by header name, whatever the column order", () => {
  const record = rowToRecord(["name", "id", ""], ["Laptop", "AST-1", "ignored"]);
  assert.deepEqual(record, { name: "Laptop", id: "AST-1" });
});

test("short rows read missing trailing cells as empty", () => {
  assert.deepEqual(rowToRecord(["id", "notes"], ["AST-1"]), { id: "AST-1", notes: "" });
});

test("records write in header order and keep native types", () => {
  const cells = recordToCells(["id", "cost", "is_active", "notes"], {
    cost: 1200,
    id: "AST-1",
    is_active: true,
  });
  assert.deepEqual(cells, ["AST-1", 1200, true, ""]);
});

test("missingColumns reports only defined fields without a column", () => {
  assert.deepEqual(missingColumns(["id"], { id: "A", brand: "Apple", skip: undefined }), ["brand"]);
});

test("booleans match how Sheets displays them", () => {
  assert.equal(cellToString(true), "TRUE");
  assert.equal(parseBool("TRUE"), true);
  assert.equal(parseBool("yes"), true);
  assert.equal(parseBool("FALSE"), false);
  assert.equal(parseBool(""), false);
});

test("parseNumber reads formatted numbers", () => {
  assert.equal(parseNumber("12,500"), 12500);
  assert.equal(parseNumber(""), 0);
  assert.equal(parseNumber("abc"), 0);
});

test("withRetry retries 429 then succeeds", async () => {
  let calls = 0;
  const result = await withRetry(async () => {
    if (++calls < 3) throw Object.assign(new Error("slow down"), { status: 429 });
    return "ok";
  }, noWait);
  assert.equal(result, "ok");
  assert.equal(calls, 3);
});

test("queue executes tasks serially", async () => {
  const queue = createQueue();
  const order = [];

  const t1 = queue(async () => {
    order.push("t1-start");
    order.push("t1-end");
    return 1;
  });

  const t2 = queue(async () => {
    order.push("t2-start");
    order.push("t2-end");
    return 2;
  });

  await Promise.all([t1, t2]);
  assert.deepEqual(order, ["t1-start", "t1-end", "t2-start", "t2-end"]);
});

