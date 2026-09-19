import { Button } from '@/components/button';

interface ExportModalActionsProps {
  busy: boolean;
  onCancel: () => void;
  onExport: () => void;
}

export function ExportModalActions({
  busy,
  onCancel,
  onExport,
}: ExportModalActionsProps) {
  return (
    <div className="flex justify-end gap-2 shrink-0">
      <Button variant="default" onClick={onCancel} disabled={busy}>
        Cancel
      </Button>
      <Button variant="primary" onClick={onExport} disabled={busy}>
        {busy ? 'Packing…' : 'Export'}
      </Button>
    </div>
  );
}
