import type { TransformMode } from '../stores/transform-mode-store';
import type { IconProps } from '@/components/icons/type';
import { cn } from '@maxigarcia/js-utils';
import { useStore } from '@nanostores/react';
import { Button } from '@/components/button';
import { FloatingToolbar } from '@/components/floating-toolbar';
import { PointerIcon } from '@/components/icons/pointer-icon';
import { RotateIcon } from '@/components/icons/rotate-icon';
import { ScaleIcon } from '@/components/icons/scale-icon';
import { useActiveModel } from '../hooks/use-active-model';
import { useTransformModeHotkeys } from '../hooks/use-transform-mode-hotkeys';
import { $editTool } from '../stores/edit-tool-store';
import { $selection } from '../stores/selection-store';
import {
  $transformMode,
  setTransformMode,
} from '../stores/transform-mode-store';

const MODES: {
  mode: TransformMode;
  label: string;
  hotkey: string;
  Icon: (props: IconProps) => React.ReactNode;
}[] = [
  { mode: 'translate', label: 'Move', hotkey: 'W', Icon: PointerIcon },
  { mode: 'rotate', label: 'Rotate', hotkey: 'E', Icon: RotateIcon },
  { mode: 'scale', label: 'Scale', hotkey: 'R', Icon: ScaleIcon },
];

interface TransformModeToolbarProps {
  className?: string;
}

export function TransformModeToolbar({ className }: TransformModeToolbarProps) {
  useTransformModeHotkeys();

  const { object: selected } = useStore($selection, { keys: ['object'] });
  const mode = useStore($transformMode);
  const editTool = useStore($editTool);
  const { scene } = useActiveModel();

  const visible
    = editTool !== 'navigate'
    && (editTool === 'move' ? scene !== null : selected !== null);

  if (!visible) {
    return null;
  }

  return (
    <FloatingToolbar aria-label="Transform mode" className={cn(className)}>
      {MODES.map(({ mode: nextMode, label, hotkey, Icon }) => {
        const active = mode === nextMode;
        return (
          <Button
            key={nextMode}
            variant={active ? 'primary' : 'ghost'}
            aria-label={`${label} (${hotkey})`}
            aria-pressed={active}
            title={`${label} (${hotkey})`}
            onClick={() => setTransformMode(nextMode)}
          >
            <Icon aria-hidden />
          </Button>
        );
      })}
    </FloatingToolbar>
  );
}
