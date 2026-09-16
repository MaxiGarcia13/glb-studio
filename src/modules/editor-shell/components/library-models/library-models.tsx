import { useStore } from '@nanostores/react';
import { useCollapsible } from '@/components/collapsible';
import { LibrarySectionCollapsible } from '@/modules/editor-shell/components/library-section-collapsible';
import { $model } from '@/modules/viewport/stores/model-store';
import { ModelImport } from '../model-import';
import { LibraryModel } from './library-model';

function ModelsImportAction() {
  const { setOpen } = useCollapsible();
  return <ModelImport onImport={() => setOpen(true)} />;
}

export function LibraryModels() {
  const { models } = useStore($model, { keys: ['models'] });

  const hasModels = models.length > 0;

  return (
    <LibrarySectionCollapsible
      title="Models"
      defaultOpen
      showChevron={hasModels}
      showTreeGuide={hasModels}
      actions={<ModelsImportAction />}
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
