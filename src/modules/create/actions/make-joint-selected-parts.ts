import type { Object3D } from 'three';

import type {
  ConnectorPlanEntry,
  NamedConnectorInput,
} from '../domain/make-joint-plan';
import type { GroupPartsAvailability } from './group-selected-parts';
import { $selection, selectObject } from '@/modules/viewport/stores/selection-store';
import { createEmptyPartGroup } from '../domain/create-part-group';
import { resolveMakeConnectorsPlan } from '../domain/make-joint-plan';
import { nextObjectName } from '../domain/object-name';
import { attachAllUnder, attachUnder } from '../domain/parent-part';
import { bumpCreatePartsRevision } from '../stores/create-parts-revision-store';
import { resolveGroupPartsContext } from './group-selected-parts';
import { pushHierarchyGraphUndo } from './push-hierarchy-undo';

export type MakeJointAvailability = GroupPartsAvailability;

/** Whether Make connector is available for the current part multi-selection. */
export function getMakeJointAvailability(): MakeJointAvailability {
  const { kind, objects } = $selection.get();

  if (kind === 'models') {
    return { enabled: false, reason: 'Use Make connector while parts are selected' };
  }

  if (kind !== 'parts') {
    return { enabled: false, reason: 'Select parts to make a connector' };
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
    reason: 'Mark bend points — Connect builds a branching limb tree',
  };
}

export interface MakeJointSelectedPartsOptions {
  /** Named connectors from the Make connector modal. */
  connectors: readonly NamedConnectorInput[];
}

/** Assign `base` to `object`, uniquifying under `root` while ignoring `object` itself. */
function assignUniqueName(object: Object3D, root: Object3D, base: string): void {
  const trimmed = base.trim();
  if (!trimmed || object.name === trimmed) {
    return;
  }
  const previous = object.name;
  object.name = '';
  object.name = nextObjectName(root, trimmed);
  if (!object.name) {
    object.name = previous;
  }
}

function resolveParentJoint(
  entry: ConnectorPlanEntry,
  jointParent: Object3D,
  jointByAnchor: Map<Object3D, Object3D>,
  nestTree: boolean,
): Object3D {
  if (!nestTree || !entry.parentAnchor) {
    return jointParent;
  }
  return jointByAnchor.get(entry.parentAnchor) ?? jointParent;
}

function applyMakeJointPlan(
  context: NonNullable<ReturnType<typeof resolveGroupPartsContext>>,
  connectors: readonly NamedConnectorInput[],
): Object3D | null {
  const plan = resolveMakeConnectorsPlan(
    context.nodes,
    context.partsRoot,
    connectors,
  );
  if (!plan || plan.connectors.length === 0) {
    return null;
  }

  const jointByAnchor = new Map<Object3D, Object3D>();
  let rootJoint: Object3D | null = null;
  let lastJoint: Object3D | null = null;
  let didWork = false;

  for (const entry of plan.connectors) {
    const parentJoint = resolveParentJoint(
      entry,
      plan.jointParent,
      jointByAnchor,
      plan.nestTree,
    );

    if (entry.mode === 'reuse') {
      assignUniqueName(entry.joint, context.partsRoot, entry.name);
      if (parentJoint !== entry.joint) {
        attachUnder(entry.joint, parentJoint, context.partsRoot);
      }
      const moved = attachAllUnder(entry.joint, entry.children, context.partsRoot);
      if (moved > 0 || entry.name.trim().length > 0) {
        didWork = true;
      }
      jointByAnchor.set(entry.anchor, entry.joint);
      lastJoint = entry.joint;
      if (!entry.parentAnchor) {
        rootJoint = entry.joint;
      }
      continue;
    }

    const joint = createEmptyPartGroup(context.partsRoot, {
      worldPivot: entry.worldPivot,
      name: entry.name,
      role: 'joint',
    });

    if (parentJoint !== context.partsRoot) {
      attachUnder(joint, parentJoint, context.partsRoot);
    }

    const moved = attachAllUnder(joint, entry.children, context.partsRoot);
    if (moved === 0) {
      joint.removeFromParent();
      continue;
    }

    didWork = true;
    jointByAnchor.set(entry.anchor, joint);
    lastJoint = joint;
    if (!entry.parentAnchor) {
      rootJoint ??= joint;
    }
  }

  if (plan.looseChildren.length > 0) {
    const moved = attachAllUnder(
      plan.jointParent,
      plan.looseChildren,
      context.partsRoot,
    );
    if (moved > 0) {
      didWork = true;
    }
  }

  if (!didWork || !lastJoint) {
    return null;
  }

  return rootJoint ?? lastJoint;
}

/**
 * Create/reuse skeleton connectors from marked bend points.
 * Two or more marks form a branching tree (shared hips → both legs, etc.).
 */
export function makeJointSelectedParts(
  options: MakeJointSelectedPartsOptions,
): boolean {
  const context = resolveGroupPartsContext();
  if (!context) {
    return false;
  }

  const connectors = options.connectors;
  if (connectors.length === 0) {
    return false;
  }

  let selectedJoint: Object3D | null = null;
  const ok = pushHierarchyGraphUndo({
    modelId: context.modelId,
    partsRoot: context.partsRoot,
    beforeSelectUuids: context.nodes.map((node) => node.uuid),
    mutate: () => {
      selectedJoint = applyMakeJointPlan(context, connectors);
      if (!selectedJoint) {
        return false;
      }
      return { ok: true, selectUuids: [selectedJoint.uuid] };
    },
  });
  if (!ok || !selectedJoint) {
    return false;
  }

  selectObject(selectedJoint);
  bumpCreatePartsRevision();
  return true;
}
