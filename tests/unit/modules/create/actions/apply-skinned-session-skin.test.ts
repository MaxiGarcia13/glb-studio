import {
  Bone,
  BoxGeometry,
  Group,
  MeshStandardMaterial,
  Skeleton,
  SkinnedMesh,
  Texture,
} from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clearUndoStack,
} from '@/modules/animation/stores/undo-stack-store';
import { applySkinnedSessionSkinTexture } from '@/modules/create/actions/apply-skinned-session-skin';
import {
  $materialMapsRevision,
} from '@/modules/create/stores/material-maps-revision-store';
import {
  getSessionSkinWardrobe,
  resetSessionSkinsStoreForTests,
} from '@/modules/create/stores/session-skins-store';
import { $model } from '@/modules/viewport/stores/model-store';

function namedTexture(name: string): Texture {
  const texture = new Texture({
    width: 4,
    height: 4,
    data: new Uint8ClampedArray(4 * 4 * 4),
  } as never);
  texture.name = name;
  texture.needsUpdate = true;
  texture.dispose = vi.fn();
  return texture;
}

function skinnedTarget(): SkinnedMesh {
  const bone = new Bone();
  const mesh = new SkinnedMesh(
    new BoxGeometry(1, 1, 1),
    new MeshStandardMaterial(),
  );
  mesh.bind(new Skeleton([bone]));
  return mesh;
}

describe('applySkinnedSessionSkinTexture', () => {
  beforeEach(() => {
    clearUndoStack();
    resetSessionSkinsStoreForTests();
    $materialMapsRevision.set(0);
    $model.set({
      models: [],
      activeModelId: null,
      previewModelIds: [],
      phase: 'idle',
      error: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearUndoStack();
    resetSessionSkinsStoreForTests();
  });

  it('appends a wardrobe entry, keeps previous skins, and sets the new one active', () => {
    const mesh = skinnedTarget();
    const material = mesh.material as MeshStandardMaterial;
    const scene = new Group();
    scene.add(mesh);
    $model.set({
      models: [
        {
          id: 'model-1',
          fileName: 'char.glb',
          blobUrl: null,
          scene,
          source: 'imported',
        },
      ],
      activeModelId: 'model-1',
      previewModelIds: ['model-1'],
      phase: 'loaded',
      error: null,
    });

    const first = namedTexture('a.png');
    const second = namedTexture('b.png');

    applySkinnedSessionSkinTexture({
      modelId: 'model-1',
      meshUuid: mesh.uuid,
      material,
      texture: first,
    });
    applySkinnedSessionSkinTexture({
      modelId: 'model-1',
      meshUuid: mesh.uuid,
      material,
      texture: second,
    });

    const wardrobe = getSessionSkinWardrobe('model-1');
    expect(wardrobe.skins).toHaveLength(2);
    expect(wardrobe.skins.map((entry) => entry.label)).toEqual([
      'a.png',
      'b.png',
    ]);
    expect(wardrobe.activeSkinId).toBe(wardrobe.skins[1]?.id);
    expect(material.map).toBe(second);
    // Previous wardrobe texture must not be freed as a live orphan.
    expect(first.dispose).not.toHaveBeenCalled();
  });
});
