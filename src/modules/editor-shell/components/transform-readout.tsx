import type { TransformAxis } from '@/modules/viewport/stores/transform-readout-store';
import { useStore } from '@nanostores/react';
import { useEffect, useState } from 'react';
import { Input } from '@/components/input/input';
import { Text } from '@/components/text';
import {
  $transformReadout,
  applyTransformPositionAxis,
  applyTransformRotationAxis,
} from '@/modules/viewport/stores/transform-readout-store';

type PositionDraft = Record<TransformAxis, string>;
type RotationDraft = Record<TransformAxis, string>;

const EMPTY_POSITION: PositionDraft = { x: '', y: '', z: '' };
const EMPTY_ROTATION: RotationDraft = { x: '', y: '', z: '' };
const AXES: TransformAxis[] = ['x', 'y', 'z'];

function formatPosition(value: number): string {
  return value.toFixed(3);
}

function formatRotation(value: number): string {
  return value.toFixed(1);
}

export function TransformReadout() {
  const value = useStore($transformReadout);
  const [positionDraft, setPositionDraft] = useState<PositionDraft>(EMPTY_POSITION);
  const [rotationDraft, setRotationDraft] = useState<RotationDraft>(EMPTY_ROTATION);
  const [focusedPosition, setFocusedPosition] = useState<TransformAxis | null>(null);
  const [focusedRotation, setFocusedRotation] = useState<TransformAxis | null>(null);

  const enabled = value !== null;

  useEffect(() => {
    if (!value) {
      if (!focusedPosition) {
        setPositionDraft(EMPTY_POSITION);
      }
      if (!focusedRotation) {
        setRotationDraft(EMPTY_ROTATION);
      }
      return;
    }
    setPositionDraft((current) => ({
      x: focusedPosition === 'x' ? current.x : formatPosition(value.x),
      y: focusedPosition === 'y' ? current.y : formatPosition(value.y),
      z: focusedPosition === 'z' ? current.z : formatPosition(value.z),
    }));
    setRotationDraft((current) => ({
      x: focusedRotation === 'x' ? current.x : formatRotation(value.rotationX),
      y: focusedRotation === 'y' ? current.y : formatRotation(value.rotationY),
      z: focusedRotation === 'z' ? current.z : formatRotation(value.rotationZ),
    }));
  }, [value, focusedPosition, focusedRotation]);

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
      setPositionDraft(EMPTY_POSITION);
      return;
    }
    setPositionDraft((prev) => ({ ...prev, [axis]: formatPosition(current[axis]) }));
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
      setRotationDraft(EMPTY_ROTATION);
      return;
    }
    const key = axis === 'x' ? 'rotationX' : axis === 'y' ? 'rotationY' : 'rotationZ';
    setRotationDraft((prev) => ({ ...prev, [axis]: formatRotation(current[key]) }));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Text variant="muted">
          Position
        </Text>

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
        <Text variant="muted">
          Rotation
        </Text>

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
    </div>
  );
}
