# US-37 — Design

## Delete eligibility

Align Delete with Copy:

1. Focused model `source === 'created'`
2. `$selection.kind === 'parts'` and `objects.length > 0`
3. Eligible = `isCreateHierarchyNode` under the active scene
4. Roots = `resolveClipboardRoots(eligible)` (skip nested under another selected node)
5. Part root → remove mesh + dispose GPU; group root → remove group and dispose all stamped descendant meshes

## Undo command: `createScene`

One stack entry = one user Add / Paste / Delete.

Snapshot shape (reuse clipboard tree encoding + placement):

```ts
{
  modelId: string;
  /** Roots to ensure exist (identity + TRS + parent + children). */
  ensureTrees: readonly CreateSceneTreeRoot[];
  /** UUIDs to remove (roots; cascade disposes descendants). */
  removeRootUuids: readonly string[];
  selectUuids: readonly string[];
}
```

Each tree root carries `uuid`, `parentUuid` (`null` = model scene root), and a clipboard-style node (part or group) with optional stable `uuid` on every descendant.

Apply order: ensureTrees → removeRootUuids → select.

| Action | before | after |
|--------|--------|-------|
| Delete | ensureTrees = snapshot of removed roots; remove = []; select = prior | ensure = []; remove = those root uuids; select = [] |
| Add / Paste | ensure = []; remove = inserted root uuids; select = prior | ensure = new trees; remove = []; select = new roots |

Instantiate for undo/redo: **no** paste +X offset; assign recorded UUIDs. User Paste still uses +X offset and fresh UUIDs on the forward path, then snapshots the live nodes for `after`.

## Files

- `create/domain/delete-part.ts` — extend or add `deleteCreateHierarchyRoot`
- `create/domain/create-part-clipboard.ts` — optional `uuid` on nodes; instantiate options `{ offsetX, assignUuids }`
- `create/domain/create-scene-undo.ts` — capture / apply helpers
- `create/actions/delete-selected-part.ts` — multi-root + push undo
- `create/actions/add-part.ts` / `paste-create-part-from-clipboard.ts` — push undo
- `animation/types/undo-stack.ts` + `apply-undoable-command.ts` — `createScene` case
- `part-delete-tool.tsx` — enable from delete availability helper
