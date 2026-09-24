import type { ComponentProps } from 'react';
import { lazy, Suspense } from 'react';

const LibraryModelAddAnimationModal = lazy(() =>
  import('./library-model-add-animation-modal').then((mod) => ({
    default: mod.LibraryModelAddAnimationModal,
  })),
);

export function LazyLibraryModelAddAnimationModal(
  props: ComponentProps<typeof LibraryModelAddAnimationModal>,
) {
  return (
    <Suspense fallback={null}>
      <LibraryModelAddAnimationModal {...props} />
    </Suspense>
  );
}
