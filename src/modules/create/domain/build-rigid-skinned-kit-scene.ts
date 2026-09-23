import type { BufferGeometry, Material, Object3D } from 'three';
import type { GroupRecipe, PartRecipe } from '@/modules/create/types/kit';

import {
  Bone,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshStandardMaterial,
  Skeleton,
  SkinnedMesh,
  Uint16BufferAttribute,
} from 'three';

import { ARMATURE_GROUP_NAME } from '@/modules/create/constants/armature';

import { orientSkeletonMixamoAxes } from './orient-skeleton-mixamo-axes';
import { getPartKind } from './part-kind';

/** Mesh recipe input for offline rigid skinning (registered MeshKit or maintainer recipe). */
export interface RigidSkinnedKitRecipe {
  id?: string;
  label: string;
  groups?: readonly GroupRecipe[];
  parts: readonly PartRecipe[];
}

/**
 * Build a bind-pose skinned scene from a mesh kit recipe (rigid weights).
 * Offline / maintainer use (US-33 kit GLB); not generated at runtime in the app.
 * Bones are reoriented to Mixamo local-+Y chain axes so US-6 retarget quats land correctly.
 */
export function buildRigidSkinnedSceneFromKit(kit: RigidSkinnedKitRecipe): Group {
  const root = new Group();
  root.name = kit.label;

  const groups = kit.groups ?? [];
  if (groups.length === 0) {
    throw new Error(`Kit "${kit.id ?? kit.label}" has no groups to turn into a skeleton`);
  }

  const nodesByName = new Map<string, Object3D>();
  const bones: Bone[] = [];

  const armature = new Group();
  armature.name = ARMATURE_GROUP_NAME;
  root.add(armature);
  nodesByName.set(ARMATURE_GROUP_NAME, armature);

  for (const recipe of groups) {
    if (recipe.name === ARMATURE_GROUP_NAME) {
      armature.position.set(...recipe.position);
      if (recipe.rotation) {
        armature.rotation.set(...recipe.rotation);
      }
      continue;
    }

    const bone = new Bone();
    bone.name = recipe.name;
    bone.position.set(...recipe.position);
    if (recipe.rotation) {
      bone.rotation.set(...recipe.rotation);
    }
    // Park under root at authored world TRS before attach reparents.
    root.add(bone);
    nodesByName.set(recipe.name, bone);
    bones.push(bone);
  }

  for (const recipe of groups) {
    if (!recipe.parent) {
      continue;
    }
    const child = nodesByName.get(recipe.name);
    const parent = nodesByName.get(recipe.parent);
    if (!child || !parent || child === armature) {
      continue;
    }
    parent.attach(child);
  }

  if (bones.length === 0) {
    throw new Error(`Kit "${kit.id ?? kit.label}" produced no bones`);
  }

  root.updateMatrixWorld(true);
  orientSkeletonMixamoAxes(bones);
  root.updateMatrixWorld(true);

  const skeleton = new Skeleton(bones);
  const pendingMeshes: Array<{ mesh: Mesh; boneIndex: number }> = [];

  for (const recipe of kit.parts) {
    if (!recipe.parent) {
      throw new Error(
        `Part "${recipe.name}" in kit "${kit.id ?? kit.label}" has no parent bone`,
      );
    }
    const parentNode = nodesByName.get(recipe.parent);
    if (!(parentNode instanceof Bone)) {
      throw new TypeError(
        `Part "${recipe.name}" parent "${recipe.parent}" is not a bone`,
      );
    }
    const boneIndex = bones.indexOf(parentNode);
    if (boneIndex < 0) {
      throw new Error(`Bone "${recipe.parent}" missing from skeleton list`);
    }

    const kind = getPartKind(recipe.kind);
    const geometry = kind.createGeometry({ ...recipe.params });
    const material = new MeshStandardMaterial({ color: recipe.color });
    const mesh = new Mesh(geometry, material);
    mesh.name = recipe.name;
    mesh.position.set(...recipe.position);
    mesh.rotation.set(...recipe.rotation);
    if (recipe.scale) {
      mesh.scale.set(...recipe.scale);
    }
    root.add(mesh);
    parentNode.attach(mesh);
    pendingMeshes.push({ mesh, boneIndex });
  }

  root.updateMatrixWorld(true);

  for (const { mesh, boneIndex } of pendingMeshes) {
    const skinned = meshToRigidSkinned(mesh, skeleton, boneIndex);
    mesh.removeFromParent();
    disposeMeshResources(mesh);
    root.add(skinned);
  }

  skeleton.calculateInverses();
  return root;
}

function meshToRigidSkinned(
  mesh: Mesh,
  skeleton: Skeleton,
  boneIndex: number,
): SkinnedMesh {
  const geometry = mesh.geometry.clone();
  geometry.applyMatrix4(mesh.matrixWorld);
  addRigidSkinAttributes(geometry, boneIndex);

  const material = Array.isArray(mesh.material)
    ? mesh.material.map((entry) => entry.clone())
    : mesh.material.clone();

  const skinned = new SkinnedMesh(geometry, material);
  skinned.name = mesh.name;
  skinned.bind(skeleton);
  return skinned;
}

function addRigidSkinAttributes(geometry: BufferGeometry, boneIndex: number): void {
  const count = geometry.getAttribute('position').count;
  const skinIndices = new Uint16Array(count * 4);
  const skinWeights = new Float32Array(count * 4);
  for (let i = 0; i < count; i += 1) {
    const offset = i * 4;
    skinIndices[offset] = boneIndex;
    skinWeights[offset] = 1;
  }
  geometry.setAttribute('skinIndex', new Uint16BufferAttribute(skinIndices, 4));
  geometry.setAttribute('skinWeight', new Float32BufferAttribute(skinWeights, 4));
}

function disposeMeshResources(mesh: Mesh): void {
  mesh.geometry.dispose();
  disposeMaterial(mesh.material);
}

function disposeMaterial(material: Material | Material[]): void {
  if (Array.isArray(material)) {
    for (const entry of material) {
      entry.dispose();
    }
    return;
  }
  material.dispose();
}
