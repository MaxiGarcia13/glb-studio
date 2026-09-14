import type { OrbitControls } from '@react-three/drei';
import type { ComponentRef } from 'react';
import type { PerspectiveCamera } from 'three';
import { useStore } from '@nanostores/react';
import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { computeScenesFraming } from '../domain/model-framing';
import { $model } from '../stores/model-store';

export type OrbitControlsRef = ComponentRef<typeof OrbitControls>;

export interface ModelFramingProps {
  controlsRef: React.RefObject<OrbitControlsRef | null>;
}

export function ModelFraming({ controlsRef }: ModelFramingProps) {
  const { models, previewModelIds } = useStore($model, {
    keys: ['models', 'previewModelIds'],
  });

  const camera = useThree((state) => state.camera);
  const perspectiveCamera = camera as PerspectiveCamera;

  useEffect(() => {
    const previewSet = new Set(previewModelIds);
    const visibleScenes = models
      .filter((model) => previewSet.has(model.id))
      .map((model) => model.scene);

    if (visibleScenes.length === 0) {
      return;
    }

    const framing = computeScenesFraming(visibleScenes, perspectiveCamera);
    if (!framing) {
      return;
    }

    perspectiveCamera.position.copy(framing.position);
    perspectiveCamera.near = framing.distance / 100;
    perspectiveCamera.far = framing.distance * 100;
    perspectiveCamera.updateProjectionMatrix();

    const controls = controlsRef.current;
    if (controls) {
      controls.target.copy(framing.center);
      controls.minDistance = framing.minDistance;
      controls.maxDistance = framing.maxDistance;
      controls.update();
    }
  }, [models, previewModelIds, perspectiveCamera, controlsRef]);

  return null;
}
