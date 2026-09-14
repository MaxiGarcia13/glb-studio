# US-20 tasks

Do not start until US-19 ships (or both are explicitly kicked off). Tick only after acceptance.

## Prep

- [ ] Confirm camera framing for multi-model layout
- [ ] Confirm which models are visible by default (all loaded vs opt-in)

## Implement

- [ ] Selection state: `activeSharedClipId` + `activeClipByModelId`
- [ ] Shared select clears per-model selections; owned select is per-model
- [x] Shared playback: same-name ready owned override per model (`resolveActiveClipIdForModel`)
- [x] Model load / select does not auto-select a clip
- [ ] Viewport renders multiple model scenes (spaced)
- [ ] Mixer / playback per model
- [ ] Library row selection wired to new selection model

## Verify

- [ ] All US-20 acceptance criteria in [`requirements.md`](./requirements.md) pass
