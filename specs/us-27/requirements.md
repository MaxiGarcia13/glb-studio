# US-27 — Additional kits via registry

Delta for growing starter content without new engine work. Parent contract: [`specs/current/requirements.md`](../current/requirements.md).

**Depends on:** US-23 (create flow + kit registry seam). New model remains empty-only; this US adds optional presets to a separate picker or create submenu — not the Plus button default.

**Status:** In progress — Simple building + Block robot recipes authored (From kit UI still open).

## Story

As an editor user, I can optionally start from a starter kit (for example a simple building or robot) so I get a head start — without changing the primary Plus → empty flow.

## Acceptance

- [ ] At least **two** kits are registered (suggested: **Simple building**, **Block robot**) using the kit recipe format
- [ ] A secondary **From kit…** entry (not the Plus button) lists them with beginner-friendly labels and one-line descriptions
- [ ] Creating from a kit follows the same library / preview / Edit / export path as `createEmptyModel`
- [ ] Plus / New model still creates an **empty** model with no modal
- [ ] No new PartKind is required unless a kit truly needs one; prefer existing kinds
- [ ] Kits remain editable (parts are normal meshes — not locked prefabs)

## Out of scope

- Marketplace / remote kit download
- User-authored kit save/share
- Skinned / animatable humanoid auto-rig
- Photoreal or scanned assets
