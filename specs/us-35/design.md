# US-35 — Design

## Layout

1. **`ResizableShell`** (`src/components/resizable-shell/`) — relative flex shell; applies `width` or `height` from state; exposes a `role="separator"` handle on `edge` (`start` | `end`) for `axis` (`horizontal` | `vertical`)
2. **`CollapsibleAside`** wraps open content in `ResizableShell` (`horizontal`; left → `edge="end"`, right → `edge="start"`). `enabled={!isMobileViewport()}`
3. **`EditorPreviewBar`** wraps in `ResizableShell` (`vertical`, `edge="start"`). Always enabled (including mobile)
4. Defaults: aside `288px` (was `18rem`); preview bar `224px` (was `h-56`). Min/max: aside `240–560`; bar `160–560` (also clamp to ~75% viewport height while dragging)

## Persistence

1. **`src/utils/local-storage/`** — typed keys + safe get/set for string/number (SSR / private-mode safe)
2. Keys: `glb-studio.editor.aside.library.width`, `glb-studio.editor.aside.settings.width`, `glb-studio.editor.preview-bar.height`
3. Read on mount; write on pointer-up (not every move)
4. Do not persist open/closed or unrelated Settings chrome

## Interaction

- Handle hit target uses even spacing (`w-2` / `h-2`); cursor `ew-resize` / `ns-resize`
- Pointer capture during drag; `user-select: none` on body while dragging
- Tokens: opaque `bg-surface`, `border-border` — no new color recipes
