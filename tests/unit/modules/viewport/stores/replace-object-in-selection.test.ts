import { Group, Object3D } from 'three';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  $selection,
  replaceObjectInSelection,
  selectObject,
} from '@/modules/viewport/stores/selection-store';

vi.mock('@/modules/animation/stores/clip-store/actions/commit-pending-pose', () => ({
  commitPendingPose: vi.fn(),
}));

vi.mock('@/modules/animation/utils/mixer-session', () => ({
  resumeMixerBindings: vi.fn(),
}));

describe('replaceObjectInSelection', () => {
  beforeEach(() => {
    $selection.set({
      object: null,
      objects: [],
      modelIds: [],
      kind: 'none',
    });
  });

  it('replaces a selected object with another and makes it active', () => {
    const group = new Group();
    const part = new Object3D();
    const other = new Object3D();
    $selection.set({
      object: group,
      objects: [other, group],
      modelIds: [],
      kind: 'parts',
    });

    replaceObjectInSelection(group, part);

    expect($selection.get()).toEqual({
      object: part,
      objects: [other, part],
      modelIds: [],
      kind: 'parts',
    });
  });

  it('falls back to selectObject when from is not in the selection', () => {
    const group = new Group();
    const part = new Object3D();
    const other = new Object3D();
    selectObject(other);

    replaceObjectInSelection(group, part);

    expect($selection.get().objects).toEqual([part]);
    expect($selection.get().object).toBe(part);
  });
});
