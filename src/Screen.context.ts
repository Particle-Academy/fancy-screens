import { createContext, useContext } from "react";
import type { ScreenLifecycle } from "./Screen.types";

/**
 * Per-Screen context. Provided by each `<Screen>`. Components inside use it
 * to know which screen they're in (for port keying) and what lifecycle
 * state they're in.
 */
export interface ScreenContextValue {
  id: string;
  title?: string;
  lifecycle: ScreenLifecycle;
}

export const ScreenContext = createContext<ScreenContextValue | null>(null);

export function useScreen(): ScreenContextValue {
  const ctx = useContext(ScreenContext);
  if (!ctx) {
    throw new Error(
      "[fancy-screens] useScreen / <Screen.Port> must be inside a <Screen>"
    );
  }
  return ctx;
}
