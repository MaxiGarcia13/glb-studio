import type { Group } from 'three';
import { cn } from '@maxigarcia/js-utils';
import { useStore } from '@nanostores/react';
import { Text } from '@/components/text';
import { setEditTool } from '@/modules/viewport/stores/edit-tool-store';
import { $model, selectModel } from '@/modules/viewport/stores/model-store';
import { $selection, selectObject } from '@/modules/viewport/stores/selection-store';
import { listCreatedPartEntries } from '../domain/list-created-parts';
import { $createPartsRevision } from '../stores/create-parts-revision-store';

interface PartOutlinerProps {
  modelId: string;
  scene: Group;
  className?: string;
}

/**
 * Library outliner of stamped parts for a created model.
 * Click a row to focus the model (if needed), switch to Edit, and select the part.
 */
export function PartOutliner({ modelId, scene, className }: PartOutlinerProps) {
  useStore($createPartsRevision);
  const { object: selected } = useStore($selection, { keys: ['object'] });
  const entries = listCreatedPartEntries(scene);

  if (entries.length === 0) {
    return null;
  }

  return (
    <div
      className={cn('flex flex-col gap-2', className)}
      role="list"
      aria-label="Parts"
    >
      {entries.map(({ mesh, depth }) => {
        const isSelected = selected === mesh;
        const label = mesh.name || mesh.uuid;

        return (
          <button
            key={mesh.uuid}
            type="button"
            role="listitem"
            title={label}
            aria-current={isSelected ? 'true' : undefined}
            className={cn(
              'flex w-full min-h-8 items-center rounded-sm py-2 pr-2 text-left transition-colors',
              isSelected
                ? 'bg-accent/15 text-accent'
                : 'text-fg hover:bg-surface-hover/40',
            )}
            style={{ paddingLeft: `${8 + depth * 16}px` }}
            onClick={() => {
              // selectModel toggles focus off when already active — only focus when needed.
              if ($model.get().activeModelId !== modelId) {
                selectModel(modelId);
              }
              setEditTool('edit');
              selectObject(mesh);
            }}
          >
            <Text as="span" className="min-w-0 truncate text-current">
              {label}
            </Text>
          </button>
        );
      })}
    </div>
  );
}
