---
description: Spec deltas and ships use US-N ids — never new v* version folders
alwaysApply: true
---

# Spec delta IDs — US-N only

New product work is scoped by **user story number**, not a version folder.

## Do

- Open deltas as `specs/us-<n>/` with `requirements.md`, `design.md`, `tasks.md`
- Name the story **US-\<n\>** in requirements, tasks, changelog, commits, and PRs
- Pick the next free `n` after the highest shipped/open US (see `specs/CHANGELOG.md`)
- On ship: fold into `specs/current/`, one changelog row as **US-\<n\>**, delete `specs/us-<n>/`

```text
✅ specs/us-32/
✅ | **US-32** | Gallery bootstrap API — entrance + rooms package (NFR-50–55) |
```

## Don't

- Do **not** create new `specs/v*` folders (`v2.8`, `v3`, …)
- Do **not** name new ships as `v2.x` in the changelog Open/Shipped tables
- Do **not** put new work under any legacy `specs/v*` tree

```text
❌ specs/v2.8/
❌ | **v2.8** | Gallery manifest API |
```

## Legacy

- Shipped history may still list old `v1`…`v2.6*` rows — leave them; do not revive those trees
- Do not recreate deleted `specs/v*` folders; open new work as `specs/us-<n>/` only
