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
import {
  applySkinnedSessionSkinsFromFiles,
  applySkinnedSessionSkinTexture,
} from '@/modules/create/actions/apply-skinned-session-skin';
import { ImageTextureError } from '@/modules/create/adapters/load-image-texture';
import * as replaceMapFromFile from '@/modules/create/adapters/replace-material-color-map-from-file';
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
          blobUrl: undefined,
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

describe('applySkinnedSessionSkinsFromFiles', () => {
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

  it('appends every success and makes the last one live; skips failures', async () => {
    const mesh = skinnedTarget();
    const material = mesh.material as MeshStandardMaterial;
    const scene = new Group();
    scene.add(mesh);
    $model.set({
      models: [
        {
          id: 'model-1',
          fileName: 'char.glb',
          blobUrl: undefined,
          scene,
          source: 'imported',
        },
      ],
      activeModelId: 'model-1',
      previewModelIds: ['model-1'],
      phase: 'loaded',
      error: null,
    });

    vi.spyOn(replaceMapFromFile, 'loadSkinnedColorMapFromFile')
      .mockImplementation(async (file: File) => {
        if (file.name === 'bad.png') {
          throw new ImageTextureError('bad file');
        }
        return namedTexture(file.name);
      });

    const result = await applySkinnedSessionSkinsFromFiles({
      modelId: 'model-1',
      meshUuid: mesh.uuid,
      material,
      files: [
        new File([], 'a.png', { type: 'image/png' }),
        new File([], 'bad.png', { type: 'image/png' }),
        new File([], 'c.png', { type: 'image/png' }),
      ],
    });

    expect(result.entries).toHaveLength(2);
    expect(result.errors).toEqual(['bad file']);
    const wardrobe = getSessionSkinWardrobe('model-1');
    expect(wardrobe.skins.map((entry) => entry.label)).toEqual([
      'a.png',
      'c.png',
    ]);
    expect(wardrobe.activeSkinId).toBe(wardrobe.skins[1]?.id);
    expect(material.map?.name).toBe('c.png');
  });

  it('adds nothing when every file fails', async () => {
    const mesh = skinnedTarget();
    const material = mesh.material as MeshStandardMaterial;
    vi.spyOn(replaceMapFromFile, 'loadSkinnedColorMapFromFile')
      .mockRejectedValue(new ImageTextureError('nope'));

    const result = await applySkinnedSessionSkinsFromFiles({
      modelId: 'model-1',
      meshUuid: mesh.uuid,
      material,
      files: [new File([], 'x.png', { type: 'image/png' })],
    });

    expect(result.entries).toHaveLength(0);
    expect(result.errors).toEqual(['nope']);
    expect(material.map).toBeNull();
    expect(getSessionSkinWardrobe('model-1').skins).toHaveLength(0);
  });
});
