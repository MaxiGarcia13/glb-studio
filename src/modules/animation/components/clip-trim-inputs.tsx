import { useStore } from '@nanostores/react';
import { Input } from '@/components/input/input';
import { $clips, isReadyClip, trimClip } from '../stores/clip-store';

export function ClipTrimInputs() {
  const { activeClipId, trimStart, trimEnd, clips } = useStore($clips, {
    keys: ['activeClipId', 'trimStart', 'trimEnd', 'clips'],
  });

  const active = clips.find((entry) => entry.id === activeClipId);
  const enabled = isReadyClip(active);
  const maxEnd = active?.sourceClip?.duration ?? trimEnd;

  const handleStart = (event: React.ChangeEvent<HTMLInputElement>) => {
    trimClip(Number(event.currentTarget.value), trimEnd);
  };

  const handleEnd = (event: React.ChangeEvent<HTMLInputElement>) => {
    trimClip(trimStart, Number(event.currentTarget.value));
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        label="Start Time"
        type="number"
        value={trimStart}
        min={0}
        max={trimEnd}
        step={0.01}
        onChange={handleStart}
        disabled={!enabled}
        className="flex-1 w-full"
      />
      <Input
        label="End Time"
        type="number"
        value={trimEnd}
        min={trimStart}
        max={maxEnd}
        step={0.01}
        onChange={handleEnd}
        disabled={!enabled}
        className="flex-1 w-full"
      />
    </div>
  );
}
