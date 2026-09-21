import {
  BoxGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Skeleton,
  SkinnedMesh,
  Vector3,
} from 'three';
import { describe, expect, it } from 'vitest';

import { writeCreateJoint } from '@/modules/create/domain/group-data';
import { writeCreatePart } from '@/modules/create/domain/part-data';
import { bindMeshesRigid } from '@/modules/create/domain/skinning/bind-meshes-rigid';
import { buildBonesFromCreateGroups } from '@/modules/create/domain/skinning/build-bones-from-create-groups';

function createPart(name: string): Mesh {
  const mesh = new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial());
  mesh.name = name;
  writeCreatePart(mesh, {
    kind: 'box',
    params: { width: 1, height: 1, depth: 1 },
  });
  return mesh;
}

function createGroup(name: string): Group {
  const group = new Group();
  group.name = name;
  writeCreateJoint(group);
  return group;
}

function buildSkeleton(scene: Group): Skeleton {
  const { bones, armature } = buildBonesFromCreateGroups(scene);
  if (armature) {
    // Keep hierarchy reachable for bind pose updates.
    scene.add(armature);
  } else {
    for (const bone of bones) {
      if (!bone.parent) {
        scene.add(bone);
      }
    }
  }
  return new Skeleton(bones);
}

describe('bindMeshesRigid', () => {
  it('binds each part rigidly to its parent create-group bone', () => {
    const scene = new Group();
    const hips = createGroup('Hips');
    const spine = createGroup('Spine');
    hips.position.set(0, 1, 0);
    spine.position.set(0, 0.5, 0);
    const torso = createPart('torso');
    const chest = createPart('chest');
    torso.position.set(0, 0, 0);
    chest.position.set(0, 0.2, 0);
    scene.add(hips);
    hips.add(torso, spine);
    spine.add(chest);
    scene.updateMatrixWorld(true);

    const skeleton = buildSkeleton(scene);
    const hipsIndex = skeleton.bones.findIndex((bone) => bone.name === 'Hips');
    const spineIndex = skeleton.bones.findIndex((bone) => bone.name === 'Spine');

    const { skinnedMeshes, skippedCount } = bindMeshesRigid(scene, skeleton);

    expect(skippedCount).toBe(0);
    expect(skinnedMeshes).toHaveLength(2);
    expect(skinnedMeshes.every((mesh) => mesh instanceof SkinnedMesh)).toBe(true);

    const torsoSkinned = skinnedMeshes.find((mesh) => mesh.name === 'torso')!;
    const chestSkinned = skinnedMeshes.find((mesh) => mesh.name === 'chest')!;
    expect(torsoSkinned.geometry.getAttribute('skinIndex').getX(0)).toBe(hipsIndex);
    expect(torsoSkinned.geometry.getAttribute('skinWeight').getX(0)).toBe(1);
    expect(chestSkinned.geometry.getAttribute('skinIndex').getX(0)).toBe(spineIndex);
    expect(skeleton.boneInverses).toHaveLength(skeleton.bones.length);
  });

  it('preserves rest pose: skinned vertices match original world positions', () => {
    const scene = new Group();
    const hips = createGroup('Hips');
    hips.position.set(0, 1, 0);
    const torso = createPart('torso');
    torso.position.set(0.5, 0.25, 0);
    scene.add(hips);
    hips.add(torso);
    scene.updateMatrixWorld(true);

    const originalCorner = new Vector3(0.5, 0.5, 0.5);
    torso.localToWorld(originalCorner);

    const skeleton = buildSkeleton(scene);
    const { skinnedMeshes } = bindMeshesRigid(scene, skeleton);
    const skinned = skinnedMeshes[0]!;
    skinned.updateMatrixWorld(true);

    // BoxGeometry corner (0.5,0.5,0.5) baked via matrixWorld into skinned geometry.
    const baked = new Vector3().fromBufferAttribute(
      skinned.geometry.getAttribute('position'),
      findVertexIndex(skinned, originalCorner),
    );
    expect(baked.distanceTo(originalCorner)).toBeLessThan(1e-5);
  });

  it('parents parts with no create-group ancestor to the root bone', () => {
    const scene = new Group();
    const hips = createGroup('Hips');
    hips.position.set(0, 1, 0);
    const orphan = createPart('orphan');
    orphan.position.set(2, 0, 0);
    scene.add(hips, orphan);
    hips.add(createPart('hip_mesh'));
    scene.updateMatrixWorld(true);

    const skeleton = buildSkeleton(scene);
    const rootIndex = skeleton.bones.findIndex((bone) => bone.name === 'Hips');

    const { skinnedMeshes, skippedCount } = bindMeshesRigid(scene, skeleton);
    const orphanSkinned = skinnedMeshes.find((mesh) => mesh.name === 'orphan')!;

    expect(skippedCount).toBe(0);
    expect(orphanSkinned.geometry.getAttribute('skinIndex').getX(0)).toBe(rootIndex);
  });
});

function findVertexIndex(skinned: SkinnedMesh, target: Vector3): number {
  const position = skinned.geometry.getAttribute('position');
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < position.count; i += 1) {
    const point = new Vector3().fromBufferAttribute(position, i);
    const dist = point.distanceTo(target);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best;
}
