# US-49 — Export as folders + flat wardrobe embed

Delta: optional folder zip layout **and** flat-export embed of every session skin inside the model GLB. Parent: [`specs/current/`](../current/).

**Depends on:** US-5 / US-22 / US-36 (export zip + modal + format); US-48 (session skins).

**Status:** Implemented — ready to fold after smoke check.

## Story

As an editor user, when I export flat I get every session skin inside the model GLB (not only the active map). When I opt into folders, each model lands in its own folder with separate animation and skin files.

## Acceptance

- [x] Export modal offers **Export as folders** (opt-in; default off = today’s flat zip)
- [x] **Flat** export embeds every session wardrobe texture in the model GLB; re-import restores the full list + active id
- [x] When folders on, each **ungrouped** model packs as:
  ```text
  {Base}/
    {Base}.{glb|fbx}
    animations/
      {Clip}.{glb|fbx}   # owned ready + validating shared for that model
    skins/
      {Skin}.png         # every session wardrobe entry (not only active)
  ```
- [x] Folder-layout model file is mesh + **active** color map only (no embedded clips / unused skins)
- [x] Skin PNG files skipped when wardrobe empty; FBX format still uses PNG for skins
- [x] Model groups stay one packed file (flat name or `{GroupBase}/{GroupBase}.{ext}`); not split into member folders in this US
- [x] Shared animation-only zip-root sidecars omitted when folder layout packs those clips under models; if export has **no** models, shared clips stay flat at zip root
- [x] Filename collisions still get numeric suffixes; no partial zip on failure

## Out of scope

- Drag-and-drop re-import of folder trees
- Per-mesh skin folders
- Splitting model groups into member folders
- FBX round-trip of session-skins extras

## Cross-links

- Session skins → US-48 in `current/`
- Export zip / modal / FBX → US-5 / US-22 / US-36
