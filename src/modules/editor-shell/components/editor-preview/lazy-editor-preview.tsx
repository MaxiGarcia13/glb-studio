import { lazy, Suspense } from 'react';
import { EditorPreviewSkeleton } from './editor-preview-skeleton';

const EditorPreview = lazy(() => import('./editor-preview').then((module) => ({ default: module.EditorPreview })));

export function LazyEditorPreview() {
  return (
    <Suspense fallback={<EditorPreviewSkeleton />}>
      <EditorPreview />
    </Suspense>
  );
}
