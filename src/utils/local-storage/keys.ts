/** Prefixed keys for editor chrome persistence. */
const PREFIX = 'glb-studio.editor';
export const STORAGE_KEYS = {
  libraryAsideWidth: `${PREFIX}.aside.library.width`,
  settingsAsideWidth: `${PREFIX}.aside.settings.width`,
  previewBarHeight: `${PREFIX}.preview-bar.height`,
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
