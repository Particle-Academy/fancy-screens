import type { ReactNode } from "react";
import type { StoreApi } from "zustand";
import type { ScreenDoc } from "./doc";

/**
 * Lifecycle of a Screen. Today only "active" is emitted; "loading",
 * "suspended", "hibernated", "restoring" land in subsequent minors as
 * the runtime fills out.
 */
export type ScreenLifecycle =
  | "mounting"
  | "loading"
  | "active"
  | "suspended"
  | "hibernated"
  | "restoring";

export interface ScreenMeta {
  id: string;
  title?: string;
  lifecycle: ScreenLifecycle;
  /** Names of stores registered for this screen (without screenId prefix). */
  storeKeys: string[];
  /** Wall-clock millis of the last visibility-change to "active". */
  lastActiveAt?: number;
  /**
   * Most recent agent activity targeting this screen. Set by the host's
   * agent-integrations layer — fancy-screens doesn't import that package,
   * just stores the value. `null` when no agent is currently active.
   */
  agentActivity?: AgentScreenActivity | null;
}

/**
 * Loose shape of an agent presence update written into ScreenMeta. Mirrors
 * the `AgentActivity` from `@particle-academy/agent-integrations` but kept
 * loose here so fancy-screens stays dep-free of that package.
 */
export interface AgentScreenActivity {
  agentId: string;
  agentName?: string;
  agentColor?: string;
  action: string;
  timestamp: number;
  /** Optional element id within the screen (sticky id, field name, …). */
  elementId?: string;
  /** Free-form label. */
  label?: string;
}

export interface ScreenProps {
  /** Globally unique screen id. Doubles as the store-key prefix. */
  id: string;
  /** Optional human title — surfaced via useScreens(). */
  title?: string;
  /** JSX children OR omit and pass `schema` for schema-driven mode. */
  children?: ReactNode;
  /**
   * Schema-driven mode. Pass a JSON description (typically agent-emitted)
   * and the Screen renders it via the component registry. When both
   * `schema` and `children` are provided, `children` wins.
   */
  schema?: ScreenSchema;
  /**
   * Document-driven mode. Pass a `DocTree` (fancy-doc-commons) — the flat,
   * addressable form of the same content.
   *
   * Takes precedence over `schema`: a document with node ids is the more
   * specific thing to have been handed, so if a caller has both, the
   * addressable one is the one they mean.
   */
  doc?: ScreenDoc;
  className?: string;
}

export interface ScreenBodyProps {
  children?: ReactNode;
  className?: string;
}

export interface ScreenSystemProps {
  children?: ReactNode;
}

/**
 * JSON page description consumed by `<Screen schema={...}>`. The schema is
 * intentionally LLM-friendly: arrays of objects, primitives, simple
 * discriminated unions. The component registry maps `type` to a React
 * component; `props` get spread; `children` recurse.
 *
 * This is the Human+ UX surface where an agent emits an entire UI as JSON
 * and the client renders it without per-page glue code.
 */
export interface ScreenSchema {
  /**
   * Stable handle for this node. **Supply it for anything an agent should be
   * able to address afterwards.**
   *
   * Optional, because nested JSON with no id bookkeeping is what a model emits
   * reliably — requiring ids would make the common case worse. But a node
   * without one cannot be addressed after render: the conversion to a flat
   * document mints a position-derived id and flags it `synthetic`, and a bridge
   * will not hand a synthetic id out as a durable handle, because inserting a
   * sibling above it silently repoints it at a different node.
   *
   * In short: no id is fine for static content, and required for anything an
   * agent is meant to drive.
   */
  id?: string;
  /** Component name registered via {@link registerSchemaComponent}. */
  type: string;
  /** Props passed through to the component. */
  props?: Record<string, unknown>;
  /** Either nested schemas or literal strings. */
  children?: Array<ScreenSchema | string>;
}

/**
 * A registered Zustand store, tracked in the screen system so agents and
 * presence layers can enumerate per-screen state without prop drilling.
 *
 * The store value is whatever `zustand.createStore(...)` returns — we keep
 * it loosely typed here since each store has its own state shape.
 */
export type RegisteredStore = StoreApi<unknown>;
