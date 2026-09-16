import { useStore } from '@nanostores/react';
import { LibrarySectionCollapsible } from '@/modules/editor-shell/components/library-section-collapsible';
import {
  $modelGroups,
  listUngroupedModelIds,
} from '@/modules/viewport/stores/model-group-store';
import { $model } from '@/modules/viewport/stores/model-store';
import { LibraryModel } from './library-model';
import { LibraryModelGroup } from './library-model-group';

export function LibraryModels() {
  const { models } = useStore($model, { keys: ['models'] });
  const { groups } = useStore($modelGroups, { keys: ['groups'] });

  const hasModels = models.length > 0;
  const ungroupedIds = listUngroupedModelIds(models.map((model) => model.id));
  const ungrouped = ungroupedIds
    .map((id) => models.find((model) => model.id === id))
    .filter((entry): entry is NonNullable<typeof entry> => entry !== undefined);

  return (
    <LibrarySectionCollapsible
      title="Models"
      defaultOpen
      showChevron={hasModels}
      showTreeGuide={hasModels}
    >
      {groups.map((group) => (
        <LibraryModelGroup
          key={group.id}
          group={group}
          models={models}
        />
      ))}
      {ungrouped.map((entry) => (
        <LibraryModel
          key={entry.id}
          model={entry}
        />
      ))}
    </LibrarySectionCollapsible>
  );
}
