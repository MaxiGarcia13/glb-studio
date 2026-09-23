import type { ExportFormat } from '@/modules/export/utils/file-name';
import { useEffect, useRef, useState } from 'react';
import { Modal } from '@/components/modal';
import { useExportZip } from '@/modules/export/hooks/use-export-zip';
import { defaultZipBaseName } from '@/modules/export/utils/file-name';
import {
  countSharedWorkingClips,
  defaultGroupNames,
  defaultModelNames,
  isDefaultZipBaseName,
} from './default-names';
import { ExportFileNames } from './export-file-names';
import { ExportModalActions } from './export-modal-actions';
import { ExportModalError } from './export-modal-error';
import { ExportZipSummary } from './export-zip-summary';

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
}

export function ExportModal({ open, onClose }: ExportModalProps) {
  const {
    download,
    busy,
    error,
    setError,
    exportUnits,
    multiModelGroups,
    clips,
  } = useExportZip();
  const [format, setFormat] = useState<ExportFormat>('glb');
  const [zipBaseName, setZipBaseName] = useState(() => defaultZipBaseName('glb'));
  const [exportAsFolders, setExportAsFolders] = useState(false);
  const [modelBaseNames, setModelBaseNames] = useState<Record<string, string>>(
    {},
  );
  const [groupBaseNames, setGroupBaseNames] = useState<Record<string, string>>(
    {},
  );
  const wasOpenRef = useRef(false);

  const sharedCount = countSharedWorkingClips(clips);
  const groupCount = multiModelGroups.length;
  const singleCount = exportUnits.filter((unit) => unit.kind === 'single').length;

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      const singleModels = exportUnits
        .filter((unit) => unit.kind === 'single')
        .flatMap((unit) => unit.models);
      setError(null);
      setFormat('glb');
      setExportAsFolders(false);
      setZipBaseName(defaultZipBaseName('glb'));
      setModelBaseNames(defaultModelNames(singleModels));
      setGroupBaseNames(
        defaultGroupNames(
          multiModelGroups.flatMap((unit) => (unit.group ? [unit.group] : [])),
        ),
      );
    }
    wasOpenRef.current = open;
  }, [open, exportUnits, multiModelGroups, setError]);

  function handleClose(): void {
    // Keep the modal open while pack / convert is in flight.
    if (busy) {
      return;
    }
    onClose();
  }

  function handleFormatChange(next: ExportFormat): void {
    setFormat(next);
    setError(null);
    setZipBaseName((previous) =>
      isDefaultZipBaseName(previous) ? defaultZipBaseName(next) : previous,
    );
  }

  async function handleExport(): Promise<void> {
    try {
      await download({
        format,
        layout: exportAsFolders ? 'folders' : 'flat',
        zipFileName: zipBaseName,
        groupFileNames: groupBaseNames,
        modelFileNames: modelBaseNames,
      });
      onClose();
    } catch {
      // Error surfaced via hook state; keep modal open (no partial zip).
    }
  }

  return (
    <Modal
      open={open}
      title="Export"
      onClose={handleClose}
      className="max-w-md"
    >
      <div className="flex flex-col gap-4 min-h-0 overflow-y-auto" aria-busy={busy}>
        <ExportZipSummary
          format={format}
          groupCount={groupCount}
          singleCount={singleCount}
          sharedCount={sharedCount}
          exportAsFolders={exportAsFolders}
        />

        <ExportFileNames
          format={format}
          busy={busy}
          zipBaseName={zipBaseName}
          exportAsFolders={exportAsFolders}
          groupBaseNames={groupBaseNames}
          modelBaseNames={modelBaseNames}
          multiModelGroups={multiModelGroups}
          exportUnits={exportUnits}
          onFormatChange={handleFormatChange}
          onZipBaseNameChange={setZipBaseName}
          onExportAsFoldersChange={setExportAsFolders}
          onGroupBaseNameChange={(groupId, value) => {
            setGroupBaseNames((previous) => ({
              ...previous,
              [groupId]: value,
            }));
          }}
          onModelBaseNameChange={(modelId, value) => {
            setModelBaseNames((previous) => ({
              ...previous,
              [modelId]: value,
            }));
          }}
        />

        {error ? <ExportModalError message={error} /> : null}

        <ExportModalActions
          busy={busy}
          format={format}
          onCancel={handleClose}
          onExport={() => void handleExport()}
        />
      </div>
    </Modal>
  );
}
