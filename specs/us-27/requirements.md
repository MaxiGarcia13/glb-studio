# US-27 — Additional kits via registry

Delta for growing starter content without new engine work. Parent contract: [`specs/current/requirements.md`](../current/requirements.md).

**Depends on:** US-23 (kit registry + create flow).

**Status:** Not started — do not implement until explicitly kicked off.

## Story

As an editor user, I can pick from more starter kits (for example a simple building or robot) so I get a head start on common shapes beyond the MVP car and block figure.

## Acceptance

- [ ] At least **two** new kits are registered (suggested: **Simple building**, **Block robot**) using the same recipe format as US-23
- [ ] Kit picker lists them with beginner-friendly labels and one-line descriptions
- [ ] Creating from a new kit follows the same library / preview / Edit / export path as MVP kits
- [ ] No new PartKind is required unless a kit truly needs one; prefer existing kinds
- [ ] Kits remain editable (parts are normal meshes — not locked prefabs)

## Out of scope

- Marketplace / remote kit download
- User-authored kit save/share
- Skinned / animatable humanoid auto-rig
- Photoreal or scanned assets
