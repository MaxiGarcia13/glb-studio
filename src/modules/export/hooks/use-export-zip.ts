import type { ExportZipOptions } from '../domain/zip-download';
import { useStore } from '@nanostores/react';
import { useState } from 'react';
import { $clips } from '@/modules/animation/stores/clip-store';
import { $createPartsRevision } from '@/modules/create/stores/create-parts-revision-store';
import { $modelGroups } from '@/modules/viewport/stores/model-group-store';
import { $model } from '@/modules/viewport/stores/model-store';
import { downloadExportZip, resolveExportUnits } from '../domain/zip-download';

export function useExportZip() {
  const { models, previewModelIds } = useStore($model, {
    keys: ['models', 'previewModelIds'],
  });
  const { groups } = useStore($modelGroups, { keys: ['groups'] });
  const { clips, activeClipByModelId, activeSharedClipId } = useStore($clips, {
    keys: ['clips', 'activeClipByModelId', 'activeSharedClipId'],
  });
  useStore($createPartsRevision);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportUnits = resolveExportUnits(models, groups);
  const multiModelGroups = exportUnits.filter((unit) => unit.kind === 'group');
  const canExport
    = exportUnits.length > 0 || clips.some((entry) => entry.clip !== null);

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
    previewModelIds,
    models,
    groups,
    exportUnits,
    multiModelGroups,
    clips,
    activeClipByModelId,
    activeSharedClipId,
  };
}
