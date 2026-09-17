import type { ModelGroup, ModelGroupsState } from '../types/model-group';
import { map } from 'nanostores';

export const $modelGroups = map<ModelGroupsState>({
  groups: [],
});

function createGroupId(): string {
  return `mgrp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function nextGroupName(existing: readonly ModelGroup[]): string {
  const used = new Set(existing.map((group) => group.name));
  if (!used.has('group')) {
    return 'group';
  }
  let index = 2;
  while (used.has(`group_${index}`)) {
    index += 1;
  }
  return `group_${index}`;
}

/** Remove model ids from every group; drop groups that become empty. */
export function removeModelsFromGroups(modelIds: readonly string[]): void {
  if (modelIds.length === 0) {
    return;
  }
  const drop = new Set(modelIds);
  const groups = $modelGroups.get().groups.map((group) => ({
    ...group,
    modelIds: group.modelIds.filter((id) => !drop.has(id)),
  })).filter((group) => group.modelIds.length > 0);
  $modelGroups.setKey('groups', groups);
}

/**
 * Create a session model group containing `modelIds` (order preserved).
 * Members are removed from any previous group. Returns the new group or null.
 */
export function createModelGroup(
  modelIds: readonly string[],
  options: { name?: string } = {},
): ModelGroup | null {
  const unique: string[] = [];
  for (const id of modelIds) {
    if (!unique.includes(id)) {
      unique.push(id);
    }
  }
  if (unique.length < 2) {
    return null;
  }

  removeModelsFromGroups(unique);

  const requested = options.name?.trim();
  const group: ModelGroup = {
    id: createGroupId(),
    name: requested && requested.length > 0
      ? requested
      : nextGroupName($modelGroups.get().groups),
    modelIds: unique,
  };
  $modelGroups.setKey('groups', [...$modelGroups.get().groups, group]);
  return group;
}

/** Dissolve groups by id (members become ungrouped). */
export function dissolveModelGroups(groupIds: readonly string[]): number {
  if (groupIds.length === 0) {
    return 0;
  }
  const drop = new Set(groupIds);
  const before = $modelGroups.get().groups.length;
  $modelGroups.setKey(
    'groups',
    $modelGroups.get().groups.filter((group) => !drop.has(group.id)),
  );
  return before - $modelGroups.get().groups.length;
}

/** Groups that fully contain every id in `modelIds` (order irrelevant). */
export function findGroupsCovering(modelIds: readonly string[]): ModelGroup[] {
  if (modelIds.length === 0) {
    return [];
  }
  const set = new Set(modelIds);
  return $modelGroups.get().groups.filter((group) => {
    if (group.modelIds.length !== set.size) {
      return false;
    }
    return group.modelIds.every((id) => set.has(id));
  });
}

/** Group containing this model, if any. */
export function findGroupForModel(modelId: string): ModelGroup | null {
  return $modelGroups.get().groups.find((group) =>
    group.modelIds.includes(modelId),
  ) ?? null;
}

/** Model ids not in any group, in library order. */
export function listUngroupedModelIds(
  allModelIds: readonly string[],
): string[] {
  const grouped = new Set(
    $modelGroups.get().groups.flatMap((group) => group.modelIds),
  );
  return allModelIds.filter((id) => !grouped.has(id));
}
