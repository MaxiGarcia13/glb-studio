import type { Group } from 'three';
import { useStore } from '@nanostores/react';
import { useEffect } from 'react';
import { setActiveModelMixer } from '@/modules/animation/utils/mixer-session';
import { $model } from '@/modules/viewport/stores/model-store';
import { useClipMixer } from '../hooks/use-clip-mixer';

interface ClipMixerModelProps {
  modelId: string;
  scene: Group;
}

function ClipMixerModel({ modelId, scene }: ClipMixerModelProps) {
  useClipMixer(scene, modelId);

  return null;
}

export function ClipMixerDriver() {
  const { models, previewModelIds, activeModelId } = useStore($model, {
    keys: ['models', 'previewModelIds', 'activeModelId'],
  });

  useEffect(() => {
    setActiveModelMixer(activeModelId);
  }, [activeModelId]);

  const previewSet = new Set(previewModelIds);
  const visible = models.filter((model) => previewSet.has(model.id));

  return (
    <>
      {visible.map((model) => (
        <ClipMixerModel
          key={model.id}
          modelId={model.id}
          scene={model.scene}
        />
      ))}
    </>
  );
}
