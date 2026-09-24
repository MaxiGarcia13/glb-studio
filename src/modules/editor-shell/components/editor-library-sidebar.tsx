import { CollapsibleAside } from '@/components/collapsible-aside/collapsible-aside';
import { LazyRetargetModal } from '@/modules/animation/components/lazy-retarget-modal';
import { STORAGE_KEYS } from '@/utils/local-storage';
import { LibraryModels } from './library-models';
import { LibrarySharedAnimations } from './library-shared-animations';

export function EditorLibrarySidebar() {
  return (
    <CollapsibleAside
      title="Library"
      direction="left"
      storageKey={STORAGE_KEYS.libraryAsideWidth}
    >
      <section className="flex flex-col gap-2">
        <LibraryModels />
        <LibrarySharedAnimations />
      </section>
      <LazyRetargetModal />
    </CollapsibleAside>
  );
}
