import type { EditorCommand } from '../types/editor-command';

/**
 * Pure editor command catalog — single source of truth for chords, labels, and
 * categories (hotkeys + Commands modal). No store writes.
 *
 * @see specs/current/design.md — Keymap (locked)
 */
export const EDITOR_COMMANDS: readonly EditorCommand[] = [
  {
    id: 'playPause',
    chords: [{ key: ' ' }],
    label: 'Play / Pause',
    category: 'Playback',
  },
  {
    id: 'toggleAxes',
    chords: [{ key: 'r' }],
    label: 'Toggle world axes',
    category: 'Viewport',
  },
  {
    id: 'toggleBones',
    chords: [{ key: 'b' }],
    label: 'Toggle bones',
    category: 'Viewport',
  },
  {
    id: 'editToolNavigate',
    chords: [{ key: '1' }],
    label: 'Navigate',
    category: 'Viewport',
  },
  {
    id: 'editToolEdit',
    chords: [{ key: '2' }],
    label: 'Edit',
    category: 'Viewport',
  },
  {
    id: 'editToolMove',
    chords: [{ key: '3' }],
    label: 'Move tool',
    category: 'Viewport',
  },
  {
    id: 'transformMove',
    chords: [{ key: 'q' }],
    label: 'Move',
    category: 'Transform',
  },
  {
    id: 'transformRotate',
    chords: [{ key: 'w' }],
    label: 'Rotate',
    category: 'Transform',
  },
  {
    id: 'transformScale',
    chords: [{ key: 'e' }],
    label: 'Scale',
    category: 'Transform',
  },
  {
    id: 'nudgeNegX',
    chords: [{ key: 'ArrowLeft' }],
    label: 'Nudge −X',
    category: 'Transform',
  },
  {
    id: 'nudgePosX',
    chords: [{ key: 'ArrowRight' }],
    label: 'Nudge +X',
    category: 'Transform',
  },
  {
    id: 'nudgePosY',
    chords: [{ key: 'ArrowUp' }],
    label: 'Nudge +Y',
    category: 'Transform',
  },
  {
    id: 'nudgeNegY',
    chords: [{ key: 'ArrowDown' }],
    label: 'Nudge −Y',
    category: 'Transform',
  },
  {
    id: 'nudgePosZ',
    chords: [{ key: 'ArrowUp', modifiers: ['shift'] }],
    label: 'Nudge +Z',
    category: 'Transform',
  },
  {
    id: 'nudgeNegZ',
    chords: [{ key: 'ArrowDown', modifiers: ['shift'] }],
    label: 'Nudge −Z',
    category: 'Transform',
  },
  {
    id: 'savePending',
    chords: [{ key: 's', modifiers: ['mod'] }],
    label: 'Commit pending pose',
    category: 'Animation',
  },
  {
    id: 'newModel',
    chords: [{ key: 'n' }],
    label: 'New model',
    category: 'Create',
  },
  {
    id: 'copyCreatePart',
    chords: [{ key: 'c', modifiers: ['mod'] }],
    label: 'Copy create part / group',
    category: 'Create',
  },
  {
    id: 'pasteCreatePart',
    chords: [{ key: 'v', modifiers: ['mod'] }],
    label: 'Paste create part / group',
    category: 'Create',
  },
  {
    id: 'deleteCreatePart',
    chords: [{ key: 'Delete' }, { key: 'Backspace' }],
    label: 'Delete create part',
    category: 'Create',
  },
  {
    id: 'undo',
    chords: [{ key: 'z', modifiers: ['mod'] }],
    label: 'Undo',
    category: 'History',
  },
  {
    id: 'redo',
    chords: [
      { key: 'z', modifiers: ['mod', 'shift'] },
      { key: 'y', modifiers: ['mod'] },
    ],
    label: 'Redo',
    category: 'History',
  },
];
