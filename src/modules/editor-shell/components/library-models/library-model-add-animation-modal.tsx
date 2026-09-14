import type { Group } from 'three';
import type { ClipEntry } from '@/modules/animation/types/clip';
import { useStore } from '@nanostores/react';
import { useState } from 'react';
import { Button } from '@/components/button';
import { useGltfFilePicker } from '@/components/gltf-file-picker/use-gltf-file-picker';
import { PlusIcon } from '@/components/icons/plus-icon';
import { UploadIcon } from '@/components/icons/upload-icon';
import { Modal } from '@/components/modal';
import { Select } from '@/components/select';
import { Text } from '@/components/text';
import {
  $clips,
  cloneClipAs,
  importClipFiles,
  startNewAnimation,
} from '@/modules/animation/stores/clip-store';
import { $model } from '@/modules/viewport/stores/model-store';

interface LibraryModelAddAnimationModalProps {
  open: boolean;
  onClose: () => void;
  ownerModelId: string;
  scene: Group;
}

const choiceRowClassName
  = 'w-full flex items-center gap-2 justify-start px-3 py-2.5 ring-1 ring-zinc-600/80';

function clipSourceLabel(
  entry: ClipEntry,
  modelNames: Map<string, string>,
): string {
  if (entry.ownerModelId === null) {
    return `${entry.name} — Shared`;
  }
  const modelName = modelNames.get(entry.ownerModelId) ?? entry.sourceFile;
  return `${entry.name} — ${modelName}`;
}

export function LibraryModelAddAnimationModal({
  open,
  onClose,
  ownerModelId,
  scene,
}: LibraryModelAddAnimationModalProps) {
  const { clips } = useStore($clips, { keys: ['clips'] });
  const { models } = useStore($model, { keys: ['models'] });
  const [sourceId, setSourceId] = useState('');

  const modelNames = new Map(models.map((model) => [model.id, model.fileName]));

  const ownedNames = new Set(
    clips
      .filter((entry) => entry.ownerModelId === ownerModelId)
      .map((entry) => entry.name),
  );

  // Other models + shared only — never this model's own clips.
  const cloneableClips = clips.filter((entry) => {
    if (entry.clip === null) {
      return false;
    }
    if (entry.ownerModelId === ownerModelId) {
      return false;
    }
    return !ownedNames.has(entry.name);
  });

  const hasCloneable = cloneableClips.length > 0;

  if (sourceId !== '' && !cloneableClips.some((entry) => entry.id === sourceId)) {
    setSourceId('');
  }

  function handleClose(): void {
    setSourceId('');
    onClose();
  }

  const { open: openImport, fileInput } = useGltfFilePicker({
    multiple: true,
    onFiles: (files) => {
      void importClipFiles(files, scene, ownerModelId).then(handleClose);
    },
  });

  return (
    <Modal
      open={open}
      title="Add animation"
      onClose={handleClose}
      className="max-w-md"
    >
      {fileInput}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => {
              startNewAnimation(scene, ownerModelId);
              handleClose();
            }}
            variant="default"
            className={choiceRowClassName}
          >
            <PlusIcon />
            Create new
          </Button>

          <Button
            onClick={() => openImport()}
            variant="default"
            className={choiceRowClassName}
          >
            <UploadIcon />
            Import
          </Button>
        </div>

        <div className="flex flex-col gap-2 border-t border-zinc-700 pt-4">
          <Text as="h2" variant="section">
            Add existing
          </Text>
          {hasCloneable
            ? (
                <div className="flex items-center gap-2">
                  <Select
                    value={sourceId}
                    onChange={(event) => setSourceId(event.target.value)}
                    aria-label="Clip to add"
                    placeholder="Choose animation…"
                    className="flex-1 min-w-0"
                    options={cloneableClips.map((entry) => ({
                      value: entry.id,
                      label: clipSourceLabel(entry, modelNames),
                    }))}
                  />
                  <Button
                    onClick={() => {
                      cloneClipAs(sourceId, ownerModelId);
                      handleClose();
                    }}
                    disabled={!sourceId}
                    variant={sourceId ? 'primary' : 'default'}
                    className="px-3 py-1.5 shrink-0"
                  >
                    Add
                  </Button>
                </div>
              )
            : (
                <Text variant="muted">
                  No other animations to add
                </Text>
              )}
        </div>
      </div>
    </Modal>
  );
}
