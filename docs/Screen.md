# Screen

A **containerized application surface**. A `<Screen>` is bigger than a tab and smaller than a route — it declares its identity to a global [registry](./Registry.md), participates in cross-surface agent presence, and can render either as JSX or from an agent-emitted JSON schema.

State management is **Zustand**. fancy-screens does not implement its own pub/sub store — you bring Zustand stores and register them with the enclosing Screen so they're enumerable by agents and presence layers.

## Import

```tsx
import { Screen, useScreen, useRegisterStore } from "@particle-academy/fancy-screens";
```

## Quick start

Wrap your app in `<Screen.System>` once at the root, then drop one or more `<Screen>` components anywhere underneath:

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
        <Screen.Body>
          <Form />
        </Screen.Body>
      </Screen>
    </Screen.System>
  );
}

function Form() {
  useRegisterStore("user", useUserStore);
  const { name, setName } = useUserStore();
  return <input value={name} onChange={(e) => setName(e.target.value)} />;
}
```

## Components

### `<Screen.System>` (root provider)

Wrap your app once. Owns the screen registry and the map of registered Zustand stores. Without it, every `<Screen>` and `useScreens()` call will throw.

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Anything. |

### `<Screen>` (root)

Declares a containerized surface. Self-registers with the system on mount, unregisters on unmount.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `id` | `string` | yes | Globally unique. Doubles as the prefix for any stores you register inside (`${id}.${storeName}`). |
| `title` | `string` | no | Human label surfaced via `useScreens()`. |
| `children` | `ReactNode` | no | The screen's content. Wins over `schema` when both are passed. |
| `schema` | `ScreenSchema` | no | Agent-emitted JSON page description. See [SchemaMode.md](./SchemaMode.md). |
| `className` | `string` | no | Forwarded to the wrapping `<div>`. |

### `<Screen.Body>`

Wraps the visible content. Today this is mostly a marker; in later minors it becomes the boundary that gets unmounted on hibernation. Use it now so future minors don't require migration.

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | The screen's renderable content. |
| `className` | `string` | Forwarded to the wrapping `<div>`. |

## Hooks

### `useScreen()`

Returns the current screen's metadata + lifecycle. Throws if used outside a `<Screen>`.

```tsx
const { id, title, lifecycle } = useScreen();
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | The Screen's `id` prop. |
| `title` | `string \| undefined` | The Screen's `title` prop. |
| `lifecycle` | `ScreenLifecycle` | Current state. Today always `"active"`. |

### `useRegisterStore(name, store)`

Register a Zustand store with the enclosing `<Screen>`. See [Stores.md](./Stores.md).

```tsx
const useUserStore = create<UserState>((set) => ({ ... }));

function Form() {
  useRegisterStore("user", useUserStore);
  // ...
}
```

After this, `useScreens()` will see the store under the key `${screen.id}.user`, and agent-integrations' bridges can read or mutate state via `store.getState()` / `store.setState()`.

### `useScreens()`

Snapshot of every mounted Screen + its registered stores' current state. The agent-superpower hook. See [Registry.md](./Registry.md).

## Schema-driven mode (agent-emit JSON UI)

```tsx
import { Screen, registerSchemaComponent } from "@particle-academy/fancy-screens";
import { Card, Button } from "@particle-academy/react-fancy";

registerSchemaComponent("Card", Card);
registerSchemaComponent("Card.Body", Card.Body);
registerSchemaComponent("Button", Button);

const schema = {
  type: "Card",
  children: [{
    type: "Card.Body",
    children: [
      "Pro plan",
      { type: "Button", props: { color: "violet" }, children: ["Subscribe"] },
    ],
  }],
};

<Screen id="pricing" schema={schema} />
```

The schema is intentionally LLM-friendly — arrays of objects, primitives, simple discriminated unions. See [SchemaMode.md](./SchemaMode.md) for the "agent emits a page" pattern.

## See also

- [Stores.md](./Stores.md) — registering Zustand stores with a Screen
- [Registry.md](./Registry.md) — `useScreens()`, the agent-superpower hook
- [SchemaMode.md](./SchemaMode.md) — agent-emitted JSON UI
- [Inertia.md](./Inertia.md) — patterns for Inertia.js apps
- [Migration.md](./Migration.md) — migrating from 0.3.x (Ports → Zustand)
