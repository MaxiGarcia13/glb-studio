import type { ClipEntry } from '@/modules/animation/types/clip';
import type { ModelEntry } from '@/modules/viewport/types/model';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/button';
import { Input } from '@/components/input/input';
import { Modal } from '@/components/modal';
import { Select } from '@/components/select';
import { Text } from '@/components/text';
import { resolveActiveClipIdForModel } from '@/modules/animation/domain/resolve-active-clip';
import { DEFAULT_SCENE_CLIP_NAME, listMergeClipChoices } from '../domain/merge-namespace';
import { useExportZip } from '../hooks/use-export-zip';
import { stripGlbExtension } from '../utils/file-name';

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
}

function countSharedWorkingClips(
  clips: { ownerModelId: string | null; clip: unknown }[],
): number {
  return clips.filter((entry) => entry.ownerModelId === null && entry.clip !== null).length;
}

function defaultModelNames(
  models: { id: string; fileName: string }[],
): Record<string, string> {
  const next: Record<string, string> = {};
  for (const model of models) {
    next[model.id] = stripGlbExtension(model.fileName);
  }
  return next;
}

function defaultClipPicks(
  previewed: ModelEntry[],
  clips: ClipEntry[],
  activeClipByModelId: Record<string, string | null>,
  activeSharedClipId: string | null,
): Record<string, string> {
  const next: Record<string, string> = {};
  for (const model of previewed) {
    const choices = listMergeClipChoices(model, clips);
    const choiceIds = new Set(choices.map((entry) => entry.id));
    const resolved = resolveActiveClipIdForModel(
      clips,
      model.id,
      activeClipByModelId,
      activeSharedClipId,
    );
    if (resolved && choiceIds.has(resolved)) {
      next[model.id] = resolved;
      continue;
    }
    next[model.id] = choices[0]?.id ?? '';
  }
  return next;
}

