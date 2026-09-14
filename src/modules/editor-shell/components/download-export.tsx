import { useState } from 'react';
import { Button } from '@/components/button';
import { DownloadIcon } from '@/components/icons/download-icon';
import { ExportModal, useExportZip } from '@/modules/export';

export function DownloadExport() {
  const { canExport } = useExportZip();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={() => setOpen(true)}
        disabled={!canExport}
        className="flex items-center gap-2 w-full justify-center"
      >
        <DownloadIcon />
        Download
      </Button>
      <ExportModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
