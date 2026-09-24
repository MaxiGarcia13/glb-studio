---
description: Prefer short usable comments — never cite US-N / ticket IDs in code
globs: '**/*.{ts,tsx,js,jsx,mjs,cjs}'
alwaysApply: true
---

# Usable Comments

Comments unlock non-obvious intent. Prefer none over noise. Specs (`specs/`) own ticket IDs and long “why we built this” narrative — not source comments.

## Forbid — ticket IDs in code

Never cite **`US-N`**, `NFR-*`, `Phase N`, `T###`, `TD##`, or similar in:

- `//` comments
- `/**` / `*` JSDoc
- Inline end-of-line remarks

```ts
// ❌ BAD
// Imported / non-created focus must never keep the modal open (US-39).
const modalOpen = prepOpen && enabled;

/** Compact texture control for skinned library focus (US-40). */
export function SkinnedTextureToolbar() {}

// ✅ GOOD
// Imported / non-created focus must never keep the modal open.
const modalOpen = prepOpen && enabled;

/** Compact texture control for skinned library focus. No prep modal. */
export function SkinnedTextureToolbar() {}
```

Name the **constraint**, not the ticket. If you need to keep a useful parenthetical after stripping an id, keep the words — drop only the id (`(US-20 play is global)` → `(play is global)`).

## Also forbid

- **Narrating the code** — restating what the next few lines already say
- **Duplicating specs** — long file headers that re-explain `design.md` / `tasks.md`
- **Meta / tooling chatter** — “listed for exhaustive-deps”, “satisfies eslint”
- **Changelog comments** — “formerly X”, “after the Y refactor” unless the hazard is still live and unnamed otherwise

## Prefer

- One short line when behavior would surprise a careful reader (ordering hazard, intentional no-op, Strict Mode quirk)
- JSDoc on exports only when the signature alone is ambiguous (units, invariants, side effects)

## Where US-N belongs

| Place                                             | US-N OK?                              |
| ------------------------------------------------- | ------------------------------------- |
| `specs/` (requirements, design, tasks, CHANGELOG) | Yes                                   |
| Commit messages / PR titles & bodies              | Yes                                   |
| Code comments / JSDoc                             | **No**                                |
| Test `describe` / `it` titles                     | Prefer no; not a substitute for specs |

Link behavior to `US-*` only in `specs/`. Code comments describe surviving hazards, not shipped tickets.
