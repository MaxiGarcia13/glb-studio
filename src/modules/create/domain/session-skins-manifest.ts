/** Root / helper-node `userData` keys persisted via GLTF `extras` (US-49 flat embed). */
export const SESSION_SKINS_MANIFEST_KEY = 'threeEditorSessionSkins';
export const SESSION_SKIN_NODE_KEY = 'threeEditorSessionSkin';

export const SESSION_SKINS_MANIFEST_VERSION = 1;

export interface SessionSkinManifestRecord {
  id: string;
  label: string;
}

export interface SessionSkinsManifest {
  version: number;
  activeSkinId: string | null;
  skins: SessionSkinManifestRecord[];
}

export interface SessionSkinNodeStamp {
  id: string;
  label: string;
}

function isRecord(value: unknown): value is SessionSkinManifestRecord {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const record = value as SessionSkinManifestRecord;
  return typeof record.id === 'string'
    && record.id.length > 0
    && typeof record.label === 'string'
    && record.label.length > 0;
}

/** Validate and return a session-skins manifest from `userData`, or null. */
export function parseSessionSkinsManifest(
  raw: unknown,
): SessionSkinsManifest | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const candidate = raw as SessionSkinsManifest;
  if (candidate.version !== SESSION_SKINS_MANIFEST_VERSION) {
    return null;
  }
  if (candidate.activeSkinId !== null && typeof candidate.activeSkinId !== 'string') {
    return null;
  }
  if (!Array.isArray(candidate.skins) || !candidate.skins.every(isRecord)) {
    return null;
  }
  return {
    version: SESSION_SKINS_MANIFEST_VERSION,
    activeSkinId: candidate.activeSkinId,
    skins: candidate.skins.map((entry) => ({
      id: entry.id,
      label: entry.label,
    })),
  };
}

export function parseSessionSkinNodeStamp(
  raw: unknown,
): SessionSkinNodeStamp | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const stamp = raw as SessionSkinNodeStamp;
  if (typeof stamp.id !== 'string' || stamp.id.length === 0) {
    return null;
  }
  if (typeof stamp.label !== 'string' || stamp.label.length === 0) {
    return null;
  }
  return { id: stamp.id, label: stamp.label };
}
