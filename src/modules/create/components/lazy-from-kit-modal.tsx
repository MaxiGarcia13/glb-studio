import type { ComponentProps } from 'react';
import { lazy, Suspense } from 'react';

const FromKitModal = lazy(() => import('./from-kit-modal')
  .then((mod) => ({ default: mod.FromKitModal })));

export function LazyFromKitModal(props: ComponentProps<typeof FromKitModal>) {
  return (
    <Suspense fallback={null}>
      <FromKitModal {...props} />
    </Suspense>
  );
}
