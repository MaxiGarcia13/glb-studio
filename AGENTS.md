# AGENTS

Web-based **GLB Studio** (GLB character & animation editor). Agents follow Spec-Driven Development; product behavior lives in `specs/`, not here.

## Stack

- Astro 7 (SSG shell) + React 19 islands + Tailwind 4
- Three.js via **React Three Fiber** + **drei** (`three`, `@react-three/fiber`, `@react-three/drei`)
- TypeScript, ESLint (`@maxigarcia/eslint-config`)

## Spec-driven development

1. **Truth:** [`specs/current/requirements.md`](specs/current/requirements.md) and [`specs/current/design.md`](specs/current/design.md)
2. **Work queue:** [`specs/current/tasks.md`](specs/current/tasks.md), open [`specs/us-<n>/`](specs/), or `specs/tech-debt.md`
3. **History:** [`specs/CHANGELOG.md`](specs/CHANGELOG.md) — one row per shipped US only

**Spec before code** for behavior changes. Update `current/` (and any open delta) first. Tick tasks only after acceptance criteria pass. New deltas are `specs/us-<n>/` only — never new `specs/v*` folders.

See [`.cursor/rules/specs-workflow.md`](.cursor/rules/specs-workflow.md) and [`.cursor/rules/spec-delta-us-ids.md`](.cursor/rules/spec-delta-us-ids.md).

## Module map

Domains under `src/modules/<domain>/`. Pages stay thin. No flat `src/components/` for domain logic. Layer roles: [`.cursor/rules/module-layers.mdc`](.cursor/rules/module-layers.mdc) (see also [ddd-solid](.cursor/rules/ddd-solid.md)). Editor UI tokens: [`.cursor/rules/editor-ui-tokens.mdc`](.cursor/rules/editor-ui-tokens.mdc).

| Domain         | Owns                                                                                  |
| -------------- | ------------------------------------------------------------------------------------- |
| `editor-shell` | Layout, collapsible sidebar, chrome UI state                                          |
| `commands`     | Editor command catalog, hotkey dispatcher, Commands-modal data (cross-cutting keymap) |
| `viewport`     | R3F canvas, camera controls, raycast selection, TransformControls                     |
| `animation`    | Clip library, mixer/playback, trim, time scale, keyframe write                        |
| `export`       | GLTFExporter pack + download                                                          |
| `import`       | FBX convert API + client `ensureGltfFile` service                                     |
| `create`       | Empty model create, part kinds, spawn / duplicate / delete, create toolbar            |

## Hard constraints (3D / animation)

- Inspect GLB (clips, bone names, root motion) before wiring `AnimationMixer`
- Prefer asset/contract fixes over offset or bone hacks
- Avoid parallel render paths (smoke test + FPS + debug body) unless each has a clear lifecycle
- Do not hardcode vendor bone prefixes (e.g. `mixamo.com`) without a registry or documented asset contract

See [`.cursor/rules/plan-before-implementing.mdc`](.cursor/rules/plan-before-implementing.mdc).

## Post-MVP / still excluded

- Post-MVP story **US-8** (morphs) lives under `specs/us-8/` — do not start unless explicitly kicked off
- Still excluded: material/texture editing on **imported** characters, server accounts, collab — see [`specs/current/requirements.md`](specs/current/requirements.md)
