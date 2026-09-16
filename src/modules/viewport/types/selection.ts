import type { Object3D } from 'three';

/** Discriminant — parts and models never share one selection. */
export type SelectionKind = 'none' | 'parts' | 'models';

export interface SelectionState {
  /**
   * Active (last-clicked) Object3D — TransformControls / inspector target.
   * Set only when `kind === 'parts'`.
   */
  object: Object3D | null;
  /**
   * Full part multi-selection including `object`.
   * Empty unless `kind === 'parts'`.
   */
  objects: Object3D[];
  /**
   * Selected library model ids. Last entry is the Group/Ungroup anchor.
   * Empty unless `kind === 'models'`.
   */
  modelIds: string[];
  kind: SelectionKind;
}

export const EMPTY_SELECTION: SelectionState = {
  object: null,
  objects: [],
  modelIds: [],
  kind: 'none',
};
