import type { Group, Object3D } from 'three';
import { cn } from '@maxigarcia/js-utils';
import { useStore } from '@nanostores/react';
import { useState } from 'react';
import { ChevronRight } from '@/components/icons/chevron-right-icon';
import { Text } from '@/components/text';
import { openContextMenuForPart } from '@/modules/viewport/actions/open-selection-context-menu';
import { setEditTool } from '@/modules/viewport/stores/edit-tool-store';
import { $model, selectModel } from '@/modules/viewport/stores/model-store';
import {
  $selection,
  selectObject,
  toggleObject,
} from '@/modules/viewport/stores/selection-store';
import { listCreatedPartEntries } from '../domain/list-created-parts';
import { $createPartsRevision } from '../stores/create-parts-revision-store';

interface PartOutlinerProps {
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
 * Library outliner of stamped parts and empty groups for a created model.
 * Click a row to focus the model (if needed), switch to Edit, and select the node.
 * Shift+click toggles membership. Parents can be collapsed via the row chevron.
 */
export function PartOutliner({ modelId, scene, className }: PartOutlinerProps) {
  useStore($createPartsRevision);
  const { object: active, objects } = useStore($selection, {
    keys: ['object', 'objects'],
  });
  const [collapsedIds, setCollapsedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const entries = listCreatedPartEntries(scene);

  if (entries.length === 0) {
    return null;
  }

  const visible = entries.filter(
    ({ object }) => !isUnderCollapsedAncestor(object, collapsedIds),
  );

  return (
    <div
      className={cn('flex flex-col gap-2', className)}
      role="tree"
      aria-label="Parts"
    >
      {visible.map(({ object, depth, hasChildren, isGroup }) => {
        const isSelected = objects.includes(object);
        const isActive = active === object;
        const label = object.name || object.uuid;
        const expanded = hasChildren && !collapsedIds.has(object.uuid);

        return (
          <div
            key={object.uuid}
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
                          if (next.has(object.uuid)) {
                            next.delete(object.uuid);
                          } else {
                            next.add(object.uuid);
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
                  toggleObject(object);
                  return;
                }
                selectObject(object);
              }}
              onContextMenu={(event) => {
                openContextMenuForPart(event, object, modelId);
              }}
            >
              <Text
                as="span"
                className={cn(
                  'min-w-0 truncate text-current',
                  isGroup && 'italic',
                )}
              >
                {label}
              </Text>
            </button>
          </div>
        );
      })}
    </div>
  );
}
