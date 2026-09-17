import { useStore } from '@nanostores/react';
import { useRef } from 'react';
import { Input } from '@/components/input/input';
import {
  $clips,
  captureTrimClipSnapshot,
  isReadyClip,
  trimClip,
} from '../stores/clip-store';

export function ClipTrimInputs() {
  const { activeClipId, trimStart, trimEnd, clips } = useStore($clips, {
    keys: ['activeClipId', 'trimStart', 'trimEnd', 'clips'],
  });
  const undoFromRef = useRef<ReturnType<typeof captureTrimClipSnapshot>>(null);

  const active = clips.find((entry) => entry.id === activeClipId);
  const enabled = isReadyClip(active);
  const maxEnd = active?.sourceClip?.duration ?? trimEnd;

  const captureUndoFrom = () => {
    if (undoFromRef.current === null) {
      undoFromRef.current = captureTrimClipSnapshot();
    }
  };

  const commitUndo = () => {
    const undoFrom = undoFromRef.current;
    undoFromRef.current = null;
    if (!undoFrom) {
      return;
    }
    const state = $clips.get();
    trimClip(state.trimStart, state.trimEnd, { undoFrom });
  };

  const handleStart = (event: React.ChangeEvent<HTMLInputElement>) => {
    captureUndoFrom();
    trimClip(Number(event.currentTarget.value), trimEnd, { recordUndo: false });
  };

  const handleEnd = (event: React.ChangeEvent<HTMLInputElement>) => {
    captureUndoFrom();
    trimClip(trimStart, Number(event.currentTarget.value), { recordUndo: false });
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
        onFocus={captureUndoFrom}
        onBlur={commitUndo}
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
        onFocus={captureUndoFrom}
        onBlur={commitUndo}
        disabled={!enabled}
        className="flex-1 w-full"
      />
    </div>
  );
}
