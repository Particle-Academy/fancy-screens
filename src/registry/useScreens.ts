import { useScreenSystem } from "../ports/PortStore.context";
import type { ScreenMeta } from "../Screen.types";

/**
 * The agent-superpower hook. Returns a list of every mounted screen with
 * its metadata + the live port snapshot for each. Updates whenever the
 * registry mutates.
 *
 * Stable shape across versions; new fields will be added but never
 * removed.
 */
export function useScreens(): Array<
  ScreenMeta & { portValues: Record<string, unknown> }
> {
  const system = useScreenSystem();
  // Reading registryVersion through context already triggers re-renders
  // when ScreenSystem bumps it; we just need to consume the registry now.
  const screens: Array<ScreenMeta & { portValues: Record<string, unknown> }> = [];
  system.registry.forEach((meta) => {
    const portValues: Record<string, unknown> = {};
    for (const portName of meta.ports) {
      const state = system.store.get(`${meta.id}.${portName}`);
      portValues[portName] = state?.value;
    }
    screens.push({ ...meta, portValues });
  });
  return screens;
}
