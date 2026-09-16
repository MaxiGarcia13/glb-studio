import { useStore } from '@nanostores/react';
import { useFrame } from '@react-three/fiber';
import { radiansToDegrees } from '../domain/euler-degrees';
import {
  $settingsTransformTarget,
  $transformReadout,
  syncTransformReadout,
} from '../stores/transform-readout-store';

const POSITION_PRECISION = 3;
const ROTATION_PRECISION = 1;
const SCALE_PRECISION = 3;

/** Push Settings transform target TRS into `$transformReadout` each frame. */
export function TransformReadoutDriver() {
  const target = useStore($settingsTransformTarget);

  useFrame(() => {
    if (!target) {
      if ($transformReadout.get() !== null) {
        syncTransformReadout(null);
      }
      return;
    }

    const posFactor = 10 ** POSITION_PRECISION;
    const rotFactor = 10 ** ROTATION_PRECISION;
    const scaleFactor = 10 ** SCALE_PRECISION;
    target.rotation.setFromQuaternion(target.quaternion, 'XYZ');
    const next = {
      x: Math.round(target.position.x * posFactor) / posFactor,
      y: Math.round(target.position.y * posFactor) / posFactor,
      z: Math.round(target.position.z * posFactor) / posFactor,
      rotationX: Math.round(radiansToDegrees(target.rotation.x) * rotFactor) / rotFactor,
      rotationY: Math.round(radiansToDegrees(target.rotation.y) * rotFactor) / rotFactor,
      rotationZ: Math.round(radiansToDegrees(target.rotation.z) * rotFactor) / rotFactor,
      scaleX: Math.round(target.scale.x * scaleFactor) / scaleFactor,
      scaleY: Math.round(target.scale.y * scaleFactor) / scaleFactor,
      scaleZ: Math.round(target.scale.z * scaleFactor) / scaleFactor,
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
      || current.scaleX !== next.scaleX
      || current.scaleY !== next.scaleY
      || current.scaleZ !== next.scaleZ
    ) {
      $transformReadout.set(next);
    }
  });

  return null;
}
