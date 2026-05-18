import { createElement, type ComponentType, type ReactNode } from "react";
import type { ScreenSchema } from "./Screen.types";

/**
 * Component registry consumed by `<Screen schema={...}>`. Hosts register
 * components by name; the schema references them by string. Agent-emitted
 * JSON UI is the primary consumer — see /docs/human-plus-ux for the full
 * "agent emits a page" story.
 */
const registry = new Map<string, ComponentType<Record<string, unknown>>>();

export function registerSchemaComponent(
  name: string,
  component: ComponentType<Record<string, unknown>>,
): void {
  registry.set(name, component);
}

export function registerSchemaComponents(
  entries: Record<string, ComponentType<Record<string, unknown>>>,
): void {
  for (const [name, component] of Object.entries(entries)) {
    registry.set(name, component);
  }
}

export function unregisterSchemaComponent(name: string): void {
  registry.delete(name);
}

/** List every registered name. Useful for agents enumerating choices. */
export function listSchemaComponents(): string[] {
  return Array.from(registry.keys());
}

/**
 * Render a {@link ScreenSchema} into a React node. Unknown component
 * names render as a visible error placeholder (so the agent sees the
 * mistake instead of a silent blank).
 */
export function renderSchema(schema: ScreenSchema, keyHint?: string | number): ReactNode {
  const Comp = registry.get(schema.type);
  if (!Comp) {
    return (
      <div
        key={keyHint}
        role="alert"
        data-fancy-schema-unknown=""
        style={{
          padding: "0.5rem 0.75rem",
          border: "1px dashed #f97316",
          color: "#9a3412",
          background: "#fff7ed",
          fontFamily: "ui-monospace, monospace",
          fontSize: 12,
        }}
      >
        Unknown schema component: <code>{schema.type}</code>. Register it with{" "}
        <code>registerSchemaComponent("{schema.type}", …)</code>.
      </div>
    );
  }

  const props = schema.props ?? {};
  const children = (schema.children ?? []).map((child, i) =>
    typeof child === "string" ? child : renderSchema(child, i),
  );

  return createElement(Comp, { key: keyHint, ...props }, children.length > 0 ? children : undefined);
}
