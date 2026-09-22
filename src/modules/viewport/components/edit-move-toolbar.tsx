import type { EditTool } from '../stores/edit-tool-store';
import type { IconProps } from '@/components/icons/type';
import type { EditorCommandId } from '@/modules/commands';
import { cn } from '@maxigarcia/js-utils';
import { useStore } from '@nanostores/react';
import { Button } from '@/components/button';
import { FloatingToolbar } from '@/components/floating-toolbar';
import { ArrowsHorizontalIcon } from '@/components/icons/arrows-horizontal-icon';
import { BoneIcon } from '@/components/icons/bone-icon';
import { ManIcon } from '@/components/icons/man-icon';
import {
  formatEditorCommandChord,
  getEditorCommand,
  runEditorCommand,
} from '@/modules/commands';
import { $model } from '@/modules/viewport/stores/model-store';
import { $editTool } from '../stores/edit-tool-store';

const TOOLS: {
  tool: EditTool;
  commandId: EditorCommandId;
  description: string;
  Icon: (props: IconProps) => React.ReactNode;
}[] = [
  {
    tool: 'navigate',
    commandId: 'editToolNavigate',
    description: 'Pan through the scene',
    Icon: ArrowsHorizontalIcon,
  },
  {
    tool: 'edit',
    commandId: 'editToolEdit',
    description: 'Pose bones and meshes',
    Icon: BoneIcon,
  },
  {
    tool: 'move',
    commandId: 'editToolMove',
    description: 'Place the whole model',
    Icon: ManIcon,
  },
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
      {TOOLS.map(({ tool: nextTool, commandId, description, Icon }) => {
        const command = getEditorCommand(commandId);
        const hotkey = formatEditorCommandChord(command.chords[0]!, false);
        const active = tool === nextTool;
        const title = `${command.label} (${hotkey}) — ${description}`;
        return (
          <Button
            key={nextTool}
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
