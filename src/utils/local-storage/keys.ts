/** Prefixed keys for editor chrome persistence. */
const EDITOR_PREFIX = 'glb-studio.editor';

export const STORAGE_KEYS = {
  libraryAsideWidth: `${EDITOR_PREFIX}.aside.library.width`,
  settingsAsideWidth: `${EDITOR_PREFIX}.aside.settings.width`,
  previewBarHeight: `${EDITOR_PREFIX}.preview-bar.height`,
  recentPartKinds: `${EDITOR_PREFIX}.create.recent-part-kinds`,
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
