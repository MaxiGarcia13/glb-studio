import { useStore } from '@nanostores/react';
import { LibrarySectionCollapsible } from '@/modules/editor-shell/components/library-section-collapsible';
import { $model } from '@/modules/viewport/stores/model-store';
import { LibraryModel } from './library-model';

export function LibraryModels() {
  const { models } = useStore($model, { keys: ['models'] });

  const hasModels = models.length > 0;

  return (
    <LibrarySectionCollapsible
      title="Models"
      defaultOpen
      showChevron={hasModels}
      showTreeGuide={hasModels}
    >
      {models.map((entry) => (
        <LibraryModel
          key={entry.id}
          model={entry}
        />
      ))}
    </LibrarySectionCollapsible>
  );
}
