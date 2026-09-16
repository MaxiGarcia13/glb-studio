import { $activeModel } from '@/modules/viewport/stores/model-store';
import { $selection } from '@/modules/viewport/stores/selection-store';
import {
  listParentCandidates,
  parentPart,
  unparentPart,
} from '../domain/parent-part';
import { readCreatePart } from '../domain/part-data';
import { asMesh, isInActiveModelScene } from '../utils/selected-part';

/** Select value for parenting under the created model’s parts root. */
export const PARTS_ROOT_PARENT_VALUE = '';

/**
 * Parent the selected stamped part under another part (by uuid) or the parts root.
 * Preserves world transform. Returns false when the selection / target is invalid.
 */
export function parentSelectedPart(parentValue: string): boolean {
  const activeModel = $activeModel.get();
  const selected = $selection.get().object;

  if (!activeModel || activeModel.source !== 'created' || !selected) {
    return false;
  }

  const mesh = asMesh(selected);
  if (!mesh || !isInActiveModelScene(mesh, activeModel.scene)) {
    return false;
  }

  if (!readCreatePart(mesh)) {
    return false;
  }

  const partsRoot = activeModel.scene;
  if (parentValue === PARTS_ROOT_PARENT_VALUE) {
    return unparentPart(mesh, partsRoot);
  }

  const parent = listParentCandidates(mesh, partsRoot).find(
    (candidate) => candidate.uuid === parentValue,
  );
  if (!parent) {
    return false;
  }

  return parentPart(mesh, parent, partsRoot);
}
