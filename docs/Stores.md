# Stores

`fancy-screens` uses **Zustand** for screen-scoped state. It does not implement its own pub/sub store anymore; instead, you bring a Zustand store and call `useRegisterStore(name, store)` from inside a `<Screen>` to make it discoverable by agents and presence layers.

## Why Zustand and not a custom store?

Earlier 0.x of `fancy-screens` shipped a custom Port system. It was a worse Zustand: no devtools, no middleware, no time-travel, no ecosystem. The right primitive is "a Zustand store you've made agent-discoverable" — not a parallel state implementation.

## Install

Zustand is an optional peer dependency:

```bash
npm install zustand
# or
pnpm add zustand
```

## Quick start

```tsx
import { create } from "zustand";
import { Screen, useRegisterStore } from "@particle-academy/fancy-screens";

const useUserStore = create<{ name: string; setName: (n: string) => void }>((set) => ({
  name: "",
  setName: (name) => set({ name }),
}));

function App() {
  return (
    <Screen.System>
      <Screen id="profile" title="Profile">
        <UserPanel />
      </Screen>
    </Screen.System>
  );
}

function UserPanel() {
  useRegisterStore("user", useUserStore);
  const { name, setName } = useUserStore();
  return <input value={name} onChange={(e) => setName(e.target.value)} />;
}
```

After this:

- The store is registered as `profile.user` in the screen system.
- `useScreens()` includes its current state under `storeValues.user` for the `profile` screen.
- `agent-integrations` bridges can read it (`useUserStore.getState()`) and write it (`useUserStore.setState({ ... })`) without any prop wiring or DOM scraping.

## API

### `useRegisterStore<T>(name: string, store: StoreApi<T>): void`

Register a store. Call once per store inside the `<Screen>` you want to attach it to. Unregistration happens automatically on unmount.

```tsx
useRegisterStore("user", useUserStore);
```

The `store` argument is the return value of `create(...)` from Zustand — the same hook you use to read state. Zustand's hooks double as the `StoreApi` (they have `.getState()`, `.setState()`, `.subscribe()` as static methods).

## Per-screen vs. global stores

By default Zustand stores are global singletons. That's usually what you want — two `<Screen id="profile-A">` and `<Screen id="profile-B">` rendered side-by-side share the same `useUserStore` state.

If you need per-screen-instance state, use Zustand's [scoped store pattern](https://docs.pmnd.rs/zustand/guides/initialize-state-with-props) — `createStore(initializer)` inside the Screen plus a React Context to expose it to descendants. The registry tracks whatever store object you pass to `useRegisterStore`, so per-instance stores work identically from an agent's perspective.

## Cross-screen reads

Agents (and your code) read other screens' state through `useScreens()`:

```tsx
const screens = useScreens();
const dashboard = screens.find((s) => s.id === "dashboard");
const filter = dashboard?.storeValues.filter as string | undefined;
```

For reactive cross-screen reads from non-agent code, just import the other screen's store directly — Zustand handles the subscription.

## Persistence

Zustand ships a `persist` middleware that handles localStorage / sessionStorage / IndexedDB. Use it directly:

```tsx
import { create } from "zustand";
import { persist } from "zustand/middleware";

const useUserStore = create(
  persist<UserState>(
    (set) => ({ name: "", setName: (name) => set({ name }) }),
    { name: "user-storage" },
  ),
);
```

You no longer need `usePersistFancyState` from `fancy-inertia` — Zustand's middleware does the job.

## Cross-screen reactivity

`useScreens()` re-renders when the screen registry mutates (mount/unmount, title change, store register/unregister) — **not** on every Zustand `setState`. That's deliberate: high-frequency state changes inside a store would otherwise cascade into every consumer of `useScreens()`.

If you need a re-render when a specific store mutates, subscribe to it directly with its hook:

```tsx
const filter = useDashboardStore((s) => s.filter);
```

## See also

- [Screen.md](./Screen.md) — the surfaces that own stores
- [Registry.md](./Registry.md) — `useScreens()` exposes registered stores
- [Migration.md](./Migration.md) — migrating from 0.3.x Ports
