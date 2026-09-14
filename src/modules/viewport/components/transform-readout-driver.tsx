import { useFrame } from '@react-three/fiber';
import { useActiveModel } from '../hooks/use-active-model';
import { $transformReadout, syncTransformReadout } from '../stores/transform-readout-store';

const PRECISION = 3;

/** Push active model root position into `$transformReadout` each frame. */
export function TransformReadoutDriver() {
  const { scene } = useActiveModel();

  useFrame(() => {
    if (!scene) {
      if ($transformReadout.get() !== null) {
        syncTransformReadout(null);
      }
      return;
    }

    const { x, y, z } = scene.position;
    const factor = 10 ** PRECISION;
    const next = {
      x: Math.round(x * factor) / factor,
      y: Math.round(y * factor) / factor,
      z: Math.round(z * factor) / factor,
    };
    const current = $transformReadout.get();
    if (!current || current.x !== next.x || current.y !== next.y || current.z !== next.z) {
      $transformReadout.set(next);
    }
  });

  return null;
}
