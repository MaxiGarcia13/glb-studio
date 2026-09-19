import { Object3D } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { POSITION_EDIT_STEP_METRES } from '@/modules/viewport/constants/position-edit';
import { $editTool } from '@/modules/viewport/stores/edit-tool-store';
import { clearPoseDirty } from '@/modules/viewport/stores/pose-edit-store';
import { $selection } from '@/modules/viewport/stores/selection-store';

vi.mock('@/modules/animation/stores/clip-store/actions/commit-pending-pose', () => ({
  commitPendingPose: vi.fn(),
}));

vi.mock('@/modules/animation/stores/clip-store/actions/playback', () => ({
  pause: vi.fn(),
}));

vi.mock('@/modules/animation/utils/mixer-session', () => ({
  suspendMixerBindings: vi.fn(),
  resumeMixerBindings: vi.fn(),
}));

vi.mock('@/modules/viewport/stores/transform-readout-store', async (importOriginal) => {
  const actual
    = await importOriginal<typeof import('@/modules/viewport/stores/transform-readout-store')>();
  return {
    ...actual,
    syncTransformReadout: vi.fn(),
  };
});

describe('nudgeSelection', () => {
  beforeEach(() => {
    $editTool.set('edit');
    clearPoseDirty();
    $selection.set({
      object: null,
      objects: [],
      modelIds: [],
      kind: 'parts',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('moves the selection by POSITION_EDIT_STEP_METRES on each axis press', async () => {
    const { nudgeSelection } = await import('@/modules/viewport/actions/nudge-selection');
    const object = new Object3D();
    object.position.set(1, 2, 3);
    $selection.set({
      object,
      objects: [object],
      modelIds: [],
      kind: 'parts',
    });

    nudgeSelection('x', 1);
    expect(object.position.x).toBeCloseTo(1 + POSITION_EDIT_STEP_METRES);
    expect(object.position.y).toBe(2);
    expect(object.position.z).toBe(3);

    nudgeSelection('y', -1);
    expect(object.position.y).toBeCloseTo(2 - POSITION_EDIT_STEP_METRES);

    nudgeSelection('z', 1);
    expect(object.position.z).toBeCloseTo(3 + POSITION_EDIT_STEP_METRES);
  });

  it('uses 0.01 m — same step as TRS position inputs', () => {
    expect(POSITION_EDIT_STEP_METRES).toBe(0.01);
  });
});
