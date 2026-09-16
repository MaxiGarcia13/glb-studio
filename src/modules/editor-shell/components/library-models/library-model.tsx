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
import { PartOutliner } from '@/modules/create/components/part-outliner';
import { listCreatedParts } from '@/modules/create/domain/list-created-parts';
import { $createPartsRevision } from '@/modules/create/stores/create-parts-revision-store';
import { LibrarySectionCollapsible } from '@/modules/editor-shell/components/library-section-collapsible';
import {
  $model,
  removeModel,
  renameModel,
  replaceModel,
  selectModel,
} from '@/modules/viewport/stores/model-store';
import {
  $selection,
  selectModelIds,
  toggleModelId,
} from '@/modules/viewport/stores/selection-store';
import { openContextMenuForModel } from '@/modules/viewport/actions/open-selection-context-menu';
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
  const { kind, modelIds } = useStore($selection, { keys: ['kind', 'modelIds'] });
  useStore($createPartsRevision);
  const focused = model.id === activeModelId;
  const inModelMulti = kind === 'models' && modelIds.includes(model.id);
  const isActiveModelAnchor = kind === 'models'
    && modelIds.length > 0
    && modelIds[modelIds.length - 1] === model.id;
  const selected = inModelMulti || (kind !== 'models' && focused);
  const [addAnimationOpen, setAddAnimationOpen] = useState(false);
  const ownedClips = clips.filter((entry) => entry.ownerModelId === model.id);
  const isCreated = model.source === 'created';
  const partCount = isCreated ? listCreatedParts(model.scene).length : 0;
  const hasNested = isCreated ? partCount > 0 : ownedClips.length > 0;
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
            selected={selected}
            active={isActiveModelAnchor}
            onSelect={(event) => {
              if (event.shiftKey) {
                toggleModelId(model.id);
                return;
              }
              selectModel(model.id);
              if ($model.get().activeModelId === model.id) {
                selectModelIds([model.id]);
              }
            }}
            onContextMenu={(event) => {
              openContextMenuForModel(event, model.id);
            }}
          />
        )}
        selected={selected}
        headerClassName={isActiveModelAnchor ? 'bg-accent/25' : undefined}
        showChevron={hasNested}
        showTreeGuide={hasNested}
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
        {isCreated
          ? <PartOutliner modelId={model.id} scene={model.scene} />
          : <ClipRows clips={ownedClips} ownerModelId={model.id} />}
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
