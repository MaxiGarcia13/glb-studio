import type { ExportFormat } from '@/modules/export/utils/file-name';
import { Button } from '@/components/button';

interface ExportModalActionsProps {
  busy: boolean;
  format: ExportFormat;
  onCancel: () => void;
  onExport: () => void;
}

export function ExportModalActions({
  busy,
  format,
  onCancel,
  onExport,
}: ExportModalActionsProps) {
  const busyLabel = format === 'fbx' ? 'Exporting…' : 'Packing…';

  return (
    <div className="flex justify-end gap-2 shrink-0">
      <Button variant="default" onClick={onCancel} disabled={busy}>
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={onExport}
        disabled={busy}
        aria-busy={busy}
      >
        {busy ? busyLabel : 'Export'}
      </Button>
    </div>
  );
}
