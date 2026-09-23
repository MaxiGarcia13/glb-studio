import type { Texture } from 'three';
import type {
  MaterialColorMapSnapshot,
  UndoableCommand,
} from '@/modules/animation/types/undo-stack';
import type { ModelEntry } from '@/modules/viewport/types/model';

import { disposeImageTexture } from '@/utils/dispose-image-texture';
import { findMeshStandardMaterial } from '../../utils/selected-part';
import { applyColorMap } from '../material-color-map';
import { cloneColorMapTexture } from './clone';

export type MaterialColorMapCommand = Extract<
  UndoableCommand,
  { id: 'materialColorMap' }
>;

export function disposeMaterialColorMapSnapshot(
  snapshot: MaterialColorMapSnapshot,
): void {
  disposeImageTexture(snapshot.map);
}

export function disposeMaterialColorMapCommand(
  command: MaterialColorMapCommand,
): void {
  disposeMaterialColorMapSnapshot(command.before);
  disposeMaterialColorMapSnapshot(command.after);
}

/**
 * If the live material still references a stack-owned map, give it a private
 * clone so the stack entry can be disposed without blacking the viewport.
 */
function adoptLiveStackMapsIfNeeded(
  command: MaterialColorMapCommand,
  models: readonly ModelEntry[],
): void {
  const model = models.find((entry) => entry.id === command.modelId);
  if (!model) {
    return;
  }

  const mesh = model.scene.getObjectByProperty('uuid', command.meshUuid);
  const material = findMeshStandardMaterial(mesh ?? null);
  if (!material?.map) {
    return;
  }

  const live = material.map;
  if (live !== command.before.map && live !== command.after.map) {
    return;
  }

  applyColorMap(material, cloneColorMapTexture(live));
}

/**
 * Free stack-owned map clones for a pruned / cleared entry.
 * Adopts onto the live material first when the viewport still shows a clone.
 */
export function disposeMaterialColorMapCommandSafely(
  command: MaterialColorMapCommand,
  models: readonly ModelEntry[],
): void {
  adoptLiveStackMapsIfNeeded(command, models);
  disposeMaterialColorMapCommand(command);
}

/** Dispose GPU resources owned by a stack entry when it leaves the session stack. */
export function disposeUndoableCommandResources(
  command: UndoableCommand,
  models: readonly ModelEntry[],
): void {
  if (command.id === 'materialColorMap') {
    disposeMaterialColorMapCommandSafely(command, models);
  }
}

/** Textures still referenced by undo stack snapshots (must not dispose as orphans). */
export function collectStackOwnedColorMaps(
  stack: {
    past: readonly UndoableCommand[];
    future: readonly UndoableCommand[];
  },
): Texture[] {
  const owned: Texture[] = [];
  for (const command of [...stack.past, ...stack.future]) {
    if (command.id !== 'materialColorMap') {
      continue;
    }
    if (command.before.map) {
      owned.push(command.before.map);
    }
    if (command.after.map) {
      owned.push(command.after.map);
    }
  }
  return owned;
}

/**
 * Dispose a replaced live map only when it is not owned by the session stack.
 * Call after assigning the new map and before pushing the new undo entry.
 */
export function releaseOrphanColorMap(
  texture: Texture | null | undefined,
  stackOwned: readonly (Texture | null | undefined)[],
): void {
  if (!texture || stackOwned.includes(texture)) {
    return;
  }
  disposeImageTexture(texture);
}
