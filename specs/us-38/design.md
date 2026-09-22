# US-38 — Add-part MRU menu + browse modal (design)

## Approach

1. **Compact menu** — Replace the flat `AddPartPalette` kind list with five dynamic rows + **See more**. Reuse `ActionMenu` (or equivalent) on the create toolbar; keep the created-model focus gate.
2. **MRU + defaults** — Pure domain helper: given stored MRU ids + default suggestion order `[box, sphere, capsule, dodecahedron, cone]`, return five unique kind ids (MRU first, then unused defaults). On add: prepend kind, dedupe, truncate to five, write localStorage via the existing `src/utils/local-storage` helpers.
3. **See more modal** — Shared `Modal` listing all kinds from `PART_KINDS` / `listPartKinds`, sectioned by registry folders: Solids (`solids.ts`), Planar (`planar.ts`), Polyhedra (`polyhedra.ts`). Selecting a row calls the same `addPart` path as the compact menu, then records MRU and closes.
4. **3D preview** — Small R3F (or lightweight Three) canvas beside/above the list showing the focused kind’s default mesh (`createMesh` / default params). Dispose geometry/material on kind change and unmount. No editor scene coupling.

## Data

| Key               | Value                                                                  |
| ----------------- | ---------------------------------------------------------------------- |
| localStorage key  | `glb-studio.create.recent-part-kinds` (`STORAGE_KEYS.recentPartKinds`) |
| Payload           | JSON array of up to 5 `PartKindId` strings, newest first               |
| Invalid / missing | Treat as empty → cold-start defaults                                   |

## Menu algorithm (examples)

Cold start:

1. box → 2. sphere → 3. capsule → 4. dodecahedron → 5. cone → See more

After adding “another” (e.g. torus):

1. torus → 2. box → 3. sphere → 4. capsule → 5. dodecahedron → See more  
   (cone drops)

After adding another new kind, then re-adding box: box moves to front; list stays length 5; no duplicates.

## Non-goals

No change to part spawn offset, naming, inspector, undo (`createScene`), or export. Preview is display-only.
