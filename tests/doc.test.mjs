import assert from "node:assert/strict";
import test from "node:test";
import { childrenOf } from "@particle-academy/fancy-doc-commons";
import { addressableIds, fromDocTree, toDocTree, TEXT_NODE_TYPE } from "../dist/index.js";

/**
 * Shapes that between them cover every way the two normal forms differ:
 * nesting, sibling order, literal text, text mixed with elements, authored ids,
 * partially-authored ids, and depth.
 */
const FIXTURES = {
  leaf: { type: "Text" },

  withProps: { type: "Button", props: { color: "violet", size: "lg" } },

  textChild: { type: "Text", children: ["Hello"] },

  nested: {
    type: "Card",
    props: { padding: "lg" },
    children: [
      { type: "Heading", props: { size: "xl" }, children: ["Title"] },
      { type: "Text", children: ["Body copy"] },
    ],
  },

  // Order is the thing most likely to break in a flat form.
  manySiblings: {
    type: "Stack",
    children: [
      { type: "Text", children: ["one"] },
      { type: "Text", children: ["two"] },
      { type: "Text", children: ["three"] },
      { type: "Text", children: ["four"] },
      { type: "Text", children: ["five"] },
    ],
  },

  // Text and elements interleaved — the case that breaks any implementation
  // which folds strings into a prop instead of giving them a node.
  mixedChildren: {
    type: "Text",
    children: ["before ", { type: "Badge", children: ["NEW"] }, " after"],
  },

  authoredIds: {
    id: "root",
    type: "Card",
    children: [
      { id: "title", type: "Heading", children: ["Hi"] },
      { id: "cta", type: "Button", props: { color: "violet" } },
    ],
  },

  // The realistic case: an agent labels what it means to drive and leaves the
  // rest anonymous.
  partiallyAuthored: {
    type: "Card",
    children: [
      { type: "Heading", children: ["Static"] },
      { id: "counter", type: "Text", children: ["0"] },
    ],
  },

  deep: {
    type: "A",
    children: [{ type: "B", children: [{ type: "C", children: [{ type: "D", children: ["deep"] }] }] }],
  },

  flowViewer: {
    id: "flow",
    type: "FlowViewer",
    props: { graph: { nodes: [], edges: [] }, variant: "list" },
  },
};

// The whole risk of this change is here. If the round trip is not an identity,
// every downstream consumer inherits a lossy conversion.
for (const [name, schema] of Object.entries(FIXTURES)) {
  test(`round-trips: ${name}`, () => {
    assert.deepEqual(fromDocTree(toDocTree(schema)), schema);
  });
}

test("preserves sibling order", () => {
  const tree = toDocTree(FIXTURES.manySiblings);
  const root = Object.values(tree.nodes).find((n) => n.type === "Stack");
  const labels = childrenOf(tree, root.id).map((c) => childrenOf(tree, c.id)[0]?.props.value);

  assert.deepEqual(labels, ["one", "two", "three", "four", "five"]);
});

test("represents a literal string as a text node, not a prop", () => {
  const tree = toDocTree(FIXTURES.textChild);
  const text = Object.values(tree.nodes).find((n) => n.type === TEXT_NODE_TYPE);

  // Folding text into a prop round-trips `mixedChildren` wrong, because a
  // string and an element can be siblings.
  assert.ok(text);
  assert.equal(text.props.value, "Hello");
});

test("keeps an authored id verbatim and does not mark it synthetic", () => {
  const tree = toDocTree(FIXTURES.authoredIds);

  assert.ok(tree.nodes.root);
  assert.equal(tree.nodes.root.synthetic, undefined);
  assert.equal(tree.nodes.cta.type, "Button");
});

test("mints a synthetic id when the author supplied none, and flags it", () => {
  const tree = toDocTree(FIXTURES.leaf);
  const node = Object.values(tree.nodes)[0];

  assert.equal(node.synthetic, true);
  // Visibly different from an authored id in a log or tool response, without
  // having to check the flag.
  assert.ok(node.id.startsWith(":"));
});

test("only offers AUTHORED ids as addressable", () => {
  const tree = toDocTree(FIXTURES.partiallyAuthored);

  // The point of the identity design: a synthetic id is derived from position,
  // so handing one to an agent as a durable handle looks more useful and is
  // actively wrong.
  assert.deepEqual(addressableIds(tree), ["counter"]);
});

test("re-mints the same synthetic ids for the same structure", () => {
  const a = toDocTree(FIXTURES.nested);
  const b = toDocTree(FIXTURES.nested);

  assert.deepEqual(Object.keys(a.nodes).sort(), Object.keys(b.nodes).sort());
});

test("shows why a synthetic id is not a handle: inserting a sibling repoints it", () => {
  const before = toDocTree({ type: "Stack", children: [{ type: "Text", children: ["first"] }] });
  const after = toDocTree({
    type: "Stack",
    children: [{ type: "Text", children: ["inserted"] }, { type: "Text", children: ["first"] }],
  });

  const textOf = (tree, id) => childrenOf(tree, id)[0]?.props.value;

  // Same id, different node — and it fails SILENTLY. That is why path-derived
  // ids are worse than no ids, and why the flag exists.
  assert.equal(textOf(before, ":0"), "first");
  assert.equal(textOf(after, ":0"), "inserted");
});

test("accepts an explicit root id and treats it as authored", () => {
  const tree = toDocTree(FIXTURES.nested, { rootId: "page" });

  assert.ok(tree.nodes.page);
  assert.equal(tree.nodes.page.synthetic, undefined);
  assert.ok(addressableIds(tree).includes("page"));
  assert.deepEqual(fromDocTree(tree, "page"), { ...FIXTURES.nested, id: "page" });
});

test("throws a useful error rather than rendering nothing", () => {
  assert.throws(() => fromDocTree({ nodes: {} }), /no root node/);
  assert.throws(() => fromDocTree(toDocTree(FIXTURES.leaf), "nope"), /no node with id/);
});

// ─── The render path ─────────────────────────────────────────────────────────
// `doc` and `schema` must reach the SAME output, because both resolve `type`
// against the same component registry. If they diverge, every /screens adapter
// silently means something different depending on which prop the host used.

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Screen, ScreenSystem, registerSchemaComponents } from "../dist/index.js";

const Box = ({ children, tone }) =>
  React.createElement("div", { "data-box": tone ?? "plain" }, children);

registerSchemaComponents({ Box });

const SAMPLE = {
  type: "Box",
  props: { tone: "warm" },
  children: ["hello ", { type: "Box", children: ["nested"] }],
};

const render = (props) =>
  renderToStaticMarkup(
    React.createElement(
      ScreenSystem,
      null,
      React.createElement(Screen, { id: "s1", ...props }),
    ),
  );

test("renders a doc identically to the equivalent schema", () => {
  assert.equal(render({ doc: toDocTree(SAMPLE) }), render({ schema: SAMPLE }));
});

test("renders the doc's actual content, not an empty shell", () => {
  const html = render({ doc: toDocTree(SAMPLE) });

  assert.match(html, /data-box="warm"/);
  assert.match(html, /nested/);
});

test("doc takes precedence over schema when both are given", () => {
  const html = render({
    doc: toDocTree({ type: "Box", props: { tone: "from-doc" } }),
    schema: { type: "Box", props: { tone: "from-schema" } },
  });

  assert.match(html, /data-box="from-doc"/);
});

test("children still win over both", () => {
  const html = render({
    doc: toDocTree(SAMPLE),
    children: React.createElement("span", null, "explicit"),
  });

  assert.match(html, /explicit/);
  assert.doesNotMatch(html, /data-box/);
});
