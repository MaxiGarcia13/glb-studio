# US-26 — Part hierarchy and outliner (design)

## Approach

1. **Parent action:** `parentPart(child, parent, partsRoot)` in create domain — reparent via `Object3D.attach` so world transform is preserved (wheels do not jump). `parent` may be another stamped part on the same model or the created model’s scene (`partsRoot`). Rejects self / descendant parents (cycle guard). `unparentPart` / create-toolbar **Unparent** moves the selection to `partsRoot`. Settings **Parent** select (`listParentCandidates`) lists other parts + Model root.
2. **Outliner:** `PartOutliner` under each created model in the Models library — `listCreatedPartEntries` (names + indent by depth); click focuses model (if needed), switches to Edit, `selectObject`; `$createPartsRevision` refreshes on add / duplicate / delete / parent / unparent
3. Shell: nested under Models for `source: 'created'` (clips stay on imported models)
4. Keep bone pickers / retarget UI separate — this list is **meshes for created models only**

## Non-goals

No multi-select; no outliner for imported skeletons in this story.
