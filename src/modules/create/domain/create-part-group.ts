import type { Object3D, Vector3Like } from 'three';
import { Group, Vector3 } from 'three';
import { writeCreateGroup } from './group-data';
import { nextObjectName } from './object-name';

const _world = new Vector3();

/**
 * Average world-space origin of `objects` (empty → zero).
 * Used as the create-group pivot so Edit rotate orbits the selection, not the floor.
 */
export function averageWorldPosition(objects: readonly Object3D[]): Vector3 {
  const result = new Vector3();
  if (objects.length === 0) {
    return result;
  }

  for (const object of objects) {
    object.getWorldPosition(_world);
    result.add(_world);
  }
  return result.multiplyScalar(1 / objects.length);
}

/**
 * Create a stamped empty group under `partsRoot` with a unique `group` name.
 * Optional `worldPivot` sets the group origin in world space (children keep
 * world pose via later `attach`). Default pivot is the parts-root origin.
 */
export function createEmptyPartGroup(
  partsRoot: Object3D,
  options?: { worldPivot?: Vector3Like },
): Group {
  const group = new Group();
  group.name = nextObjectName(partsRoot, 'group');
  writeCreateGroup(group);
  partsRoot.add(group);

  if (options?.worldPivot) {
    partsRoot.updateMatrixWorld(true);
    group.position.copy(options.worldPivot);
    partsRoot.worldToLocal(group.position);
  }

  return group;
}

/**
 * Create a stamped empty group with an exact name (kit armature nodes).
 * Caller owns uniqueness within the kit recipe.
 */
export function createNamedCreateGroup(parent: Object3D, name: string): Group {
  const group = new Group();
  group.name = name;
  writeCreateGroup(group);
  parent.add(group);
  return group;
}
