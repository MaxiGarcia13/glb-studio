import { Group, Object3D } from 'three';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { $editTool } from '@/modules/viewport/stores/edit-tool-store';
import { $model } from '@/modules/viewport/stores/model-store';
import { clearPoseDirty } from '@/modules/viewport/stores/pose-edit-store';
import { $selection } from '@/modules/viewport/stores/selection-store';
import { applyTransformPositionAxis } from '@/modules/viewport/stores/transform-readout-store';

vi.mock('@/modules/animation/stores/clip-store/actions/commit-pending-pose', () => ({
  commitPendingPose: vi.fn(),
}));

vi.mock('@/modules/animation/stores/clip-store/actions/playback', () => ({
  pause: vi.fn(),
}));

vi.mock('@/modules/animation/utils/mixer-session', () => ({
  suspendMixerBindings: vi.fn(),
  resumeMixerBindings: vi.fn(),
  sampleMixerAt: vi.fn(),
}));

describe('applyTransformPositionAxis multi', () => {
  beforeEach(() => {
    $editTool.set('edit');
    clearPoseDirty();
    $selection.set({
      object: null,
      objects: [],
      modelIds: [],
      kind: 'parts',
    });
    $model.set({
      models: [],
      activeModelId: null,
      previewModelIds: [],
      phase: 'idle',
      error: null,
    });
  });

  it('applies a shared position delta to every selected part root', () => {
    const a = new Object3D();
    const b = new Object3D();
    a.position.set(1, 0, 0);
    b.position.set(3, 0, 0);
    const scene = new Group();
    scene.add(a);
    scene.add(b);
    $model.set({
      models: [{ id: 'm1', fileName: 'a.glb', scene, source: 'created' }],
      activeModelId: 'm1',
      previewModelIds: ['m1'],
      phase: 'loaded',
      error: null,
    });
    // Primary is b at x=3; set to 4 → delta +1 for both.
    $selection.set({
      object: b,
      objects: [a, b],
      modelIds: [],
      kind: 'parts',
    });

    applyTransformPositionAxis('x', 4);

    expect(a.position.x).toBeCloseTo(2);
    expect(b.position.x).toBeCloseTo(4);
  });
});
