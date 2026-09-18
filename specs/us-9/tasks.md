# US-9 tasks

Do not start until explicitly kicked off. Tick only after acceptance.

## Prep

- [x] Confirm US-4 track insert/update helpers are reusable — see [design.md](./design.md) “Prep — US-4 helper reuse”; extend `keyframe-write.ts`, do not route graph edits through `writeNodeKeyframe`
- [x] Sketch graph vs key-list MVP layout — revised to bottom chrome Timeline \| Tracks; see [design.md](./design.md) “Prep — MVP layout (revised)”

## Implement (domain / Keys MVP — partial)

- [x] Track list for active clip (+ selection filter) — `list-clip-tracks` + `$keyframeTrackFilter` / `$selectedTrackName` (currently Settings; relocate in chrome tasks below)
- [x] Keyframe select / edit time & values — key table + `updateTrackKeyframe` / `updateClipKeyframe`
- [ ] Add / delete keyframes
- [ ] Rebind mixer after edits; show interpolation where applicable

## Implement (bottom chrome — not started)

Do not start until explicitly kicked off.

- [x] Extract reusable playback transport controls (play / pause / stop / loop) for use in both bar modes — `usePlaybackTransport` + `PlaybackControls` `labeled` \| `icon`
- [ ] Bottom bar wrapper + mode select: **Timeline** \| **Tracks** (default Timeline); session UI store
- [ ] Timeline mode: keep existing `TimelineScrubber` under the shared transport row
- [ ] Tracks mode: split pane **bones | tracks** (+ key table for selected track); sync bone pick with `$selection` / track filter
- [ ] Remove Settings → Animation **Keys** collapsible; Settings keeps trim / speed / blend only

## Verify

- [ ] All US-9 acceptance criteria in [`requirements.md`](./requirements.md) pass
