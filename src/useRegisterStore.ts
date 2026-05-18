import { useEffect } from "react";
import type { StoreApi } from "zustand";
import { useScreen } from "./Screen.context";
import { useScreenSystem } from "./ScreenSystem.context";

/**
 * Register a Zustand store with the enclosing `<Screen>`. The store gets
 * keyed as `${screenId}.${name}` and shows up in `useScreens()` and to
 * agent-integrations' presence/bridge layers so an agent can read or
 * mutate per-screen state without prop drilling — Zustand's own
 * `getState()` and `setState()` do the work.
 *
 * Call this once per store inside a component that lives within the
 * `<Screen>` you want to attach to:
 *
 *   import { create } from "zustand";
 *   import { useRegisterStore } from "@particle-academy/fancy-screens";
 *
 *   const useUserStore = create((set) => ({
 *     name: "",
 *     setName: (name: string) => set({ name }),
 *   }));
 *
 *   function UserPanel() {
 *     useRegisterStore("user", useUserStore);
 *     const name = useUserStore((s) => s.name);
 *     return <input value={name} onChange={(e) => useUserStore.getState().setName(e.target.value)} />;
 *   }
 *
 * The store object you pass IS the same one Zustand returns from
 * `create(...)` — we just track it. The store survives this hook's
 * unmount; registration is the only thing tied to lifecycle.
 */
export function useRegisterStore<T>(name: string, store: StoreApi<T>): void {
  const screen = useScreen();
  const system = useScreenSystem();

  useEffect(() => {
    const key = `${screen.id}.${name}`;
    // Cast to StoreApi<unknown> for the registry — we lose T at the
    // boundary, which is fine because consumers re-type when they read.
    return system.registerStore(key, store as unknown as StoreApi<unknown>);
  }, [screen.id, name, store, system]);
}
