import { BoxGeometry, Group, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';

import { createEmptyPartGroup } from '@/modules/create/domain/hierarchy/create-part-group';
import {
  assignPartsToChainIntervals,
  assignPartsToNearestConnector,
  buildHingeParentMap,
  connectionWorldPivot,
  resolveMakeConnectorsPlan,
  sortProximalToDistal,
  worldBoundCenter,
} from '@/modules/create/domain/make-joint-plan';
import { writeCreatePart } from '@/modules/create/domain/part-data';

function createPart(name: string, y: number, x = 0): Mesh {
  const mesh = new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial());
  mesh.name = name;
  mesh.position.set(x, y, 0);
  writeCreatePart(mesh, {
    kind: 'box',
    params: { width: 1, height: 1, depth: 1 },
  });
  return mesh;
}

describe('worldBoundCenter', () => {
  it('returns the AABB center for a stamped part', () => {
    const root = new Group();
    const part = createPart('shin', 2);
    root.add(part);
    root.updateMatrixWorld(true);

    expect(worldBoundCenter(part).toArray()).toEqual([0, 2, 0]);
  });
});

describe('connectionWorldPivot', () => {
  it('places the hinge where stacked unit boxes meet', () => {
    const root = new Group();
    const lower = createPart('foot', 2);
    const upper = createPart('shin', 4);
    root.add(upper, lower);
    root.updateMatrixWorld(true);

    const pivot = connectionWorldPivot(upper, lower);
    expect(pivot.y).toBeCloseTo(3);
  });
});

describe('sortProximalToDistal', () => {
  it('orders higher parts before lower parts on an upright limb', () => {
    const root = new Group();
    const foot = createPart('foot', 1);
    const shin = createPart('shin', 3);
    const thigh = createPart('thigh', 5);
    root.add(foot, shin, thigh);
    root.updateMatrixWorld(true);

    expect(sortProximalToDistal([foot, shin, thigh], root).map((n) => n.name)).toEqual([
      'thigh',
      'shin',
      'foot',
    ]);
  });

  it('orders body-near before outward on a horizontal limb', () => {
    const root = new Group();
    const hip = createPart('hip', 2, 1);
    const knee = createPart('knee', 2, 4);
    const paw = createPart('paw', 2, 7);
    root.add(hip, knee, paw);
    root.updateMatrixWorld(true);

    expect(sortProximalToDistal([paw, hip, knee], root).map((n) => n.name)).toEqual([
      'hip',
      'knee',
      'paw',
    ]);
  });
});

describe('assignPartsToNearestConnector', () => {
  it('assigns each leftover to the closer connector', () => {
    const root = new Group();
    const left = createPart('left', 1, -4);
    const right = createPart('right', 1, 4);
    const nearLeft = createPart('a', 1, -3);
    const nearRight = createPart('b', 1, 3);
    root.add(left, right, nearLeft, nearRight);
    root.updateMatrixWorld(true);

    const buckets = assignPartsToNearestConnector([nearLeft, nearRight], [left, right]);
    expect(buckets.get(left)).toEqual([nearLeft]);
    expect(buckets.get(right)).toEqual([nearRight]);
  });
});

describe('assignPartsToChainIntervals', () => {
  it('puts segments under the hinge above them; proximal leftovers stay loose', () => {
    const root = new Group();
    const thigh = createPart('thigh', 5);
    const knee = createPart('knee', 4);
    const shin = createPart('shin', 3);
    const ankle = createPart('ankle', 2);
    const foot = createPart('foot', 1);
    root.add(thigh, knee, shin, ankle, foot);
    root.updateMatrixWorld(true);

    const ordered = sortProximalToDistal(
      [thigh, knee, shin, ankle, foot],
      root,
    );
    const { buckets, loose } = assignPartsToChainIntervals(
      [thigh, shin, foot],
      [knee, ankle],
      ordered,
    );

    expect(loose).toEqual([thigh]);
    expect(buckets.get(knee)).toEqual([shin]);
    expect(buckets.get(ankle)).toEqual([foot]);
  });
});

