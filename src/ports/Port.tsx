import { useEffect } from "react";
import { useScreen } from "../Screen.context";
import { useScreenSystem } from "./PortStore.context";
import type { ScreenPortProps } from "../Screen.types";

/**
 * Declarative port. Render as a sibling of `<Screen.Body>` inside a
 * `<Screen>`. Renders no DOM — its only job is to declare the port to
 * the store on mount and tear it down on unmount.
 */
export function Port<T = unknown>({
  name,
  direction = "inout",
  schema,
  defaultValue,
}: ScreenPortProps<T>) {
  const screen = useScreen();
  const system = useScreenSystem();

  useEffect(() => {
    system.store.declare(screen.id, name, {
      schema,
      direction,
      defaultValue,
    });
    // Patch the screen's port list in the registry.
    const meta = system.registry.get(screen.id);
    if (meta && !meta.ports.includes(name)) {
      system.updateScreen(screen.id, { ports: [...meta.ports, name] });
    }
    return () => {
      system.store.remove(screen.id, name);
      const m = system.registry.get(screen.id);
      if (m) {
        system.updateScreen(screen.id, {
          ports: m.ports.filter((p) => p !== name),
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen.id, name]);

  return null;
}

Port.displayName = "Screen.Port";
