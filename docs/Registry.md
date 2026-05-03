# Registry — `useScreens()`

The agent-superpower hook. Returns a live, typed snapshot of every mounted `<Screen>` in the app — its identity, lifecycle, declared ports, and current port values.

This is the single biggest reason to use `<Screen>` over a vanilla div: it makes the app **introspectable**. An agent (or a debug overlay, or a feature flag check) can ask "what's currently visible? what data does that screen consume?" without reading source.

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

The hook can be called from anywhere inside `<Screen.System>` — including from components **outside** any `<Screen>`. That's how a global status bar / debug overlay / agent panel can observe the whole app.

## Return shape

`useScreens()` returns an array of objects with this shape:

```ts
type ScreenInfo = {
  id: string;
  title?: string;
  lifecycle: "mounting" | "loading" | "active" | "suspended" | "hibernated" | "restoring";
  ports: string[];                          // local port names declared by this screen
  portValues: Record<string, unknown>;      // live values, keyed by local port name
  lastActiveAt?: number;                    // wall-clock millis of last activation
};
```

| Field | Why it matters for agents |
|-------|--------------------------|
| `id` | Stable identifier. Use this in cross-screen references (`useScreenPort("id.port")`). |
| `title` | Human label. Show in UIs that list screens. |
| `lifecycle` | What state the screen is in *right now*. Particularly important for hibernation in 0.3.x — agents can decide whether to wake a screen vs. read its snapshot. |
| `ports` | Schema-shape: which inputs/outputs the screen exposes. Lets an agent generate a schema-mode payload without reading source. |
| `portValues` | Live values. Lets an agent know what the user is currently looking at, what filters are applied, what's selected. |

## Reactivity

`useScreens()` re-renders on:

- A screen mounts or unmounts
- A screen's `title` changes
- A port is declared or removed (changes `ports`)
- A port value changes (changes `portValues`)
- (0.3.x) A lifecycle transition

The implementation reads the registry-version counter inside `<Screen.System>` plus subscribes to each port store key — the API stays the same; the runtime just gets fancier.

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

Drop this inside `<Screen.System>` next to your app for an always-on view of every screen's live state.

### Agent introspection prompt

```ts
const screens = useScreens();
const prompt = `
You can drive the following screens:

${screens
  .map(
    (s) =>
      `- ${s.id} (${s.title}): exposes ports [${s.ports.join(", ")}]; ` +
      `currently lifecycle=${s.lifecycle}, values=${JSON.stringify(s.portValues)}`,
  )
  .join("\n")}

To act, write to a port: { screenId: "...", portName: "...", value: ... }
`;
```

The agent gets the running app's full IO surface as a structured JSON document — no source-code reading, no runtime mystery.

### Feature flag

```tsx
function useScreenIsOpen(id: string): boolean {
  return useScreens().some((s) => s.id === id && s.lifecycle === "active");
}
```

Build entitlement / progressive-disclosure logic on top of the registry without prop-drilling.

## Stability promise

The shape of `ScreenInfo` is stable across the 0.x series. Fields will be **added** (e.g. `path` when URL sync ships in 0.7.x; `loading` when the loading layer ships in 0.4.x) but never removed. Code that reads `screens[i].id` today will keep working through 1.0.0.

## See also

- [Screen.md](./Screen.md) — the component that registers itself here
- [Ports.md](./Ports.md) — what `ports` and `portValues` reflect
