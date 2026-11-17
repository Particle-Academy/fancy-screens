# Contributing to @particle-academy/fancy-screens

Notes for anyone, human or agent, working ON this package's code. How to USE the
package is in [AGENTS.md](./AGENTS.md); what it is, is in [README.md](./README.md).
`CLAUDE.md` is a symlink to this file, so Claude Code reads these notes when it
works in this repo.

## Commands

```bash
npm run build   # tsup -> dist/ (main entry + the /react-fancy adapter)
npm run dev     # tsup --watch
npm run lint    # tsc --noEmit && eslint .
npm test        # builds, then node --test tests/*.test.mjs
```

## Tests

Tests live in `tests/` (`ScreenSwitcher.test.mjs`, `doc.test.mjs`,
`substrate-conformance.test.mjs`) and run against the built `dist/`, which is
why `npm test` builds first.

## Layout

- The main entry (`src/index.ts`) must never import the optional
  `@particle-academy/react-fancy` peer; react-fancy-specific code lives in
  `src/react-fancy.tsx`, published as the `/react-fancy` subpath.
- Release notes for maintainers are in `docs/PUBLISHING.md`.

## Changelog

Update `CHANGELOG.md` in the same commit as the change.
