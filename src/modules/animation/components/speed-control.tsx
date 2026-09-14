import { useStore } from '@nanostores/react';

import { Text } from '@/components/text';
import { $clips, isReadyClip, MAX_TIME_SCALE, MIN_TIME_SCALE, setTimeScale } from '../stores/clip-store';

export function SpeedControl() {
  const { activeClipId, clips } = useStore($clips, {
    keys: ['activeClipId', 'clips'],
  });

  const active = clips.find((entry) => entry.id === activeClipId);
  const timeScale = active?.timeScale ?? 1;
  // Speed is per-clip metadata; model focus is not required.
  const enabled = activeClipId !== null && isReadyClip(active);

  return (
    <label className="flex flex-col gap-1">
      <Text variant="muted">Speed</Text>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={MIN_TIME_SCALE}
          max={MAX_TIME_SCALE}
          step={0.1}
          value={timeScale}
          onChange={(event) => setTimeScale(Number(event.currentTarget.value))}
          disabled={!enabled}
          aria-label="Playback speed multiplier"
          className="flex-1 accent-sky-500 disabled:opacity-40"
        />
        <Text variant="numeric" className="w-9 text-right text-zinc-100">
          {timeScale.toFixed(1)}
          x
        </Text>
      </div>
    </label>
  );
}
