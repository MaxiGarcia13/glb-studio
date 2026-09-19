import type { Object3D } from 'three';
import { isCreateGroup } from '@/modules/create/domain/group-data';
import { $activeModel, $model } from '../stores/model-store';
import { $selection } from '../stores/selection-store';

/**
 * What the Settings sidebar should show for the current selection.
 * - idle: model root TRS + Animation
 * - group: Model TRS bound to the empty create group; no Animation
 * - part: Part panel (TRS + size); no Model / Animation
 * - bone: Selection name + Animation (Keys filter); no Model / Part
 * - multi: position XYZ only (shared delta); primary bound for readout
 *
 * Part / group focus is create-model only (US-34: after skin, source → imported).
 */
export type SettingsFocusKind = 'idle' | 'multi' | 'part' | 'group' | 'bone';

export interface SettingsFocus {
  kind: SettingsFocusKind;
  /** Object for Model-section TRS (model root or empty group). */
  modelTransformTarget: Object3D | null;
  /** Selected create part or bone when kind is `part` / `bone`. */
  partObject: Object3D | null;
  /** Primary object for multi-select position readout / delta baseline. */
  multiTransformTarget: Object3D | null;
}

function isBoneObject(object: Object3D): boolean {
  return (object as Object3D & { isBone?: boolean }).isBone === true;
}

function idleFocus(root: Object3D | null): SettingsFocus {
  return {
    kind: 'idle',
    modelTransformTarget: root,
    partObject: null,
    multiTransformTarget: null,
  };
}

export function resolveSettingsFocus(): SettingsFocus {
  const selection = $selection.get();
  const model = $activeModel.get();
  const root = model?.scene ?? null;
  const created = model?.source === 'created';

  if (selection.kind === 'models') {
    if (selection.modelIds.length > 1) {
      const lastId = selection.modelIds[selection.modelIds.length - 1];
      const primary
        = $model.get().models.find((entry) => entry.id === lastId)?.scene
          ?? root;
      return {
        kind: 'multi',
        modelTransformTarget: null,
        partObject: null,
        multiTransformTarget: primary,
      };
    }
    return idleFocus(root);
  }

  if (selection.kind === 'parts') {
    if (selection.objects.length > 1) {
      return {
        kind: 'multi',
        modelTransformTarget: null,
        partObject: null,
        multiTransformTarget: selection.object,
      };
    }

    const object = selection.object;
    if (!object) {
      return idleFocus(root);
    }

    if (created && isCreateGroup(object)) {
      return {
        kind: 'group',
        modelTransformTarget: object,
        partObject: null,
        multiTransformTarget: null,
      };
    }

    if (isBoneObject(object)) {
      return {
        kind: 'bone',
        modelTransformTarget: null,
        partObject: object,
        multiTransformTarget: null,
      };
    }

    if (created) {
      return {
        kind: 'part',
        modelTransformTarget: null,
        partObject: object,
        multiTransformTarget: null,
      };
    }

    // Imported / skinned mesh pick — keep model + Animation, not create Part tools.
    return idleFocus(root);
  }

  return idleFocus(root);
}
