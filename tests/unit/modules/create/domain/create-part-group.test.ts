import { BoxGeometry, Group, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';

import {
  averageWorldPosition,
  createEmptyPartGroup,
} from '@/modules/create/domain/create-part-group';
import { attachAllUnder } from '@/modules/create/domain/parent-part';
import { writeCreatePart } from '@/modules/create/domain/part-data';

function createPart(name: string): Mesh {
  const mesh = new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial());
  mesh.name = name;
  writeCreatePart(mesh, {
    kind: 'box',
    params: { width: 1, height: 1, depth: 1 },
  });
  return mesh;
}

describe('averageWorldPosition', () => {
  it('returns zero for an empty list', () => {
    expect(averageWorldPosition([]).toArray()).toEqual([0, 0, 0]);
  });

  it('averages world origins of the given objects', () => {
    const root = new Group();
    const a = createPart('a');
    const b = createPart('b');
    a.position.set(0, 2, 0);
    b.position.set(4, 6, 0);
    root.add(a, b);
    root.updateMatrixWorld(true);

    expect(averageWorldPosition([a, b]).toArray()).toEqual([2, 4, 0]);
  });
});

describe('createEmptyPartGroup', () => {
  it('places the group at worldPivot so attach keeps children in place', () => {
    const partsRoot = new Group();
    const a = createPart('a');
    const b = createPart('b');
    a.position.set(1, 2, 0);
    b.position.set(3, 4, 0);
    partsRoot.add(a, b);
    partsRoot.updateMatrixWorld(true);

    const worldPivot = averageWorldPosition([a, b]);
    const group = createEmptyPartGroup(partsRoot, { worldPivot });
    attachAllUnder(group, [a, b], partsRoot);
    partsRoot.updateMatrixWorld(true);

    expect(group.position.toArray()).toEqual([2, 3, 0]);

    const aWorld = new Vector3();
    const bWorld = new Vector3();
    a.getWorldPosition(aWorld);
    b.getWorldPosition(bWorld);
    expect(aWorld.toArray()).toEqual([1, 2, 0]);
    expect(bWorld.toArray()).toEqual([3, 4, 0]);
  });

  it('converts worldPivot through a translated parts root', () => {
    const partsRoot = new Group();
    partsRoot.position.set(10, 0, 0);
    const a = createPart('a');
    a.position.set(0, 4, 0);
    partsRoot.add(a);
    partsRoot.updateMatrixWorld(true);

    const worldPivot = averageWorldPosition([a]);
    const group = createEmptyPartGroup(partsRoot, { worldPivot });

    expect(worldPivot.toArray()).toEqual([10, 4, 0]);
    expect(group.position.toArray()).toEqual([0, 4, 0]);
  });
});
