import { Group, Object3D } from 'three';
import { describe, expect, it } from 'vitest';

import {
  findModelOwningObject,
  isNodeNameTaken,
} from '@/modules/viewport/domain/node-name';

describe('isNodeNameTaken', () => {
  it('returns false when the name is free or only held by except', () => {
    const root = new Group();
    const self = new Object3D();
    self.name = 'Hips';
    root.add(self);

    expect(isNodeNameTaken(root, 'Spine', self)).toBe(false);
    expect(isNodeNameTaken(root, 'Hips', self)).toBe(false);
  });

  it('returns true when another node already uses the name', () => {
    const root = new Group();
    const hips = new Object3D();
    hips.name = 'Hips';
    const other = new Object3D();
    other.name = 'Spine';
    root.add(hips, other);

    expect(isNodeNameTaken(root, 'Hips', other)).toBe(true);
  });

  it('ignores empty names while traversing', () => {
    const root = new Group();
    const unnamed = new Object3D();
    const self = new Object3D();
    self.name = 'box';
    root.add(unnamed, self);

    expect(isNodeNameTaken(root, '', self)).toBe(false);
  });
});

describe('findModelOwningObject', () => {
  it('returns the model whose scene contains the object', () => {
    const sceneA = new Group();
    const sceneB = new Group();
    const child = new Object3D();
    sceneB.add(child);

    const models = [
      { id: 'a', fileName: 'a.glb', scene: sceneA, source: 'imported' as const },
      { id: 'b', fileName: 'b.glb', scene: sceneB, source: 'imported' as const },
    ];

    expect(findModelOwningObject(models, child)?.id).toBe('b');
    expect(findModelOwningObject(models, sceneA)?.id).toBe('a');
    expect(findModelOwningObject(models, new Object3D())).toBeNull();
  });
});
