# @toastwrite/editor

Modern rewrite of [TOAST UI Editor](https://github.com/nhn/tui.editor) with a clean architecture, Node 22+ support, and a fresh version line starting at **1.0.0-alpha.1**.

## Stack

| Layer | Choice |
| --- | --- |
| Monorepo | pnpm workspaces + Turborepo |
| Language | TypeScript 5 |
| Build | Vite 6 (library + demo) |
| Tests | Vitest 3 |
| Lint | ESLint 9 flat config |
| Node | >= 22 |

## Packages

| Package | Description |
| --- | --- |
| `@toastwrite/editor` | Core editor and viewer |
| `@toastwrite/parser` | CommonMark/GFM markdown parser |

Plugins and framework wrappers will be added after the core stabilizes.

## Architecture

```
Editor (facade)
├── EditorContext (shared state)
│   ├── ContentService → ToastMark
│   ├── PreviewService → Renderer + DOMPurify
│   └── EventBus (typed pub/sub)
├── MarkdownMode
├── PluginManager
└── Layout UI
```

Design patterns used:

- **Facade** — `Editor` / `Viewer` public API
- **Observer** — typed `EventBus`
- **Composition** — services injected via `EditorContext`

## Getting started

```bash
pnpm install
pnpm build
pnpm dev
```

Open http://localhost:5454 for the demo app.

## Scripts

```bash
pnpm build       # build all packages
pnpm test:ci     # run all tests
pnpm lint        # eslint
pnpm typecheck   # tsc --noEmit
```

## Per-package commands

```bash
pnpm --filter @toastwrite/editor test
pnpm --filter @toastwrite/parser test:ci
pnpm --filter @toastwrite/demo dev
```

## Roadmap

1. **Core** — markdown editor, viewer, events, plugins (this repo)
2. **Plugins** — chart, syntax highlight, color, table, uml
3. **Wrappers** — React 19, Vue 3

## License

MIT
