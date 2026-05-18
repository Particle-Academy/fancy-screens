# Schema-driven mode

`<Screen schema={...}>` renders an entire screen from a JSON description. The schema is intentionally LLM-friendly — arrays of objects, primitives, simple discriminated unions — so an agent can emit a full UI and the client renders it without per-page glue.

This is the **Human+ UX** surface where the agent is the page author. We've seen Server-Driven UI fail repeatedly when designers or PMs are the schema authors; with an LLM as the author the cost/benefit flips, because JSON is a great target for code-generation models.

## Schema shape

```ts
type ScreenSchema = {
  type: string;                                 // component name registered via registerSchemaComponent
  props?: Record<string, unknown>;              // spread to the component
  children?: Array<ScreenSchema | string>;      // recurse or render string literals
};
```

That's the whole grammar.

## Register components

```tsx
import { registerSchemaComponent, registerSchemaComponents } from "@particle-academy/fancy-screens";
import { Card, Action, Heading, Text } from "@particle-academy/react-fancy";

registerSchemaComponents({
  "Card": Card,
  "Card.Header": Card.Header,
  "Card.Body": Card.Body,
  "Card.Footer": Card.Footer,
  "Action": Action,
  "Heading": Heading,
  "Text": Text,
});
```

`@particle-academy/fancy-inertia` ships a `registerFancyComponents()` helper that registers everything `react-fancy` exports in one call.

## Render a schema

```tsx
const schema = {
  type: "Card",
  props: { variant: "elevated" },
  children: [{
    type: "Card.Body",
    children: [
      { type: "Heading", props: { level: 3 }, children: ["Pro plan"] },
      { type: "Text", children: ["$29/mo. All features unlocked."] },
      { type: "Action", props: { color: "violet" }, children: ["Subscribe"] },
    ],
  }],
};

<Screen id="pricing" schema={schema} />
```

## Patterns

### Agent emits a page through Inertia

PHP:

```php
public function show(User $user)
{
    $schema = app(AgentPlanner::class)->buildPageFor($user);
    return Inertia::render('AgentScreen', ['schema' => $schema]);
}
```

React:

```tsx
import { InertiaSchemaScreen } from "@particle-academy/fancy-inertia";

export default function AgentScreen() {
  return <InertiaSchemaScreen />;
}
```

The whole flow:

1. User navigates to `/agent/:id`.
2. Laravel asks the agent to build a page schema for that user.
3. The schema lands in Inertia props.
4. `<InertiaSchemaScreen>` reads it, renders via `<Screen schema={...}>`.
5. Any registered component is fair game — including stateful ones, since their state comes from registered Zustand stores like every other screen.

### Agent emits a page client-side

```tsx
const [schema, setSchema] = useState<ScreenSchema | null>(null);

async function ask(prompt: string) {
  const response = await fetch("/api/agent/page", { method: "POST", body: prompt });
  setSchema(await response.json());
}

return schema ? <Screen id="agent" schema={schema} /> : <Loading />;
```

The agent can re-emit the schema on every prompt — `<Screen>` re-renders to match.

## Unknown component handling

If `type` references a name that isn't registered, the screen renders a visible orange error placeholder instead of silently dropping the node. This is deliberate — the agent should see the mistake, not gaslight itself.

## Stability promise

The `ScreenSchema` grammar is stable across the 0.x series. Fields will be **added** (e.g. `if`, `for` constructs when conditional rendering ships) but never removed.

## See also

- [Screen.md](./Screen.md) — `<Screen schema={...}>` reference
- [Inertia.md](./Inertia.md) — agent-emitted pages over Inertia
