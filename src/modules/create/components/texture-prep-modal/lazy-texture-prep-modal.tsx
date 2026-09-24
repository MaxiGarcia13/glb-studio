import type { ComponentProps } from 'react';
import { lazy, Suspense } from 'react';

const TexturePrepModal = lazy(() => import('./texture-prep-modal')
  .then((mod) => ({ default: mod.TexturePrepModal })));

export function LazyTexturePrepModal(props: ComponentProps<typeof TexturePrepModal>) {
  return (
    <Suspense fallback={null}>
      <TexturePrepModal {...props} />
    </Suspense>
  );
}
