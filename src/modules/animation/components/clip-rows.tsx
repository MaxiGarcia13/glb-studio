import type { ClipEntry } from '@/modules/animation/types/clip';
import { cn } from '@maxigarcia/js-utils';
import { useStore } from '@nanostores/react';
import { AssetEntry } from '@/components/asset-entry';
import { Button } from '@/components/button';
import { useGltfFilePicker } from '@/components/gltf-file-picker/use-gltf-file-picker';
import { AnimationIcon } from '@/components/icons/animation-icon';
import { RetargetIcon } from '@/components/icons/retarget-icon';
import {
  buildSkeletonNodeSet,
  validateClipAgainstSkeleton,
} from '@/modules/animation/domain/clip-validate';
import { useActiveModel } from '@/modules/viewport/hooks/use-active-model';
import { $model, selectModel } from '@/modules/viewport/stores/model-store';
import {
  $clips,
  removeClip,
  renameClip,
  replaceClip,
  selectClip,
} from '../stores/clip-store';
import { $retargetClipId, openRetarget } from '../stores/retarget-ui-store';

interface ClipRowsProps {
  clips: ClipEntry[];
  ownerModelId?: string | null;
  className?: string;
}

/** Shared-list mismatch vs the focused model (store status stays global). */
function sharedConflictError(
  entry: ClipEntry,
  nodeNames: Set<string> | null,
): string | null {
  if (!nodeNames || !entry.clip || entry.status === 'error') {
    return null;
  }
  const result = validateClipAgainstSkeleton(entry.clip, nodeNames);
  return result.valid ? null : result.error;
}

export function ClipRows({ clips, ownerModelId, className }: ClipRowsProps) {
  const { activeSharedClipId, activeClipByModelId, blendClipId } = useStore($clips, {
    keys: ['activeSharedClipId', 'activeClipByModelId', 'blendClipId'],
  });
  const retargetClipId = useStore($retargetClipId);
  const { activeModelId } = useStore($model, { keys: ['activeModelId'] });
  const { scene } = useActiveModel();

  const isSharedList = ownerModelId === undefined || ownerModelId === null;
  const selectedClipId
    = isSharedList
      ? activeSharedClipId
      : (activeClipByModelId[ownerModelId] ?? null);

  // Shared Animations: re-validate against the focused model when it changes.
  const activeNodeNames
    = isSharedList && scene ? buildSkeletonNodeSet(scene) : null;

  const { open: openReplace, fileInput: replaceInput } = useGltfFilePicker<string>({
    onFiles: (files, id) => {
      const file = files[0];
      if (file && id) {
        void replaceClip(id, file, scene);
      }
    },
  });

  if (clips.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      {replaceInput}

      {clips.map((entry) => {
        const contextError = isSharedList
          ? sharedConflictError(entry, activeNodeNames)
          : null;
        const isError = entry.status === 'error' || contextError !== null;
        const errorMessage = entry.status === 'error' ? entry.error : contextError;
        const isDraft = entry.status === 'draft';
        const canRetarget = isError && entry.clip !== null;
        const isRetargeting = retargetClipId === entry.id;
        const roleLabel
          = entry.id === blendClipId
            ? 'Blend'
            : isDraft
              ? 'Draft'
              : undefined;

        return (
          <AssetEntry
            key={entry.id}
            variant="row"
            leading={<AnimationIcon />}
            label={entry.name}
            title={`${entry.name} (${entry.sourceFile})`}
            description={isError ? errorMessage : entry.sourceFile}
            errorDetail={errorMessage}
            status={isError ? 'error' : undefined}
            statusLabel={
              roleLabel ?? (isError ? (canRetarget ? 'Needs retarget' : 'Failed') : undefined)
            }
            selected={entry.id === selectedClipId}
            onSelect={
              isError
                ? undefined
                : () => {
                    const ownerId = entry.ownerModelId ?? ownerModelId ?? undefined;
                    if (ownerId) {
                      selectModel(ownerId);
                    }
                    selectClip(entry.id, ownerId);
                  }
            }
            onReplace={() => openReplace(entry.id)}
            onRemove={() => removeClip(entry.id)}
            onRename={(name) => renameClip(entry.id, name)}
            replaceDisabled={scene === null || isDraft}
            primaryAction={
              canRetarget
                ? (
                    <Button
                      onClick={() => openRetarget(entry.id, ownerModelId ?? activeModelId)}
                      variant="primary"
                      aria-label="Retarget clip"
                      title={isRetargeting ? 'Retargeting…' : 'Retarget clip'}
                      className="p-1.5"
                      disabled={isRetargeting}
                    >
                      <RetargetIcon />
                    </Button>
                  )
                : undefined
            }
          />
        );
      })}
    </div>
  );
}
