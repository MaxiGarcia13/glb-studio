import { lazy, Suspense } from 'react';

const MakeJointModal = lazy(() => import('./make-joint-modal')
  .then((mod) => ({ default: mod.MakeJointModal })));

export function LazyMakeJointModal() {
  return (
    <Suspense fallback={null}>
      <MakeJointModal />
    </Suspense>
  );
}
