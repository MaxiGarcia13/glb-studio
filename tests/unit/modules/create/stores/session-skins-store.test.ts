import {
  BoxGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Texture,
} from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { collectLiveColorMaps } from '@/modules/create/domain/color-map/collect-live-color-maps';
import {
  $sessionSkinsByModel,
  appendSessionSkin,
  disposeSessionSkinsForModel,
  getSessionSkinWardrobe,
  removeSessionSkinEntry,
  resetSessionSkinsStoreForTests,
  setActiveSessionSkinId,
} from '@/modules/create/stores/session-skins-store';

function namedTexture(name: string): Texture {
  const texture = new Texture();
  texture.name = name;
  texture.dispose = vi.fn();
  return texture;
}

afterEach(() => {
  resetSessionSkinsStoreForTests();
});

describe('collectLiveColorMaps', () => {
  it('collects distinct material.map textures under a scene', () => {
    const shared = namedTexture('shared.png');
    const scene = new Group();
    scene.add(
      new Mesh(
        new BoxGeometry(1, 1, 1),
        new MeshStandardMaterial({ map: shared }),
      ),
    );
    scene.add(
      new Mesh(
        new BoxGeometry(1, 1, 1),
        new MeshStandardMaterial({ map: shared }),
      ),
    );
    scene.add(new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial()));

    const live = collectLiveColorMaps(scene);
    expect(live.size).toBe(1);
    expect(live.has(shared)).toBe(true);
  });
});

describe('session skins store', () => {
  it('appends skins and keeps previous entries active on the newest', () => {
    const a = namedTexture('a.png');
    const b = namedTexture('b.png');
    const first = appendSessionSkin('model-1', { texture: a });
    const second = appendSessionSkin('model-1', { texture: b });

    const wardrobe = getSessionSkinWardrobe('model-1');
    expect(wardrobe.skins).toHaveLength(2);
    expect(wardrobe.skins[0]?.id).toBe(first.id);
    expect(wardrobe.skins[1]?.id).toBe(second.id);
    expect(wardrobe.activeSkinId).toBe(second.id);
    expect(wardrobe.skins[0]?.label).toBe('a.png');
  });

  it('setActiveSessionSkinId updates active without dropping skins', () => {
    const first = appendSessionSkin('model-1', { texture: namedTexture('a.png') });
    appendSessionSkin('model-1', { texture: namedTexture('b.png') });
    setActiveSessionSkinId('model-1', first.id);
    expect(getSessionSkinWardrobe('model-1').activeSkinId).toBe(first.id);
    setActiveSessionSkinId('model-1', null);
    expect(getSessionSkinWardrobe('model-1').activeSkinId).toBeNull();
  });

  it('removeSessionSkinEntry disposes the texture and clears active when needed', () => {
    const texture = namedTexture('gone.png');
    const entry = appendSessionSkin('model-1', { texture });
    removeSessionSkinEntry('model-1', entry.id);
    expect(texture.dispose).toHaveBeenCalledTimes(1);
    expect(getSessionSkinWardrobe('model-1').skins).toHaveLength(0);
    expect($sessionSkinsByModel.get()['model-1']).toBeUndefined();
  });

  it('disposeSessionSkinsForModel skips live maps so scene dispose can free them', () => {
    const live = namedTexture('live.png');
    const orphan = namedTexture('orphan.png');
    appendSessionSkin('model-1', { texture: live });
    appendSessionSkin('model-1', { texture: orphan });

    const scene = new Group();
    scene.add(
      new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial({ map: live })),
    );

    disposeSessionSkinsForModel('model-1', scene);
    expect(live.dispose).not.toHaveBeenCalled();
    expect(orphan.dispose).toHaveBeenCalledTimes(1);
    expect($sessionSkinsByModel.get()['model-1']).toBeUndefined();
  });

  it('returns an empty wardrobe for unknown models', () => {
    expect(getSessionSkinWardrobe('missing')).toEqual({
      skins: [],
      activeSkinId: null,
    });
  });
});
