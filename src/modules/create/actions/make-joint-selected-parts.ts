import type { GroupPartsAvailability } from './group-selected-parts';
import { $selection, selectObject } from '@/modules/viewport/stores/selection-store';
import {
  averageWorldPosition,
  createEmptyPartGroup,
} from '../domain/create-part-group';
import { attachAllUnder } from '../domain/parent-part';
import { bumpCreatePartsRevision } from '../stores/create-parts-revision-store';
import { resolveGroupPartsContext } from './group-selected-parts';

export type MakeJointAvailability = GroupPartsAvailability;

/** Whether Make joint is available for the current part multi-selection. */
export function getMakeJointAvailability(): MakeJointAvailability {
  const { kind, objects } = $selection.get();

  if (kind === 'models') {
    return { enabled: false, reason: 'Use Make joint while parts are selected' };
  }

  if (kind !== 'parts') {
    return { enabled: false, reason: 'Select parts to make a joint' };
  }

  if (objects.length < 2) {
    return { enabled: false, reason: 'Select at least two parts' };
  }

  if (!resolveGroupPartsContext()) {
    return {
      enabled: false,
      reason: 'Select two or more create parts on the same created model',
    };
  }

  return {
    enabled: true,
    reason: 'Create a joint and put the selection under it',
  };
}

export interface MakeJointSelectedPartsOptions {
  /** Joint name base (unique’d in the scene). */
  name: string;
}

/**
 * Create a skeleton joint and parent selected create nodes under it.
 * World transforms preserved. Selects the new joint.
 */
export function makeJointSelectedParts(
  options: MakeJointSelectedPartsOptions,
): boolean {
  const name = options.name.trim();
  if (!name) {
    return false;
  }

  const context = resolveGroupPartsContext();
  if (!context) {
    return false;
  }

  context.partsRoot.updateMatrixWorld(true);
  const worldPivot = averageWorldPosition(context.nodes);
  const joint = createEmptyPartGroup(context.partsRoot, {
    worldPivot,
    name,
    role: 'joint',
  });
  const moved = attachAllUnder(joint, context.nodes, context.partsRoot);
  if (moved === 0) {
    joint.removeFromParent();
    return false;
  }

  selectObject(joint);
  bumpCreatePartsRevision();
  return true;
}
