import type { Object3D } from 'three';
import { isCreateGroup } from '@/modules/create/domain/group-data';
import { $activeModel } from '../stores/model-store';
import { $selection } from '../stores/selection-store';

/**
 * What the Settings sidebar should show for the current selection.
 * - idle: model root TRS + Animation
 * - group: Model TRS bound to the empty create group; no Animation
 * - part: Part panel (TRS + size); no Model / Animation
 * - multi: hide Model / Part / Animation (ambiguous)
 */
export type SettingsFocusKind = 'idle' | 'multi' | 'part' | 'group';

export interface SettingsFocus {
  kind: SettingsFocusKind;
  /** Object for Model-section TRS (model root or empty group). */
  modelTransformTarget: Object3D | null;
  /** Selected create part / bone when kind === 'part'. */
  partObject: Object3D | null;
}

export function resolveSettingsFocus(): SettingsFocus {
  const selection = $selection.get();
  const model = $activeModel.get();
  const root = model?.scene ?? null;

  if (selection.kind === 'models') {
    if (selection.modelIds.length > 1) {
      return { kind: 'multi', modelTransformTarget: null, partObject: null };
    }
    return { kind: 'idle', modelTransformTarget: root, partObject: null };
  }

  if (selection.kind === 'parts') {
    if (selection.objects.length > 1) {
      return { kind: 'multi', modelTransformTarget: null, partObject: null };
    }

    const object = selection.object;
    if (!object) {
      return { kind: 'idle', modelTransformTarget: root, partObject: null };
    }

    if (isCreateGroup(object)) {
      return {
        kind: 'group',
        modelTransformTarget: object,
        partObject: null,
      };
    }

    return {
      kind: 'part',
      modelTransformTarget: null,
      partObject: object,
    };
  }

  return { kind: 'idle', modelTransformTarget: root, partObject: null };
}
