import { Group, Object3D } from 'three';
import { describe, expect, it } from 'vitest';

import { nextObjectName } from '@/modules/create/domain/object-name';

describe('nextObjectName', () => {
  it('returns the base name when unused', () => {
    expect(nextObjectName(new Group(), 'box')).toBe('box');
  });

  it('appends _2, _3, … when the base and earlier suffixes are taken', () => {
    const root = new Group();
    const a = new Object3D();
    a.name = 'box';
    const b = new Object3D();
    b.name = 'box_2';
    root.add(a, b);

    expect(nextObjectName(root, 'box')).toBe('box_3');
  });

  it('ignores empty names while traversing', () => {
    const root = new Group();
    root.add(new Object3D());
    expect(nextObjectName(root, 'group')).toBe('group');
  });
});
