# Inertia.js integration

`fancy-screens` runs anywhere a React tree runs, including inside Inertia.js pages. There are three integration concerns specific to Inertia, two of which are solved by the [`@particle-academy/fancy-inertia`](https://github.com/Particle-Academy/fancy-inertia) adapter:

1. **`<Screen.System>` belongs at app-shell level** (above the Inertia outlet) — otherwise the registry resets on every navigation.
2. **Schema mode pairs naturally with Inertia props** — a Laravel controller (or agent-emitted JSON) can return an entire screen layout from the server.
3. **State persistence across navigation** is now Zustand's job — use `zustand/middleware`'s `persist` directly.

## App-shell mounting

Wrap your Inertia app entry once with `<FancyAppRoot>`, which mounts `<Screen.System>` along with `Toast.Provider`:

```tsx
import { createInertiaApp } from "@inertiajs/react";
import { FancyAppRoot } from "@particle-academy/fancy-inertia";
import { createRoot } from "react-dom/client";

createInertiaApp({
  resolve: (name) => import(`./Pages/${name}.tsx`),
  setup({ App, props, el }) {
    createRoot(el).render(
      <FancyAppRoot>
        <App {...props} />
      </FancyAppRoot>,
    );
  },
});
```

Pages below `<App />` can render `<Screen>` freely; the system context is already in scope.

## Schema-driven pages from the server

A Laravel controller can ship the entire page layout as JSON:

```php
return Inertia::render('AgentScreen', [
    'schema' => $agent->buildPageFor($user),
]);
```

The React page becomes one line:

```tsx
import { InertiaSchemaScreen } from "@particle-academy/fancy-inertia";

export default function AgentScreen() {
  return <InertiaSchemaScreen />;
}
```

`InertiaSchemaScreen` reads `usePage().props.schema` and renders it through `<Screen schema={...}>`. Components referenced in the schema must be registered first — typically via `registerFancyComponents()` at the app entry.

This is the "agent emits a page" surface — when an LLM is the schema author, the server has the schema in props by the time the page lands. See [Screen.md → schema mode](./Screen.md#schema-driven-mode-agent-emit-json-ui).

## Persisting state across navigation

Inertia's `router.visit()` unmounts the React tree. Zustand stores survive because they're module-scope JavaScript objects — they don't unmount with React.

If you want state to survive a full page refresh too, use Zustand's `persist` middleware:

```tsx
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useUserStore = create(
  persist<UserState>(
    (set) => ({ name: "", setName: (n) => set({ name: n }) }),
    { name: "user-storage" },
  ),
);
```

You no longer need `usePersistFancyState` from `fancy-inertia` — `persist` handles it cleanly per store. `fancy-inertia` ≥ 0.2 has dropped that hook.

## See also

- [Screen.md](./Screen.md) — `<Screen>` reference
- [Stores.md](./Stores.md) — Zustand stores
- [SchemaMode.md](./SchemaMode.md) — agent-emitted JSON UI
