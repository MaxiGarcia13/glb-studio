import type { TransformAxis } from '@/modules/viewport/stores/transform-readout-store';
import { useStore } from '@nanostores/react';
import { useEffect, useState } from 'react';
import { Input } from '@/components/input/input';
import { Text } from '@/components/text';
import {
  $transformReadout,
  applyTransformPositionAxis,
  applyTransformRotationAxis,
  applyTransformScaleAxis,
} from '@/modules/viewport/stores/transform-readout-store';

type AxisDraft = Record<TransformAxis, string>;

const EMPTY_DRAFT: AxisDraft = { x: '', y: '', z: '' };
const AXES: TransformAxis[] = ['x', 'y', 'z'];

function formatFixed(value: number, digits: number): string {
  return value.toFixed(digits);
}

export function TransformReadout() {
  const value = useStore($transformReadout);
  const [positionDraft, setPositionDraft] = useState<AxisDraft>(EMPTY_DRAFT);
  const [rotationDraft, setRotationDraft] = useState<AxisDraft>(EMPTY_DRAFT);
  const [scaleDraft, setScaleDraft] = useState<AxisDraft>(EMPTY_DRAFT);
  const [focusedPosition, setFocusedPosition] = useState<TransformAxis | null>(null);
  const [focusedRotation, setFocusedRotation] = useState<TransformAxis | null>(null);
  const [focusedScale, setFocusedScale] = useState<TransformAxis | null>(null);

  const enabled = value !== null;

  useEffect(() => {
    if (!value) {
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
      x: focusedScale === 'x' ? current.x : formatFixed(value.scaleX, 3),
      y: focusedScale === 'y' ? current.y : formatFixed(value.scaleY, 3),
      z: focusedScale === 'z' ? current.z : formatFixed(value.scaleZ, 3),
    }));
  }, [value, focusedPosition, focusedRotation, focusedScale]);

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
  };

  const handleScaleChange = (axis: TransformAxis, next: string) => {
    setScaleDraft((current) => ({ ...current, [axis]: next }));
    if (next === '' || next === '-' || next === '.' || next === '-.') {
      return;
    }
    const parsed = Number(next);
    if (Number.isFinite(parsed)) {
      applyTransformScaleAxis(axis, parsed);
    }
  };

  const handleScaleBlur = (axis: TransformAxis) => {
    setFocusedScale(null);
    const current = $transformReadout.get();
    if (!current) {
      setScaleDraft(EMPTY_DRAFT);
      return;
    }
    const key = axis === 'x' ? 'scaleX' : axis === 'y' ? 'scaleY' : 'scaleZ';
    setScaleDraft((prev) => ({ ...prev, [axis]: formatFixed(current[key], 3) }));
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
              step={0.01}
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
        <Text variant="muted">Scale</Text>

        <div className="flex gap-2">
          {AXES.map((axis) => (
            <Input
              key={`scale-${axis}`}
              label={axis.toUpperCase()}
              type="number"
              step={0.01}
              min={0.001}
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
