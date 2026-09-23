import type { ClipEntry } from '@/modules/animation/types/clip';
import type { ModelEntry } from '@/modules/viewport/types/model';

import { AnimationClip, Bone, Group, Skeleton, SkinnedMesh } from 'three';
import { describe, expect, it } from 'vitest';
import { collectModelExportClips } from '@/modules/export/domain/model-glb';

function importedModel(id: string): ModelEntry {
  const bone = new Bone();
  bone.name = 'Hips';
  const skeleton = new Skeleton([bone]);
  const mesh = new SkinnedMesh();
  mesh.name = 'Body';
  mesh.bind(skeleton);
  const scene = new Group();
  scene.name = id;
  scene.add(bone);
  scene.add(mesh);
  return {
    id,
    fileName: `${id}.glb`,
    scene,
    source: 'imported',
  };
}

function clip(partial: Partial<ClipEntry> & Pick<ClipEntry, 'id' | 'name'>): ClipEntry {
  return {
    status: 'ready',
    ownerModelId: null,
    timeScale: 1,
    trimIn: 0,
    trimOut: 1,
    clip: new AnimationClip(partial.name, 1, []),
    ...partial,
  } as ClipEntry;
}

describe('collectModelExportClips', () => {
  it('includes owned ready clips for created models and skips shared', () => {
    const model: ModelEntry = {
      id: 'c1',
      fileName: 'New.glb',
      scene: new Group(),
      source: 'created',
    };
    const clips = [
      clip({ id: 'o1', name: 'Idle', ownerModelId: 'c1' }),
      clip({ id: 's1', name: 'SharedWalk', ownerModelId: null }),
      clip({ id: 'o2', name: 'Other', ownerModelId: 'other' }),
    ];
    expect(collectModelExportClips(model, clips).map((entry) => entry.id)).toEqual(
      ['o1'],
    );
  });

  it('includes owned ready + tracking-less shared for imported models', () => {
    const model = importedModel('m1');
    const clips = [
      clip({ id: 'o1', name: 'Idle', ownerModelId: 'm1' }),
      clip({
        id: 's1',
        name: 'SharedEmpty',
        ownerModelId: null,
        clip: new AnimationClip('SharedEmpty', 1, []),
      }),
      clip({ id: 'draft', name: 'Draft', ownerModelId: 'm1', status: 'draft' }),
    ];
    expect(collectModelExportClips(model, clips).map((entry) => entry.id)).toEqual(
      ['o1', 's1'],
    );
  });
});
