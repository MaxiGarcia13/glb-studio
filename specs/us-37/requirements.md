# US-37 — Create scene undo (add / paste / delete)

Delta for undoable create-graph insert/remove. Parent contract: [`specs/current/requirements.md`](../current/requirements.md).

**Depends on:** US-10 (undo stack), US-23 / US-24 (parts), US-26 (groups).

**Status:** Implemented — fold into `current/` on ship (delete this folder + changelog Open → Shipped).

## Story

As an editor user, I can delete selected create parts or groups (including multi-select), and undo / redo Add part, Paste, and Delete so I can recover from mistakes without rebuilding the scene.

## Acceptance

- [x] **Delete** on a stamped create **part** removes that part
- [x] **Delete** on a create **group** (plain or joint) removes the group and its entire create subtree
- [x] **Delete** on part multi-select removes all clipboard roots (nodes nested under another selected node are skipped) in one gesture
- [x] Delete toolbar control is enabled whenever Delete would remove at least one eligible root (not mesh-only)
- [x] **Add part**, **Paste**, and **Delete** each push one session undo entry (`createScene`)
- [x] Undo of Delete restores trees at their prior parents with stable UUIDs and reselects the restored roots
- [x] Redo of Delete removes those trees again; Undo of Add / Paste removes the inserted roots; Redo reinserts them
- [x] Copy remains session clipboard only (not an undo entry); Cut stays out of scope

## Out of scope

- Duplicate undo (may follow the same path later; not required in this US)
- Kit instantiate / New model as undo entries
- Durable undo across reloads
