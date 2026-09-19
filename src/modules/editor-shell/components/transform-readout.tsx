import type { TransformAxis } from '@/modules/viewport/stores/transform-readout-store';
import { useStore } from '@nanostores/react';
import { useEffect, useState } from 'react';
import { Input } from '@/components/input/input';
import { Text } from '@/components/text';
import { getRestRootScale } from '@/modules/animation/domain/rest-pose';
import { commitPendingPose } from '@/modules/animation/stores/clip-store';
import { POSITION_EDIT_STEP_METRES } from '@/modules/viewport/constants/position-edit';
import { $activeModel } from '@/modules/viewport/stores/model-store';
import {
  $settingsFocus,
  $transformReadout,
  applyTransformPositionAxis,
  applyTransformRotationAxis,
  applyTransformScalePercentAxis,
} from '@/modules/viewport/stores/transform-readout-store';

type AxisDraft = Record<TransformAxis, string>;

const EMPTY_DRAFT: AxisDraft = { x: '', y: '', z: '' };
const AXES: TransformAxis[] = ['x', 'y', 'z'];
const UNIT_REST = { x: 1, y: 1, z: 1 } as const;

function formatFixed(value: number, digits: number): string {
  return value.toFixed(digits);
}

/** Current scale as percent of rest (`100` = rest scale on that axis). */
function scaleToRestPercent(current: number, rest: number): number {
  if (!(rest > 0)) {
    return 100;
  }
  return (current / rest) * 100;
}

