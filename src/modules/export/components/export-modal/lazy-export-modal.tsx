import type { ComponentProps } from 'react';
import { lazy, Suspense } from 'react';

const ExportModal = lazy(() => import('./export-modal')
  .then((mod) => ({ default: mod.ExportModal })));

export function LazyExportModal(props: ComponentProps<typeof ExportModal>) {
  return (
    <Suspense fallback={null}>
      <ExportModal {...props} />
    </Suspense>
  );
}
