import type { MeshStandardMaterial } from 'three';
import { Group, Texture } from 'three';
import { describe, expect, it, vi } from 'vitest';

import { deletePart } from '@/modules/create/domain/delete-part';
import { applyColorMap } from '@/modules/create/domain/material-color-map';
import { spawnPart } from '@/modules/create/domain/spawn-part';

describe('deletePart texture dispose', () => {
  it('disposes GPU texture and closes ImageBitmap on the color map', () => {
    const scene = new Group();
    const mesh = spawnPart(scene, 'box');
    const material = mesh.material as MeshStandardMaterial;
    const texture = new Texture();
    const close = vi.fn();
    texture.image = { close };
    const dispose = vi.spyOn(texture, 'dispose');
    applyColorMap(material, texture);

    expect(deletePart(mesh)).toBe(true);
    expect(mesh.parent).toBeNull();
    expect(dispose).toHaveBeenCalledOnce();
    expect(close).toHaveBeenCalledOnce();
  });
});
