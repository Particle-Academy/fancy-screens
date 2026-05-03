import { useCallback, useEffect, useState } from "react";
import { useScreen } from "../Screen.context";
import { useScreenSystem } from "./PortStore.context";
import { PortStore } from "./PortStore";
import type { PortState } from "../Screen.types";

const EMPTY_STATE: PortState<unknown> = {
  value: undefined,
  loading: false,
  error: null,
  version: 0,
};

/**
 * Read/write a port from inside a `<Screen>`.
 *
 * - Local name (`useScreenPort("user")`) reads the current screen's port.
 * - Cross-screen reference (`useScreenPort("dashboard.user")`) reads
 *   the named port from another screen.
 *
 * Returns `[value, setValue, meta]` where meta is `{ loading, error, key }`.
 */
export function useScreenPort<T = unknown>(
  name: string,
): [T | undefined, (value: T) => void, { loading: boolean; error: Error | null; key: string }] {
  const screen = useScreen();
  const system = useScreenSystem();

  const key = name.includes(".") ? name : PortStore.key(screen.id, name);

  const [state, setState] = useState<PortState<T>>(
    () => (system.store.get(key) as PortState<T>) ?? (EMPTY_STATE as PortState<T>),
  );

  useEffect(() => {
    const initial = system.store.get(key);
    if (initial) setState(initial as PortState<T>);
    const unsub = system.store.subscribe(key, (s) => setState(s as PortState<T>));
    return unsub;
  }, [system.store, key]);

  const setValue = useCallback(
    (value: T) => {
      system.store.set(key, value);
    },
    [system.store, key],
  );

  return [state.value, setValue, { loading: state.loading, error: state.error, key }];
}
