import { createContext, useContext } from "react";
import type { PortStore } from "./PortStore";
import type { ScreenMeta } from "../Screen.types";

/**
 * The "system" context — provided by `<Screen.System>` at the app root.
 * Exposes the global PortStore and the screen registry. All hooks bottom
 * out here.
 */
export interface ScreenSystemValue {
  store: PortStore;
  /** Live registry of all mounted screens, keyed by id. */
  registry: Map<string, ScreenMeta>;
  /** Bumped on every registry mutation — drives useScreens() rerenders. */
  registryVersion: number;
  registerScreen: (meta: ScreenMeta) => void;
  updateScreen: (id: string, patch: Partial<ScreenMeta>) => void;
  unregisterScreen: (id: string) => void;
}

export const ScreenSystemContext = createContext<ScreenSystemValue | null>(null);

export function useScreenSystem(): ScreenSystemValue {
  const ctx = useContext(ScreenSystemContext);
  if (!ctx) {
    throw new Error(
      "[fancy-screens] useScreenSystem / <Screen.Port> must be inside <Screen.System>. " +
      "Wrap your app: <Screen.System>{...}</Screen.System>"
    );
  }
  return ctx;
}
