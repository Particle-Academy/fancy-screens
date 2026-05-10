import { useEffect, useMemo, type ReactNode } from "react";
import { ScreenContext, type ScreenContextValue } from "./Screen.context";
import { useScreenSystem } from "./ports/PortStore.context";
import { Port } from "./ports/Port";
import { ScreenSystem } from "./ScreenSystem";
import type { ScreenProps, ScreenBodyProps } from "./Screen.types";

function ScreenBody({ children, className }: ScreenBodyProps) {
  return <div data-fancy-screens-body="" className={className}>{children}</div>;
}
ScreenBody.displayName = "Screen.Body";

/**
 * Containerized application surface.
 *
 * 0.2.x scope: scoped state via typed ports + global registry.
 * Subsequent minors add lifecycle (visibility, hibernation), loading,
 * layouts, and schema-driven mode.
 */
function ScreenRoot({ id, title, children, className }: ScreenProps) {
  const system = useScreenSystem();

  useEffect(() => {
    system.registerScreen({
      id,
      title,
      lifecycle: "active",
      ports: [],
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

  const style = agentActivity?.agentColor
    ? ({ ["--agent-color" as any]: agentActivity.agentColor } as React.CSSProperties)
    : undefined;

  return (
    <ScreenContext.Provider value={ctx}>
      <div
        data-fancy-screens-screen=""
        data-screen-id={id}
        className={classes || undefined}
        style={style}
      >
        {children}
      </div>
    </ScreenContext.Provider>
  );
}

ScreenRoot.displayName = "Screen";

export const Screen = Object.assign(ScreenRoot, {
  Body: ScreenBody,
  Port,
  System: ScreenSystem,
});

export type { ScreenProps, ScreenBodyProps } from "./Screen.types";
export type { ScreenPortProps } from "./Screen.types";
