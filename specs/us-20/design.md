# US-20 design

## Scope

Multi-model simultaneous preview and per-model vs shared clip selection. Builds on US-19 ownership.

## Selection model

Replace single `activeClipId` with:

- `activeSharedClipId: string | null` — when set, shared selection is active; clear `activeClipByModelId`
- `activeClipByModelId: Record<string, string | null>` — per-model owned clip when no shared clip is active

Rules:

- Select owned clip under model M → set `activeClipByModelId[M]`; leave other models’ selections; clear `activeSharedClipId`
- Select shared clip → set `activeSharedClipId`, clear all `activeClipByModelId`
- Playback resolve per model: explicit owned selection, else same-name ready owned override of the shared clip, else the shared clip
- Loading / selecting a model does not auto-select a clip

## Viewport / mixer

- Render all (or multi-selected) model scenes, spaced in world space
- One `AnimationMixer` per model (or one driver iterating models)
- Framing / camera: fit bounds of visible models (or keep framing the “primary” model — decide at implement time)

## Non-goals

Library nesting and ownership (US-19). Retarget partial-success rules stay in US-19.
