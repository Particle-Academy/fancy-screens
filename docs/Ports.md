# Ports

A **port** is a declared input or output channel on a `<Screen>`. Ports are the only sanctioned way for data to cross the screen boundary — internal `useState` stays internal, but anything declared as a port is visible (and writable) by every component inside the same screen, by sibling screens via cross-screen references, and by the agent-introspectable [registry](./Registry.md).

## Import

```tsx
import { Screen, useScreenPort } from "@particle-academy/fancy-screens";
import type { PortSchema } from "@particle-academy/fancy-screens";
```

## Declaration

Render `<Screen.Port>` as a sibling of `<Screen.Body>` inside a `<Screen>`. It produces no DOM — it just registers the port with the global store on mount and tears it down on unmount.

```tsx
<Screen id="dashboard">
  <Screen.Port
    name="user"
    direction="in"
    defaultValue={{ name: "Anon", email: "" }}
    schema={{ kind: "object", shape: { name: "string", email: "string" } }}
  />
  <Screen.Port name="filter" direction="out" defaultValue="all" />
  <Screen.Body>…</Screen.Body>
</Screen>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | — | Local name. Stored as `${screenId}.${name}` in the global key space. |
| `direction` | `"in" \| "out" \| "inout"` | `"inout"` | Documentation only today; the registry surfaces it so agents know which way data flows. |
| `schema` | `PortSchema` | — | Optional validator. Built-in forms or any object with `.parse(value)` (e.g. Zod). |
| `defaultValue` | `T` | `undefined` | Initial value seeded into the store the first time the port is declared. |

## Reading and writing

Inside any component nested under a `<Screen>`:

```tsx
const [user, setUser, meta] = useScreenPort<UserType>("user");

// user      — current value (or undefined if never set)
// setUser   — write a new value (validated against the schema)
// meta.loading  — true if a port owner has marked the value pending
// meta.error    — Error object if last write failed validation
// meta.key      — the absolute store key (`screenId.name`)
```

`useScreenPort()` subscribes to the store; the component re-renders whenever the value (or `loading` / `error`) changes.

## Cross-screen reads

A port name with a dot is treated as an absolute reference, no matter which screen the consumer is in:

```tsx
function ReportsScreen() {
  // Read another screen's port directly
  const [filter] = useScreenPort<string>("dashboard.filter");
  return <Reports filter={filter} />;
}
```

This is what makes dashboards composable: one screen sets a filter, all the others react. There's no parent-child wiring required.

## Validation

`PortSchema` is **duck-typed**. The validator accepts:

- **Built-in forms**, no dependency required:

  ```ts
  { kind: "string", min?, max? }
  { kind: "number", min?, max? }
  { kind: "boolean" }
  { kind: "any" }
  { kind: "array", of: PortSchema }
  { kind: "object", shape: Record<string, PortSchema | "string" | "number" | "boolean" | "any"> }
  ```

- **Anything with a `.parse(value)` method** — Zod, custom validators, your own classes. The validator just calls `.parse(value)` and lets it throw.

Failed validation **does not throw to the caller**. It stores the `Error` on the port's `state.error` and bumps the version. Consumers that care can read `meta.error` from `useScreenPort()` and surface it. This keeps live UIs from crashing on bad agent-generated payloads.

```tsx
import { z } from "zod";

const UserSchema = z.object({ name: z.string().min(1), email: z.string().email() });

<Screen.Port name="user" direction="in" schema={UserSchema} />
```

## Lifecycle of a port

```
declare ── set/setLoading ── set/setLoading ── … ── unmount → remove
   │           │                                        │
   └─ subscribers attach via useScreenPort ─────────────┘
```

Ports live as long as their declaring `<Screen.Port>` is mounted. When the Screen unmounts (or `<Screen.Port>` is conditionally rendered away), the port is removed from the store and any subscribers see `undefined` next render.

In 0.3.x, the store will *survive* hibernation: a Screen may unmount its UI while keeping its port snapshot in the store, so cross-screen reads against a hibernated screen still resolve to the last known value.

## Idempotent re-declaration

Calling `<Screen.Port name="x" />` twice with the same `name` in the same Screen is safe. The second declaration:

- Updates `schema` and `direction`
- Updates `defaultValue` only if the port has never been written to
- Preserves the current value and version

This means changing a port's schema in source code doesn't blow away in-flight state on hot reload.

## Loading flag (preview)

Today `setPortLoading` exists internally but isn't surfaced; v0.4.x adds the public API:

```tsx
const { setPortLoading } = useScreenLoading();
setPortLoading("user", true);   // user is refetching
const data = await fetch(...);
setUser(await data.json());     // setting a value clears loading automatically
```

A screen with any `loading === true` port enters the `"loading"` lifecycle state in 0.4.x and renders its `<Screen.Loading>` sub-component (or a layout-aware default skeleton).

## See also

- [Screen.md](./Screen.md) — the root component and lifecycle
- [Registry.md](./Registry.md) — how ports show up in `useScreens()`
