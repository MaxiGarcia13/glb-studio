import { useStore } from '@nanostores/react';
import { isSkinnedLibraryModel } from '@/modules/import/domain/model-scene-kind';
import { $model } from '../stores/model-store';
import { $viewportSettings } from '../stores/viewport-settings-store';
import { ModelSkeletonHelper } from './model-skeleton-helper';

export function ModelViewer() {
  const { models, previewModelIds } = useStore($model, {
    keys: ['models', 'previewModelIds'],
  });
  const { bonesVisible } = useStore($viewportSettings, {
    keys: ['bonesVisible'],
  });

  const previewSet = new Set(previewModelIds);
  const visible = models.filter((model) => previewSet.has(model.id));

  if (visible.length === 0) {
    return null;
  }

  return (
    <>
      {visible.map((model) => (
        // Library owns the scene for the session — do not dispose on eye-toggle unmount.
        <primitive key={model.id} object={model.scene} dispose={null} />
      ))}
      {bonesVisible
        && visible
          .filter((model) => isSkinnedLibraryModel(model))
          .map((model) => (
            <ModelSkeletonHelper key={`skeleton-${model.id}`} scene={model.scene} />
          ))}
    </>
  );
}
