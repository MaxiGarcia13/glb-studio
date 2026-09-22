import { BoxGeometry, Group, Mesh, MeshStandardMaterial, Texture } from 'three';
import { describe, expect, it, vi } from 'vitest';

import { disposeScene } from '@/modules/viewport/utils/scene-dispose';

describe('disposeScene texture dispose', () => {
  it('disposes GPU texture and closes ImageBitmap on material maps', () => {
    const scene = new Group();
    const material = new MeshStandardMaterial();
    const texture = new Texture();
    const close = vi.fn();
    texture.image = { close };
    const dispose = vi.spyOn(texture, 'dispose');
    material.map = texture;
    scene.add(new Mesh(new BoxGeometry(1, 1, 1), material));

    disposeScene(scene);

    expect(dispose).toHaveBeenCalledOnce();
    expect(close).toHaveBeenCalledOnce();
  });
});
