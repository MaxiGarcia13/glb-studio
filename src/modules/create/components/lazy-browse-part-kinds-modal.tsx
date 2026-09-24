import type { ComponentProps } from 'react';
import { lazy, Suspense } from 'react';

const BrowsePartKindsModal = lazy(() => import('./browse-part-kinds-modal')
  .then((mod) => ({ default: mod.BrowsePartKindsModal })));

export function LazyBrowsePartKindsModal(
  props: ComponentProps<typeof BrowsePartKindsModal>,
) {
  return (
    <Suspense
      fallback={null}
    >
      <BrowsePartKindsModal {...props} />
    </Suspense>
  );
}
