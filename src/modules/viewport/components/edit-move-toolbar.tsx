import type { EditTool } from '../stores/edit-tool-store';
import { cn } from '@maxigarcia/js-utils';
import { useStore } from '@nanostores/react';
import { Button } from '@/components/button';
import { FloatingToolbar } from '@/components/floating-toolbar';
import { CursorIcon } from '@/components/icons/cursor-icon';
import { MoveIcon } from '@/components/icons/move-icon';
import { $model } from '@/modules/viewport/stores/model-store';
import { $editTool, setEditTool } from '../stores/edit-tool-store';

const TOOLS: { tool: EditTool; label: string; Icon: typeof CursorIcon }[] = [
  { tool: 'edit', label: 'Edit', Icon: CursorIcon },
  { tool: 'move', label: 'Move', Icon: MoveIcon },
];

interface EditMoveToolbarProps {
  className?: string;
}

export function EditMoveToolbar({ className }: EditMoveToolbarProps) {
  const { phase } = useStore($model, { keys: ['phase'] });
  const tool = useStore($editTool);

  if (phase !== 'loaded') {
    return null;
  }

  return (
    <FloatingToolbar aria-label="Edit / Move" className={cn(className)}>
      {TOOLS.map(({ tool: nextTool, label, Icon }) => {
        const active = tool === nextTool;
        return (
          <Button
            key={nextTool}
            variant={active ? 'primary' : 'ghost'}
            aria-label={label}
            aria-pressed={active}
            title={label}
            onClick={() => setEditTool(nextTool)}
          >
            <Icon aria-hidden />
          </Button>
        );
      })}
    </FloatingToolbar>
  );
}
