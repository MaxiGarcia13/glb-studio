import type { ModelEntry } from '@/modules/viewport/types/model';

import { useStore } from '@nanostores/react';
import { useState } from 'react';
import { useAssetEntryRename } from '@/components/asset-entry/use-asset-entry-rename';
import { useGltfFilePicker } from '@/components/gltf-file-picker/use-gltf-file-picker';
import { ClipRows } from '@/modules/animation/components/clip-rows';
import {
  buildSkeletonNodeSet,
  validateClipAgainstSkeleton,
} from '@/modules/animation/domain/clip-validate';
import { $clips } from '@/modules/animation/stores/clip-store';
import { LibrarySectionCollapsible } from '@/modules/editor-shell/components/library-section-collapsible';
import {
  $model,
  removeModel,
  renameModel,
  replaceModel,
  selectModel,
} from '@/modules/viewport/stores/model-store';
import { LibraryModelActions } from './library-model-actions';
import { LibraryModelAddAnimationModal } from './library-model-add-animation-modal';
import { LibraryModelTitle } from './library-model-title';

interface LibraryModelProps {
  model: ModelEntry;
}

export function LibraryModel({ model }: LibraryModelProps) {
  const { clips, activeSharedClipId, activeClipByModelId } = useStore($clips, {
    keys: ['clips', 'activeSharedClipId', 'activeClipByModelId'],
  });
  const { activeModelId } = useStore($model, { keys: ['activeModelId'] });
  const focused = model.id === activeModelId;
  const [addAnimationOpen, setAddAnimationOpen] = useState(false);
  const ownedClips = clips.filter((entry) => entry.ownerModelId === model.id);
  const nodeNames = buildSkeletonNodeSet(model.scene);
  const conflictedClips = clips.filter((entry) => {
    if (!entry.clip) {
      return false;
    }
    if (entry.ownerModelId === model.id) {
      return entry.status === 'error';
    }
    if (entry.ownerModelId !== null) {
      return false;
    }
    return !validateClipAgainstSkeleton(entry.clip, nodeNames).valid;
  });
  const selectedConflictedClip = conflictedClips.find(
    (entry) =>
      entry.id === activeSharedClipId
      || entry.id === (activeClipByModelId[model.id] ?? null),
  );
  const firstConflictedClip = conflictedClips[0];

  const rename = useAssetEntryRename({
    label: model.fileName,
    onRename: (name) => renameModel(model.id, name),
  });

  const { open: openReplace, fileInput: replaceInput } = useGltfFilePicker({
    onFiles: (files) => {
      const file = files[0];
      if (file) {
        void replaceModel(model.id, file);
      }
    },
  });

  return (
    <>
      <LibrarySectionCollapsible
        title={(
          <LibraryModelTitle
            modelId={model.id}
            fileName={model.fileName}
            rename={rename}
            selected={focused}
            onSelect={() => selectModel(model.id)}
          />
        )}
        selected={focused}
        className="ml-5"
        headerContentClassName="flex-col w-full"
        actionsClassName="w-full justify-end"
        actions={(
          <LibraryModelActions
            modelId={model.id}
            conflictedClipId={selectedConflictedClip?.id ?? firstConflictedClip?.id ?? null}
            onAddAnimation={() => setAddAnimationOpen(true)}
            onRename={rename.startEditing}
            onReplace={() => openReplace()}
            onRemove={() => removeModel(model.id)}
          />
        )}
      >
        <ClipRows clips={ownedClips} ownerModelId={model.id} />
      </LibrarySectionCollapsible>

      {replaceInput}

      <LibraryModelAddAnimationModal
        open={addAnimationOpen}
        onClose={() => setAddAnimationOpen(false)}
        ownerModelId={model.id}
        scene={model.scene}
      />
    </>
  );
}
