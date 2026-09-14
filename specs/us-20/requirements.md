# US-20 — Multi-model preview + per-model clips

Delta for rendering multiple models in the preview with independent owned-clip selection, and shared-clip broadcast playback. Parent contract: [`specs/current/requirements.md`](../current/requirements.md).

**Depends on:** US-19 (nested library + ownership). Do not start until US-19 ships (or both are explicitly kicked off together).

## Story

As an editor user, I can preview two or more models at once, each playing a different owned animation; selecting a shared animation plays that clip on models that lack a same-name owned ready clip, and those models’ own same-name clip otherwise.

## Acceptance

- [ ] Viewport can show more than one loaded model at a time (spaced layout)
- [ ] Each model can have its own selected **owned** clip playing
- [ ] Selecting a **shared** clip clears per-model owned selections; each model plays that shared clip **unless** it already owns a ready clip with the same display name (then it plays the owned one)
- [ ] Selecting an owned clip under a model does not clear other models’ owned selections
- [ ] Loading or selecting a model does **not** auto-select an animation (T-pose until the user picks a clip)
- [ ] Playback / mixer works per model (no single-mixer-only limitation for multi-model)

## Out of scope for this delta

- Nested library / ownership itself (US-19)
- Morphs, curve UI, undo (US-8…US-10)
