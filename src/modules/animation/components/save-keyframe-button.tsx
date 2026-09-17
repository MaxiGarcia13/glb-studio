import { cn } from '@maxigarcia/js-utils';
import { useStore } from '@nanostores/react';
import { Button } from '@/components/button';
import { FloatingToolbar } from '@/components/floating-toolbar';
import { RestoreIcon } from '@/components/icons/restore-icon';
import { useActiveModel } from '@/modules/viewport/hooks/use-active-model';
import { $poseDirty } from '@/modules/viewport/stores/pose-edit-store';
import { restorePose } from '../stores/clip-store';

interface SaveKeyframeButtonProps {
  className?: string;
}

/**
 * In-progress pose discard. Finished gestures auto-commit; this only shows
 * while a gizmo drag or Settings field edit is still open.
 */
export function SaveKeyframeButton({ className }: SaveKeyframeButtonProps) {
  const poseDirty = useStore($poseDirty);
  const { scene } = useActiveModel();

  if (!poseDirty || scene === null) {
    return null;
  }

  return (
    <FloatingToolbar aria-label="Pose edit" className={cn(className)}>
      <Button
        variant="ghost"
        onClick={restorePose}
        aria-label="Restore edit"
        title="Discard this edit"
      >
        <RestoreIcon aria-hidden />
      </Button>
    </FloatingToolbar>
  );
}
