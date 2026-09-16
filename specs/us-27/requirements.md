# US-27 — Additional kits via registry

Delta for growing starter content without new engine work. Parent contract: [`specs/current/requirements.md`](../current/requirements.md).

**Depends on:** US-23 (create flow + kit registry seam). New model remains empty-only; this US adds optional presets to a separate picker or create submenu — not the Plus button default.

**Status:** In progress — recipes + From kit UI shipped; optional clothed variant + verify still open.

## Story

As an editor user, I can optionally start from a starter kit (for example a simple building or robot) so I get a head start — without changing the primary Plus → empty flow.

## Acceptance

- [x] At least **two** kits are registered (suggested: **Simple building**, **Block robot**) using the kit recipe format
- [x] A secondary **From kit…** entry (not the Plus button) lists them with beginner-friendly labels and one-line descriptions
- [x] Creating from a kit follows the same library / preview / Edit / export path as `createEmptyModel`
- [x] Plus / New model still creates an **empty** model with no modal
- [x] No new PartKind is required unless a kit truly needs one; prefer existing kinds
- [x] Kits remain editable (parts are normal meshes — not locked prefabs)

## Out of scope

- Marketplace / remote kit download
- User-authored kit save/share
- Skinned / animatable humanoid auto-rig
- Photoreal or scanned assets
