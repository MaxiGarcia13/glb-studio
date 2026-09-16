import {
  dissolveModelGroups,
  findGroupForModel,
  findGroupsCovering,
  removeModelsFromGroups,
} from '@/modules/viewport/stores/model-group-store';
import { $selection } from '@/modules/viewport/stores/selection-store';

export interface UngroupModelsAvailability {
  enabled: boolean;
  reason: string;
}

export function getUngroupModelsAvailability(): UngroupModelsAvailability {
  const { kind, modelIds } = $selection.get();

  if (kind === 'parts') {
    return { enabled: false, reason: 'Use Ungroup while parts are selected' };
  }

  if (kind !== 'models') {
    return { enabled: false, reason: 'Select models to ungroup' };
  }

  if (modelIds.length === 0) {
    return { enabled: false, reason: 'Select models to ungroup' };
  }

  const covering = findGroupsCovering(modelIds);
  if (covering.length > 0) {
    return {
      enabled: true,
      reason: 'Dissolve the selected model group(s)',
    };
  }

  const anyGrouped = modelIds.some((id) => findGroupForModel(id) !== null);
  if (!anyGrouped) {
    return { enabled: false, reason: 'Selected models are not in a group' };
  }

  return {
    enabled: true,
    reason: 'Remove selected models from their group(s)',
  };
}

/**
 * Dissolve covering groups, or pull selected models out of whatever groups they are in.
 */
export function ungroupSelectedModels(): boolean {
  const availability = getUngroupModelsAvailability();
  if (!availability.enabled) {
    return false;
  }

  const { modelIds } = $selection.get();
  const covering = findGroupsCovering(modelIds);
  if (covering.length > 0) {
    return dissolveModelGroups(covering.map((group) => group.id)) > 0;
  }

  removeModelsFromGroups(modelIds);
  return true;
}
