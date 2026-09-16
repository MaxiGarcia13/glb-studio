# Specs changelog

## How it works

- **Open** — planned or in-progress user stories (US-N)
- **Shipped** — one row per completed US after acceptance; fold delta into `current/`, then delete `specs/us-<n>/`
- Do **not** add a row per task — only when a US ships
- Do **not** create `specs/v*` folders; use `specs/us-<n>/` only

## Open

| ID | Summary |
|----|---------|
| **US-28** | Part color maps (textures) on created models only |
| **US-27** | Additional create kits via registry (building, robot, …) |
| **US-26** | Part hierarchy + outliner for created models |
| **US-8** | Morph-target editing (post-MVP) |
| **US-9** | Graph / curve keyframe UI (post-MVP) |
| **US-10** | Full undo / redo stack (post-MVP) |

## Shipped

| ID | Summary |
|----|---------|
| **US-25** | Grid / rotation snap for created-model edits |
| **US-30** | EditorToolbar (Blender-style File / Settings menu bar) |
| **US-29** | Rename selected bone / mesh from Settings (owned clip + bind-pose remap) |
| **US-24** | Primitive palette + add part on created models |
| **US-23** | Create empty model (no kit modal) + part edit/export |
| **US-22** | Export modal + merge visible models into one mesh GLB |
| **US-21** | Whole-model rotate / scale in Move + Settings root rotation XYZ |
| **US-20** | Multi-model preview + per-model / shared clip selection |
| **US-19** | Nested library + clip ownership (model-owned vs shared; iconized sidebar) |
| **US-18** | Retarget hips bind-frame — drop non-hips positions + delta-from-bind rebase |
| **US-17** | Retarget position scale — rest-pose length ratio on remapped tracks |
| **US-16** | FBX import via convert API (Vercel Node + `fbx2gltf`) |
| **US-7** | Multi-clip blending — draft clips, weighted viewport blend, Bake into active clip |
| **US-15** | Edit / Move tools — bind-pose save + whole-model translate + T-pose |
| **US-14** | Viewport general settings — show/hide axes + length (metres) |
| **US-6** | Cross-rig retargeting (explicit bone map + vendor registry) |
| **US-12** | Rename model and animation library entries |
| **US-13** | Selection name overlay in preview (bone / mesh) |
| **US-5** | Zip download: per-model GLBs + animation-only files |
| **US-4** | Keyframe capture via TransformControls |
| **US-3** | Clip trim & mixer time scale |
| **US-11** | Model library — many characters, one previewed |
| **US-2** | Animation library import & playback UI |
| **US-1** | Model load & full-screen R3F viewport |
