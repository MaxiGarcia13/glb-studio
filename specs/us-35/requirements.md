# US-35 — Resizable editor chrome

Delta for drag-resizable Library / Settings asides and preview playback bar, with sizes persisted in `localStorage`. Parent contract: [`specs/current/requirements.md`](../current/requirements.md).

## Story

As an editor user, I can drag-resize the Library and Settings asides and the bottom preview bar so long bone lists and Tracks rows are readable, and those sizes are remembered across reloads.

## Acceptance

- [ ] Library (left) and Settings (right) asides are drag-resizable on desktop (`>640px`); sizes clamp to documented min/max
- [ ] Bottom preview / playback bar is drag-resizable on desktop **and** mobile (top edge)
- [ ] Aside horizontal resize is disabled on mobile (collapse / overlay unchanged)
- [ ] Panel sizes persist via project `localStorage` helpers (`glb-studio.*` keys) and restore on reload
- [ ] Collapse / expand of asides still works; resize applies only while open
- [ ] Shared `ResizableShell` owns drag + size; callers do not reimplement pointer math

## Out of scope

- Persisting snap / axes / other Settings toggles (remain session-only per US-14 / US-25)
- Persisting aside open/closed state
- Touch multi-finger or double-click reset-to-default (nice-to-have later)
