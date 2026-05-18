import { useMemo, useRef, useState, type ReactNode } from "react";
import { ScreenSystemContext, type ScreenSystemValue } from "./ScreenSystem.context";
import type { RegisteredStore, ScreenMeta } from "./Screen.types";

interface ScreenSystemProps {
  children?: ReactNode;
}

/**
 * Root provider for fancy-screens. Wrap your app once. Owns the screen
 * registry and a Map of registered Zustand stores. Without this,
 * `<Screen>` and `useScreens()` will throw.
 */
export function ScreenSystem({ children }: ScreenSystemProps) {
  const registryRef = useRef<Map<string, ScreenMeta>>(new Map());
  const storesRef = useRef<Map<string, RegisteredStore>>(new Map());
  const [registryVersion, setRegistryVersion] = useState(0);

  const value = useMemo<ScreenSystemValue>(() => {
    const bump = () => setRegistryVersion((v) => v + 1);
    return {
      registry: registryRef.current,
      registryVersion,
      stores: storesRef.current,
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
        // Drop any stores registered to this screen so the maps don't drift.
        const prefix = `${id}.`;
        for (const key of storesRef.current.keys()) {
          if (key.startsWith(prefix)) storesRef.current.delete(key);
        }
        bump();
      },
      registerStore: (key, store) => {
        storesRef.current.set(key, store);
        // Patch the storeKeys array on the owning screen so consumers can
        // enumerate stores without scanning the global map.
        const [screenId, storeName] = key.split(".");
        if (screenId && storeName) {
          const existing = registryRef.current.get(screenId);
          if (existing && !existing.storeKeys.includes(storeName)) {
            registryRef.current.set(screenId, {
              ...existing,
              storeKeys: [...existing.storeKeys, storeName],
            });
          }
        }
        bump();
        return () => {
          storesRef.current.delete(key);
          if (screenId && storeName) {
            const existing = registryRef.current.get(screenId);
            if (existing) {
              registryRef.current.set(screenId, {
                ...existing,
                storeKeys: existing.storeKeys.filter((n) => n !== storeName),
              });
            }
          }
          bump();
        };
      },
    };
  }, [registryVersion]);

  return (
    <ScreenSystemContext.Provider value={value}>{children}</ScreenSystemContext.Provider>
  );
}

ScreenSystem.displayName = "ScreenSystem";
