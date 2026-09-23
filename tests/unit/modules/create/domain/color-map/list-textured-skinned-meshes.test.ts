import {
  Bone,
  BoxGeometry,
  Group,
  MeshStandardMaterial,
  Skeleton,
  SkinnedMesh,
  Texture,
} from 'three';
import { describe, expect, it } from 'vitest';

import {
  labelForTexturedSkinnedMesh,
  listTexturedSkinnedMeshes,
} from '@/modules/create/domain/color-map/list-textured-skinned-meshes';

function namedTexture(name: string): Texture {
  const texture = new Texture();
  texture.name = name;
  return texture;
}

function makeSkinned(
  options: {
    name?: string;
    map?: Texture | null;
  } = {},
): SkinnedMesh {
  const material = new MeshStandardMaterial();
  if (options.map) {
    material.map = options.map;
  }
  const bone = new Bone();
  const skinned = new SkinnedMesh(new BoxGeometry(1, 1, 1), material);
  if (options.name) {
    skinned.name = options.name;
  }
  skinned.add(bone);
  skinned.bind(new Skeleton([bone]));
  return skinned;
}

describe('labelForTexturedSkinnedMesh', () => {
  it('prefers texture.name and falls back to Texture', () => {
    const mesh = makeSkinned();
    expect(
      labelForTexturedSkinnedMesh(mesh, namedTexture('atlas.png'), {
        includeMeshName: false,
      }),
    ).toBe('atlas.png');
    expect(
      labelForTexturedSkinnedMesh(mesh, namedTexture(''), {
        includeMeshName: false,
      }),
    ).toBe('Texture');
  });

  it('includes mesh name when useful', () => {
    const mesh = makeSkinned({ name: 'Body' });
    expect(
      labelForTexturedSkinnedMesh(mesh, namedTexture('atlas.png'), {
        includeMeshName: true,
      }),
    ).toBe('Body · atlas.png');
    expect(
      labelForTexturedSkinnedMesh(mesh, namedTexture(''), {
        includeMeshName: true,
      }),
    ).toBe('Body');
  });
});

describe('listTexturedSkinnedMeshes', () => {
  it('returns only skinned meshes that have a .map', () => {
    const withMap = makeSkinned({
      name: 'Body',
      map: namedTexture('skin.png'),
    });
    const bare = makeSkinned({ name: 'Extras' });
    const scene = new Group();
    scene.add(withMap, bare);

    const entries = listTexturedSkinnedMeshes(scene);
    expect(entries).toHaveLength(1);
    expect(entries[0]!.mesh).toBe(withMap);
    expect(entries[0]!.label).toBe('skin.png');
  });

  it('returns empty when no textured skinned meshes', () => {
    const scene = new Group();
    scene.add(makeSkinned());
    expect(listTexturedSkinnedMeshes(scene)).toEqual([]);
  });

  it('includes mesh names when multiple textured meshes', () => {
    const body = makeSkinned({
      name: 'Body',
      map: namedTexture('body.png'),
    });
    const head = makeSkinned({
      name: 'Head',
      map: namedTexture('face.png'),
    });
    const scene = new Group();
    scene.add(body, head);

    const entries = listTexturedSkinnedMeshes(scene);
    expect(entries.map((entry) => entry.label)).toEqual([
      'Body · body.png',
      'Head · face.png',
    ]);
  });
});
