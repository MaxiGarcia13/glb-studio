import type { Object3D } from 'three';
import { Box3, Vector3 } from 'three';

import { isCreateHierarchyNode, isCreateJoint } from './hierarchy/group-data';

const Y_TIE_EPSILON = 1e-4;
const AXIS_EPSILON = 1e-6;

const _boxA = new Box3();
const _boxB = new Box3();
const _centerA = new Vector3();
const _centerB = new Vector3();
const _axis = new Vector3();
const _size = new Vector3();
const _faceB = new Vector3();
const _world = new Vector3();
const _rootWorld = new Vector3();
const _selectionBox = new Box3();

/** Source for one connector in the Make connector wizard. */
export type ConnectorSource
  = | { kind: 'new' }
    | { kind: 'node'; object: Object3D };

export interface NamedConnectorInput {
  source: ConnectorSource;
  name: string;
}

export type ConnectorPlanEntry
  = | {
    mode: 'create';
    name: string;
    worldPivot: Vector3;
    children: Object3D[];
    /** Marked part this connector was created from. */
    anchor: Object3D;
    /** Parent hinge anchor, or `null` to attach under `jointParent`. */
    parentAnchor: Object3D | null;
  }
  | {
    mode: 'reuse';
    name: string;
    joint: Object3D;
    children: Object3D[];
    anchor: Object3D;
    parentAnchor: Object3D | null;
  };

export interface MakeConnectorsPlan {
  jointParent: Object3D;
  /**
   * When true, connectors form a branching tree (shared hips → both legs, etc.).
   * Each entry’s `parentAnchor` points at its parent hinge.
   */
  nestTree: boolean;
  /** Unused leftovers (should be rare with nearest assignment). */
  looseChildren: Object3D[];
  connectors: ConnectorPlanEntry[];
}

/**
 * World-space center of an object’s bounds, or its origin if bounds are empty.
 */
export function worldBoundCenter(object: Object3D, target = new Vector3()): Vector3 {
  _boxA.setFromObject(object);
  if (_boxA.isEmpty()) {
    return object.getWorldPosition(target);
  }
  return _boxA.getCenter(target);
}

/** Half-extent of an AABB projected onto a unit axis. */
function aabbHalfExtentAlong(box: Box3, unitAxis: Vector3): number {
  box.getSize(_size).multiplyScalar(0.5);
  return (
    Math.abs(unitAxis.x) * _size.x
    + Math.abs(unitAxis.y) * _size.y
    + Math.abs(unitAxis.z) * _size.z
  );
}

/**
 * Hinge between two objects: midpoint of the facing bound faces along the
 * center-to-center axis. Falls back to midpoint of centers when coincident.
 */
export function connectionWorldPivot(
  proximal: Object3D,
  distal: Object3D,
  target = new Vector3(),
): Vector3 {
  _boxA.setFromObject(proximal);
  _boxB.setFromObject(distal);

  if (_boxA.isEmpty() || _boxB.isEmpty()) {
    worldBoundCenter(proximal, _centerA);
    worldBoundCenter(distal, _centerB);
    return target.copy(_centerA).add(_centerB).multiplyScalar(0.5);
  }

  _boxA.getCenter(_centerA);
  _boxB.getCenter(_centerB);
  _axis.copy(_centerB).sub(_centerA);
  const length = _axis.length();
  if (length < 1e-8) {
    return target.copy(_centerA);
  }

  _axis.multiplyScalar(1 / length);
  const extentA = aabbHalfExtentAlong(_boxA, _axis);
  const extentB = aabbHalfExtentAlong(_boxB, _axis);

  target.copy(_centerA).addScaledVector(_axis, extentA);
  _faceB.copy(_centerB).addScaledVector(_axis, -extentB);
  return target.add(_faceB).multiplyScalar(0.5);
}

function horizontalDistanceSqFromRoot(
  object: Object3D,
  partsRoot: Object3D,
): number {
  object.getWorldPosition(_world);
  partsRoot.getWorldPosition(_rootWorld);
  const dx = _world.x - _rootWorld.x;
  const dz = _world.z - _rootWorld.z;
  return dx * dx + dz * dz;
}

/**
 * Unit axis along the selection’s longest AABB edge, oriented so +axis points
 * distal. Vertical selections: down is distal (toward the ground). Horizontal:
 * away from `partsRoot` is distal (outward limb). No species / bone names.
 */
