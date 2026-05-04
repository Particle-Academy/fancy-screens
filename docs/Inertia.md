# Inertia.js integration

fancy-screens is designed to run anywhere a React tree runs, including inside Inertia.js pages. There are three integration concerns specific to Inertia, all solved by the [`@particle-academy/fancy-inertia`](https://github.com/Particle-Academy/fancy-inertia) adapter:

1. **`<Screen.System>` belongs at app-shell level** (above the Inertia outlet) — otherwise the registry resets on every navigation.
2. **Inertia navigation unmounts the React tree** — the port store + registry vanish unless persisted.
3. **Schema mode pairs naturally with Inertia props** — a Laravel controller can emit an entire screen layout as JSON.

This page shows the patterns. For full reference of the adapter exports, see [fancy-inertia USAGE.md](https://github.com/Particle-Academy/fancy-inertia/blob/main/docs/USAGE.md).

## App-shell mounting

Wrap your Inertia app entry once with `<FancyAppRoot>`, which mounts `<Screen.System>` (along with `Toast.Provider` and echarts module registration):

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
      </FancyAppRoot>
    );
  },
});
```

Pages below `<App />` can render `<Screen>` freely; the system context is already in scope.

## Persisting state across navigation

Without help, Inertia's `router.visit()` unmounts the entire page tree, dropping the port store. Mount `usePersistFancyState()` at app-shell level — it serializes the port store to sessionStorage on `router.on('before')` and rehydrates after the new page mounts:

```tsx
import { FancyAppRoot, usePersistFancyState } from "@particle-academy/fancy-inertia";

function ShellInner({ children }: { children: React.ReactNode }) {
  usePersistFancyState();           // session-scoped persistence
  // usePersistFancyState({ storage: "local" });  // survives tab close
  return <>{children}</>;
}

createInertiaApp({
  setup({ App, props, el }) {
    createRoot(el).render(
      <FancyAppRoot>
        <ShellInner>
          <App {...props} />
        </ShellInner>
      </FancyAppRoot>
    );
  },
});
```

After this, port state survives navigation. A `<Screen id="filters">` on `/admin/users` and the same `<Screen id="filters">` on `/admin/reports` share their port values automatically — no Redux, no URL params.

## Schema-driven Inertia pages

The most powerful integration. A controller emits a fancy-screens schema as an Inertia prop; the React page is one line.

```php
// Laravel controller
class DashboardController
{
    public function __invoke(Request $request, AgentService $agent)
    {
        return Inertia::render('AgentDashboard', [
            'schema' => $agent->dashboardFor($request->user()),
        ]);
    }
}
```

```tsx
// React page
import { InertiaSchemaScreen } from "@particle-academy/fancy-inertia";
export default function AgentDashboard() {
  return <InertiaSchemaScreen />;
}
```

For the components in the schema to resolve by name, register them once at app boot:

```tsx
import { registerFancyComponents } from "@particle-academy/fancy-inertia";
import { Screen } from "@particle-academy/fancy-screens";

const registry = await registerFancyComponents({
  withECharts: true,
  withScreens: true,
  extra: { MyChart, MyOnboardingCard },
});
Screen.registerComponents?.(registry);
```

The default whitelist covers Card, Action, Badge, Heading, Text, Input, Select, Modal, Callout, Tabs, Accordion, Avatar, Profile, Timeline, Tooltip, Popover (+ EChart/diagrams with `withECharts: true`).

### Live updates without remount

Use Inertia's [partial reload](https://inertiajs.com/partial-reloads) to swap just the schema prop:

```tsx
import { router } from "@inertiajs/react";
router.reload({ only: ["schema"] });
```

The new schema diffs into the existing render — port state survives because the `<Screen>` reuses its own port store.

## SSR

`<Screen.System>` and `<Screen>` are SSR-safe (the React tree renders; `IntersectionObserver` only attaches post-hydration). `<Screen.Body>` and `<Screen.Port>` are pure declarative.

Schema-driven pages render the layout server-side too — the schema → JSX pipeline is synchronous, so the SSR HTML contains the full rendered tree.

See the [fancy-inertia SSR matrix](https://github.com/Particle-Academy/fancy-inertia/blob/main/docs/SSR.md#particle-academyfancy-screens) for the per-component breakdown.

## Cross-screen state across pages

A common multi-page Inertia admin pattern. `Pages/Admin/Users.tsx` and `Pages/Admin/Reports.tsx` are separate Inertia pages, but both declare a `<Screen id="filters">` with a `dateRange` port. With `usePersistFancyState()`, the date range a user picks on Users carries straight to Reports — no global state library, no URL params, no parent prop drilling.

See [fancy-inertia/docs/Recipes.md → Cross-screen state on a multi-Inertia-page admin](https://github.com/Particle-Academy/fancy-inertia/blob/main/docs/Recipes.md#cross-screen-state-on-a-multi-inertia-page-admin) for the full code.
