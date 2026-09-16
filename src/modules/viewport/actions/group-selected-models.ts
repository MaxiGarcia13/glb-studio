import {
  createModelGroup,
} from '@/modules/viewport/stores/model-group-store';
import { $model } from '@/modules/viewport/stores/model-store';
import { $selection, selectModelIds } from '@/modules/viewport/stores/selection-store';

export interface GroupModelsAvailability {
  enabled: boolean;
  reason: string;
}

export function getGroupModelsAvailability(): GroupModelsAvailability {
  const { kind, modelIds } = $selection.get();

  if (kind === 'parts') {
    return { enabled: false, reason: 'Use Group while parts are selected' };
  }

  if (kind !== 'models') {
    return { enabled: false, reason: 'Select models to group' };
  }

  if (modelIds.length < 2) {
    return { enabled: false, reason: 'Select at least two models' };
  }

  const known = new Set($model.get().models.map((model) => model.id));
  const valid = modelIds.filter((id) => known.has(id));
  if (valid.length < 2) {
    return { enabled: false, reason: 'Select at least two models' };
  }

  return {
    enabled: true,
    reason: 'Create a group and put the selection under it',
  };
}

/**
 * Put selected models into a new session group (library tree + export unit).
 */
export function groupSelectedModels(): boolean {
  const availability = getGroupModelsAvailability();
  if (!availability.enabled) {
    return false;
  }

  const { modelIds } = $selection.get();
  const known = new Set($model.get().models.map((model) => model.id));
  const valid = modelIds.filter((id) => known.has(id));
  const group = createModelGroup(valid);
  if (!group) {
    return false;
  }

  selectModelIds(group.modelIds);
  return true;
}
