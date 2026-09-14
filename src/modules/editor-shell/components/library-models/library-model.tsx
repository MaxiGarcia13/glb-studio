import type { ModelEntry } from '@/modules/viewport/types/model';

import { useStore } from '@nanostores/react';
import { useState } from 'react';
import { useAssetEntryRename } from '@/components/asset-entry/use-asset-entry-rename';
import { useGltfFilePicker } from '@/components/gltf-file-picker/use-gltf-file-picker';
import { ClipRows } from '@/modules/animation/components/clip-rows';
import { modelHasReadyOwnedClipNamed } from '@/modules/animation/domain/clip-conflict';
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
  const { clips } = useStore($clips, {
    keys: ['clips'],
  });
  const { activeModelId } = useStore($model, { keys: ['activeModelId'] });
  const focused = model.id === activeModelId;
  const [addAnimationOpen, setAddAnimationOpen] = useState(false);
  const ownedClips = clips.filter((entry) => entry.ownerModelId === model.id);
  const nodeNames = buildSkeletonNodeSet(model.scene);
  const conflictedClipIds = clips.flatMap((entry) => {
    if (!entry.clip) {
      return [];
    }
    if (entry.ownerModelId === model.id) {
      return entry.status === 'error' ? [entry.id] : [];
    }
    if (entry.ownerModelId !== null) {
      return [];
    }
    if (modelHasReadyOwnedClipNamed(clips, model.id, entry.name)) {
      return [];
    }
    return validateClipAgainstSkeleton(entry.clip, nodeNames).valid ? [] : [entry.id];
  });

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
        showChevron={ownedClips.length > 0}
        showTreeGuide={ownedClips.length > 0}
        actions={(
          <LibraryModelActions
            modelId={model.id}
            conflictedClipIds={conflictedClipIds}
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
