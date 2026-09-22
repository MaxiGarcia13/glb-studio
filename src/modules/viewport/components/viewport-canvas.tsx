import type { OrbitControlsRef } from './model-framing';
import { Canvas } from '@react-three/fiber';
import { useRef } from 'react';
import { ClipMixerDriver } from '@/modules/animation/components/clip-mixer-driver';
import {
  DEFAULT_CAMERA_FOV,
  DEFAULT_CAMERA_POSITION,
} from '../constants/camera';
import { ModelFraming } from './model-framing';
import { ModelViewer } from './model-viewer';
import { SelectionDriver } from './selection-driver';
import { SelectionHighlight } from './selection-highlight';
import { TransformControlsDriver } from './transform-controls-driver';
import { TransformReadoutDriver } from './transform-readout-driver';
import { ViewportEnvironment } from './viewport-environment';
import { ViewportOrbitControls } from './viewport-orbit-controls';
import { WorldAxes } from './world-axes';

export function ViewportCanvas() {
  const controlsRef = useRef<OrbitControlsRef>(null);

  return (
    <Canvas
      camera={{
        position: [...DEFAULT_CAMERA_POSITION],
        fov: DEFAULT_CAMERA_FOV,
      }}
      className="h-full w-full"
    >
      <ViewportEnvironment />

      <WorldAxes />

      <ViewportOrbitControls controlsRef={controlsRef} />
      <ModelViewer />
      <ClipMixerDriver />
      <ModelFraming controlsRef={controlsRef} />
      <SelectionDriver />
      <SelectionHighlight />
      <TransformControlsDriver controlsRef={controlsRef} />
      <TransformReadoutDriver />
    </Canvas>
  );
}
