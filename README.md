# three-editor

**A browser-native GLB character & animation editor** — load or build characters, shape their motion, and ship clean GLBs without leaving the tab.

Import skinned models, create primitive kits from scratch, manage shared and model-owned clips, trim and retime animations, hold poses into keyframes, then export a zip of models and animation-only files — all client-side on Three.js.

> Screenshots and a live demo are coming soon.

## Why three-editor?

Most character pipelines bounce between DCC tools, converters, and one-off scripts. **three-editor** keeps the loop in one place:

- **See it immediately** — full-screen 3D viewport with orbit, pan, and zoom
- **Work like an editor** — Blender-style File / Settings chrome, collapsible sidebar, command palette and hotkeys
- **Own the clip library** — nested model-owned and shared animations, playback, trim, speed, bind pose, and keyframe hold
- **Create as well as import** — empty models, primitive parts, hierarchy / outliner, groups
- **Export what you need** — zip of per-model GLBs plus animation-only files, packed in the browser

Built for game and interactive creators who already live in GLB / glTF and want a fast, focused animation pass.

## Features

- Load one or more `.glb` / `.gltf` models (skinned mesh + skeleton)
- Import FBX via conversion and bring clips into a shared library
- Create empty models and stamp / parent / group primitive parts
- Play, pause, stop, loop, scrub — mixer-tied timeline
- Trim clips, change time scale, hold pose to end of clip
- Multi-model preview, model groups, and session undo / redo for edits
- Client-side zip export (models + shared animation-only GLBs)

## Stack

| Layer | Tech                                                                                                                                      |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Shell | [Astro](https://astro.build/) 7 (SSG)                                                                                                     |
| UI    | React 19 islands, Tailwind 4                                                                                                              |
| 3D    | [Three.js](https://threejs.org/) via [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) + [drei](https://github.com/pmndrs/drei) |
| State | [nanostores](https://github.com/nanostores/nanostores)                                                                                    |

## Quick start

**Requirements:** Node.js 24+ (see [`.nvmrc`](.nvmrc)).

```bash
git clone https://github.com/MaxiGarcia13/three-editor.git
cd three-editor
npm install
npm run dev
```

Open the URL printed by Astro (usually `http://localhost:4321`).

| Script            | What it does                 |
| ----------------- | ---------------------------- |
| `npm run dev`     | Local development server     |
| `npm run build`   | Production build             |
| `npm run preview` | Preview the production build |
| `npm run lint`    | ESLint                       |
| `npm test`        | Unit tests (Vitest)          |

## Contributing

Issues, forks, and PRs are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, repo layout, and how we work. Deeper agent / architecture notes live in [`AGENTS.md`](AGENTS.md); product behavior is specified under [`specs/`](specs/).

## License

[Apache License 2.0](LICENSE)