export function selectionLimbAxis(
  nodes: readonly Object3D[],
  partsRoot: Object3D,
  target = new Vector3(),
): Vector3 {
  _selectionBox.makeEmpty();
  for (const node of nodes) {
    _selectionBox.expandByObject(node);
  }
  if (_selectionBox.isEmpty()) {
    return target.set(0, -1, 0);
  }

  _selectionBox.getSize(_size);
  if (_size.y >= _size.x && _size.y >= _size.z) {
    // Upright chain (leg, neck): higher = proximal, lower = distal.
    return target.set(0, -1, 0);
  }

  if (_size.x >= _size.z) {
    target.set(1, 0, 0);
  } else {
    target.set(0, 0, 1);
  }

  partsRoot.getWorldPosition(_rootWorld);
  _selectionBox.getCenter(_centerA);
  const halfSpan = (target.x !== 0 ? _size.x : _size.z) * 0.5;
  _centerB.copy(_centerA).addScaledVector(target, halfSpan);
  _faceB.copy(_centerA).addScaledVector(target, -halfSpan);
  if (_faceB.distanceToSquared(_rootWorld) > _centerB.distanceToSquared(_rootWorld)) {
    target.negate();
  }
  return target;
}

function projectOnAxis(object: Object3D, axis: Vector3): number {
  worldBoundCenter(object, _world);
  return _world.dot(axis);
}

/**
 * Sort create nodes proximal → distal along the selection’s long axis.
 * Fallback: higher world Y, then closer to model origin (XZ).
 */
export function sortProximalToDistal(
  nodes: readonly Object3D[],
  partsRoot: Object3D,
): Object3D[] {
  if (nodes.length < 2) {
    return [...nodes];
  }

  const axis = selectionLimbAxis(nodes, partsRoot, _axis);
  let min = Infinity;
  let max = -Infinity;
  for (const node of nodes) {
    const t = projectOnAxis(node, axis);
    if (t < min) {
      min = t;
    }
    if (t > max) {
      max = t;
    }
  }
  const span = max - min;

  if (span > AXIS_EPSILON) {
    return [...nodes].sort((a, b) => {
      const da = projectOnAxis(a, axis) - projectOnAxis(b, axis);
      if (Math.abs(da) > AXIS_EPSILON) {
        // Smaller projection = proximal (axis points distal).
        return da < 0 ? -1 : 1;
      }
      return (
        horizontalDistanceSqFromRoot(a, partsRoot)
        - horizontalDistanceSqFromRoot(b, partsRoot)
      );
    });
  }

  return [...nodes].sort((a, b) => {
    a.getWorldPosition(_centerA);
    b.getWorldPosition(_centerB);
    const dy = _centerA.y - _centerB.y;
    if (Math.abs(dy) > Y_TIE_EPSILON) {
      return dy > 0 ? -1 : 1;
    }
    return (
      horizontalDistanceSqFromRoot(a, partsRoot)
      - horizontalDistanceSqFromRoot(b, partsRoot)
    );
  });
}

/**
 * Shared parent of every node when it is a valid create attach target
 * (`partsRoot` or a stamped create part/group). Otherwise `partsRoot`.
 */
export function sharedJointParent(
  nodes: readonly Object3D[],
  partsRoot: Object3D,
): Object3D {
  const firstParent = nodes[0]?.parent;
  if (!firstParent || firstParent === nodes[0]) {
    return partsRoot;
  }
  for (const node of nodes) {
    if (node.parent !== firstParent) {
      return partsRoot;
    }
  }
  if (firstParent === partsRoot || isCreateHierarchyNode(firstParent)) {
    return firstParent;
  }
  return partsRoot;
}

function distanceSq(a: Object3D, b: Object3D): number {
  worldBoundCenter(a, _centerA);
  worldBoundCenter(b, _centerB);
  return _centerA.distanceToSquared(_centerB);
}

/** Assign each leftover part to the nearest connector anchor object. */
export function assignPartsToNearestConnector(
  parts: readonly Object3D[],
  connectorAnchors: readonly Object3D[],
): Map<Object3D, Object3D[]> {
  const buckets = new Map<Object3D, Object3D[]>();
  for (const anchor of connectorAnchors) {
    buckets.set(anchor, []);
  }
  if (connectorAnchors.length === 0) {
    return buckets;
  }

  for (const part of parts) {
    let best = connectorAnchors[0]!;
    let bestDist = distanceSq(part, best);
    for (let i = 1; i < connectorAnchors.length; i += 1) {
      const anchor = connectorAnchors[i]!;
      const dist = distanceSq(part, anchor);
      if (dist < bestDist) {
        best = anchor;
        bestDist = dist;
      }
    }
    buckets.get(best)!.push(part);
  }
  return buckets;
}

