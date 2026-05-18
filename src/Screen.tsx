import { useEffect, useMemo, type CSSProperties, type ReactNode } from "react";
import { ScreenContext, type ScreenContextValue } from "./Screen.context";
import { useScreenSystem } from "./ScreenSystem.context";
import { ScreenSystem } from "./ScreenSystem";
import { renderSchema } from "./schema";
import type { ScreenBodyProps, ScreenProps } from "./Screen.types";

function ScreenBody({ children, className }: ScreenBodyProps) {
  return <div data-fancy-screens-body="" className={className}>{children}</div>;
}
ScreenBody.displayName = "Screen.Body";

/**
 * Containerized application surface. Registers with the enclosing
 * `<Screen.System>` so agents and presence layers can enumerate and
 * target it.
 *
 * Supports two render modes:
 *   - JSX children  — pass any React tree
 *   - schema prop   — agent-emitted JSON, rendered via the schema registry
 *
 * Children win if both are provided.
 */
function ScreenRoot({ id, title, children, schema, className }: ScreenProps) {
  const system = useScreenSystem();

  useEffect(() => {
    system.registerScreen({
      id,
      title,
      lifecycle: "active",
      storeKeys: [],
      lastActiveAt: Date.now(),
    });
    return () => system.unregisterScreen(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Patch title without remounting the registry entry.
  useEffect(() => {
    if (title !== undefined) system.updateScreen(id, { title });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, title]);

  // Read the live agentActivity for this screen so we can apply a CSS
  // class while it's set. Subscribers (e.g. agent-integrations) push
  // updates via system.updateScreen(id, { agentActivity }).
  const meta = system.registry.get(id);
  const agentActivity = meta?.agentActivity;

  const ctx = useMemo<ScreenContextValue>(
    () => ({ id, title, lifecycle: "active" }),
    [id, title],
  );

  const classes = [
    className,
    agentActivity ? "agent-focused-element" : null,
  ].filter(Boolean).join(" ");

  const style: CSSProperties | undefined = agentActivity?.agentColor
    ? ({ ["--agent-color" as unknown as keyof CSSProperties]: agentActivity.agentColor } as CSSProperties)
    : undefined;

  const body = children ?? (schema ? renderSchema(schema) : null);

  return (
    <ScreenContext.Provider value={ctx}>
      <div
        data-fancy-screens-screen=""
        data-screen-id={id}
        className={classes || undefined}
        style={style}
      >
        {body}
      </div>
    </ScreenContext.Provider>
  );
}

ScreenRoot.displayName = "Screen";

export const Screen = Object.assign(ScreenRoot, {
  Body: ScreenBody,
  System: ScreenSystem,
});

export type { ScreenProps, ScreenBodyProps } from "./Screen.types";
