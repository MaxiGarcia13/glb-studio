import type { ComponentProps } from 'react';
import { lazy, Suspense } from 'react';

const CommandsModal = lazy(() => import('./commands-modal')
  .then((mod) => ({ default: mod.CommandsModal })));

export function LazyCommandsModal(props: ComponentProps<typeof CommandsModal>) {
  return (
    <Suspense fallback={null}>
      <CommandsModal {...props} />
    </Suspense>
  );
}
