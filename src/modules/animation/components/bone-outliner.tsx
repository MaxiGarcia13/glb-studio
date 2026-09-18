import type { Bone, Group } from 'three';
import { cn } from '@maxigarcia/js-utils';
import { useStore } from '@nanostores/react';
import { Bone as ThreeBone } from 'three';
import { BoneIcon } from '@/components/icons/bone-icon';
import { Text } from '@/components/text';
import { listBoneEntries } from '@/modules/animation/domain/list-bones';
import { LibrarySectionCollapsible } from '@/modules/editor-shell/components/library-section-collapsible';
import { setEditTool } from '@/modules/viewport/stores/edit-tool-store';
import { $model, selectModel } from '@/modules/viewport/stores/model-store';
import {
  $selection,
  selectObject,
  toggleObject,
} from '@/modules/viewport/stores/selection-store';

interface BoneOutlinerProps {
  modelId: string;
  scene: Group;
  className?: string;
}

/**
 * Library outliner of skeleton bones for an imported model.
 * Parents use `LibrarySectionCollapsible` (closed by default). BoneIcon marks bone rows.
 * Click a row to focus the model (if needed), switch to Edit, and select the bone.
 * Shift+click toggles membership.
 */
export function BoneOutliner({ modelId, scene, className }: BoneOutlinerProps) {
  const { object: active, objects } = useStore($selection, {
    keys: ['object', 'objects'],
  });
  const entries = listBoneEntries(scene);

  if (entries.length === 0) {
    return null;
  }

  const boneSet = new Set(entries.map(({ bone }) => bone));
  const roots = entries.filter(({ depth }) => depth === 0).map(({ bone }) => bone);

  function getChildren(bone: Bone): Bone[] {
    return bone.children.filter(
      (child): child is Bone => child instanceof ThreeBone && boneSet.has(child),
    );
  }

  function selectBone(bone: Bone, event: React.MouseEvent) {
    if ($model.get().activeModelId !== modelId) {
      selectModel(modelId);
    }
    setEditTool('edit');
    if (event.shiftKey) {
      toggleObject(bone);
      return;
    }
    selectObject(bone);
  }

  function renderBone(bone: Bone) {
    const children = getChildren(bone);
    const label = bone.name || bone.uuid;
    const isSelected = objects.includes(bone);
    const isActive = active === bone;

    const title = (
      <button
        type="button"
        title={label}
        className="min-w-0 flex-1 cursor-pointer truncate text-left"
        onClick={(event) => {
          event.stopPropagation();
          selectBone(bone, event);
        }}
      >
        <Text
          as="span"
          className={cn(
            'min-w-0 truncate',
            isActive || isSelected ? 'text-fg' : 'text-current',
          )}
        >
          {label}
        </Text>
      </button>
    );

    if (children.length === 0) {
      return (
        <div
          key={bone.uuid}
          role="treeitem"
          aria-selected={isSelected}
          className={cn(
            'flex w-full min-h-8 items-center gap-2 rounded-sm px-2 py-2 transition-colors',
            isActive
              ? 'bg-surface-hover text-fg'
              : isSelected
                ? 'bg-control text-fg'
                : 'text-fg hover:bg-surface-hover/40',
          )}
        >
          <span className="inline-flex h-8 w-4 shrink-0" aria-hidden />
          <button
            type="button"
            title={label}
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 truncate text-left"
            onClick={(event) => selectBone(bone, event)}
          >
            <span className="shrink-0 text-fg-muted" aria-hidden>
              <BoneIcon />
            </span>
            <Text as="span" className="min-w-0 truncate text-current">
              {label}
            </Text>
          </button>
        </div>
      );
    }

    return (
      <LibrarySectionCollapsible
        key={bone.uuid}
        title={title}
        defaultOpen={false}
        selected={isActive || isSelected}
        showChevron
        showTreeGuide
      >
        {children.map((child) => renderBone(child))}
      </LibrarySectionCollapsible>
    );
  }

  return (
    <div
      className={cn('flex flex-col gap-2', className)}
      role="tree"
      aria-label="Bones"
    >
      {roots.map((bone) => renderBone(bone))}
    </div>
  );
}
