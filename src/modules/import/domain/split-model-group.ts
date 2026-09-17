import type { AnimationClip, Object3D } from 'three';
import type {
  ModelGroupManifest,
  ModelGroupMemberRecord,
} from '@/modules/export/domain/model-group-manifest';
import type { ModelLoadResult } from '@/modules/viewport/types/model';

import { Group } from 'three';

import { remapClipTracks } from '@/modules/animation/domain/clip-remap';
import {
  MODEL_GROUP_MANIFEST_KEY,
  MODEL_GROUP_MEMBER_KEY,
  parseModelGroupManifest,
  parseModelGroupMemberStamp,
} from '@/modules/export/domain/model-group-manifest';

export interface SplitModelGroupResult {
  models: ModelLoadResult[];
  groupName: string;
}

/** Read a stamped group manifest from a loaded GLTF scene (or a direct child). */
export function readModelGroupManifest(scene: Object3D): ModelGroupManifest | null {
  const direct = parseModelGroupManifest(scene.userData[MODEL_GROUP_MANIFEST_KEY]);
  if (direct) {
    return direct;
  }

  for (const child of scene.children) {
    const nested = parseModelGroupManifest(child.userData[MODEL_GROUP_MANIFEST_KEY]);
    if (nested) {
      return nested;
    }
  }

  return null;
}

/** Node that carries the manifest (loaded scene or its stamped child group). */
function findManifestRoot(scene: Object3D): Object3D {
  if (parseModelGroupManifest(scene.userData[MODEL_GROUP_MANIFEST_KEY])) {
    return scene;
  }
  for (const child of scene.children) {
    if (parseModelGroupManifest(child.userData[MODEL_GROUP_MANIFEST_KEY])) {
      return child;
    }
  }
  return scene;
}

function ensureGroup(root: Object3D): Group {
  if ((root as Group).isGroup) {
    return root as Group;
  }
  const wrap = new Group();
  wrap.name = root.name || 'model';
  wrap.add(root);
  return wrap;
}

/**
 * Strip `prefix` from every named node. Returns prefixed → original map for
 * remapping animation tracks back to unprefixed bone names.
 */
export function stripNamespacePrefix(
  root: Object3D,
  prefix: string,
): Map<string, string> {
  const nameMap = new Map<string, string>();
  root.traverse((object) => {
    if (!object.name || !object.name.startsWith(prefix)) {
      return;
    }
    const original = object.name.slice(prefix.length);
    nameMap.set(object.name, original);
    object.name = original;
  });
  return nameMap;
}

function objectUsesPrefix(root: Object3D, prefix: string): boolean {
  let found = false;
  root.traverse((object) => {
    if (found || !object.name) {
      return;
    }
    if (object.name.startsWith(prefix)) {
      found = true;
    }
  });
  return found;
}

function findMemberRoot(
  candidates: readonly Object3D[],
  member: ModelGroupMemberRecord,
): Object3D | null {
  for (const child of candidates) {
    const stamp = parseModelGroupMemberStamp(child.userData[MODEL_GROUP_MEMBER_KEY]);
    if (stamp && stamp.prefix === member.prefix) {
      return child;
    }
  }

  // Longest-prefix-first callers avoid `test_` claiming `test_1_…` bones.
  for (const child of candidates) {
    if (objectUsesPrefix(child, member.prefix)) {
      return child;
    }
  }

  return null;
}

function remapMemberClips(
  animations: readonly AnimationClip[],
  member: ModelGroupMemberRecord,
  nameMap: Map<string, string>,
): AnimationClip[] {
  const byExportName = new Map(animations.map((clip) => [clip.name, clip]));
  const result: AnimationClip[] = [];

  for (const record of member.clips) {
    const source = byExportName.get(record.exportName);
    if (!source) {
      continue;
    }
    if (nameMap.size === 0) {
      const clone = source.clone();
      clone.name = record.name;
      result.push(clone);
      continue;
    }
    const remapped = remapClipTracks(source, nameMap);
    if (!remapped.clip) {
      continue;
    }
    remapped.clip.name = record.name;
    result.push(remapped.clip);
  }

  return result;
}

function clearGroupStamps(root: Object3D): void {
  delete root.userData[MODEL_GROUP_MANIFEST_KEY];
  delete root.userData[MODEL_GROUP_MEMBER_KEY];
  root.traverse((object) => {
    delete object.userData[MODEL_GROUP_MANIFEST_KEY];
    delete object.userData[MODEL_GROUP_MEMBER_KEY];
  });
}

/**
 * Split a packed group GLB scene into per-member ModelLoadResults.
 * Detaches member roots from `scene` and strips bone prefixes.
 * Member order in the result matches the manifest.
 */
export function splitModelGroupScene(
  scene: Object3D,
  animations: readonly AnimationClip[],
  manifest: ModelGroupManifest,
  fallbackFileName: string,
): SplitModelGroupResult | null {
  const manifestRoot = findManifestRoot(scene);
  const remaining = [...manifestRoot.children];
  const byPrefix = new Map<string, ModelLoadResult>();

  // Longest prefix first so `test_1_` wins over `test_` on fallback matching.
  const membersByPrefixLength = [...manifest.members].sort(
    (a, b) => b.prefix.length - a.prefix.length,
  );

  for (const member of membersByPrefixLength) {
    const root = findMemberRoot(remaining, member);
    if (!root) {
      return null;
    }

    const index = remaining.indexOf(root);
    if (index >= 0) {
      remaining.splice(index, 1);
    }
    root.parent?.remove(root);
    const nameMap = stripNamespacePrefix(root, member.prefix);
    const memberScene = ensureGroup(root);
    clearGroupStamps(memberScene);

    byPrefix.set(member.prefix, {
      fileName: member.fileName || fallbackFileName,
      scene: memberScene,
      animations: remapMemberClips(animations, member, nameMap),
      source: member.source,
    });
  }

  const models = manifest.members.map((member) => byPrefix.get(member.prefix));
  if (models.includes(undefined) || models.length < 2) {
    return null;
  }

  return {
    models: models as ModelLoadResult[],
    groupName: manifest.name,
  };
}
