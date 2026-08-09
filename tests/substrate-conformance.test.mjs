import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CANONICAL_IDS,
  CANONICAL_TREE,
  CANONICAL_WALKS,
  ancestorsOf,
  childrenOf,
  descendantsOf,
  roots,
} from "@particle-academy/fancy-doc-commons";

/**
 * Screens share the substrate — the other half of story #171's AC1.
 *
 * `fancy-cms-ui` asserts these same constants in its own suite. A fixture only
 * one consumer checks proves nothing: the point is that the CMS and screens
 * agree at RUNTIME, so a bridge can hand a document from one to the other and
 * get the same shape back.
 */
const doc = {
  nodes: Object.fromEntries(
    Object.entries(CANONICAL_TREE.nodes).map(([id, n]) => [id, { ...n, type: n.type ?? "Box" }]),
  ),
};

test("agrees on roots and their order", () => {
  assert.deepEqual(roots(doc).map((n) => n.id), [...CANONICAL_WALKS.roots]);
});

test("agrees on sibling order", () => {
  assert.deepEqual(
    childrenOf(doc, CANONICAL_IDS.rootB).map((n) => n.id),
    [...CANONICAL_WALKS.childrenOfRootB],
  );
});

test("agrees on descendants", () => {
  assert.deepEqual(descendantsOf(doc, CANONICAL_IDS.rootB), [
    ...CANONICAL_WALKS.descendantsOfRootB,
  ]);
});

test("agrees on ancestors", () => {
  assert.deepEqual(ancestorsOf(doc, CANONICAL_IDS.grandchild), [
    ...CANONICAL_WALKS.ancestorsOfGrandchild,
  ]);
});

test("agrees that an orphan has no ancestors and is not a root", () => {
  assert.deepEqual(ancestorsOf(doc, CANONICAL_IDS.orphan), [
    ...CANONICAL_WALKS.ancestorsOfOrphan,
  ]);
  assert.equal(roots(doc).some((n) => n.id === CANONICAL_IDS.orphan), false);
});
