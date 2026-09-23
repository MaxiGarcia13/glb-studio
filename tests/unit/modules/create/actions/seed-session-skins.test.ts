import {
  Bone,
  BoxGeometry,
  Group,
  MeshStandardMaterial,
  Skeleton,
  SkinnedMesh,
  Texture,
} from 'three';
import { afterEach, describe, expect, it } from 'vitest';

import { seedSessionSkinsFromModel } from '@/modules/create/actions/seed-session-skins';
import {
  getSessionSkinWardrobe,
  resetSessionSkinsStoreForTests,
} from '@/modules/create/stores/session-skins-store';
import type { ModelEntry } from '@/modules/viewport/types/model';

function namedTexture(name: string): Texture {
  const texture = new Texture();
  texture.name = name;
  return texture;
}

function makeSkinnedEntry(options: {
  id?: string;
  map?: Texture | null;
  source?: ModelEntry['source'];
}): ModelEntry {
  const material = new MeshStandardMaterial();
  if (options.map) {
    material.map = options.map;
  }
  const bone = new Bone();
  const mesh = new SkinnedMesh(new BoxGeometry(1, 1, 1), material);
  mesh.add(bone);
  mesh.bind(new Skeleton([bone]));
  const scene = new Group();
  scene.add(mesh);
  return {
    id: options.id ?? 'model-1',
    fileName: 'char.glb',
    scene,
    source: options.source ?? 'imported',
  };
}

afterEach(() => {
  resetSessionSkinsStoreForTests();
});

describe('seedSessionSkinsFromModel', () => {
  it('seeds one active entry from an existing imported .map', () => {
    const map = namedTexture('baked.png');
    const model = makeSkinnedEntry({ map });
    expect(seedSessionSkinsFromModel(model)).toBe(true);
    const wardrobe = getSessionSkinWardrobe(model.id);
    expect(wardrobe.skins).toHaveLength(1);
    expect(wardrobe.skins[0]?.texture).toBe(map);
    expect(wardrobe.skins[0]?.label).toBe('baked.png');
    expect(wardrobe.activeSkinId).toBe(wardrobe.skins[0]?.id);
  });

  it('does nothing when there is no map', () => {
    const model = makeSkinnedEntry({});
    expect(seedSessionSkinsFromModel(model)).toBe(false);
    expect(getSessionSkinWardrobe(model.id).skins).toHaveLength(0);
  });

  it('does not seed created (non-skinned-library) models', () => {
    const map = namedTexture('part.png');
    const model = makeSkinnedEntry({ map, source: 'created' });
    expect(seedSessionSkinsFromModel(model)).toBe(false);
    expect(getSessionSkinWardrobe(model.id).skins).toHaveLength(0);
  });

  it('does not re-seed when the wardrobe already has entries', () => {
    const map = namedTexture('baked.png');
    const model = makeSkinnedEntry({ map });
    expect(seedSessionSkinsFromModel(model)).toBe(true);
    expect(seedSessionSkinsFromModel(model)).toBe(false);
    expect(getSessionSkinWardrobe(model.id).skins).toHaveLength(1);
  });
});
