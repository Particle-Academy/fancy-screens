# Changelog

All notable changes to `@particle-academy/fancy-screens` will be documented in this file.

The format is loosely based on [Keep a Changelog](https://keepachangelog.com/), and this project follows [Semantic Versioning](https://semver.org/) — though the 0.x series is explicit about which layer of the runtime each minor adds.

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
