import { BoxGeometry, Group, Mesh, MeshStandardMaterial, Object3D } from 'three';
import { describe, expect, it } from 'vitest';

import {
  findUnderRoot,
  resolveCreateSelection,
} from '@/modules/create/domain/hierarchy/create-graph-lookup';
import { writeCreatePart } from '@/modules/create/domain/part-data';
import { EMPTY_SELECTION } from '@/modules/viewport/types/selection';

function createPart(name: string): Mesh {
  const mesh = new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial());
  mesh.name = name;
  writeCreatePart(mesh, {
    kind: 'box',
    params: { width: 1, height: 1, depth: 1 },
  });
  return mesh;
}

describe('findUnderRoot', () => {
  it('finds the root itself and descendants by uuid', () => {
    const root = new Group();
    const child = new Object3D();
    root.add(child);
    expect(findUnderRoot(root, root.uuid)).toBe(root);
    expect(findUnderRoot(root, child.uuid)).toBe(child);
    expect(findUnderRoot(root, 'missing')).toBeNull();
  });
});

describe('resolveCreateSelection', () => {
  it('returns empty selection when no create hierarchy nodes resolve', () => {
    const root = new Group();
    const plain = new Object3D();
    root.add(plain);
    expect(resolveCreateSelection(root, [plain.uuid, 'missing'])).toEqual(
      EMPTY_SELECTION,
    );
  });

  it('selects resolved create nodes with the last as active', () => {
    const root = new Group();
    const a = createPart('a');
    const b = createPart('b');
    root.add(a, b);

    expect(resolveCreateSelection(root, [a.uuid, b.uuid])).toEqual({
      object: b,
      objects: [a, b],
      modelIds: [],
      kind: 'parts',
    });
  });
});
