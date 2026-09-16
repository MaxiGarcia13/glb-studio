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

function defaultGroupNames(
  groups: { id: string; name: string }[],
): Record<string, string> {
  const next: Record<string, string> = {};
  for (const group of groups) {
    next[group.id] = group.name;
  }
  return next;
}

function defaultClipPicks(
  models: ModelEntry[],
  clips: ClipEntry[],
  activeClipByModelId: Record<string, string | null>,
  activeSharedClipId: string | null,
): Record<string, string> {
  const next: Record<string, string> = {};
  for (const model of models) {
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
    exportUnits,
    multiModelGroups,
    clips,
    activeClipByModelId,
    activeSharedClipId,
  } = useExportZip();
  const [zipBaseName, setZipBaseName] = useState('glb-export');
  const [sceneClipName, setSceneClipName] = useState(DEFAULT_SCENE_CLIP_NAME);
  const [modelBaseNames, setModelBaseNames] = useState<Record<string, string>>({});
  const [groupBaseNames, setGroupBaseNames] = useState<Record<string, string>>({});
  const [clipIdByModelId, setClipIdByModelId] = useState<Record<string, string>>({});
  const wasOpenRef = useRef(false);

  const sharedCount = countSharedWorkingClips(clips);
  const groupCount = multiModelGroups.length;
  const singleCount = exportUnits.filter((unit) => unit.kind === 'single').length;
  const sceneBakeModels = multiModelGroups.flatMap((unit) => unit.models);
  const needsSceneBake = sceneBakeModels.length > 0;
  const pickedCount = sceneBakeModels.filter((model) =>
    Boolean(clipIdByModelId[model.id]),
  ).length;

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      const bakeModels = multiModelGroups.flatMap((unit) => unit.models);
      const singleModels = exportUnits
        .filter((unit) => unit.kind === 'single')
        .flatMap((unit) => unit.models);
      setError(null);
      setZipBaseName('glb-export');
      setSceneClipName(DEFAULT_SCENE_CLIP_NAME);
      setModelBaseNames(defaultModelNames(singleModels));
      setGroupBaseNames(
        defaultGroupNames(
          multiModelGroups.flatMap((unit) => (unit.group ? [unit.group] : [])),
        ),
      );
      setClipIdByModelId(
        defaultClipPicks(
          bakeModels,
          clips,
          activeClipByModelId,
          activeSharedClipId,
        ),
      );
    }
    wasOpenRef.current = open;
  }, [
    open,
    exportUnits,
    multiModelGroups,
    clips,
    activeClipByModelId,
    activeSharedClipId,
    setError,
  ]);

  async function handleExport(): Promise<void> {
    try {
      await download({
        zipFileName: zipBaseName,
        groupFileNames: groupBaseNames,
        modelFileNames: modelBaseNames,
        clipIdByModelId: needsSceneBake ? clipIdByModelId : undefined,
        sceneClipName: needsSceneBake ? sceneClipName : undefined,
      });
      onClose();
    } catch {
      // Error surfaced via hook state; keep modal open.
    }
  }

  const summaryParts: string[] = [];
  if (groupCount > 0) {
    summaryParts.push(
      `${groupCount} grouped ${groupCount === 1 ? 'GLB' : 'GLBs'}`,
    );
  }
  if (singleCount > 0) {
    summaryParts.push(
      `${singleCount} ${singleCount === 1 ? 'model' : 'models'}`,
    );
  }
  if (sharedCount > 0) {
    summaryParts.push(
      `${sharedCount} shared animation ${sharedCount === 1 ? 'file' : 'files'}`,
    );
  }
  if (needsSceneBake && pickedCount > 0) {
    summaryParts.push(
      `Scene bake from ${pickedCount} ${pickedCount === 1 ? 'clip' : 'clips'}`,
    );
  }

  return (
    <Modal
      open={open}
      title="Export"
      onClose={onClose}
      className="max-w-md"
    >
      <div className="flex flex-col gap-4 min-h-0 overflow-y-auto">
        <div className="flex flex-col gap-2">
          <Text as="h2" variant="section">
            Zip contents
          </Text>
          <Text variant="muted">
            {summaryParts.length > 0
              ? summaryParts.join(' · ')
              : 'Nothing to pack yet'}
          </Text>
          {groupCount > 0 && (
            <Text size="sm" variant="muted">
              Model groups pack as one GLB each (namespaced bones). Ungrouped models stay separate.
            </Text>
          )}
        </div>

        {needsSceneBake && (
          <div className="flex flex-col gap-4 border-t border-border pt-4">
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
            {multiModelGroups.map((unit) => (
              <div key={unit.group?.id ?? unit.models[0]?.id} className="flex flex-col gap-3">
                <Text variant="muted">
                  {unit.group?.name ?? 'Group'}
                </Text>
                {unit.models.map((model) => {
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
              </div>
            ))}
            <Text size="sm" variant="muted">
              Different clips per model bake into one Scene animation inside that group GLB.
            </Text>
          </div>
        )}

        <div className="flex flex-col gap-4 border-t border-border pt-4">
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
          {multiModelGroups.map((unit) => {
            const group = unit.group;
            if (!group) {
              return null;
            }
            return (
              <Input
                key={group.id}
                label={`Group · ${group.name}`}
                value={groupBaseNames[group.id] ?? group.name}
                onChange={(event) => {
                  const value = event.target.value;
                  setGroupBaseNames((previous) => ({
                    ...previous,
                    [group.id]: value,
                  }));
                }}
                disabled={busy}
                spellCheck={false}
              />
            );
          })}
          {exportUnits
            .filter((unit) => unit.kind === 'single')
            .map((unit) => {
              const model = unit.models[0];
              if (!model) {
                return null;
              }
              return (
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
              );
            })}
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
