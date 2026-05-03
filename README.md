# @particle-academy/fancy-screens

**Containerized application surface for fancy components.**

A `<Screen>` is a scoped, lifecycle-aware unit — bigger than a tab, smaller than a route. It owns its own state, declares its IO contract through typed **ports**, hibernates when off-screen, and can be composed in opinionated layouts (Stack, Grid, Spotlight). Schema-driven mode lets agents author whole pages as JSON, referencing fancy components by name. A global registry (`useScreens()`) lets agents introspect the running app.

## Status

**v0.1.0 — bootstrap scaffold.** The real runtime ships across the 0.x series. See [the plan](https://github.com/Particle-Academy/fancy-screens) for the layer-by-layer roadmap and the API surface that will land in 1.0.0.

## Why

Tabs and carousels solve presentation, not scope or lifecycle. Routes solve navigation, not parallel composition. There's no IO contract that lets sibling screens share intentional data without leaking the rest of their state. fancy-screens is the missing layer between react-fancy components and a full app.

## Roadmap

| Version | Adds |
|---------|------|
| 0.1.x   | Package bootstrap |
| 0.2.x   | Port store + `<Screen.Port>` |
| 0.3.x   | Visibility + hibernation |
| 0.4.x   | Loading layer + `<Screen.Loading>` (data-aware) |
| 0.5.x   | Layouts (Stack / Grid / Spotlight / Group) |
| 0.6.x   | Schema-driven rendering |
| 0.7.x   | URL sync + sessionStorage persistence |
| 1.0.0   | Full v1 — all of the above stable |

## License

MIT
