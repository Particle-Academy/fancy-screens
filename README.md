# @particle-academy/fancy-screens

**Containerized application surfaces for fancy components.** A `<Screen>` is a scoped, lifecycle-aware unit — bigger than a tab, smaller than a route. It owns its own state, declares its IO contract through typed **ports**, hibernates when off-view, and composes with siblings into dashboard-grade layouts. Schema-driven mode lets agents author whole pages as JSON. A global registry (`useScreens()`) gives any caller — including agents — structured introspection of the running app.

## Why

Tabs and carousels solve presentation, not scope or lifecycle. Routes solve navigation, not parallel composition. There's no IO contract that lets sibling screens share intentional data without leaking the rest of their state. fancy-screens is the missing layer between react-fancy components and a full app.

## Installation

```bash
npm install @particle-academy/fancy-screens
```

**Peer dependencies (all but react are optional):**
- `react >= 18`, `react-dom >= 18`
- `@particle-academy/react-fancy >= 3` — only if you render react-fancy components inside your screens

## Quick start

```tsx
import { Screen, useScreenPort, useScreens } from "@particle-academy/fancy-screens";

function App() {
  return (
    <Screen.System>
      <Screen id="profile" title="Profile">
        <Screen.Port name="user" defaultValue={{ name: "" }} />
        <Screen.Port name="filter" direction="out" defaultValue="all" />
        <Screen.Body>
          <Form />
        </Screen.Body>
      </Screen>
      <DebugPanel />
    </Screen.System>
  );
}

function Form() {
  const [user, setUser] = useScreenPort<{ name: string }>("user");
  const [filter, setFilter] = useScreenPort<string>("filter");
  return (
    <>
      <input value={user?.name} onChange={(e) => setUser({ name: e.target.value })} />
      <select value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option>all</option><option>active</option><option>archived</option>
      </select>
    </>
  );
}

function DebugPanel() {
  // Lives outside the Screen but still sees the registry
  const screens = useScreens();
  return <pre>{JSON.stringify(screens, null, 2)}</pre>;
}
```

## Concepts

### Scope through ports

State that should be visible across a screen's children — but not leak outward — lives in **ports**. Anything else stays local. Port keys are flat (`screenId.portName`) so a sibling can subscribe to another screen's port without prop-drilling:

```tsx
const [dashFilter] = useScreenPort<string>("dashboard.filter");
```

Ports validate their writes with a duck-typed validator that natively understands a small schema language *and* accepts any object with `.parse(value)` — so Zod schemas drop in without an extra dependency.

### Lifecycle (preview)

A screen transitions through `mounting → loading → active → suspended → hibernated → restoring → active`. Today (0.2.x) only `mounting → active` is implemented; subsequent minors fill in the rest:

| Version | Adds |
|---------|------|
| **0.2.x** | Port store + `<Screen>` JSX root + `<Screen.Port>` + `useScreenPort` + `useScreens` registry |
| 0.3.x | Visibility detection + hibernation (unmount + snapshot + rehydrate) |
| 0.4.x | Data-aware loading state + `<Screen.Loading>` + skeleton transitions |
| 0.5.x | Layouts: `Screen.Group`, `Screen.Stack`, `Screen.Grid`, `Screen.Spotlight` |
| 0.6.x | Schema-driven rendering + component registry + `@portName.path` reference resolver |
| 0.7.x | URL sync + sessionStorage persistence + cmd+1..9 keyboard cycling |
| 1.0.0 | Full v1 — all of the above stable |

### The agent superpower

`useScreens()` returns a typed, live snapshot of every mounted screen — its id, title, lifecycle, declared port names, and current port values. Call it from anywhere inside `<Screen.System>` and you have a structured introspection of the running app. An agent can:

- Generate a schema-mode payload (in 0.6.x) without reading source
- Decide whether to wake a hibernated screen vs. read its last-known snapshot
- Build status bars, debug overlays, and feature-flag checks against the live registry

## Documentation

| Topic | Description |
|-------|-------------|
| [Screen](docs/Screen.md) | Root component, lifecycle states, patterns for multi-screen apps |
| [Ports](docs/Ports.md) | Declarative IO contract, validators, cross-screen reads |
| [Registry](docs/Registry.md) | `useScreens()` and the introspection contract |
| [Publishing](docs/PUBLISHING.md) | Release process — OIDC trusted publisher |

## Status

**v0.2.x — port store + Screen root + registry.** Production-usable for ports + introspection patterns. Hold off on heavy reliance on lifecycle until 0.3.x lands hibernation. The API surface for `<Screen>`, `<Screen.Port>`, `useScreenPort`, and `useScreens` is stable across the 0.x series.

## License

MIT
