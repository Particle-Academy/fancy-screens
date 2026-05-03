# Screen

A **containerized application surface**. A `<Screen>` is bigger than a tab and smaller than a route — it owns its own state via typed [ports](./Ports.md), declares its identity to a global [registry](./Registry.md), and (in later 0.x releases) hibernates when off-view, syncs to the URL, and renders from a JSON schema.

## Import

```tsx
import { Screen, useScreen } from "@particle-academy/fancy-screens";
```

## Quick start

Wrap your app in `<Screen.System>` once at the root, then drop one or more `<Screen>` components anywhere underneath:

```tsx
import { Screen, useScreenPort } from "@particle-academy/fancy-screens";

function App() {
  return (
    <Screen.System>
      <Screen id="profile" title="Profile">
        <Screen.Port name="user" defaultValue={{ name: "" }} />
        <Screen.Body>
          <Form />
        </Screen.Body>
      </Screen>
    </Screen.System>
  );
}

function Form() {
  const [user, setUser] = useScreenPort<{ name: string }>("user");
  return <input value={user?.name} onChange={(e) => setUser({ name: e.target.value })} />;
}
```

## Components

### `<Screen.System>` (root provider)

Wrap your app once. Owns the global port store and the screen registry. Without it, every Screen + hook will throw.

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Anything. |

### `<Screen>` (root)

Declares a containerized surface. Self-registers with the system on mount, unregisters on unmount.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `id` | `string` | yes | Globally unique. Doubles as the prefix for this screen's port keys (`${id}.${portName}`). |
| `title` | `string` | no | Human label surfaced via `useScreens()`. |
| `children` | `ReactNode` | no | Typically a mix of `<Screen.Port>` (declarations) and one `<Screen.Body>` (visible content). |
| `className` | `string` | no | Forwarded to the wrapping `<div>`. |

### `<Screen.Body>`

Wraps the visible content. In 0.2.x this is mostly a marker; in 0.3.x it becomes the boundary that gets unmounted on hibernation. Use it now so future minors don't require migration.

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | The screen's renderable content. |
| `className` | `string` | Forwarded to the wrapping `<div>`. |

### `<Screen.Port>`

Declarative port. Renders nothing — its only job is to declare a port to the store on mount and tear it down on unmount. See [Ports.md](./Ports.md) for the full contract.

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
| `lifecycle` | `"mounting" \| "loading" \| "active" \| "suspended" \| "hibernated" \| "restoring"` | Current state. 0.2.x always reports `"active"`; later minors fill in the rest. |

## Lifecycle (preview)

The full lifecycle ships across 0.x releases. Today (0.2.x) the state machine is stubbed at `"active"`:

| State | Lands in | Means |
|-------|----------|-------|
| `mounting` | 0.3.x | First render; ports declared, store initialized. |
| `loading`  | 0.4.x | At least one port has `loading: true`. |
| `active`   | 0.2.x | Visible + ports resolved + receiving events. |
| `suspended`| 0.3.x | Off-view but in DOM (200 ms grace before hibernation). |
| `hibernated`| 0.3.x | Past `hibernateAfter` (default 30 s); unmounted, snapshot kept. |
| `restoring`| 0.3.x | Re-rendering from JSX/schema; replaying the snapshot. |

## Patterns

**Multiple screens on one page** — drop them anywhere. Each gets its own scope:

```tsx
<Screen.System>
  <header>…</header>
  <Screen id="left">  <Screen.Body>…</Screen.Body> </Screen>
  <Screen id="right"> <Screen.Body>…</Screen.Body> </Screen>
</Screen.System>
```

**Cross-screen reads** — port keys are flat (`screenId.portName`), so a hook can subscribe to a sibling's port directly. Useful for dashboards where one screen filters and others react:

```tsx
function ReportsScreen() {
  const [filter] = useScreenPort<string>("dashboard.filter");
  return <Reports filter={filter} />;
}
```

**Agent introspection** — call `useScreens()` from any component (even one outside any screen) to get a typed snapshot of the running app. See [Registry.md](./Registry.md).

## See also

- [Ports.md](./Ports.md) — declarative IO contract; how data crosses the boundary
- [Registry.md](./Registry.md) — `useScreens()`, the agent-superpower hook
- [PUBLISHING.md](./PUBLISHING.md) — release process for this package
