import { useMemo, useRef, useState, type ReactNode } from "react";
import { ScreenSystemContext, type ScreenSystemValue } from "./ports/PortStore.context";
import { PortStore } from "./ports/PortStore";
import type { ScreenMeta } from "./Screen.types";

interface ScreenSystemProps {
  children?: ReactNode;
}

/**
 * Root provider for fancy-screens. Wrap your app once. Owns the global
 * PortStore and the screen registry. Without this, `<Screen>` and
 * `useScreens()` will throw.
 */
export function ScreenSystem({ children }: ScreenSystemProps) {
  const storeRef = useRef<PortStore | null>(null);
  if (storeRef.current === null) storeRef.current = new PortStore();

  const registryRef = useRef<Map<string, ScreenMeta>>(new Map());
  const [registryVersion, setRegistryVersion] = useState(0);

  const value = useMemo<ScreenSystemValue>(() => {
    const bump = () => setRegistryVersion((v) => v + 1);
    return {
      store: storeRef.current!,
      registry: registryRef.current,
      registryVersion,
      registerScreen: (meta) => {
        registryRef.current.set(meta.id, meta);
        bump();
      },
      updateScreen: (id, patch) => {
        const existing = registryRef.current.get(id);
        if (!existing) return;
        registryRef.current.set(id, { ...existing, ...patch });
        bump();
      },
      unregisterScreen: (id) => {
        registryRef.current.delete(id);
        bump();
      },
    };
  }, [registryVersion]);

  return (
    <ScreenSystemContext.Provider value={value}>{children}</ScreenSystemContext.Provider>
  );
}

ScreenSystem.displayName = "ScreenSystem";
