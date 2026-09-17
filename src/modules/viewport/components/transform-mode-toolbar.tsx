import type { TransformMode } from '../stores/transform-mode-store';
import type { IconProps } from '@/components/icons/type';
import type { EditorCommandId } from '@/modules/commands';
import { cn } from '@maxigarcia/js-utils';
import { useStore } from '@nanostores/react';
import { Button } from '@/components/button';
import { FloatingToolbar } from '@/components/floating-toolbar';
import { MoveIcon } from '@/components/icons/move-icon';
import { RotateIcon } from '@/components/icons/rotate-icon';
import { ScaleIcon } from '@/components/icons/scale-icon';
import {
  formatEditorCommandChord,
  getEditorCommand,
  runEditorCommand,
} from '@/modules/commands';
import { useActiveModel } from '../hooks/use-active-model';
import { $editTool } from '../stores/edit-tool-store';
import { $selection } from '../stores/selection-store';
import { $transformMode } from '../stores/transform-mode-store';

const MODES: {
  mode: TransformMode;
  commandId: EditorCommandId;
  Icon: (props: IconProps) => React.ReactNode;
}[] = [
  { mode: 'translate', commandId: 'transformMove', Icon: MoveIcon },
  { mode: 'rotate', commandId: 'transformRotate', Icon: RotateIcon },
  { mode: 'scale', commandId: 'transformScale', Icon: ScaleIcon },
];

interface TransformModeToolbarProps {
  className?: string;
}

export function TransformModeToolbar({ className }: TransformModeToolbarProps) {
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
      {MODES.map(({ mode: nextMode, commandId, Icon }) => {
        const command = getEditorCommand(commandId);
        const hotkey = formatEditorCommandChord(command.chords[0]!, false);
        const active = mode === nextMode;
        const title = `${command.label} (${hotkey})`;
        return (
          <Button
            key={nextMode}
            variant={active ? 'primary' : 'ghost'}
            aria-label={title}
            aria-pressed={active}
            title={title}
            onClick={() => runEditorCommand(commandId)}
          >
            <Icon aria-hidden />
          </Button>
        );
      })}
    </FloatingToolbar>
  );
}