export function ExportModal({ open, onClose }: ExportModalProps) {
  const {
    download,
    busy,
    error,
    setError,
    canMerge,
    models,
    previewModelIds,
    clips,
    activeClipByModelId,
    activeSharedClipId,
  } = useExportZip();
  const [mergeModels, setMergeModels] = useState(false);
  const [zipBaseName, setZipBaseName] = useState('glb-export');
  const [mergedBaseName, setMergedBaseName] = useState('merged');
  const [sceneClipName, setSceneClipName] = useState(DEFAULT_SCENE_CLIP_NAME);
  const [modelBaseNames, setModelBaseNames] = useState<Record<string, string>>({});
  const [clipIdByModelId, setClipIdByModelId] = useState<Record<string, string>>({});
  const wasOpenRef = useRef(false);

  const previewed = models.filter((model) => previewModelIds.includes(model.id));
  const sharedCount = countSharedWorkingClips(clips);
  const mergeActive = mergeModels && canMerge;
  const pickedCount = previewed.filter((model) => Boolean(clipIdByModelId[model.id])).length;

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      const visible = models.filter((model) => previewModelIds.includes(model.id));
      setError(null);
      setMergeModels(false);
      setZipBaseName('glb-export');
      setMergedBaseName('merged');
      setSceneClipName(DEFAULT_SCENE_CLIP_NAME);
      setModelBaseNames(defaultModelNames(models));
      setClipIdByModelId(
        defaultClipPicks(visible, clips, activeClipByModelId, activeSharedClipId),
      );
    }
    if (!open) {
      setMergeModels(false);
    }
    wasOpenRef.current = open;
  }, [
    open,
    models,
    previewModelIds,
    clips,
    activeClipByModelId,
    activeSharedClipId,
    setError,
  ]);

  useEffect(() => {
    if (!canMerge && mergeModels) {
      setMergeModels(false);
    }
  }, [canMerge, mergeModels]);

  async function handleExport(): Promise<void> {
    try {
      await download({
        mergeModels: mergeActive,
        zipFileName: zipBaseName,
        mergedFileName: mergedBaseName,
        modelFileNames: modelBaseNames,
        clipIdByModelId: mergeActive ? clipIdByModelId : undefined,
        sceneClipName: mergeActive ? sceneClipName : undefined,
      });
      onClose();
    } catch {
      // Error surfaced via hook state; keep modal open.
    }
  }

  return (
    <Modal
      open={open}
      title="Export"
      onClose={onClose}
      className="max-w-md"
    >
      <div className="flex flex-col gap-4 min-h-0 overflow-y-auto">
        <div className="flex flex-col gap-1">
          <Text as="h2" variant="section">
            Zip contents
          </Text>
          {mergeActive
            ? (
                <Text variant="muted">
                  1 merged GLB from
                  {' '}
                  {previewed.length}
                  {' '}
                  visible
                  {' '}
                  {previewed.length === 1 ? 'model' : 'models'}
                  {pickedCount > 0
                    ? ` · Scene bake from ${pickedCount} ${pickedCount === 1 ? 'clip' : 'clips'}`
                    : ''}
                  {sharedCount > 0
                    ? ` · ${sharedCount} shared animation ${sharedCount === 1 ? 'file' : 'files'}`
                    : ''}
                </Text>
              )
            : (
                <Text variant="muted">
                  {models.length}
                  {' '}
                  {models.length === 1 ? 'model' : 'models'}
                  {sharedCount > 0
                    ? ` · ${sharedCount} shared animation ${sharedCount === 1 ? 'file' : 'files'}`
                    : ''}
                </Text>
              )}
        </div>

        <label
          className={`flex items-start gap-2 shrink-0 ${canMerge ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
        >
          <input
            type="checkbox"
            checked={mergeActive}
            disabled={!canMerge || busy}
            onChange={(event) => setMergeModels(event.target.checked)}
            className="size-3.5 shrink-0 mt-0.5 rounded-sm border-zinc-600 accent-sky-500"
          />
          <span className="flex flex-col gap-0.5">
            <Text variant="muted">Merge visible models</Text>
            <Text size="sm" variant="muted">
              {canMerge
                ? 'One GLB with namespaced bones. Pick a clip per character to bake a Scene take (e.g. a fight). Shared clips also stay as separate files.'
                : 'Show at least two models in the viewport to enable merge.'}
            </Text>
          </span>
        </label>

        {mergeActive && (
          <div className="flex flex-col gap-3 border-t border-zinc-700 pt-4">
            <Text as="h2" variant="section">
              Scene animations
            </Text>
            <Input
              label="Scene clip name"
              value={sceneClipName}
              onChange={(event) => setSceneClipName(event.target.value)}
              disabled={busy}
              spellCheck={false}
            />
            {previewed.map((model) => {
              const choices = listMergeClipChoices(model, clips);
              const options = [
                { value: '', label: 'None (bind pose)' },
                ...choices.map((entry) => ({
                  value: entry.id,
                  label:
                    entry.ownerModelId === null
                      ? `${entry.name} (shared)`
                      : entry.name,
                })),
              ];
              return (
                <Select
                  key={model.id}
                  label={stripGlbExtension(model.fileName)}
                  value={clipIdByModelId[model.id] ?? ''}
                  options={options}
                  disabled={busy || choices.length === 0}
                  onChange={(event) => {
                    const value = event.target.value;
                    setClipIdByModelId((previous) => ({
                      ...previous,
                      [model.id]: value,
                    }));
                  }}
                />
              );
            })}
            <Text size="sm" variant="muted">
              Different clips per model bake into one Scene animation (both characters act together).
            </Text>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-zinc-700 pt-4">
          <Text as="h2" variant="section">
            File names
          </Text>
          <Input
            label="Zip archive"
            value={zipBaseName}
            onChange={(event) => setZipBaseName(event.target.value)}
            disabled={busy}
            spellCheck={false}
            aria-description=".zip is added automatically"
          />
          {mergeActive
            ? (
                <Input
                  label="Merged model"
                  value={mergedBaseName}
                  onChange={(event) => setMergedBaseName(event.target.value)}
                  disabled={busy}
                  spellCheck={false}
                />
              )
            : (
                models.map((model) => (
                  <Input
                    key={model.id}
                    label={stripGlbExtension(model.fileName)}
                    value={modelBaseNames[model.id] ?? stripGlbExtension(model.fileName)}
                    onChange={(event) => {
                      const value = event.target.value;
                      setModelBaseNames((previous) => ({
                        ...previous,
                        [model.id]: value,
                      }));
                    }}
                    disabled={busy}
                    spellCheck={false}
                  />
                ))
              )}
          <Text size="sm" variant="muted">
            Shared animation files keep their library names. Extensions are added automatically.
          </Text>
        </div>

        {error && (
          <Text as="div" variant="error" className="whitespace-pre-line">
            {error}
          </Text>
        )}

        <div className="flex justify-end gap-2 shrink-0">
          <Button variant="default" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => void handleExport()}
            disabled={busy}
          >
            {busy ? 'Packing…' : 'Export'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
