"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { processGraph } = require("../graph");

test("matches the assessment example", () => {
  const result = processGraph([
    "A->B", "A->C", "B->D", "C->E", "E->F",
    "X->Y", "Y->Z", "Z->X",
    "P->Q", "Q->R",
    "G->H", "G->H", "G->I",
    "hello", "1->2", "A->",
  ]);

  assert.deepEqual(result.hierarchies, [
    { root: "A", tree: { A: { B: { D: {} }, C: { E: { F: {} } } } }, depth: 4 },
    { root: "X", tree: {}, has_cycle: true },
    { root: "P", tree: { P: { Q: { R: {} } } }, depth: 3 },
    { root: "G", tree: { G: { H: {}, I: {} } }, depth: 2 },
  ]);
  assert.deepEqual(result.invalid_entries, ["hello", "1->2", "A->"]);
  assert.deepEqual(result.duplicate_edges, ["G->H"]);
  assert.deepEqual(result.summary, {
    total_trees: 3,
    total_cycles: 1,
    largest_tree_root: "A",
  });
});

test("trims valid edges and reports each duplicate only once", () => {
  const result = processGraph([" A->B ", "A->B", "A->B"]);
  assert.deepEqual(result.invalid_entries, []);
  assert.deepEqual(result.duplicate_edges, ["A->B"]);
  assert.equal(result.summary.total_trees, 1);
});

test("rejects malformed values and self-loops", () => {
  const entries = ["", "a->B", "AB->C", "A-B", "A->", "A->A", null, 12];
  assert.deepEqual(processGraph(entries).invalid_entries, [
    "", "a->B", "AB->C", "A-B", "A->", "A->A", "", "12",
  ]);
});

test("keeps the first parent and preserves the discarded parent as a standalone node", () => {
  const result = processGraph(["A->D", "B->D"]);
  assert.deepEqual(result.hierarchies, [
    { root: "A", tree: { A: { D: {} } }, depth: 2 },
    { root: "B", tree: { B: {} }, depth: 1 },
  ]);
});

test("uses lexicographical tiebreakers", () => {
  const result = processGraph(["X->Y", "A->B"]);
  assert.equal(result.summary.largest_tree_root, "A");
});

test("handles an empty graph", () => {
  const result = processGraph([]);
  assert.deepEqual(result.hierarchies, []);
  assert.deepEqual(result.summary, {
    total_trees: 0,
    total_cycles: 0,
    largest_tree_root: "",
  });
});
