import {
  BoxGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Texture,
} from 'three';
import { describe, expect, it } from 'vitest';

import { labelForColorMap } from '@/modules/create/domain/color-map/color-map-label';
import { readPartColorMapEntry } from '@/modules/create/domain/color-map/read-part-color-map';
import { CREATE_PART_USER_DATA_KEY } from '@/modules/create/domain/part-data';

function namedTexture(name: string): Texture {
  const texture = new Texture();
  texture.name = name;
  return texture;
}

function stampPart(options: {
  name?: string;
  map?: Texture | null;
}): Mesh {
  const material = new MeshStandardMaterial();
  if (options.map) {
    material.map = options.map;
  }
  const mesh = new Mesh(new BoxGeometry(1, 1, 1), material);
  if (options.name) {
    mesh.name = options.name;
  }
  mesh.userData[CREATE_PART_USER_DATA_KEY] = {
    kind: 'box',
    params: { width: 1, height: 1, depth: 1 },
  };
  return mesh;
}

describe('labelForColorMap', () => {
  it('prefers texture.name and falls back to Texture', () => {
    expect(labelForColorMap(namedTexture('brick.png'))).toBe('brick.png');
    expect(labelForColorMap(namedTexture(''))).toBe('Texture');
    expect(labelForColorMap(namedTexture('   '))).toBe('Texture');
  });
});

describe('readPartColorMapEntry', () => {
  it('returns null when the part has no map', () => {
    expect(readPartColorMapEntry(stampPart({ name: 'box' }))).toBeNull();
  });

  it('returns null for non-stamped meshes', () => {
    const material = new MeshStandardMaterial({
      map: namedTexture('orphan.png'),
    });
    const mesh = new Mesh(new BoxGeometry(1, 1, 1), material);
    expect(readPartColorMapEntry(mesh)).toBeNull();
  });

  it('returns mesh, material, and label when stamped part has a map', () => {
    const map = namedTexture('wood.jpg');
    const mesh = stampPart({ name: 'box', map });
    const entry = readPartColorMapEntry(mesh);
    expect(entry).not.toBeNull();
    expect(entry?.mesh).toBe(mesh);
    expect(entry?.material.map).toBe(map);
    expect(entry?.label).toBe('wood.jpg');
  });

  it('falls back to Texture when map name is empty', () => {
    const mesh = stampPart({ map: namedTexture('') });
    expect(readPartColorMapEntry(mesh)?.label).toBe('Texture');
  });

  it('ignores groups and unstamped children under a scene', () => {
    const scene = new Group();
    scene.add(stampPart({ name: 'bare' }));
    scene.add(stampPart({ name: 'textured', map: namedTexture('a.png') }));
    const textured = scene.children[1]!;
    expect(readPartColorMapEntry(scene.children[0]!)).toBeNull();
    expect(readPartColorMapEntry(textured)?.label).toBe('a.png');
  });
});