/**
 * Assign leftovers to the hinge above them along a linear chain (interval parenting).
 * Parts proximal to the first hinge are returned as `loose`.
 */
export function assignPartsToChainIntervals(
  parts: readonly Object3D[],
  orderedHinges: readonly Object3D[],
  orderedSelection: readonly Object3D[],
): { buckets: Map<Object3D, Object3D[]>; loose: Object3D[] } {
  const buckets = new Map<Object3D, Object3D[]>();
  for (const hinge of orderedHinges) {
    buckets.set(hinge, []);
  }
  const loose: Object3D[] = [];
  if (orderedHinges.length === 0) {
    return { buckets, loose: [...parts] };
  }

  const hingeSet = new Set(orderedHinges);
  const indexInOrder = new Map<Object3D, number>();
  orderedSelection.forEach((node, index) => {
    indexInOrder.set(node, index);
  });

  for (const part of parts) {
    const partIndex = indexInOrder.get(part);
    if (partIndex === undefined) {
      loose.push(part);
      continue;
    }

    let parentHinge: Object3D | null = null;
    for (const node of orderedSelection) {
      const nodeIndex = indexInOrder.get(node)!;
      if (nodeIndex >= partIndex) {
        break;
      }
      if (hingeSet.has(node)) {
        parentHinge = node;
      }
    }

    if (!parentHinge) {
      loose.push(part);
      continue;
    }
    buckets.get(parentHinge)!.push(part);
  }

  return { buckets, loose };
}

/**
 * Smaller = more proximal (toward the body). Prefers higher world Y, then closer
 * to the model origin on XZ — works for upright bipeds and outward animal limbs
 * without species knowledge. (Distance-to-root alone fails when the root sits on
 * the ground under the feet.)
 */
export function proximalScore(object: Object3D, partsRoot: Object3D): number {
  worldBoundCenter(object, _centerA);
  partsRoot.getWorldPosition(_rootWorld);
  const dx = _centerA.x - _rootWorld.x;
  const dz = _centerA.z - _rootWorld.z;
  return -_centerA.y * 1_000 + (dx * dx + dz * dz);
}

/**
 * Build a branching hinge tree: each hinge parents under the nearest hinge that
 * is clearly more proximal. Hinges at a similar depth (e.g. both knees) stay
 * siblings under `jointParent`. Generic — no species / bone names.
 */
export function buildHingeParentMap(
  hinges: readonly Object3D[],
  partsRoot: Object3D,
): Map<Object3D, Object3D | null> {
  const parents = new Map<Object3D, Object3D | null>();
  if (hinges.length === 0) {
    return parents;
  }

  const scores = new Map<Object3D, number>();
  let minScore = Infinity;
  let maxScore = -Infinity;
  for (const hinge of hinges) {
    const score = proximalScore(hinge, partsRoot);
    scores.set(hinge, score);
    if (score < minScore) {
      minScore = score;
    }
    if (score > maxScore) {
      maxScore = score;
    }
  }
  const span = Math.max(maxScore - minScore, 1e-6);
  // Must be meaningfully more proximal than the child (~6% of hinge-score span).
  const margin = span * 0.06;

  for (const hinge of hinges) {
    const hingeScore = scores.get(hinge)!;
    let best: Object3D | null = null;
    let bestDist = Infinity;
    for (const candidate of hinges) {
      if (candidate === hinge) {
        continue;
      }
      const candidateScore = scores.get(candidate)!;
      if (candidateScore >= hingeScore - margin) {
        continue;
      }
      const dist = distanceSq(hinge, candidate);
      if (dist < bestDist) {
        best = candidate;
        bestDist = dist;
      }
    }
    parents.set(hinge, best);
  }

  return parents;
}

/**
 * Assign each leftover to the nearest hinge; on a near-tie prefer the more
 * proximal hinge (thigh→hips, shin→knee).
 */
export function assignPartsToNearestHingePreferProximal(
  parts: readonly Object3D[],
  hinges: readonly Object3D[],
  partsRoot: Object3D,
): Map<Object3D, Object3D[]> {
  const buckets = new Map<Object3D, Object3D[]>();
  for (const hinge of hinges) {
    buckets.set(hinge, []);
  }
  if (hinges.length === 0) {
    return buckets;
  }

  const tieEpsilon = 1e-4;
  for (const part of parts) {
    let best = hinges[0]!;
    let bestDist = distanceSq(part, best);
    let bestScore = proximalScore(best, partsRoot);
    for (let i = 1; i < hinges.length; i += 1) {
      const hinge = hinges[i]!;
      const dist = distanceSq(part, hinge);
      const score = proximalScore(hinge, partsRoot);
      if (
        dist < bestDist - tieEpsilon
        || (Math.abs(dist - bestDist) <= tieEpsilon && score < bestScore)
      ) {
        best = hinge;
        bestDist = dist;
        bestScore = score;
      }
    }
    buckets.get(best)!.push(part);
  }
  return buckets;
}

