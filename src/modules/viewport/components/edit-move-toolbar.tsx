import type { EditTool } from '../stores/edit-tool-store';
import type { IconProps } from '@/components/icons/type';
import { cn } from '@maxigarcia/js-utils';
import { useStore } from '@nanostores/react';
import { Button } from '@/components/button';
import { FloatingToolbar } from '@/components/floating-toolbar';
import { ArrowsHorizontalIcon } from '@/components/icons/arrows-horizontal-icon';
import { BoneIcon } from '@/components/icons/bone-icon';
import { ManIcon } from '@/components/icons/man-icon';
import { $model } from '@/modules/viewport/stores/model-store';
import { $editTool, setEditTool } from '../stores/edit-tool-store';

const TOOLS: { tool: EditTool; label: string; Icon: (props: IconProps) => React.ReactNode }[] = [
  { tool: 'navigate', label: 'Navigate', Icon: ArrowsHorizontalIcon },
  { tool: 'edit', label: 'Edit', Icon: BoneIcon },
  { tool: 'move', label: 'Move', Icon: ManIcon },
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
    <FloatingToolbar aria-label="Navigate / Edit / Move" className={cn(className)}>
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
