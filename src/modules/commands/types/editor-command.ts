/** Stable ids for the editor command catalog (hotkeys + Commands modal). */
export type EditorCommandId
  = | 'playPause'
    | 'toggleAxes'
    | 'toggleBones'
    | 'transformMove'
    | 'transformRotate'
    | 'transformScale'
    | 'nudgeNegX'
    | 'nudgePosX'
    | 'nudgePosY'
    | 'nudgeNegY'
    | 'nudgePosZ'
    | 'nudgeNegZ'
    | 'savePending'
    | 'copyCreatePart'
    | 'pasteCreatePart'
    | 'deleteCreatePart'
    | 'undo'
    | 'redo';

export type EditorCommandCategory
  = | 'Playback'
    | 'Viewport'
    | 'Transform'
    | 'Animation'
    | 'Create'
    | 'History';

/**
 * Platform-agnostic modifier.
 * `mod` = Cmd on macOS, Ctrl elsewhere (matched against meta/ctrl at dispatch time).
 */
export type EditorCommandMod = 'mod' | 'shift';

/** One binding; `key` matches `KeyboardEvent.key` (letters lowercased at match time). */
export interface EditorCommandChord {
  key: string;
  modifiers?: readonly EditorCommandMod[];
}

export interface EditorCommand {
  id: EditorCommandId;
  chords: readonly EditorCommandChord[];
  label: string;
  category: EditorCommandCategory;
}
