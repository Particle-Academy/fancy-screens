# Registry — `useScreens()`

The agent-superpower hook. Returns a live, typed snapshot of every mounted `<Screen>` in the app — its identity, lifecycle, registered Zustand stores, and the current state of each.

This is the single biggest reason to use `<Screen>` over a vanilla `<div>`: it makes the app **introspectable**. An agent (or a debug overlay, or a feature flag check) can ask "what's currently visible? what state does that screen hold?" without reading source.

## Import

```tsx
import { useScreens } from "@particle-academy/fancy-screens";
```

## Usage

```tsx
function StatusBar() {
  const screens = useScreens();
  return (
    <div>
      {screens.length} screens active: {screens.map((s) => s.title).join(", ")}
    </div>
  );
}
```

The hook can be called from anywhere inside `<Screen.System>` — including from components **outside** any `<Screen>`. That's how a global status bar / debug overlay / agent panel observes the whole app.

## Return shape

```ts
type ScreenInfo = {
  id: string;
  title?: string;
  lifecycle: "mounting" | "loading" | "active" | "suspended" | "hibernated" | "restoring";
  storeKeys: string[];                       // names of Zustand stores registered to this screen
  storeValues: Record<string, unknown>;      // snapshot of each store's state at call time
  lastActiveAt?: number;                     // wall-clock millis of last activation
  agentActivity?: AgentScreenActivity | null;
};
```

| Field | Why it matters for agents |
|-------|--------------------------|
| `id` | Stable identifier for cross-screen references. |
| `title` | Human label. Show in UIs that list screens. |
| `lifecycle` | What state the screen is in *right now*. |
| `storeKeys` | Names of Zustand stores attached via `useRegisterStore`. |
| `storeValues` | Current state for each store at the moment `useScreens()` was called. |
| `agentActivity` | Most recent agent action targeting this screen (presence layer writes here). |

## Reactivity

`useScreens()` re-renders on:

- A screen mounts or unmounts
- A screen's `title` changes
- A store is registered or unregistered (changes `storeKeys`)

It does **not** re-render on every Zustand `setState` — that would cascade into every consumer of `useScreens()` on high-frequency state changes. The `storeValues` you read are a snapshot at call time. If you need a re-render when a specific store mutates, subscribe to that store directly with its hook.

## Patterns

### Debug overlay

```tsx
function ScreensDevtool() {
  const screens = useScreens();
  return (
    <pre className="fixed bottom-2 right-2 max-w-md text-xs">
      {JSON.stringify(screens, null, 2)}
    </pre>
  );
}
```

### Agent introspection prompt

```ts
const screens = useScreens();
const prompt = `
You can drive the following screens:

${screens
  .map(
    (s) =>
      `- ${s.id} (${s.title}): stores [${s.storeKeys.join(", ")}]; ` +
      `lifecycle=${s.lifecycle}; ` +
      `state=${JSON.stringify(s.storeValues)}`,
  )
  .join("\n")}
`;
```

The agent gets the running app's full state surface as a structured JSON document — no source-code reading, no DOM scraping.

### Feature flag

```tsx
function useScreenIsOpen(id: string): boolean {
  return useScreens().some((s) => s.id === id && s.lifecycle === "active");
}
```

## Stability promise

The shape of `ScreenInfo` is stable across the 0.x series. Fields will be **added** (e.g. `path` when URL sync ships; `loading` when the loading layer ships) but never removed. Code that reads `screens[i].id` today will keep working through 1.0.0.

The 0.3 → 0.4 rename of `ports` / `portValues` → `storeKeys` / `storeValues` is the one breaking change in this surface — covered in [Migration.md](./Migration.md).

## See also

- [Screen.md](./Screen.md) — the component that registers itself here
- [Stores.md](./Stores.md) — what `storeKeys` and `storeValues` reflect
- [Migration.md](./Migration.md) — 0.3 → 0.4 migration
