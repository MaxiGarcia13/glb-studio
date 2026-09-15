# US-26 — Part hierarchy and outliner (design)

## Approach

1. **Parent action:** `attach` / reparent selected Object3D under a chosen parent while preserving world transform (`attach` pattern) so wheels do not jump
2. **Outliner:** flat or indented list from a traverse of the created model’s parts root; click → `select` existing selection store
3. Shell: Create section or collapsible under Models when focus is created
4. Keep bone pickers / retarget UI separate — this list is **meshes for created models only**

## Non-goals

No multi-select; no outliner for imported skeletons in this story.
