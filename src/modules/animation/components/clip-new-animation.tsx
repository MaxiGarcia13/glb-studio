import { Button } from '@/components/button';
import { PlusIcon } from '@/components/icons/plus-icon';
import { useActiveModel } from '@/modules/viewport/hooks/use-active-model';
import { startNewAnimation } from '../stores/clip-store';

interface ClipNewAnimationProps {
  onCreate?: () => void;
}

export function ClipNewAnimation({ onCreate }: ClipNewAnimationProps) {
  const { scene } = useActiveModel();
  const enabled = scene !== null;

  return (
    <Button
      onClick={() => {
        startNewAnimation(scene);
        onCreate?.();
      }}
      disabled={!enabled}
      variant="ghost"
      aria-label="New animation"
      title="New animation"
      className="p-2"
    >
      <PlusIcon />
    </Button>
  );
}
