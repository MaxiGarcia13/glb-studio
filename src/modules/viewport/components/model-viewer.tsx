import { useStore } from '@nanostores/react';
import { $model } from '../stores/model-store';

export function ModelViewer() {
  const { models, previewModelIds } = useStore($model, {
    keys: ['models', 'previewModelIds'],
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
    </>
  );
}