function toPlanEntry(
  object: Object3D,
  name: string,
  assigned: Object3D[],
  parentAnchor: Object3D | null,
): ConnectorPlanEntry {
  if (isCreateJoint(object)) {
    return {
      mode: 'reuse',
      name,
      joint: object,
      children: assigned,
      anchor: object,
      parentAnchor,
    };
  }
  return {
    mode: 'create',
    name,
    worldPivot: worldBoundCenter(object, new Vector3()),
    children: [object, ...assigned],
    anchor: object,
    parentAnchor,
  };
}

/**
 * Resolve create/reuse connector entries and child assignments for the wizard.
 * Two or more marked bend points form a branching tree (hips → both legs, etc.).
 */
export function resolveMakeConnectorsPlan(
  nodes: readonly Object3D[],
  partsRoot: Object3D,
  namedConnectors: readonly NamedConnectorInput[],
): MakeConnectorsPlan | null {
  if (nodes.length < 2 || namedConnectors.length === 0) {
    return null;
  }

  const trimmed = namedConnectors
    .map((entry) => ({
      source: entry.source,
      name: entry.name.trim(),
    }))
    .filter((entry) => entry.name.length > 0);

  if (trimmed.length === 0) {
    return null;
  }

  partsRoot.updateMatrixWorld(true);
  const jointParent = sharedJointParent(nodes, partsRoot);

  const onlyNew
    = trimmed.length === 1
      && trimmed[0]!.source.kind === 'new';

  if (onlyNew) {
    const ordered = sortProximalToDistal(nodes, partsRoot);
    const proximal = ordered[0];
    const distal = ordered[ordered.length - 1];
    if (!proximal || !distal || proximal === distal) {
      return null;
    }
    // Hinge between proximal and the rest: proximal stays above so rotating
    // the connector swings only distal parts (not the whole group).
    const distalChildren = ordered.slice(1);
    const pivot = connectionWorldPivot(proximal, distal);
    return {
      jointParent: proximal,
      nestTree: false,
      looseChildren: [],
      connectors: [
        {
          mode: 'create',
          name: trimmed[0]!.name,
          worldPivot: pivot,
          children: distalChildren,
          anchor: proximal,
          parentAnchor: null,
        },
      ],
    };
  }

  const nodeEntries = trimmed.filter(
    (entry): entry is { source: { kind: 'node'; object: Object3D }; name: string } =>
      entry.source.kind === 'node',
  );

  if (nodeEntries.length === 0) {
    return null;
  }

  for (const entry of nodeEntries) {
    if (!nodes.includes(entry.source.object)) {
      return null;
    }
  }

  const nameByObject = new Map(
    nodeEntries.map((entry) => [entry.source.object, entry.name] as const),
  );
  const marked = [...nameByObject.keys()];
  const markedSet = new Set(marked);
  const leftovers = nodes.filter((node) => !markedSet.has(node));
  const nestTree = marked.length >= 2;

  if (!nestTree) {
    const assignments = assignPartsToNearestConnector(leftovers, marked);
    const connectors: ConnectorPlanEntry[] = marked.map((object) =>
      toPlanEntry(
        object,
        nameByObject.get(object)!,
        assignments.get(object) ?? [],
        null,
      ),
    );
    return { jointParent, nestTree: false, looseChildren: [], connectors };
  }

  const parentByHinge = buildHingeParentMap(marked, partsRoot);
  const assignments = assignPartsToNearestHingePreferProximal(
    leftovers,
    marked,
    partsRoot,
  );

  // Proximal-first so callers can apply in order.
  const orderedHinges = [...marked].sort(
    (a, b) => proximalScore(a, partsRoot) - proximalScore(b, partsRoot),
  );

  const connectors: ConnectorPlanEntry[] = orderedHinges.map((object) =>
    toPlanEntry(
      object,
      nameByObject.get(object)!,
      assignments.get(object) ?? [],
      parentByHinge.get(object) ?? null,
    ),
  );

  return {
    jointParent,
    nestTree: true,
    looseChildren: [],
    connectors,
  };
}
