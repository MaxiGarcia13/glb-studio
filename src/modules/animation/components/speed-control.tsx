import { useStore } from '@nanostores/react';
import { useRef } from 'react';

import { Text } from '@/components/text';
import { $clips, isReadyClip, MAX_TIME_SCALE, MIN_TIME_SCALE, setTimeScale } from '../stores/clip-store';

export function SpeedControl() {
  const { activeClipId, clips } = useStore($clips, {
    keys: ['activeClipId', 'clips'],
  });
  const undoFromRef = useRef<number | null>(null);

  const active = clips.find((entry) => entry.id === activeClipId);
  const timeScale = active?.timeScale ?? 1;
  // Speed is per-clip metadata; model focus is not required.
  const enabled = activeClipId !== null && isReadyClip(active);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (undoFromRef.current === null) {
      undoFromRef.current = timeScale;
    }
    setTimeScale(Number(event.currentTarget.value), { recordUndo: false });
  };

  const handleCommit = () => {
    const undoFrom = undoFromRef.current;
    undoFromRef.current = null;
    if (undoFrom === null) {
      return;
    }
    const current = $clips.get().clips.find((entry) => entry.id === activeClipId)?.timeScale;
    if (current === undefined) {
      return;
    }
    setTimeScale(current, { undoFrom });
  };

  return (
    <label className="flex flex-col gap-2">
      <Text variant="muted">Speed</Text>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={MIN_TIME_SCALE}
          max={MAX_TIME_SCALE}
          step={0.1}
          value={timeScale}
          onChange={handleChange}
          onPointerUp={handleCommit}
          onBlur={handleCommit}
          disabled={!enabled}
          aria-label="Playback speed multiplier"
          className="flex-1 accent-accent disabled:opacity-40"
        />
        <Text variant="numeric" className="w-8 text-right text-fg">
          {timeScale.toFixed(1)}
          x
        </Text>
      </div>
    </label>
  );
}
