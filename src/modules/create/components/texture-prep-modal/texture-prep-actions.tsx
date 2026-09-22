import { Button } from '@/components/button';

interface TexturePrepActionsProps {
  onCancel: () => void;
  /** When false, Apply stays disabled (no committed draft yet). */
  canApply?: boolean;
  onApply?: () => void;
}

export function TexturePrepActions({
  onCancel,
  canApply = false,
  onApply,
}: TexturePrepActionsProps) {
  return (
    <div className="flex shrink-0 justify-end gap-2">
      <Button variant="ghost" onClick={onCancel}>
        Cancel
      </Button>
      <Button
        variant="primary"
        disabled={!canApply}
        title={canApply ? 'Apply texture' : 'Choose an image before applying'}
        onClick={onApply}
      >
        Apply
      </Button>
    </div>
  );
}
