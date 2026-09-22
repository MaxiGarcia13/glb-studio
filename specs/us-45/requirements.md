# US-45 — Fuse / join parts (boolean union)

Delta: merge two or more overlapping created parts into **one** mesh so a limb or prop reads as a single figure silhouette (not three separate solids). Parent: [`specs/current/requirements.md`](../current/requirements.md).

**Series:** Figure craft (US-41 → US-45).

**Depends on:** **US-41** (bake + geometry undo/clipboard). Shares CSG stack with **US-44** when both ship (prefer one adapter). Softens boolean out-of-scope for **created union**.

**Status:** Planned — not kicked off.

## Story

As an editor user building a figure, I can join pieces that should look like one continuous form (e.g. upper-arm blocks fused into one arm segment) so the result does not read as separate stacked figures — while still using joints **between** fused segments when I need a bendable elbow.

## Acceptance

- [ ] With a created model focused, user can **Fuse** when **two or more** stamped create **parts** are selected (not groups-as-opaque; design may allow exploding one level — document at kickoff)
- [ ] Fuse runs boolean **union** of selected meshes in a common space → **one** new (or surviving) crafted mesh; **removes** the other source parts from the scene
- [ ] Result is **crafted** (US-41); size fields disabled; Reset restores only if we keep a single source kind (MVP: Reset may rebuild from **primary** selection’s kind+params **or** Reset disabled with reason — pick at kickoff and document)
- [ ] Naming: sensible default (e.g. primary name, or `fused` / `fused_2` via `nextPartName`)
- [ ] Material: prefer primary selection’s color/map; document if maps are dropped when UVs break
- [ ] One undo entry restores all pre-fuse parts and removes the fused mesh
- [ ] Parts should **overlap or touch** enough for a sensible union; if disjoint, either still produce a multi-island mesh (OK) or warn — document choice (recommend allow multi-island + soft warning)
- [ ] Disabled for imported / post-Skin; fewer than two parts; selection includes non-parts without a clear resolve path
- [ ] **Posing guidance** (copy in UI): fuse within a segment; keep **separate** fused meshes + **joint** for elbows/knees — Fuse does not create bones
- [ ] Export shows a single continuous (or multi-island) mesh for the fused result
- [ ] Adapter/unit test: two overlapping boxes → one geometry, triangle count in expected range

## Out of scope

- Boolean subtract / holes (→ US-44)
- Auto weight paint or auto Skin after fuse
- Fuse of entire joint hierarchies into one skinned mesh in one click
- Non-destructive boolean modifiers (always bake)
- Weld-by-distance without CSG (vertex merge only) as a substitute for visual union

## Product intent (arm example)

1. Build upper arm from 2–3 overlapping primitives → **Fuse** → one upper-arm mesh
2. Build forearm similarly → **Fuse**
3. **Make connector / joint** between upper and forearm → bendable arm that does not look like six separate boxes

## Cross-links

- Foundation → [`specs/us-41/`](../us-41/)
- Brushes (smooth seam after fuse) → [`specs/us-42/`](../us-42/)
- Round corners → [`specs/us-43/`](../us-43/)
- Holes → [`specs/us-44/`](../us-44/)
