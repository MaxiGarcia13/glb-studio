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
  $commandStack,
  clearUndoStack,
} from '@/modules/animation/stores/undo-stack-store';
import {
  applySkinnedSessionSkinsFromFiles,
  applySkinnedSessionSkinTexture,
} from '@/modules/create/actions/apply-skinned-session-skin';
import {
  pickNoSessionSkin,
  pickSessionSkin,
} from '@/modules/create/actions/pick-session-skin';
import { removeSessionSkin } from '@/modules/create/actions/remove-session-skin';
import { ImageTextureError } from '@/modules/create/adapters/load-image-texture';
import * as replaceMapFromFile from '@/modules/create/adapters/replace-material-color-map-from-file';
import { $materialMapsRevision } from '@/modules/create/stores/material-maps-revision-store';
import {
  $sessionSkinsByModel,
  getSessionSkinWardrobe,
  resetSessionSkinsStoreForTests,
} from '@/modules/create/stores/session-skins-store';
import { $model, removeModel } from '@/modules/viewport/stores/model-store';

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

function mountSkinnedModel(mesh: SkinnedMesh): Group {
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
  return scene;
}

describe('session skins acceptance', () => {
  let mesh: SkinnedMesh;
  let material: MeshStandardMaterial;
  let scene: Group;

  beforeEach(() => {
    clearUndoStack();
    resetSessionSkinsStoreForTests();
    $materialMapsRevision.set(0);
    mesh = skinnedTarget();
    material = mesh.material as MeshStandardMaterial;
    scene = mountSkinnedModel(mesh);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearUndoStack();
    resetSessionSkinsStoreForTests();
    $model.set({
      models: [],
      activeModelId: null,
      previewModelIds: [],
      phase: 'idle',
      error: null,
    });
  });

  it('append keeps previous; last apply is live', () => {
    applySkinnedSessionSkinTexture({
      modelId: 'model-1',
      meshUuid: mesh.uuid,
      material,
      texture: namedTexture('a.png'),
    });
    applySkinnedSessionSkinTexture({
      modelId: 'model-1',
      meshUuid: mesh.uuid,
      material,
      texture: namedTexture('b.png'),
    });

    const wardrobe = getSessionSkinWardrobe('model-1');
    expect(wardrobe.skins).toHaveLength(2);
    expect(wardrobe.skins.map((entry) => entry.label)).toEqual([
      'a.png',
      'b.png',
    ]);
    expect(wardrobe.activeSkinId).toBe(wardrobe.skins[1]?.id);
    expect(material.map?.name).toBe('b.png');
  });

  it('pick A then none clears material but keeps list entries', () => {
    applySkinnedSessionSkinTexture({
      modelId: 'model-1',
      meshUuid: mesh.uuid,
      material,
      texture: namedTexture('a.png'),
    });
    applySkinnedSessionSkinTexture({
      modelId: 'model-1',
      meshUuid: mesh.uuid,
      material,
      texture: namedTexture('b.png'),
    });

    const firstId = getSessionSkinWardrobe('model-1').skins[0]!.id;
    expect(pickSessionSkin({
      modelId: 'model-1',
      skinId: firstId,
      scene,
    })).toBe(true);
    expect(material.map?.name).toBe('a.png');

    expect(pickNoSessionSkin({ modelId: 'model-1', scene })).toBe(true);
    expect(material.map).toBeNull();
    expect(getSessionSkinWardrobe('model-1').activeSkinId).toBeNull();
    expect(getSessionSkinWardrobe('model-1').skins).toHaveLength(2);
  });

  it('remove inactive keeps live; remove active clears', () => {
    applySkinnedSessionSkinTexture({
      modelId: 'model-1',
      meshUuid: mesh.uuid,
      material,
      texture: namedTexture('a.png'),
    });
    applySkinnedSessionSkinTexture({
      modelId: 'model-1',
      meshUuid: mesh.uuid,
      material,
      texture: namedTexture('b.png'),
    });

    const wardrobe = getSessionSkinWardrobe('model-1');
    const firstId = wardrobe.skins[0]!.id;
    const secondId = wardrobe.skins[1]!.id;

    expect(removeSessionSkin({
      modelId: 'model-1',
      skinId: firstId,
      scene,
    })).toBe(true);
    expect(material.map?.name).toBe('b.png');
    expect(getSessionSkinWardrobe('model-1').skins).toHaveLength(1);

    expect(removeSessionSkin({
      modelId: 'model-1',
      skinId: secondId,
      scene,
    })).toBe(true);
    expect(material.map).toBeNull();
    expect(getSessionSkinWardrobe('model-1').skins).toHaveLength(0);
  });

  it('dispose on unload clears wardrobe and frees orphan skins', () => {
    const orphan = namedTexture('orphan.png');
    const live = namedTexture('live.png');
    applySkinnedSessionSkinTexture({
      modelId: 'model-1',
      meshUuid: mesh.uuid,
      material,
      texture: orphan,
    });
    applySkinnedSessionSkinTexture({
      modelId: 'model-1',
      meshUuid: mesh.uuid,
      material,
      texture: live,
    });

    removeModel('model-1');

    expect($sessionSkinsByModel.get()['model-1']).toBeUndefined();
    expect(orphan.dispose).toHaveBeenCalled();
    expect($model.get().models).toHaveLength(0);
  });

  it('failed decode adds nothing and does not push undo', async () => {
    vi.spyOn(replaceMapFromFile, 'loadSkinnedColorMapFromFile')
      .mockRejectedValue(new ImageTextureError('nope'));
    clearUndoStack();

    const result = await applySkinnedSessionSkinsFromFiles({
      modelId: 'model-1',
      meshUuid: mesh.uuid,
      material,
      files: [new File([], 'bad.png', { type: 'image/png' })],
    });

    expect(result.entries).toHaveLength(0);
    expect(result.errors).toEqual(['nope']);
    expect(material.map).toBeNull();
    expect(getSessionSkinWardrobe('model-1').skins).toHaveLength(0);
    expect($commandStack.get().past).toHaveLength(0);
  });
});