export function TransformReadout() {
  const value = useStore($transformReadout);
  const activeModel = useStore($activeModel);
  const focus = useStore($settingsFocus);
  const [positionDraft, setPositionDraft] = useState<AxisDraft>(EMPTY_DRAFT);
  const [rotationDraft, setRotationDraft] = useState<AxisDraft>(EMPTY_DRAFT);
  const [scaleDraft, setScaleDraft] = useState<AxisDraft>(EMPTY_DRAFT);
  const [focusedPosition, setFocusedPosition] = useState<TransformAxis | null>(null);
  const [focusedRotation, setFocusedRotation] = useState<TransformAxis | null>(null);
  const [focusedScale, setFocusedScale] = useState<TransformAxis | null>(null);

  const enabled = value !== null;
  const scene = activeModel?.scene ?? null;
  // Groups use unit rest (100% = scale 1); model root uses bind / load rest.
  const restScale = focus.kind === 'group'
    ? UNIT_REST
    : scene
      ? getRestRootScale(scene)
      : null;
  const restScaleX = restScale?.x ?? null;
  const restScaleY = restScale?.y ?? null;
  const restScaleZ = restScale?.z ?? null;
  const scaleHint = focus.kind === 'group'
    ? 'Scale · 100% = unit size'
    : 'Scale · 100% = rest size';

  useEffect(() => {
    if (!value || restScaleX === null || restScaleY === null || restScaleZ === null) {
      if (!focusedPosition) {
        setPositionDraft(EMPTY_DRAFT);
      }
      if (!focusedRotation) {
        setRotationDraft(EMPTY_DRAFT);
      }
      if (!focusedScale) {
        setScaleDraft(EMPTY_DRAFT);
      }
      return;
    }
    setPositionDraft((current) => ({
      x: focusedPosition === 'x' ? current.x : formatFixed(value.x, 3),
      y: focusedPosition === 'y' ? current.y : formatFixed(value.y, 3),
      z: focusedPosition === 'z' ? current.z : formatFixed(value.z, 3),
    }));
    setRotationDraft((current) => ({
      x: focusedRotation === 'x' ? current.x : formatFixed(value.rotationX, 1),
      y: focusedRotation === 'y' ? current.y : formatFixed(value.rotationY, 1),
      z: focusedRotation === 'z' ? current.z : formatFixed(value.rotationZ, 1),
    }));
    setScaleDraft((current) => ({
      x: focusedScale === 'x'
        ? current.x
        : formatFixed(scaleToRestPercent(value.scaleX, restScaleX), 1),
      y: focusedScale === 'y'
        ? current.y
        : formatFixed(scaleToRestPercent(value.scaleY, restScaleY), 1),
      z: focusedScale === 'z'
        ? current.z
        : formatFixed(scaleToRestPercent(value.scaleZ, restScaleZ), 1),
    }));
  }, [
    value,
    restScaleX,
    restScaleY,
    restScaleZ,
    focusedPosition,
    focusedRotation,
    focusedScale,
  ]);

  const handlePositionChange = (axis: TransformAxis, next: string) => {
    setPositionDraft((current) => ({ ...current, [axis]: next }));
    if (next === '' || next === '-' || next === '.' || next === '-.') {
      return;
    }
    const parsed = Number(next);
    if (Number.isFinite(parsed)) {
      applyTransformPositionAxis(axis, parsed);
    }
  };

  const handlePositionBlur = (axis: TransformAxis) => {
    setFocusedPosition(null);
    const current = $transformReadout.get();
    if (!current) {
      setPositionDraft(EMPTY_DRAFT);
      return;
    }
    setPositionDraft((prev) => ({ ...prev, [axis]: formatFixed(current[axis], 3) }));
    commitPendingPose();
  };

  const handleRotationChange = (axis: TransformAxis, next: string) => {
    setRotationDraft((current) => ({ ...current, [axis]: next }));
    if (next === '' || next === '-' || next === '.' || next === '-.') {
      return;
    }
    const parsed = Number(next);
    if (Number.isFinite(parsed)) {
      applyTransformRotationAxis(axis, parsed);
    }
  };

  const handleRotationBlur = (axis: TransformAxis) => {
    setFocusedRotation(null);
    const current = $transformReadout.get();
    if (!current) {
      setRotationDraft(EMPTY_DRAFT);
      return;
    }
    const key = axis === 'x' ? 'rotationX' : axis === 'y' ? 'rotationY' : 'rotationZ';
    setRotationDraft((prev) => ({ ...prev, [axis]: formatFixed(current[key], 1) }));
    commitPendingPose();
  };

  const handleScaleChange = (axis: TransformAxis, next: string) => {
    setScaleDraft((current) => ({ ...current, [axis]: next }));
    if (next === '' || next === '-' || next === '.' || next === '-.') {
      return;
    }
    const parsed = Number(next);
    if (Number.isFinite(parsed)) {
      applyTransformScalePercentAxis(axis, parsed);
    }
  };

  const handleScaleBlur = (axis: TransformAxis) => {
    setFocusedScale(null);
    const current = $transformReadout.get();
    if (!current) {
      setScaleDraft(EMPTY_DRAFT);
      return;
    }
    const rest = focus.kind === 'group'
      ? UNIT_REST
      : (() => {
          const root = $activeModel.get()?.scene ?? null;
          return root ? getRestRootScale(root) : UNIT_REST;
        })();
    const key = axis === 'x' ? 'scaleX' : axis === 'y' ? 'scaleY' : 'scaleZ';
    setScaleDraft((prev) => ({
      ...prev,
      [axis]: formatFixed(scaleToRestPercent(current[key], rest[axis]), 1),
    }));
    commitPendingPose();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Text variant="muted">Position</Text>

        <div className="flex gap-2">
          {AXES.map((axis) => (
            <Input
              key={`pos-${axis}`}
              label={`${axis.toUpperCase()} (m)`}
              type="number"
              step={POSITION_EDIT_STEP_METRES}
              value={enabled ? positionDraft[axis] : '—'}
              disabled={!enabled}
              className="flex-1 w-full"
              onFocus={() => setFocusedPosition(axis)}
              onChange={(event) => handlePositionChange(axis, event.target.value)}
              onBlur={() => handlePositionBlur(axis)}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Text variant="muted">Rotation</Text>

        <div className="flex gap-2">
          {AXES.map((axis) => (
            <Input
              key={`rot-${axis}`}
              label={`${axis.toUpperCase()} (°)`}
              type="number"
              step={1}
              min={0}
              max={360}
              value={enabled ? rotationDraft[axis] : '—'}
              disabled={!enabled}
              className="flex-1 w-full"
              onFocus={() => setFocusedRotation(axis)}
              onChange={(event) => handleRotationChange(axis, event.target.value)}
              onBlur={() => handleRotationBlur(axis)}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Text variant="muted">{scaleHint}</Text>

        <div className="flex gap-2">
          {AXES.map((axis) => (
            <Input
              key={`scale-${axis}`}
              label={`${axis.toUpperCase()} (%)`}
              type="number"
              step={1}
              min={1}
              value={enabled ? scaleDraft[axis] : '—'}
              disabled={!enabled}
              className="flex-1 w-full"
              onFocus={() => setFocusedScale(axis)}
              onChange={(event) => handleScaleChange(axis, event.target.value)}
              onBlur={() => handleScaleBlur(axis)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
