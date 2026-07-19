# ScreenSwitcher

`ScreenSwitcher` promotes the screen registry into reusable navigation. It
reads `useScreens()` by default and accepts enriched `screens` data when a host
also owns routing, kinds, previews, or close behavior.

```tsx
<ScreenSwitcher
  screens={screens}
  activeId={activeId}
  onSelect={setActiveId}
  onClose={removeScreen}
/>
```

Selection is controlled when `activeId` is provided. Otherwise the component
uses `defaultActiveId`, falls back to the first screen, and repairs its internal
selection when that screen disappears.

## Header

- `showHeader={false}` hides the built-in header.
- `header={<MyHeader />}` replaces it.
- `header={(context) => ...}` receives the screens, active id, select/close
  callbacks, and `defaultHeader`.

## Thumbnails

Set `mode="thumbnails"` and provide `renderThumbnail` or `thumbnail` on each
screen item. The core package renders a dependency-free fallback frame.

For the real react-fancy `FauxClient`:

```tsx
import { FauxClientScreenThumbnail } from
  "@particle-academy/fancy-screens/react-fancy";

<ScreenSwitcher
  mode="thumbnails"
  thumbnailVariant="device"
  thumbnailFrame={FauxClientScreenThumbnail}
/>
```

The adapter is a separate entrypoint so applications without the optional
`@particle-academy/react-fancy` peer can import the core package safely.

## Stable handles

Each interactive item exposes:

- `data-screen-id`
- `data-screen-kind`
- `data-screen-active`
- `data-screen-action="activate" | "close"`
- `data-screen-affordance="kind" | "title"`

Agents should use these stable handles rather than inferred DOM structure.
