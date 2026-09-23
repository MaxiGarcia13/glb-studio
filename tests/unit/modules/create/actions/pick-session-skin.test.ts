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

import { applyUndoableCommand } from '@/modules/animation/stores/clip-store/actions/apply-undoable-command';
import {
  clearUndoStack,
  takeUndoCommand,
} from '@/modules/animation/stores/undo-stack-store';
import { applySkinnedSessionSkinTexture } from '@/modules/create/actions/apply-skinned-session-skin';
import {
  pickNoSessionSkin,
  pickSessionSkin,
} from '@/modules/create/actions/pick-session-skin';
import { removeSessionSkin } from '@/modules/create/actions/remove-session-skin';
import { $materialMapsRevision } from '@/modules/create/stores/material-maps-revision-store';
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

describe('pickSessionSkin / pickNoSessionSkin', () => {
  let mesh: SkinnedMesh;
  let material: MeshStandardMaterial;
  let scene: Group;

  beforeEach(() => {
    clearUndoStack();
    resetSessionSkinsStoreForTests();
    $materialMapsRevision.set(0);
    mesh = skinnedTarget();
    material = mesh.material as MeshStandardMaterial;
    scene = new Group();
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearUndoStack();
    resetSessionSkinsStoreForTests();
  });

  it('picks a prior wardrobe entry onto the live material', () => {
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
    const firstId = wardrobe.skins[0]!.id;
    expect(pickSessionSkin({
      modelId: 'model-1',
      skinId: firstId,
      scene,
    })).toBe(true);
    expect(material.map).toBe(first);
    expect(getSessionSkinWardrobe('model-1').activeSkinId).toBe(firstId);
  });

  it('pick none clears the live map and activeSkinId', () => {
    applySkinnedSessionSkinTexture({
      modelId: 'model-1',
      meshUuid: mesh.uuid,
      material,
      texture: namedTexture('a.png'),
    });
    expect(pickNoSessionSkin({ modelId: 'model-1', scene })).toBe(true);
    expect(material.map).toBeNull();
    expect(getSessionSkinWardrobe('model-1').activeSkinId).toBeNull();
    expect(getSessionSkinWardrobe('model-1').skins).toHaveLength(1);
  });

  it('remove inactive keeps the live map; remove active clears it', () => {
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
    const firstId = wardrobe.skins[0]!.id;
    const secondId = wardrobe.skins[1]!.id;

    expect(removeSessionSkin({
      modelId: 'model-1',
      skinId: firstId,
      scene,
    })).toBe(true);
    expect(material.map).toBe(second);
    expect(getSessionSkinWardrobe('model-1').skins).toHaveLength(1);

    expect(removeSessionSkin({
      modelId: 'model-1',
      skinId: secondId,
      scene,
    })).toBe(true);
    expect(material.map).toBeNull();
    expect(getSessionSkinWardrobe('model-1').skins).toHaveLength(0);
    expect(second.dispose).toHaveBeenCalled();
  });

  it('undo of remove-active restores wardrobe entry and live map', () => {
    const texture = namedTexture('a.png');
    applySkinnedSessionSkinTexture({
      modelId: 'model-1',
      meshUuid: mesh.uuid,
      material,
      texture,
    });
    const skinId = getSessionSkinWardrobe('model-1').skins[0]!.id;

    expect(removeSessionSkin({
      modelId: 'model-1',
      skinId,
      scene,
    })).toBe(true);
    expect(material.map).toBeNull();
    expect(getSessionSkinWardrobe('model-1').skins).toHaveLength(0);

    const command = takeUndoCommand();
    expect(command?.id).toBe('materialColorMap');
    if (!command || command.id !== 'materialColorMap') {
      return;
    }
    expect(command.sessionSkinRemoval?.skinId).toBe(skinId);

    applyUndoableCommand(command, 'undo');
    const restored = getSessionSkinWardrobe('model-1');
    expect(restored.skins).toHaveLength(1);
    expect(restored.skins[0]?.id).toBe(skinId);
    expect(restored.activeSkinId).toBe(skinId);
    expect(material.map).toBe(restored.skins[0]?.texture);

    applyUndoableCommand(command, 'redo');
    expect(material.map).toBeNull();
    expect(getSessionSkinWardrobe('model-1').skins).toHaveLength(0);
  });
});
