# Contributing to GLB Studio

Thanks for helping improve **GLB Studio** (repo: `three-editor`). This guide covers how to report issues, propose changes, and find your way around the repo. For deeper architecture and agent rules, see [`AGENTS.md`](AGENTS.md).

## Ways to contribute

- **Bug reports** — use the [bug report](https://github.com/MaxiGarcia13/three-editor/issues/new?template=bug_report.md) template. Include OS, browser, steps to reproduce, and what you expected.
- **Feature ideas** — use the [feature request](https://github.com/MaxiGarcia13/three-editor/issues/new?template=feature_request.md) template. Describe the user outcome, not just an implementation idea.
- **Pull requests** — fork the repo, open a PR against `main`, and keep the change focused. CI runs build and lint on every PR.

Please open an issue before large features so we can align on scope.

## Development setup

**Requirements:** Node.js 24+ (see [`.nvmrc`](.nvmrc)).

```bash
git clone https://github.com/MaxiGarcia13/three-editor.git
cd three-editor
npm install
npm run dev
```

Useful scripts:

| Script               | Purpose                           |
| -------------------- | --------------------------------- |
| `npm run dev`        | Start the Astro dev server        |
| `npm run build`      | Production build (also run by CI) |
| `npm run lint`       | ESLint                            |
| `npm run lint:fix`   | ESLint with autofix               |
| `npm test`           | Vitest unit tests                 |
| `npm run test:watch` | Vitest watch mode                 |

Before opening a PR, run `npm run lint`, `npm test`, and `npm run build` locally when you can.

## Repository structure

```
src/
  pages/           # Thin Astro pages — wire islands, avoid domain logic
  modules/         # Product domains (see table below)
specs/             # Spec-driven product truth and work queue
  current/         # Living requirements, design, and tasks
  us-<n>/          # Open user-story deltas
  CHANGELOG.md     # Shipped user stories only
.github/           # CI, issue templates, workflows
```

### Modules (`src/modules/<domain>/`)

Pages stay thin. Domain logic lives under modules — not a flat `src/components/` tree.

| Domain         | Owns                                                            |
| -------------- | --------------------------------------------------------------- |
| `editor-shell` | Layout, collapsible sidebar, chrome UI state                    |
| `commands`     | Command catalog, hotkeys, Commands modal                        |
| `viewport`     | R3F canvas, camera, raycast selection, TransformControls        |
| `animation`    | Clip library, mixer / playback, trim, time scale, keyframes     |
| `export`       | GLTFExporter pack + download                                    |
| `import`       | FBX convert API + client GLTF ensure service                    |
| `create`       | Empty models, parts, spawn / duplicate / delete, create toolbar |

Inside a module you may see layers such as `domain/`, `adapters/`, `services/`, `stores/`, `actions/`, `hooks/`, and `components/` — use only what you need. Prefer putting product rules in `domain/` and UI wiring in hooks / components.

## Specs before behavior changes

Product behavior is defined in **`specs/`**, not invented in PRs:

1. Read [`specs/current/requirements.md`](specs/current/requirements.md) and [`specs/current/design.md`](specs/current/design.md).
2. Check the work queue in [`specs/current/tasks.md`](specs/current/tasks.md), open `specs/us-<n>/` folders, or [`specs/tech-debt.md`](specs/tech-debt.md).
3. For behavior changes, update the relevant spec (and any open US delta) **before** or **with** the code.
4. Tick acceptance criteria only after they actually pass.

`AGENTS.md` has the full workflow; this file stays light on purpose.

## Pull request checklist

- [ ] Change is scoped — one concern when possible
- [ ] Specs updated if user-visible behavior changed
- [ ] `npm run lint` and `npm test` pass
- [ ] `npm run build` succeeds
- [ ] PR description explains **why**, not only what

## Code of conduct (short)

Be respectful in issues and reviews. Assume good intent. Critique ideas and code, not people.

## License

By contributing, you agree that your contributions are licensed under the [Apache License 2.0](LICENSE).
