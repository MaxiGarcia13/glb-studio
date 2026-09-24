import type { ComponentProps } from 'react';
import { lazy, Suspense } from 'react';

const RetargetModal = lazy(() => import('./retarget-modal')
  .then((mod) => ({ default: mod.RetargetModal })));

export function LazyRetargetModal(props: ComponentProps<typeof RetargetModal>) {
  return (
    <Suspense fallback={null}>
      <RetargetModal {...props} />
    </Suspense>
  );
}
