# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Flow Browser is an Electron-based web browser built with React 19, TypeScript, Vite, and TailwindCSS 4. It uses an embedded SQLite database (via `better-sqlite3` / Drizzle ORM) and has no external backend services.

### Prerequisites

- **Node.js v22+** (see `.nvmrc`)
- **Bun v1.2.0+** (package manager; lockfile is `bun.lock`)
- **build-essential** and **python3** (for native module compilation via node-gyp)

### Key commands

Standard dev commands are in `package.json`. Quick reference:

| Task | Command |
|---|---|
| Install deps | `bun install` |
| Lint | `bun lint` |
| Typecheck | `bun typecheck` |
| Dev mode | `bun dev` |
| Dev with watch | `bun dev:watch` |
| Format | `bun format` |

### Running the Electron app in headless / cloud environments

- The VM already has a display at `DISPLAY=:1`. Run `bun dev` directly; no `xvfb-run` wrapper is needed.
- GLib-GObject and D-Bus warnings in the Electron stderr output are harmless on headless Linux and can be ignored.
- On first launch, Flow Browser shows an onboarding wizard that must be completed before the main browser window appears.
- The `postinstall` script (`electron-builder install-app-deps`) rebuilds native modules automatically during `bun install`.

### Gotchas

- The `electron` dependency is installed from a Castlabs fork (`@castlabs/electron-releases`) for Widevine DRM support. This is normal and expected.
- There are no automated test suites (no `test` script in `package.json`). Validation is done via `bun lint` and `bun typecheck`.
- Animation imports use `motion/react` (not `framer-motion`).
