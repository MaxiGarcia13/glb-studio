import type { ModelSource } from '@/modules/viewport/types/model';

/** Root / member `userData` keys persisted via GLTF `extras`. */
export const MODEL_GROUP_MANIFEST_KEY = 'threeEditorModelGroup';
export const MODEL_GROUP_MEMBER_KEY = 'threeEditorGroupMember';

export const MODEL_GROUP_MANIFEST_VERSION = 1;

export interface ModelGroupClipRecord {
  /** Unique clip name inside the packed GLB. */
  exportName: string;
  /** Library display name after split import. */
  name: string;
}

export interface ModelGroupMemberRecord {
  fileName: string;
  /** Bone/node prefix including trailing `_`. */
  prefix: string;
  source: ModelSource;
  clips: ModelGroupClipRecord[];
}

export interface ModelGroupManifest {
  version: number;
  name: string;
  members: ModelGroupMemberRecord[];
}

export interface ModelGroupMemberStamp {
  prefix: string;
  fileName: string;
  source: ModelSource;
}

function isModelSource(value: unknown): value is ModelSource {
  return value === 'imported' || value === 'created';
}

function isClipRecord(value: unknown): value is ModelGroupClipRecord {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const record = value as ModelGroupClipRecord;
  return typeof record.exportName === 'string'
    && record.exportName.length > 0
    && typeof record.name === 'string'
    && record.name.length > 0;
}

function isMemberRecord(value: unknown): value is ModelGroupMemberRecord {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const record = value as ModelGroupMemberRecord;
  return typeof record.fileName === 'string'
    && record.fileName.length > 0
    && typeof record.prefix === 'string'
    && record.prefix.length > 0
    && isModelSource(record.source)
    && Array.isArray(record.clips)
    && record.clips.every(isClipRecord);
}

/** Validate and return a manifest from `userData`, or null. */
export function parseModelGroupManifest(raw: unknown): ModelGroupManifest | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const candidate = raw as ModelGroupManifest;
  if (candidate.version !== MODEL_GROUP_MANIFEST_VERSION) {
    return null;
  }
  if (typeof candidate.name !== 'string' || candidate.name.trim().length === 0) {
    return null;
  }
  if (!Array.isArray(candidate.members) || candidate.members.length < 2) {
    return null;
  }
  if (!candidate.members.every(isMemberRecord)) {
    return null;
  }
  return {
    version: MODEL_GROUP_MANIFEST_VERSION,
    name: candidate.name.trim(),
    members: candidate.members,
  };
}

export function parseModelGroupMemberStamp(raw: unknown): ModelGroupMemberStamp | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const candidate = raw as ModelGroupMemberStamp;
  if (typeof candidate.prefix !== 'string' || candidate.prefix.length === 0) {
    return null;
  }
  if (typeof candidate.fileName !== 'string' || candidate.fileName.length === 0) {
    return null;
  }
  if (!isModelSource(candidate.source)) {
    return null;
  }
  return {
    prefix: candidate.prefix,
    fileName: candidate.fileName,
    source: candidate.source,
  };
}
