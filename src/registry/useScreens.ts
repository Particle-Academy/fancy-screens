import { useScreenSystem } from "../ScreenSystem.context";
import type { RegisteredStore, ScreenMeta } from "../Screen.types";

/**
 * The agent-superpower hook. Returns a list of every mounted screen with
 * its metadata + a snapshot of every Zustand store registered to that
 * screen (`Zustand store.getState()` at call time).
 *
 * Stable shape across versions; new fields will be added but never
 * removed.
 */
export function useScreens(): Array<
  ScreenMeta & { storeValues: Record<string, unknown> }
> {
  const system = useScreenSystem();
  // Reading registryVersion through context already triggers re-renders
  // when ScreenSystem bumps it; we just need to consume the registry now.
  const screens: Array<ScreenMeta & { storeValues: Record<string, unknown> }> = [];
  system.registry.forEach((meta) => {
    const storeValues: Record<string, unknown> = {};
    for (const storeKey of meta.storeKeys) {
      const store: RegisteredStore | undefined = system.stores.get(`${meta.id}.${storeKey}`);
      storeValues[storeKey] = store?.getState();
    }
    screens.push({ ...meta, storeValues });
  });
  return screens;
}
