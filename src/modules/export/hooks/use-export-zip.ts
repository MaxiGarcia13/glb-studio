import type { ExportZipOptions } from '../domain/zip-download';
import { useStore } from '@nanostores/react';
import { useState } from 'react';
import { $clips } from '@/modules/animation/stores/clip-store';
import { $model } from '@/modules/viewport/stores/model-store';
import { downloadExportZip } from '../domain/zip-download';

export function useExportZip() {
  const { models, previewModelIds } = useStore($model, {
    keys: ['models', 'previewModelIds'],
  });
  const { clips, activeClipByModelId, activeSharedClipId } = useStore($clips, {
    keys: ['clips', 'activeClipByModelId', 'activeSharedClipId'],
  });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canExport = models.length > 0 || clips.some((entry) => entry.clip !== null);
  const canMerge = previewModelIds.length >= 2;

  async function download(options: ExportZipOptions = {}): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await downloadExportZip(options);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Export failed');
      throw cause;
    } finally {
      setBusy(false);
    }
  }

  return {
    download,
    busy,
    error,
    setError,
    canExport,
    canMerge,
    previewModelIds,
    models,
    clips,
    activeClipByModelId,
    activeSharedClipId,
  };
}
