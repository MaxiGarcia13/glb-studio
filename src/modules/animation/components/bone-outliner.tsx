import type { Group, Object3D } from 'three';
import { cn } from '@maxigarcia/js-utils';
import { useStore } from '@nanostores/react';
import { useState } from 'react';
import { ChevronRight } from '@/components/icons/chevron-right-icon';
import { Text } from '@/components/text';
import { listBoneEntries } from '@/modules/animation/domain/list-bones';
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

function isUnderCollapsedAncestor(
  object: Object3D,
  collapsed: ReadonlySet<string>,
): boolean {
  let current: Object3D | null = object.parent;
  while (current) {
    if (collapsed.has(current.uuid)) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

/**
 * Library outliner of skeleton bones for an imported model.
 * Click a row to focus the model (if needed), switch to Edit, and select the bone.
 * Shift+click toggles membership. Parents can be collapsed via the row chevron.
 */
export function BoneOutliner({ modelId, scene, className }: BoneOutlinerProps) {
  const { object: active, objects } = useStore($selection, {
    keys: ['object', 'objects'],
  });
  const [collapsedIds, setCollapsedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const entries = listBoneEntries(scene);

  if (entries.length === 0) {
    return null;
  }

  const visible = entries.filter(
    ({ bone }) => !isUnderCollapsedAncestor(bone, collapsedIds),
  );

  return (
    <div
      className={cn('flex flex-col gap-2', className)}
      role="tree"
      aria-label="Bones"
    >
      {visible.map(({ bone, depth, hasChildren }) => {
        const isSelected = objects.includes(bone);
        const isActive = active === bone;
        const label = bone.name || bone.uuid;
        const expanded = hasChildren && !collapsedIds.has(bone.uuid);

        return (
          <div
            key={bone.uuid}
            role="treeitem"
            aria-selected={isSelected}
            aria-expanded={hasChildren ? expanded : undefined}
            className={cn(
              'flex w-full min-h-8 items-center gap-2 rounded-sm py-2 pr-2 transition-colors',
              isActive
                ? 'bg-accent/25 text-accent'
                : isSelected
                  ? 'bg-accent/15 text-accent'
                  : 'text-fg hover:bg-surface-hover/40',
            )}
            style={{ paddingLeft: `${8 + depth * 16}px` }}
          >
            <span className="inline-flex h-8 w-4 shrink-0 items-center justify-center">
              {hasChildren
                ? (
                    <button
                      type="button"
                      aria-label={expanded ? `Collapse ${label}` : `Expand ${label}`}
                      title={expanded ? 'Collapse' : 'Expand'}
                      className="inline-flex h-8 w-4 cursor-pointer items-center justify-center text-fg-muted hover:text-fg"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setCollapsedIds((current) => {
                          const next = new Set(current);
                          if (next.has(bone.uuid)) {
                            next.delete(bone.uuid);
                          } else {
                            next.add(bone.uuid);
                          }
                          return next;
                        });
                      }}
                    >
                      <ChevronRight
                        className={cn(
                          'transition-transform',
                          expanded && 'rotate-90',
                        )}
                        aria-hidden
                      />
                    </button>
                  )
                : null}
            </span>

            <button
              type="button"
              title={label}
              className="min-w-0 flex-1 cursor-pointer truncate text-left"
              onClick={(event) => {
                if ($model.get().activeModelId !== modelId) {
                  selectModel(modelId);
                }
                setEditTool('edit');
                if (event.shiftKey) {
                  toggleObject(bone);
                  return;
                }
                selectObject(bone);
              }}
            >
              <Text as="span" className="min-w-0 truncate text-current">
                {label}
              </Text>
            </button>
          </div>
        );
      })}
    </div>
  );
}
