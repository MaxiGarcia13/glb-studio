import { $activeModel } from '@/modules/viewport/stores/model-store';
import {
  $selection,
  clearSelection,
} from '@/modules/viewport/stores/selection-store';
import { resolveSelectedCreateRoots } from '../domain/hierarchy/selected-create-roots';
import { bumpCreatePartsRevision } from '../stores/create-parts-revision-store';
import { pushCreateSceneDeleteUndo } from './push-create-scene-undo';

export interface DeleteSelectedPartAvailability {
  enabled: boolean;
  reason: string;
}

/** Whether Delete would remove at least one create hierarchy root. */
export function getDeleteSelectedPartAvailability(): DeleteSelectedPartAvailability {
  const context = resolveSelectedCreateRoots(
    $activeModel.get(),
    $selection.get(),
  );
  if (!context) {
    return {
      enabled: false,
      reason: 'Select a create part or group to delete',
    };
  }
  return {
    enabled: true,
    reason: context.roots.length === 1
      ? 'Delete selected part or group'
      : `Delete ${context.roots.length} selected roots`,
  };
}

/**
 * Delete selected stamped parts and/or create groups on the focused created
 * model (clipboard roots). Clears selection; leaves the library model entry.
 * Pushes one createScene undo entry.
 */
export function deleteSelectedPart(): void {
  const context = resolveSelectedCreateRoots(
    $activeModel.get(),
    $selection.get(),
  );
  if (!context) {
    return;
  }

  clearSelection();
  const ok = pushCreateSceneDeleteUndo({
    modelId: context.modelId,
    partsRoot: context.partsRoot,
    roots: context.roots,
    beforeSelectUuids: context.selectUuids,
  });
  if (ok) {
    bumpCreatePartsRevision();
  }
}
