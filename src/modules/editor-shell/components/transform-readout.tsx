import type { TransformAxis } from '@/modules/viewport/stores/transform-readout-store';
import { useStore } from '@nanostores/react';
import { useEffect, useState } from 'react';
import { Input } from '@/components/input/input';
import { Text } from '@/components/text';
import { $clips } from '@/modules/animation/stores/clip-store';
import {
  $transformReadout,
  applyTransformPositionAxis,
} from '@/modules/viewport/stores/transform-readout-store';

type Draft = Record<TransformAxis, string>;

const EMPTY_DRAFT: Draft = { x: '', y: '', z: '' };
const AXES: TransformAxis[] = ['x', 'y', 'z'];

function formatAxis(value: number): string {
  return value.toFixed(3);
}

export function TransformReadout() {
  const value = useStore($transformReadout);
  const { activeClipId } = useStore($clips, { keys: ['activeClipId'] });
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [focused, setFocused] = useState<TransformAxis | null>(null);

  const enabled = value !== null;

  useEffect(() => {
    if (!value) {
      if (!focused) {
        setDraft(EMPTY_DRAFT);
      }
      return;
    }
    setDraft((current) => ({
      x: focused === 'x' ? current.x : formatAxis(value.x),
      y: focused === 'y' ? current.y : formatAxis(value.y),
      z: focused === 'z' ? current.z : formatAxis(value.z),
    }));
  }, [value, focused]);

  const handleChange = (axis: TransformAxis, next: string) => {
    setDraft((current) => ({ ...current, [axis]: next }));
    if (next === '' || next === '-' || next === '.' || next === '-.') {
      return;
    }
    const parsed = Number(next);
    if (Number.isFinite(parsed)) {
      applyTransformPositionAxis(axis, parsed);
    }
  };

  const handleBlur = (axis: TransformAxis) => {
    setFocused(null);
    const current = $transformReadout.get();
    if (!current) {
      setDraft(EMPTY_DRAFT);
      return;
    }
    setDraft((prev) => ({ ...prev, [axis]: formatAxis(current[axis]) }));
  };

  return (
    <div className="flex flex-col gap-2">
      <Text variant="muted">
        {activeClipId ? 'Animation root position' : 'Model root position'}
      </Text>

      <div className="flex gap-2">
        {AXES.map((axis) => (
          <Input
            key={axis}
            label={`${axis.toUpperCase()} (m)`}
            type="number"
            step={0.01}
            value={enabled ? draft[axis] : '—'}
            disabled={!enabled}
            className="flex-1 w-full"
            onFocus={() => setFocused(axis)}
            onChange={(event) => handleChange(axis, event.target.value)}
            onBlur={() => handleBlur(axis)}
          />
        ))}
      </div>
    </div>
  );
}
