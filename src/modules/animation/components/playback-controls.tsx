import { cn } from '@maxigarcia/js-utils';
import { useStore } from '@nanostores/react';
import { Button } from '@/components/button';
import { PauseIcon } from '@/components/icons/pause-icon';
import { PlayIcon } from '@/components/icons/play-icon';
import { RepeatIcon } from '@/components/icons/repeat-icon';
import { StopIcon } from '@/components/icons/stop-icon';
import { $model } from '@/modules/viewport/stores/model-store';
import { $clips, pause, play, stop, toggleLoop } from '../stores/clip-store';

interface PlaybackControlsProps {
  className?: string;
}

export function PlaybackControls({ className }: PlaybackControlsProps) {
  const { playing, loop, activeClipId } = useStore($clips, {
    keys: ['playing', 'loop', 'activeClipId'],
  });
  const { previewModelIds } = useStore($model, { keys: ['previewModelIds'] });

  // Clip selection drives play; model focus is not required (US-20 play is global).
  const enabled = activeClipId !== null && previewModelIds.length > 0;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button
        onClick={playing ? pause : play}
        disabled={!enabled}
        aria-label={playing ? 'Pause' : 'Play'}
        aria-pressed={playing}
        className="flex-1 flex items-center justify-center gap-2 max-w-20"
      >
        {playing ? <PauseIcon /> : <PlayIcon />}
        {playing ? 'Pause' : 'Play'}
      </Button>
      <Button
        onClick={stop}
        disabled={!enabled}
        aria-label="Stop"
        className="flex-1 flex items-center justify-center gap-2 max-w-20"
      >
        <StopIcon />
        Stop
      </Button>
      <Button
        onClick={toggleLoop}
        disabled={!enabled}
        aria-label="Toggle loop"
        aria-pressed={loop}
        variant="ghost"
        className={`flex-1 flex items-center justify-center gap-2 max-w-20 ${loop ? 'text-accent' : ''}`}
      >
        <RepeatIcon />
        {loop ? 'Loop' : 'Once'}
      </Button>
    </div>
  );
}
