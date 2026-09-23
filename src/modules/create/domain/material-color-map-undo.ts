import type { MeshStandardMaterial } from 'three';
import type {
  MaterialColorMapSnapshot,
  UndoableCommand,
} from '@/modules/animation/types/undo-stack';
import { Texture } from 'three';

import { $model } from '@/modules/viewport/stores/model-store';
import { disposeImageTexture } from '@/utils/dispose-image-texture';
import { findMeshStandardMaterial } from '../utils/selected-part';
import { applyColorMap } from './material-color-map';
import { syncMaterialMapAlpha } from './texture-map-alpha';

export type MaterialColorMapCommand = Extract<
  UndoableCommand,
  { id: 'materialColorMap' }
>;

/**
 * Deep-ish clone for undo: own pixel buffer so disposing one texture cannot
 * close a shared ImageBitmap / wipe a shared canvas still on the stack.
 * Builds a new `Texture` (Three.js `clone()` shares `source` / image data).
 */
export function cloneColorMapTexture(source: Texture): Texture {
  const sourceImage = source.image;
  let image: Texture['image'] = sourceImage;

  const width
    = sourceImage && typeof (sourceImage as { width?: unknown }).width === 'number'
      ? Math.max(1, (sourceImage as { width: number }).width)
      : 1;
  const height
    = sourceImage && typeof (sourceImage as { height?: unknown }).height === 'number'
      ? Math.max(1, (sourceImage as { height: number }).height)
      : 1;

  if (typeof ImageData !== 'undefined') {
    let data: ImageData | null = null;
    if (
      typeof document !== 'undefined'
      && sourceImage
      && typeof (sourceImage as { getContext?: unknown }).getContext === 'function'
    ) {
      const scratch = document.createElement('canvas');
      scratch.width = width;
      scratch.height = height;
      const context = scratch.getContext('2d');
      if (context) {
        try {
          context.drawImage(sourceImage as CanvasImageSource, 0, 0);
          data = context.getImageData(0, 0, width, height);
        } catch {
          data = null;
        }
      }
    }
    try {
      data ??= new ImageData(width, height);
    } catch {
      data = null;
    }
    if (data) {
      image = data;
    }
  }

  // Last resort: distinct object so stack entries never share image refs.
  if (image === sourceImage) {
    image = {
      width,
      height,
      data: new Uint8ClampedArray(width * height * 4),
    } as unknown as Texture['image'];
  }

  const clone = new Texture(image);
  clone.colorSpace = source.colorSpace;
  clone.flipY = source.flipY;
  clone.name = source.name;
  clone.userData = { ...source.userData };
  clone.wrapS = source.wrapS;
  clone.wrapT = source.wrapT;
  clone.repeat.copy(source.repeat);
  clone.offset.copy(source.offset);
  clone.center.copy(source.center);
  clone.rotation = source.rotation;
  clone.needsUpdate = true;
  return clone;
}

/** Snapshot the live map as a stack-owned clone (or null). */
export function snapshotMaterialColorMap(
  material: MeshStandardMaterial,
): MaterialColorMapSnapshot {
  return {
    map: material.map ? cloneColorMapTexture(material.map) : null,
  };
}

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
 * Assign a snapshot map without disposing stack-owned textures.
 * Orphan live maps (not in `stackOwned`) are freed.
 */
export function restoreMaterialColorMap(
  material: MeshStandardMaterial,
  snapshot: MaterialColorMapSnapshot,
  stackOwned: readonly (Texture | null | undefined)[],
): void {
  const live = material.map;
  if (snapshot.map) {
    applyColorMap(material, snapshot.map);
  } else {
    material.map = null;
    syncMaterialMapAlpha(material, null);
    material.needsUpdate = true;
  }

  if (
    live
    && live !== snapshot.map
    && !stackOwned.includes(live)
  ) {
    disposeImageTexture(live);
  }
}

/**
 * If the live material still references a stack-owned map, give it a private
 * clone so the stack entry can be disposed without blacking the viewport.
 */
function adoptLiveStackMapsIfNeeded(command: MaterialColorMapCommand): void {
  const model = $model.get().models.find((entry) => entry.id === command.modelId);
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
): void {
  adoptLiveStackMapsIfNeeded(command);
  disposeMaterialColorMapCommand(command);
}

/** Dispose GPU resources owned by a stack entry when it leaves the session stack. */
export function disposeUndoableCommandResources(command: UndoableCommand): void {
  if (command.id === 'materialColorMap') {
    disposeMaterialColorMapCommandSafely(command);
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

/**
 * Assign a live map without disposing. Pair with `releaseOrphanColorMap` so
 * stack-owned undo clones survive until pruned.
 */
export function assignMaterialColorMapLive(
  material: MeshStandardMaterial,
  next: Texture | null,
): Texture | null {
  const previous = material.map;
  if (next) {
    applyColorMap(material, next);
  } else {
    material.map = null;
    syncMaterialMapAlpha(material, null);
    material.needsUpdate = true;
  }
  return previous;
}

/** Apply undo/redo for a materialColorMap stack entry onto the live model. */
export function applyMaterialColorMapCommand(
  command: MaterialColorMapCommand,
  direction: 'undo' | 'redo',
): void {
  const model = $model.get().models.find((entry) => entry.id === command.modelId);
  if (!model) {
    return;
  }

  const mesh = model.scene.getObjectByProperty('uuid', command.meshUuid);
  const material = findMeshStandardMaterial(mesh ?? null);
  if (!material) {
    return;
  }

  const snapshot = direction === 'undo' ? command.before : command.after;
  restoreMaterialColorMap(material, snapshot, [
    command.before.map,
    command.after.map,
  ]);
}
