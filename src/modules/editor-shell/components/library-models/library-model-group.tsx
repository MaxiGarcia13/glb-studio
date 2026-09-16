import type { ModelGroup } from '@/modules/viewport/types/model-group';
import type { ModelEntry } from '@/modules/viewport/types/model';
import { cn } from '@maxigarcia/js-utils';
import { useStore } from '@nanostores/react';
import { Text } from '@/components/text';
import { LibrarySectionCollapsible } from '@/modules/editor-shell/components/library-section-collapsible';
import { openContextMenuForModel } from '@/modules/viewport/actions/open-selection-context-menu';
import {
  $selection,
  selectModelIds,
  toggleModelId,
} from '@/modules/viewport/stores/selection-store';
import { LibraryModel } from './library-model';

interface LibraryModelGroupProps {
  group: ModelGroup;
  models: readonly ModelEntry[];
}

export function LibraryModelGroup({ group, models }: LibraryModelGroupProps) {
  const { kind, modelIds } = useStore($selection, { keys: ['kind', 'modelIds'] });
  const members = group.modelIds
    .map((id) => models.find((model) => model.id === id))
    .filter((entry): entry is ModelEntry => entry !== undefined);

  if (members.length === 0) {
    return null;
  }

  const allSelected = kind === 'models'
    && group.modelIds.length > 0
    && group.modelIds.every((id) => modelIds.includes(id));
  const isAnchor = kind === 'models'
    && modelIds.length > 0
    && group.modelIds.includes(modelIds[modelIds.length - 1]!);

  return (
    <LibrarySectionCollapsible
      title={(
        <button
          type="button"
          className="min-w-0 flex-1 cursor-pointer truncate text-left"
          aria-pressed={allSelected}
          title={group.name}
          onClick={(event) => {
            event.stopPropagation();
            if (event.shiftKey) {
              for (const id of group.modelIds) {
                if (!modelIds.includes(id)) {
                  toggleModelId(id);
                }
              }
              return;
            }
            selectModelIds(group.modelIds);
          }}
          onContextMenu={(event) => {
            event.preventDefault();
            event.stopPropagation();
            selectModelIds(group.modelIds);
            // Open via first member helper path — selection already set.
            openContextMenuForModel(event, group.modelIds[0]!);
          }}
        >
          <Text
            as="h2"
            variant="section"
            className={cn(
              'truncate italic',
              allSelected && 'text-accent',
              isAnchor && allSelected && 'font-semibold',
            )}
          >
            {group.name}
          </Text>
        </button>
      )}
      selected={allSelected}
      headerClassName={isAnchor && allSelected ? 'bg-accent/25' : undefined}
      showChevron
      showTreeGuide
      defaultOpen
    >
      {members.map((model) => (
        <LibraryModel key={model.id} model={model} />
      ))}
    </LibrarySectionCollapsible>
  );
}