describe('buildHingeParentMap', () => {
  it('parents knees under hips and ankles under knees (branching)', () => {
    const root = new Group();
    const hips = createPart('hips', 5, 0);
    const lKnee = createPart('l_knee', 3, -2);
    const rKnee = createPart('r_knee', 3, 2);
    const lAnkle = createPart('l_ankle', 1, -2);
    const rAnkle = createPart('r_ankle', 1, 2);
    root.add(hips, lKnee, rKnee, lAnkle, rAnkle);
    root.updateMatrixWorld(true);

    const parents = buildHingeParentMap(
      [hips, lKnee, rKnee, lAnkle, rAnkle],
      root,
    );

    expect(parents.get(hips)).toBeNull();
    expect(parents.get(lKnee)).toBe(hips);
    expect(parents.get(rKnee)).toBe(hips);
    expect(parents.get(lAnkle)).toBe(lKnee);
    expect(parents.get(rAnkle)).toBe(rKnee);
  });

  it('keeps both knees as siblings when hips are unmarked', () => {
    const root = new Group();
    const lKnee = createPart('l_knee', 3, -2);
    const rKnee = createPart('r_knee', 3, 2);
    const lAnkle = createPart('l_ankle', 1, -2);
    const rAnkle = createPart('r_ankle', 1, 2);
    root.add(lKnee, rKnee, lAnkle, rAnkle);
    root.updateMatrixWorld(true);

    const parents = buildHingeParentMap(
      [lKnee, rKnee, lAnkle, rAnkle],
      root,
    );

    expect(parents.get(lKnee)).toBeNull();
    expect(parents.get(rKnee)).toBeNull();
    expect(parents.get(lAnkle)).toBe(lKnee);
    expect(parents.get(rAnkle)).toBe(rKnee);
  });
});

