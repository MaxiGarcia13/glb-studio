import type { RetargetScope } from '@/modules/animation/stores/clip-store';
import type { ClipEntry } from '@/modules/animation/types/clip';

import { useStore } from '@nanostores/react';
import { useMemo, useState } from 'react';
import { Text } from '@/components/text';
import { boneDisplayName } from '@/modules/animation/domain/bone-registry';
import { useRetarget } from '@/modules/animation/hooks/use-retarget';
import { retargetClip } from '@/modules/animation/stores/clip-store';
import { $retargetTargetModelId } from '@/modules/animation/stores/retarget-ui-store';
import { $model } from '@/modules/viewport/stores/model-store';
import { RetargetBoneTable } from './retarget-bone-table';
import { RetargetPanelActions } from './retarget-panel-actions';
import { RetargetPanelHeader } from './retarget-panel-header';
import { RetargetScopeFields } from './retarget-scope-fields';

interface RetargetPanelProps {
  entry: ClipEntry;
  onComplete: () => void;
  onCancel: () => void;
}

export function RetargetPanel({ entry, onComplete, onCancel }: RetargetPanelProps) {
  const targetModelId = useStore($retargetTargetModelId);
  const { models } = useStore($model, { keys: ['models'] });
  const targetModel = models.find((model) => model.id === targetModelId) ?? null;
  const targetScene = targetModel?.scene ?? null;
  const {
    sourceBones,
    targetBoneNames,
    mapping,
    mappedCount,
    complete,
    setMapping,
  } = useRetarget(entry, targetScene);
  const [unmappedOnly, setUnmappedOnly] = useState(false);
  const [scope, setScope] = useState<RetargetScope>('active');
  const [applyError, setApplyError] = useState<string | null>(null);

  const sortedTargets = useMemo(
    () => [...targetBoneNames].sort((a, b) => {
      const labelCmp = boneDisplayName(a).localeCompare(boneDisplayName(b));
      return labelCmp !== 0 ? labelCmp : a.localeCompare(b);
    }),
    [targetBoneNames],
  );

  if (!targetModel) {
    return (
      <Text variant="error">
        Focus a model in the viewport before retargeting.
      </Text>
    );
  }

  if (sourceBones.length === 0) {
    return (
      <Text variant="muted">
        This clip has no bone tracks to map.
      </Text>
    );
  }

  if (targetBoneNames.size === 0) {
    return (
      <Text variant="error">
        The loaded character has no skeleton bones to map onto.
      </Text>
    );
  }

  const rows = unmappedOnly
    ? sourceBones.filter((bone) => {
        const target = mapping.get(bone);
        return !(target && targetBoneNames.has(target));
      })
    : sourceBones;

  const onSubmit = () => {
    setApplyError(null);
    const result = retargetClip(entry.id, mapping, {
      scope,
      activeScene: targetScene,
      targetModelId: targetModel.id,
    });
    if (result.error || !result.clipId) {
      setApplyError(result.error ?? 'Retarget failed');
      return;
    }
    onComplete();
  };

  const setBoneMapping = (sourceBone: string, value: string) => {
    const next = new Map(mapping);
    if (value) {
      next.set(sourceBone, value);
    } else {
      next.delete(sourceBone);
    }
    setMapping(next);
  };

  return (
    <div className="flex flex-col gap-4 min-h-0 flex-1">
      <RetargetPanelHeader
        mismatch={entry.error ?? 'Clip tracks do not match this skeleton'}
        mappedCount={mappedCount}
        sourceCount={sourceBones.length}
        unmappedOnly={unmappedOnly}
        onUnmappedOnlyChange={setUnmappedOnly}
      />

      <RetargetBoneTable
        rows={rows}
        mapping={mapping}
        targetBoneNames={targetBoneNames}
        sortedTargets={sortedTargets}
        onMap={setBoneMapping}
      />

      <div className="flex flex-col gap-4 shrink-0">
        <RetargetScopeFields
          scope={scope}
          multiModel={models.length > 1}
          onScopeChange={setScope}
        />
        <RetargetPanelActions
          canApply={complete}
          hasSkipped={mappedCount < sourceBones.length}
          applyError={applyError}
          onCancel={onCancel}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}
