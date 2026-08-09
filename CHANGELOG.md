# Changelog

All notable changes to `@particle-academy/fancy-screens` will be documented in this file.

The format is loosely based on [Keep a Changelog](https://keepachangelog.com/), and this project follows [Semantic Versioning](https://semver.org/) — though the 0.x series is explicit about which layer of the runtime each minor adds.

## [0.7.1] — 2026-08-09

### Added

- **Asserts `fancy-doc-commons`' `CANONICAL_WALKS`** — the shared fixture
  `fancy-cms-ui` asserts too, so both surfaces are checked against the same tree
  rather than each being inspected separately. A fixture only one consumer
  checks proves nothing; the point is that a bridge can hand a document from one
  surface to the other and get the same shape back.

### Changed

- `@particle-academy/fancy-doc-commons` to `>=0.4 <2.0`.

## [0.7.0] — 2026-08-07

### Changed

- **BREAKING — Node 22 is now declared as the floor.** `engines.node` is `>=22`, where this package previously declared **nothing at all**.

  Declaring nothing was not the same as supporting old Node: a consumer on 18 installed cleanly and found out at runtime.

  **What you must do:** on Node 22 or newer, nothing. Note npm only *warns* on an `engines` mismatch while **pnpm fails the install**, so this surfaces differently depending on your package manager. Node 18 is end-of-life and 20 is maintenance-only.

- **BREAKING — React 18 is no longer supported.** `peerDependencies.react` / `react-dom` are now `^19.0.0`.

  **What you must do:** on React 19, nothing. On React 18, stay on the previous release, or upgrade your app to 19 first.

  React 18 support was a claim nothing tested — every build and test in this package ran against 19, so the 18 half of the old range was never executed. An untested compatibility claim is worse than an absent one, because it reads as support.

### Why

These are the kit 0.5 platform floors, applied across every package at once so a consumer never has to resolve a mix. **No API changed, nothing was removed, nothing was renamed** — only what the package requires.

## [0.6.0] — 2026-08-02

The document-substrate half of the screens/CMS reconciliation. Everything here
is **additive** — `schema` behaves exactly as before.

### Added

- **`toDocTree()` / `fromDocTree()`** — lossless conversion between
  `ScreenSchema` and a `fancy-doc-commons` `DocTree`.

  They are one model in two normal forms, not two models: nested JSON is what an
  agent should *emit* (terse, no id bookkeeping, what a model produces
  reliably), and flat-with-ids is what a runtime should *hold* (addressable,
  patchable, mergeable). Round-trip identity is proven over ten fixtures
  covering nesting, sibling order, literal text, text interleaved with elements,
  authored ids, partially-authored ids and depth.

  A literal string child becomes a node of reserved type `#text` rather than a
  prop — a string and an element can be siblings, so folding text into a prop
  loses their relative order.

- **`<Screen doc={…}>`** — render a `DocTree` directly. Takes precedence over
  `schema`; `children` still wins over both. Both props reach the same output,
  which is asserted: `DocNode.type` and `ScreenSchema.type` are the same string
  resolved against the same component registry, so **every `/screens` adapter
  keeps working untouched** — the registry was never the fragmented part, the
  tree around it was.

- **Optional `id` on `ScreenSchema`**, plus `addressableIds()`.

  Supply an `id` for anything an agent should be able to address after render.
  A node without one gets a position-derived id flagged `synthetic`, and
  `addressableIds()` returns **only** the authored ones.

  That distinction is the point rather than a detail: a position-derived id
  silently repoints at a different node when a sibling is inserted above it, so
  handing one to an agent as a durable handle looks more useful and is actively
  wrong. There is a test that demonstrates the repointing, so the reasoning
  survives the next refactor.

  **What you must DO: nothing.** `id` is optional and existing schemas are
  unchanged. But an agent-driven surface should start supplying ids — that is
  what makes a rendered screen drivable, and its absence is why this was a
  standing violation of the component contract's stable-handles requirement.

### Changed

- `@particle-academy/fancy-doc-commons` is now a dependency (`>=0.1 <2.0`). It
  is a pure, dependency-free core — no React, no runtime weight.

## [0.5.0] — 2026-07-18

### Added

- `ScreenSwitcher` with controlled or uncontrolled selection, a replaceable or
  hideable header, stable per-screen action handles, and tab/thumbnail modes.
- Optional `fancy-screens/react-fancy` adapter for real `FauxClient` thumbnails
  while keeping the main entrypoint safe when react-fancy is absent.

## [0.2.1] — 2026-05-03

### Added
- Rich documentation: `docs/Screen.md`, `docs/Ports.md`, `docs/Registry.md`
- Substantial README with quick-start, concepts, and version roadmap
- This CHANGELOG

No code changes.

## [0.2.0] — 2026-05-03

First runtime layer.

### Added
- `<Screen.System>` root provider — owns the global port store + screen registry
- `<Screen>` JSX-mode root — self-registers, provides per-screen context
- `<Screen.Body>` — wraps visible content (will become the hibernation boundary in 0.3.x)
- `<Screen.Port>` — declarative port with optional `defaultValue` + `schema`
- `useScreenPort(name)` — read/write a port; supports cross-screen references via `"screenId.portName"`
- `useScreens()` — agent-introspection hook returning live registry of all mounted screens
- `useScreen()` — current screen's metadata + lifecycle state
- `useScreenSystem()` — lower-level access to the system context (for advanced patterns)
- Duck-typed port validator: built-in `{kind: "string"|"number"|"boolean"|"any"|"array"|"object"}` forms; accepts anything with `.parse(value)` (e.g. Zod)

### Lifecycle
- States defined: `mounting`, `loading`, `active`, `suspended`, `hibernated`, `restoring`
- 0.2.x emits only `mounting → active`; subsequent minors fill in the rest

## [0.1.0] — 2026-05-03

Bootstrap publish — package skeleton + npm trusted-publisher setup. No runtime.
