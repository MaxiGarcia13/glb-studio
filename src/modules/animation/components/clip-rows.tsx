import type { ClipEntry } from '@/modules/animation/types/clip';
import { cn } from '@maxigarcia/js-utils';
import { useStore } from '@nanostores/react';
import { AssetEntry } from '@/components/asset-entry';
import { Button } from '@/components/button';
import { useGltfFilePicker } from '@/components/gltf-file-picker/use-gltf-file-picker';
import { AnimationIcon } from '@/components/icons/animation-icon';
import { RetargetIcon } from '@/components/icons/retarget-icon';
import { useActiveModel } from '@/modules/viewport/hooks/use-active-model';
import { $model } from '@/modules/viewport/stores/model-store';
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

export function ClipRows({ clips, ownerModelId, className }: ClipRowsProps) {
  const { activeSharedClipId, activeClipByModelId, blendClipId } = useStore($clips, {
    keys: ['activeSharedClipId', 'activeClipByModelId', 'blendClipId'],
  });
  const retargetClipId = useStore($retargetClipId);
  const { activeModelId } = useStore($model, { keys: ['activeModelId'] });
  const { scene } = useActiveModel();

  const selectedClipId
    = ownerModelId === undefined || ownerModelId === null
      ? activeSharedClipId
      : (activeClipByModelId[ownerModelId] ?? null);

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
    <div className={cn('flex flex-col gap-3', className)}>
      {replaceInput}

      {clips.map((entry) => {
        const isError = entry.status === 'error';
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
            leading={<AnimationIcon />}
            label={entry.name}
            title={`${entry.name} (${entry.sourceFile})`}
            description={isError ? entry.error : entry.sourceFile}
            errorDetail={entry.error}
            status={isError ? 'error' : undefined}
            statusLabel={
              roleLabel ?? (isError ? (canRetarget ? 'Needs retarget' : 'Failed') : undefined)
            }
            selected={entry.id === selectedClipId}
            onSelect={
              isError
                ? undefined
                : () => selectClip(entry.id, entry.ownerModelId ?? undefined)
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
