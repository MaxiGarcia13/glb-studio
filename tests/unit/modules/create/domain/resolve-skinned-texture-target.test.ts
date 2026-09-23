import type { ModelEntry } from '@/modules/viewport/types/model';
import {
  Bone,
  BoxGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Skeleton,
  SkinnedMesh,
} from 'three';

import { describe, expect, it } from 'vitest';
import {
  getSkinnedTextureAvailability,
  listSkinnedMeshes,
  resolveSkinnedTextureMesh,
  resolveSkinnedTextureTarget,
} from '@/modules/create/domain/resolve-skinned-texture-target';

function model(
  source: ModelEntry['source'],
  scene: ModelEntry['scene'],
): ModelEntry {
  return { id: 'm1', fileName: 'm.glb', source, scene };
}

function makeSkinned(
  material: MeshStandardMaterial | MeshBasicMaterial = new MeshStandardMaterial(),
): SkinnedMesh {
  const bone = new Bone();
  const skinned = new SkinnedMesh(new BoxGeometry(1, 1, 1), material);
  skinned.add(bone);
  skinned.bind(new Skeleton([bone]));
  return skinned;
}

describe('listSkinnedMeshes', () => {
  it('returns every SkinnedMesh under the scene', () => {
    const a = makeSkinned();
    const b = makeSkinned();
    const scene = new Group();
    scene.add(a, b, new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial()));

    expect(listSkinnedMeshes(scene)).toEqual([a, b]);
  });
});

describe('resolveSkinnedTextureMesh', () => {
  it('prefers the selected SkinnedMesh when it is in the scene', () => {
    const a = makeSkinned();
    const b = makeSkinned();
    const scene = new Group();
    scene.add(a, b);

    expect(resolveSkinnedTextureMesh(scene, b)).toBe(b);
  });

  it('falls back to the sole skinned mesh when selection is not a SkinnedMesh', () => {
    const sole = makeSkinned();
    const scene = new Group();
    const bone = sole.skeleton.bones[0]!;
    scene.add(sole);

    expect(resolveSkinnedTextureMesh(scene, bone)).toBe(sole);
    expect(resolveSkinnedTextureMesh(scene, null)).toBe(sole);
  });

  it('returns null when multiple skinned meshes and no skinned selection', () => {
    const a = makeSkinned();
    const b = makeSkinned();
    const scene = new Group();
    scene.add(a, b);

    expect(resolveSkinnedTextureMesh(scene, null)).toBeNull();
    expect(resolveSkinnedTextureMesh(scene, a.skeleton.bones[0]!)).toBeNull();
  });

  it('ignores a SkinnedMesh selected outside the active scene', () => {
    const inScene = makeSkinned();
    const outside = makeSkinned();
    const scene = new Group();
    scene.add(inScene);
    new Group().add(outside);

    expect(resolveSkinnedTextureMesh(scene, outside)).toBe(inScene);
  });
});

describe('resolveSkinnedTextureTarget', () => {
  it('pairs the mesh with its MeshStandardMaterial', () => {
    const material = new MeshStandardMaterial({ color: 0xFF0000 });
    const mesh = makeSkinned(material);
    const scene = new Group();
    scene.add(mesh);

    expect(resolveSkinnedTextureTarget(scene, null)).toEqual({ mesh, material });
  });

  it('returns null when the mesh material is not MeshStandardMaterial', () => {
    const mesh = makeSkinned(new MeshBasicMaterial());
    const scene = new Group();
    scene.add(mesh);

    expect(resolveSkinnedTextureTarget(scene, null)).toBeNull();
  });
});

describe('getSkinnedTextureAvailability', () => {
  it('enables for a skinned library model with a sole standard skinned mesh', () => {
    const material = new MeshStandardMaterial();
    const mesh = makeSkinned(material);
    const scene = new Group();
    scene.add(mesh);

    expect(getSkinnedTextureAvailability(model('imported', scene), null)).toEqual({
      enabled: true,
      reason: 'Apply a color map (prefer UV atlas skins)',
      target: { mesh, material },
    });
  });

  it('uses the selected skinned mesh when several exist', () => {
    const materialA = new MeshStandardMaterial();
    const materialB = new MeshStandardMaterial();
    const a = makeSkinned(materialA);
    const b = makeSkinned(materialB);
    const scene = new Group();
    scene.add(a, b);

    expect(getSkinnedTextureAvailability(model('imported', scene), b)).toEqual({
      enabled: true,
      reason: 'Apply a color map (prefer UV atlas skins)',
      target: { mesh: b, material: materialB },
    });
  });

  it('disables when focus is not a skinned library model', () => {
    const scene = new Group();
    scene.add(new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial()));

    expect(getSkinnedTextureAvailability(model('created', scene), null)).toEqual({
      enabled: false,
      reason: 'Focus a skinned model to apply a texture',
      target: null,
    });
    expect(getSkinnedTextureAvailability(null, null).enabled).toBe(false);
  });

  it('disables multi-mesh skinned models until a skinned mesh is selected', () => {
    const scene = new Group();
    scene.add(makeSkinned(), makeSkinned());

    expect(getSkinnedTextureAvailability(model('imported', scene), null)).toEqual({
      enabled: false,
      reason: 'Select a skinned mesh to texture',
      target: null,
    });
  });

  it('disables when the target material cannot hold a color map', () => {
    const scene = new Group();
    scene.add(makeSkinned(new MeshBasicMaterial()));

    expect(getSkinnedTextureAvailability(model('imported', scene), null)).toEqual({
      enabled: false,
      reason: 'Material does not support a color map',
      target: null,
    });
  });
});
