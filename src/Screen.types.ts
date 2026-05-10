import type { ReactNode } from "react";

/**
 * Lifecycle of a Screen. 0.2.x only emits "mounting" and "active".
 * "loading", "suspended", "hibernated", "restoring" land in subsequent
 * minors as the runtime fills out.
 */
export type ScreenLifecycle =
  | "mounting"
  | "loading"
  | "active"
  | "suspended"
  | "hibernated"
  | "restoring";

/** Direction of data flow across a port. */
export type PortDirection = "in" | "out" | "inout";

/**
 * A duck-typed validator. Accepts anything with a `.parse(value)` method
 * (Zod schemas, native validators, custom shapes) plus our built-in
 * descriptive forms. See validate.ts for the resolver.
 */
export type PortSchema =
  | { kind: "string"; min?: number; max?: number }
  | { kind: "number"; min?: number; max?: number }
  | { kind: "boolean" }
  | { kind: "any" }
  | { kind: "array"; of: PortSchema }
  | { kind: "object"; shape: Record<string, PortSchema | string> }
  // Duck-typed: anything with `.parse(value)` (e.g. Zod) is honored.
  | { parse: (value: unknown) => unknown };

/** Live state of a port — the unit observed by useScreenPort consumers. */
export interface PortState<T = unknown> {
  value: T | undefined;
  loading: boolean;
  error: Error | null;
  /** Bumped on every successful write — useful for forcing re-render keys. */
  version: number;
}

/** Stored port descriptor inside the global PortStore. */
export interface PortRecord<T = unknown> {
  state: PortState<T>;
  schema?: PortSchema;
  direction: PortDirection;
  /** Optional per-port default seeded at <Screen.Port> declaration. */
  defaultValue?: T;
}

export interface ScreenMeta {
  id: string;
  title?: string;
  lifecycle: ScreenLifecycle;
  /** Port names declared by this screen (without the screenId prefix). */
  ports: string[];
  /** Wall-clock millis of the last visibility-change to "active". */
  lastActiveAt?: number;
  /**
   * Most recent agent activity targeting this screen. Set by the host's
   * agent-integrations layer (see `AgentScreensBridge` / `useAgentActivity`)
   * — fancy-screens doesn't import that package, just stores the value.
   * `null` when no agent is currently active on the screen.
   */
  agentActivity?: AgentScreenActivity | null;
}

/**
 * Loose shape of an agent presence update written into ScreenMeta. Mirrors
 * the `AgentActivity` from `@particle-academy/agent-integrations` but kept
 * loose here so fancy-screens stays dep-free.
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
  /** Globally unique screen id. Doubles as the port-key prefix. */
  id: string;
  /** Optional human title — surfaced via useScreens(). */
  title?: string;
  /** JSX children OR omit and pass `schema` (later minors). */
  children?: ReactNode;
  className?: string;
}

export interface ScreenBodyProps {
  children?: ReactNode;
  className?: string;
}

export interface ScreenPortProps<T = unknown> {
  /** Local port name. Stored as `${screenId}.${name}`. */
  name: string;
  direction?: PortDirection;
  schema?: PortSchema;
  /** Initial value if the port hasn't been written yet. */
  defaultValue?: T;
}

export interface ScreenSystemProps {
  children?: ReactNode;
}
