# Migrating to 0.4 — Ports → Zustand

`fancy-screens` 0.4 drops the custom Port system. State management is now **Zustand** (an optional peer dep). The schema-driven, registry, and presence pieces are unchanged.

## Why

The Port API was a worse Zustand — same shape (typed key/value store with subscribers) but no devtools, no middleware, no community recipes, no battle-tested scaling story. Once `agent-integrations` shipped per-component MCP bridges with stable handles, the Port system never picked up a real non-demo consumer. We removed it.

## Mapping

| Before (0.3.x) | After (0.4.x) |
|---|---|
| `<Screen.Port name="user" defaultValue={...} />` | `useRegisterStore("user", useUserStore)` inside the Screen |
| `const [user, setUser] = useScreenPort<T>("user")` | `const { user, setUser } = useUserStore()` |
| `useScreenPort<T>("other.field")` (cross-screen) | `useOtherStore((s) => s.field)` — import the other store directly |
| `useScreens()` returns `portValues` | `useScreens()` returns `storeValues` |
| `usePersistFancyState()` | Zustand's `persist` middleware |
| `PortSchema`, `PortDirection`, `PortRecord` types | Removed — Zustand has its own typing |

The `<Screen>`, `<Screen.System>`, `<Screen.Body>`, `useScreen()`, `useScreens()` and `agentActivity` APIs are unchanged.

## Step-by-step migration

### 1. Install Zustand

```bash
npm install zustand
```

### 2. Replace each `<Screen.Port>` + `useScreenPort` pair with a Zustand store

Before:

```tsx
<Screen id="profile">
  <Screen.Port name="user" defaultValue={{ name: "", email: "" }} />
  <Screen.Body>
    <Form />
  </Screen.Body>
</Screen>

function Form() {
  const [user, setUser] = useScreenPort<{ name: string; email: string }>("user");
  return <input value={user?.name} onChange={(e) => setUser({ ...user, name: e.target.value })} />;
}
```

After:

```tsx
import { create } from "zustand";
import { useRegisterStore } from "@particle-academy/fancy-screens";

const useUserStore = create<{
  name: string;
  email: string;
  setName: (n: string) => void;
}>((set) => ({
  name: "",
  email: "",
  setName: (name) => set({ name }),
}));

<Screen id="profile">
  <Screen.Body>
    <Form />
  </Screen.Body>
</Screen>

function Form() {
  useRegisterStore("user", useUserStore);
  const { name, setName } = useUserStore();
  return <input value={name} onChange={(e) => setName(e.target.value)} />;
}
```

### 3. Replace `usePersistFancyState()` with Zustand's `persist` middleware

Before:

```tsx
import { usePersistFancyState } from "@particle-academy/fancy-inertia";

function ShellPersistence() {
  usePersistFancyState();
  return null;
}
```

After (per-store):

```tsx
import { create } from "zustand";
import { persist } from "zustand/middleware";

const useUserStore = create(
  persist<UserState>(
    (set) => ({ name: "", setName: (n) => set({ name: n }) }),
    { name: "user-storage" },
  ),
);
```

`fancy-inertia` ≥ 0.2 no longer exports `usePersistFancyState` — its module is removed.

### 4. Update `useScreens()` consumers

`useScreens()` used to return `{ ports: string[], portValues: Record<string, unknown> }`. It now returns `{ storeKeys: string[], storeValues: Record<string, unknown> }`. The shape is otherwise identical.

If you wrote agent prompts that reference `ports` / `portValues`, change them to `storeKeys` / `storeValues`.

### 5. Remove any imports of `PortSchema`, `PortDirection`, `PortRecord`, `PortState`, `useScreenPort`, `Screen.Port`

They no longer exist. If you used schema validation on writes, do it inside the Zustand action — Zod and Valibot both work cleanly there.

## Behavior changes worth knowing

- **No automatic schema validation on writes.** Validate in the action body if you want.
- **Cross-screen reads are imports, not strings.** `useScreenPort("dashboard.filter")` becomes `useDashboardStore((s) => s.filter)`. This is more typesafe and friendlier to refactor tools.
- **No port subscriptions from outside React.** Use `store.subscribe(...)` from Zustand directly.

## See also

- [Stores.md](./Stores.md) — the new state primitive
- [Screen.md](./Screen.md) — `<Screen>` is unchanged
- [Registry.md](./Registry.md) — `useScreens()` shape change
