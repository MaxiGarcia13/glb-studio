import { cn } from '@maxigarcia/js-utils';
import { Button } from '@/components/button';
import { PauseIcon } from '@/components/icons/pause-icon';
import { PlayIcon } from '@/components/icons/play-icon';
import { RepeatIcon } from '@/components/icons/repeat-icon';
import { StopIcon } from '@/components/icons/stop-icon';
import { usePlaybackTransport } from '../hooks/use-playback-transport';

export type PlaybackControlsVariant = 'labeled' | 'icon';

interface PlaybackControlsProps {
  className?: string;
  /**
   * `labeled` — Play / Pause / Stop / Loop text (legacy centered bar).
   * `icon` — icon-only compact row for shared Timeline | Tracks chrome.
   */
  variant?: PlaybackControlsVariant;
}

/**
 * Reusable transport controls. Same store wiring for every bottom-bar mode;
 * only layout density changes via `variant`.
 */
export function PlaybackControls({
  className,
  variant = 'labeled',
}: PlaybackControlsProps) {
  const { playing, loop, enabled, play, pause, stop, toggleLoop }
    = usePlaybackTransport();

  const iconOnly = variant === 'icon';

  return (
    <div
      role="toolbar"
      aria-label="Playback"
      className={cn('flex items-center gap-2', className)}
    >
      <Button
        onClick={playing ? pause : play}
        disabled={!enabled}
        aria-label={playing ? 'Pause' : 'Play'}
        aria-pressed={playing}
        variant={iconOnly ? 'ghost' : 'default'}
        title={playing ? 'Pause' : 'Play'}
        className={cn(
          'flex items-center justify-center gap-2',
          !iconOnly && 'flex-1 max-w-20',
        )}
      >
        {playing ? <PauseIcon /> : <PlayIcon />}
        {!iconOnly && (playing ? 'Pause' : 'Play')}
      </Button>
      <Button
        onClick={stop}
        disabled={!enabled}
        aria-label="Stop"
        title="Stop"
        variant={iconOnly ? 'ghost' : 'default'}
        className={cn(
          'flex items-center justify-center gap-2',
          !iconOnly && 'flex-1 max-w-20',
        )}
      >
        <StopIcon />
        {!iconOnly && 'Stop'}
      </Button>
      <Button
        onClick={toggleLoop}
        disabled={!enabled}
        aria-label="Toggle loop"
        aria-pressed={loop}
        title={loop ? 'Loop' : 'Once'}
        variant="ghost"
        className={cn(
          'flex items-center justify-center gap-2',
          !iconOnly && 'flex-1 max-w-20',
          loop && 'text-accent',
        )}
      >
        <RepeatIcon />
        {!iconOnly && (loop ? 'Loop' : 'Once')}
      </Button>
    </div>
  );
}
