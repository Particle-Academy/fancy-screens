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

  const ctx = useMemo<ScreenContextValue>(
    () => ({ id, title, lifecycle: "active" }),
    [id, title],
  );

  return (
    <ScreenContext.Provider value={ctx}>
      <div data-fancy-screens-screen="" data-screen-id={id} className={className}>
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
