import { createContext, useContext } from "react";
import type { RegisteredStore, ScreenMeta } from "./Screen.types";

/**
 * The "system" context — provided by `<Screen.System>` at the app root.
 * Exposes the screen registry and a registry of Zustand stores keyed by
 * `${screenId}.${storeName}`. All hooks bottom out here.
 */
export interface ScreenSystemValue {
  /** Live registry of all mounted screens, keyed by id. */
  registry: Map<string, ScreenMeta>;
  /** Bumped on every registry mutation — drives useScreens() rerenders. */
  registryVersion: number;
  /** Zustand stores registered via useRegisterStore, keyed by `${screenId}.${name}`. */
  stores: Map<string, RegisteredStore>;

  registerScreen: (meta: ScreenMeta) => void;
  updateScreen: (id: string, patch: Partial<ScreenMeta>) => void;
  unregisterScreen: (id: string) => void;
  /** Returns an unregister function. */
  registerStore: (key: string, store: RegisteredStore) => () => void;
}

export const ScreenSystemContext = createContext<ScreenSystemValue | null>(null);

export function useScreenSystem(): ScreenSystemValue {
  const ctx = useContext(ScreenSystemContext);
  if (!ctx) {
    throw new Error(
      "[fancy-screens] useScreenSystem must be inside <Screen.System>. " +
        "Wrap your app: <Screen.System>{...}</Screen.System>",
    );
  }
  return ctx;
}
