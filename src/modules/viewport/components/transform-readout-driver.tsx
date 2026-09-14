import { useFrame } from '@react-three/fiber';
import { radiansToDegrees } from '../domain/euler-degrees';
import { useActiveModel } from '../hooks/use-active-model';
import { $transformReadout, syncTransformReadout } from '../stores/transform-readout-store';

const POSITION_PRECISION = 3;
const ROTATION_PRECISION = 1;

/** Push active model root position + rotation into `$transformReadout` each frame. */
export function TransformReadoutDriver() {
  const { scene } = useActiveModel();

  useFrame(() => {
    if (!scene) {
      if ($transformReadout.get() !== null) {
        syncTransformReadout(null);
      }
      return;
    }

    const posFactor = 10 ** POSITION_PRECISION;
    const rotFactor = 10 ** ROTATION_PRECISION;
    scene.rotation.setFromQuaternion(scene.quaternion, 'XYZ');
    const next = {
      x: Math.round(scene.position.x * posFactor) / posFactor,
      y: Math.round(scene.position.y * posFactor) / posFactor,
      z: Math.round(scene.position.z * posFactor) / posFactor,
      rotationX: Math.round(radiansToDegrees(scene.rotation.x) * rotFactor) / rotFactor,
      rotationY: Math.round(radiansToDegrees(scene.rotation.y) * rotFactor) / rotFactor,
      rotationZ: Math.round(radiansToDegrees(scene.rotation.z) * rotFactor) / rotFactor,
    };
    const current = $transformReadout.get();
    if (
      !current
      || current.x !== next.x
      || current.y !== next.y
      || current.z !== next.z
      || current.rotationX !== next.rotationX
      || current.rotationY !== next.rotationY
      || current.rotationZ !== next.rotationZ
    ) {
      $transformReadout.set(next);
    }
  });

  return null;
}
