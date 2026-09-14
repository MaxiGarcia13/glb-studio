import { Button } from '@/components/button';
import { useCollapsible } from '@/components/collapsible';
import { AnimationIcon } from '@/components/icons/animation-icon';
import { EditIcon } from '@/components/icons/edit-icon';
import { ReplaceIcon } from '@/components/icons/replace-icon';
import { RetargetIcon } from '@/components/icons/retarget-icon';
import { TrashIcon } from '@/components/icons/trash-icon';
import { openRetarget } from '@/modules/animation/stores/retarget-ui-store';

interface LibraryModelActionsProps {
  modelId: string;
  conflictedClipId: string | null;
  onAddAnimation: () => void;
  onRename: () => void;
  onReplace: () => void;
  onRemove: () => void;
}

export function LibraryModelActions({
  modelId,
  conflictedClipId,
  onAddAnimation,
  onRename,
  onReplace,
  onRemove,
}: LibraryModelActionsProps) {
  const { setOpen } = useCollapsible();

  return (
    <>
      {conflictedClipId !== null && (
        <Button
          onClick={() => openRetarget(conflictedClipId, modelId)}
          variant="ghost"
          aria-label="Retarget conflicted clips"
          title="Retarget clips"
          className="p-1.5"
        >
          <RetargetIcon />
        </Button>
      )}

      <Button
        onClick={() => {
          setOpen(true);
          onAddAnimation();
        }}
        variant="ghost"
        aria-label="Add animation"
        title="Add animation"
        className="p-1.5"
      >
        <AnimationIcon />
      </Button>
      <Button
        onClick={onRename}
        variant="ghost"
        aria-label="Rename model"
        title="Rename model"
        className="p-1.5"
      >
        <EditIcon />
      </Button>
      <Button
        onClick={onReplace}
        variant="ghost"
        aria-label="Replace model"
        title="Replace model"
        className="p-1.5"
      >
        <ReplaceIcon />
      </Button>
      <Button
        onClick={onRemove}
        variant="ghost"
        aria-label="Remove model"
        title="Remove model"
        className="p-1.5"
      >
        <TrashIcon />
      </Button>
    </>
  );
}
