# US-9 design

## Scope

Graph or key-list editor for existing clip tracks; complements TransformControls pose capture (US-4).

## Approach

- Read track times/values from the active working clip
- Present a curve graph and/or spreadsheet-style key list
- Mutations go through the same insert/update/delete helpers used by US-4 (single write path)
- Selection sync: viewport bone selection filters visible tracks when possible
- Keep canvas playback on refs; graph UI promotes discrete edits to React state

## Prep — US-4 helper reuse (confirmed)

**Verdict:** keep a **single write path** under `animation/domain/keyframe-write.ts`, but US-9 cannot call `writeNodeKeyframe` for graph edits. That API is hold-plateau TRS capture (playhead → clip end). Curve UI needs finer key CRUD on one track.

### Reusable today

| Piece | Where | Reuse for US-9 |
| ----- | ----- | -------------- |
| Find/create by node + suffix (`splitTrackName`) | `clip-validate` + `writeHoldTrackData` | Track identity / filter by selected bone |
| In-place times/values rewrite on a **cloned** clip | `writeHoldWindow` | Same array pattern for upsert / delete |
| Single-key upsert when `start === end` | `writeHoldWindow` | Seed for “set sample at time” |
| Store publish + mixer rebind | `saveKeyframe` → `$clips` → `useClipMixerAction` | Mirror for graph commits (no `resumeMixerBindings` race) |

Public export today: **`writeNodeKeyframe` only**. Hold helpers are private.

### Gaps (add in `keyframe-write`, do not fork)

- Delete key at index / time
- Move key time (and keep values)
- Upsert / edit sample on one track without hold-to-end or full TRS
- Read helpers: list tracks + keys for the active clip (UI layer)
- Interpolation: show `KeyframeTrack` default interpolant; change only where Three allows (no Bezier beyond track type)
- Morph / other suffixes: `splitTrackName` knows `.morphTargetInfluences`; pose write does not — graph should list any track, mutate generically by `valueSize`

### Contract for implement tasks

1. Extend `keyframe-write.ts` with pure clip→clip helpers (upsert / update time&value / delete).
2. Pose capture keeps using `writeNodeKeyframe`; graph / key-list call the new helpers only.
3. Store action clones the working clip, applies one helper, publishes to `$clips`, lets mixer rebind.

## Prep — MVP layout (key-list first)

**Choice:** ship a **key-list** in the right Settings **Animation** block as US-9 MVP. Defer a curve graph until acceptance is green on list edits; graph is optional stretch in the bottom center column (shared time axis with the scrubber), not a second write path.

Chrome today: Library (clips + bone outliner) | Viewport + `PreviewPlaybackBar` (transport + scrubber only) | Settings (trim / speed / blend). No inspector drawer. `$selection.object` already holds the Edit-tool bone — use it to filter tracks; nothing filters by bone yet.

### Why key-list first

- Fits the existing `18rem` Settings aside and the same form density as trim / speed / Blend collapsible
- Covers every acceptance criterion without a new shell region (“graph **or** key list”)
- A readable curve graph needs width + height the asides cannot give; growing the bottom bar is a larger chrome change

### Wireframe — Settings Animation (MVP)

```
Settings → Animation
├─ Trim / Speed / Blend          (unchanged)
└─ Collapsible "Keys"            (new; open when a ready clip is active)
   ├─ Filter: Selected bone | All tracks
   │     (default Selected when `$selection` is a parts bone/mesh; else All)
   ├─ Track list (scroll)
   │     Hips.position
   │     Hips.quaternion   ← selected
   │     Hips.scale
   ├─ Interpolation: Linear (read-only or Select when Three allows)
   ├─ Key table for selected track
   │     # | Time | v0 | v1 | v2 [| v3]
   │     0 | 0.00 | … editable Inputs
   │     1 | 0.42 | …
   └─ Actions: Add at playhead · Delete selected key
```

- Module home: `animation/components/` (e.g. `keyframe-editor` + track/key subpieces); mount from `editor-settings-sidebar` next to Blend
- Tokens: `bg-surface` / `bg-control` / `border-border` / `text-fg*` — same as Blend; even spacing `2/4/6/8`
- Playhead time for “Add”: reuse `readClipTimelineTime` (same as US-4)
- No change to Library clip rows or bone outliner beyond reading `$selection`

### Wireframe — bottom curve (stretch, not MVP gate)

```
PreviewPlaybackBar (taller when Keys open / toggle)
├─ transport + TimelineScrubber   (existing)
└─ optional curve strip
      track label | sparkline / polyline for selected track values vs time
      click near playhead → select nearest key (edits still in Settings table)
```

Do not put the primary edit form in the bottom strip for v1 — keep mutation UI in Settings so the scrubber stays seek-only until a dedicated graph pass.

### Layout → implement mapping

| Implement task | Lives in |
| -------------- | -------- |
| Track list + selection filter | Settings Keys collapsible; filter from `$selection` |
| Keyframe select / edit time & values | Key table Inputs → domain upsert/update helpers |
| Add / delete keyframes | Actions row → domain helpers at playhead / selected index |
| Rebind + show interpolation | Existing mixer rebind after `$clips` publish; label/Select on selected track |

## Non-goals

No After Effects–grade graph editor in v1 of this story — prioritize correct track mutation and readable UX over fancy Bezier tooling beyond what tracks support. No new shell column; no graph required to close US-9 acceptance.