describe('resolveMakeConnectorsPlan', () => {
  it('creates a new connector under the proximal part with only distal children', () => {
    const root = new Group();
    const shin = createPart('shin', 3);
    const foot = createPart('foot', 1);
    root.add(shin, foot);
    root.updateMatrixWorld(true);

    const plan = resolveMakeConnectorsPlan([shin, foot], root, [
      { source: { kind: 'new' }, name: 'RightFoot' },
    ]);
    expect(plan).not.toBeNull();
    expect(plan!.nestTree).toBe(false);
    expect(plan!.jointParent).toBe(shin);
    expect(plan!.connectors).toHaveLength(1);
    expect(plan!.connectors[0]).toMatchObject({
      mode: 'create',
      name: 'RightFoot',
      children: [foot],
      parentAnchor: null,
    });
    expect(plan!.connectors[0]!.mode === 'create'
      && plan!.connectors[0].worldPivot).toBeInstanceOf(Vector3);
  });

  it('puts all but the proximal part under a new connector when connecting three parts', () => {
    const root = new Group();
    const thigh = createPart('thigh', 5);
    const shin = createPart('shin', 3);
    const foot = createPart('foot', 1);
    root.add(thigh, shin, foot);
    root.updateMatrixWorld(true);

    const plan = resolveMakeConnectorsPlan([thigh, shin, foot], root, [
      { source: { kind: 'new' }, name: 'connector' },
    ]);
    expect(plan!.jointParent).toBe(thigh);
    expect(plan!.connectors[0]!.children).toEqual([shin, foot]);
  });

  it('creates a connector at a marked part and keeps that part as a child', () => {
    const root = new Group();
    const ankle = createPart('ankle_right', 3);
    const foot = createPart('foot', 1);
    root.add(ankle, foot);
    root.updateMatrixWorld(true);

    const plan = resolveMakeConnectorsPlan([ankle, foot], root, [
      { source: { kind: 'node', object: ankle }, name: 'RightFoot' },
    ]);
    expect(plan!.nestTree).toBe(false);
    expect(plan!.connectors).toHaveLength(1);
    const entry = plan!.connectors[0]!;
    expect(entry.mode).toBe('create');
    if (entry.mode !== 'create') {
      return;
    }
    expect(entry.children).toEqual([ankle, foot]);
    expect(entry.worldPivot.y).toBeCloseTo(3);
  });

  it('builds a single-leg tree knee→ankle with shin/foot under hinges', () => {
    const root = new Group();
    const thigh = createPart('thigh', 5);
    const knee = createPart('knee', 4);
    const shin = createPart('shin', 3);
    const ankle = createPart('ankle', 2);
    const foot = createPart('foot', 1);
    root.add(thigh, knee, shin, ankle, foot);
    root.updateMatrixWorld(true);

    const plan = resolveMakeConnectorsPlan(
      [thigh, knee, shin, ankle, foot],
      root,
      [
        { source: { kind: 'node', object: knee }, name: 'knee' },
        { source: { kind: 'node', object: ankle }, name: 'ankle' },
      ],
    );

    expect(plan!.nestTree).toBe(true);
    const kneeEntry = plan!.connectors.find((c) => c.name === 'knee')!;
    const ankleEntry = plan!.connectors.find((c) => c.name === 'ankle')!;
    expect(kneeEntry.parentAnchor).toBeNull();
    expect(ankleEntry.parentAnchor).toBe(knee);
    expect(kneeEntry.children).toContain(knee);
    expect(kneeEntry.children).toContain(shin);
    expect(ankleEntry.children).toContain(ankle);
    expect(ankleEntry.children).toContain(foot);
  });

  it('builds hips→both knees→ankles branching tree', () => {
    const root = new Group();
    const hips = createPart('hips', 5, 0);
    const lThigh = createPart('l_thigh', 4, -2);
    const rThigh = createPart('r_thigh', 4, 2);
    const lKnee = createPart('l_knee', 3, -2);
    const rKnee = createPart('r_knee', 3, 2);
    const lShin = createPart('l_shin', 2, -2);
    const rShin = createPart('r_shin', 2, 2);
    const lAnkle = createPart('l_ankle', 1, -2);
    const rAnkle = createPart('r_ankle', 1, 2);
    root.add(hips, lThigh, rThigh, lKnee, rKnee, lShin, rShin, lAnkle, rAnkle);
    root.updateMatrixWorld(true);

    const plan = resolveMakeConnectorsPlan(
      [hips, lThigh, rThigh, lKnee, rKnee, lShin, rShin, lAnkle, rAnkle],
      root,
      [
        { source: { kind: 'node', object: hips }, name: 'hips' },
        { source: { kind: 'node', object: lKnee }, name: 'l_knee' },
        { source: { kind: 'node', object: rKnee }, name: 'r_knee' },
        { source: { kind: 'node', object: lAnkle }, name: 'l_ankle' },
        { source: { kind: 'node', object: rAnkle }, name: 'r_ankle' },
      ],
    );

    expect(plan!.nestTree).toBe(true);
    const byName = Object.fromEntries(
      plan!.connectors.map((c) => [c.name, c]),
    );
    expect(byName.hips!.parentAnchor).toBeNull();
    expect(byName.l_knee!.parentAnchor).toBe(hips);
    expect(byName.r_knee!.parentAnchor).toBe(hips);
    expect(byName.l_ankle!.parentAnchor).toBe(lKnee);
    expect(byName.r_ankle!.parentAnchor).toBe(rKnee);
    expect(byName.l_knee!.children).toContain(lShin);
    expect(byName.r_knee!.children).toContain(rShin);
  });

  it('reuses an existing joint connector', () => {
    const root = new Group();
    const joint = createEmptyPartGroup(root, { name: 'RightFoot', role: 'joint' });
    const foot = createPart('foot', 1);
    root.add(foot);
    root.updateMatrixWorld(true);

    const plan = resolveMakeConnectorsPlan([joint, foot], root, [
      { source: { kind: 'node', object: joint }, name: 'RightFoot' },
    ]);
    expect(plan!.connectors[0]).toMatchObject({
      mode: 'reuse',
      name: 'RightFoot',
      joint,
      children: [foot],
      parentAnchor: null,
    });
  });

  it('returns null when names are empty', () => {
    const root = new Group();
    const a = createPart('a', 2);
    const b = createPart('b', 1);
    root.add(a, b);
    expect(
      resolveMakeConnectorsPlan([a, b], root, [
        { source: { kind: 'new' }, name: '   ' },
      ]),
    ).toBeNull();
  });
});
