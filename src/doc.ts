import {
  type DocId,
  type DocNode,
  type DocTree,
  childrenOf,
  fractionalKey,
} from "@particle-academy/fancy-doc-commons";
import type { ScreenSchema } from "./Screen.types";

/**
 * A `ScreenSchema` node in its flat, addressable normal form.
 *
 * `synthetic` marks an id this library MINTED because the author did not supply
 * one. It is not a durable handle: it is derived from the node's position, so
 * inserting a sibling above it silently reassigns it to a different node. A
 * bridge must never hand a synthetic id to an agent as something to store —
 * that is the difference between a handle that works and one that works until
 * somebody adds a row.
 */
export interface ScreenDocNode extends DocNode {
  synthetic?: boolean;
}

/** A screen document: the flat form of a `ScreenSchema`. */
export type ScreenDoc = DocTree<ScreenDocNode>;

/**
 * Reserved node type for a literal string child.
 *
 * `ScreenSchema.children` may hold bare strings, and a flat tree has no concept
 * of a text child — every node needs an id and a parent. Representing text as a
 * node with a reserved type is what makes the conversion LOSSLESS in both
 * directions; dropping strings, or folding them into a prop, would round-trip
 * wrong for any schema that mixes text and elements as siblings.
 */
export const TEXT_NODE_TYPE = "#text";

export interface ToDocTreeOptions {
  /** Id for the root node. Defaults to a synthetic one. */
  rootId?: DocId;
}

/**
 * `ScreenSchema` → `DocTree`.
 *
 * Nested JSON is the right thing for an agent to *emit* — terse, no id
 * bookkeeping, and what a model produces reliably. Flat-with-ids is the right
 * thing for a runtime to *hold* — addressable, patchable, mergeable. These are
 * one model in two normal forms, so this is a conversion, not a migration.
 */
export function toDocTree(schema: ScreenSchema, options: ToDocTreeOptions = {}): ScreenDoc {
  const nodes: Record<DocId, ScreenDocNode> = {};

  const walk = (
    node: ScreenSchema | string,
    parent: DocId | null,
    path: number[],
    order: string,
  ): void => {
    const syntheticId = syntheticIdFor(path);

    if (typeof node === "string") {
      nodes[syntheticId] = {
        id: syntheticId,
        type: TEXT_NODE_TYPE,
        parent,
        order,
        props: { value: node },
        synthetic: true,
      };

      return;
    }

    const authored = node.id;
    const id = authored ?? syntheticId;

    nodes[id] = {
      id,
      type: node.type,
      parent,
      order,
      props: node.props ? { ...node.props } : {},
      ...(authored === undefined ? { synthetic: true } : {}),
    };

    let previous: string | null = null;
    (node.children ?? []).forEach((child, index) => {
      const childOrder = fractionalKey(previous, null);
      previous = childOrder;
      walk(child, id, [...path, index], childOrder);
    });
  };

  const rootPath: number[] = [];
  const rootOrder = fractionalKey(null, null);

  if (options.rootId !== undefined) {
    // An explicit root id is authored by the caller, so it is NOT synthetic.
    const { children, props, type } = schema;
    nodes[options.rootId] = {
      id: options.rootId,
      type,
      parent: null,
      order: rootOrder,
      props: props ? { ...props } : {},
    };

    let previous: string | null = null;
    (children ?? []).forEach((child, index) => {
      const childOrder = fractionalKey(previous, null);
      previous = childOrder;
      walk(child, options.rootId!, [index], childOrder);
    });

    return { nodes };
  }

  walk(schema, null, rootPath, rootOrder);

  return { nodes };
}

/**
 * `DocTree` → `ScreenSchema`.
 *
 * Synthetic ids are dropped, so a schema that arrived without ids comes back
 * without them and the round trip is an identity. An authored id survives.
 */
export function fromDocTree(tree: ScreenDoc, rootId?: DocId): ScreenSchema {
  const root = rootId !== undefined ? tree.nodes[rootId] : rootsOf(tree)[0];

  if (!root) {
    throw new Error(
      rootId !== undefined
        ? `fromDocTree: no node with id "${rootId}"`
        : "fromDocTree: the tree has no root node",
    );
  }

  if (root.type === TEXT_NODE_TYPE) {
    throw new Error("fromDocTree: the root node is a text node, which cannot be a ScreenSchema");
  }

  return build(tree, root);
}

function build(tree: ScreenDoc, node: ScreenDocNode): ScreenSchema {
  const kids = childrenOf(tree, node.id);

  const schema: ScreenSchema = { type: node.type };

  if (!node.synthetic) schema.id = node.id;
  if (Object.keys(node.props).length > 0) schema.props = { ...node.props };

  if (kids.length > 0) {
    schema.children = kids.map((child) =>
      child.type === TEXT_NODE_TYPE ? String(child.props.value ?? "") : build(tree, child),
    );
  }

  return schema;
}

function rootsOf(tree: ScreenDoc): ScreenDocNode[] {
  return childrenOf(tree, null);
}

/**
 * Position-derived id, used only when the author supplied none.
 *
 * The `:` prefix is deliberate: it makes a minted id visibly different from an
 * authored one at a glance, in a log or a tool response, without having to look
 * up the `synthetic` flag.
 */
function syntheticIdFor(path: number[]): DocId {
  return path.length === 0 ? ":root" : `:${path.join(".")}`;
}

/**
 * The ids an agent may store, i.e. the author-supplied ones.
 *
 * This is what a bridge should answer "what can I address here?" with. Handing
 * back synthetic ids would look more useful and be actively wrong.
 */
export function addressableIds(tree: ScreenDoc): DocId[] {
  return Object.values(tree.nodes)
    .filter((node) => !node.synthetic)
    .map((node) => node.id);
}
