import type { Group, Mesh, Object3D } from 'three';
import { useStore } from '@nanostores/react';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Box3, Vector3 } from 'three';

import {
  BONE_SELECTION_SPHERE_RADIUS,
  SELECTION_BOX_PADDING,
  SELECTION_HIGHLIGHT_COLOR,
} from '../constants/selection';
import { $model } from '../stores/model-store';
import { $selection } from '../stores/selection-store';

const scratchBox = new Box3();
const scratchCenter = new Vector3();
const scratchSize = new Vector3();
const scratchWorld = new Vector3();

function isMeshObject(object: Object3D): boolean {
  return (object as { isMesh?: boolean }).isMesh === true;
}

function isBoneObject(object: Object3D): boolean {
  return (object as { isBone?: boolean }).isBone === true;
}

interface SelectionMarkerProps {
  target: Object3D;
  /** Prefer world AABB (model roots / non-mesh nodes). */
  preferBox?: boolean;
}

function SelectionMarker({ target, preferBox = false }: SelectionMarkerProps) {
  const markerRef = useRef<Group>(null);
  const boxRef = useRef<Mesh>(null);
  const sphereRef = useRef<Mesh>(null);

  useFrame(() => {
    const marker = markerRef.current;
    if (!marker) {
      return;
    }

    const box = boxRef.current;
    const sphere = sphereRef.current;
    const useBox = preferBox || isMeshObject(target) || !isBoneObject(target);

    if (useBox && box) {
      scratchBox.setFromObject(target);
      scratchBox.getCenter(scratchCenter);
      scratchBox.getSize(scratchSize);
      if (scratchSize.lengthSq() === 0) {
        marker.visible = false;
        return;
      }
      marker.position.copy(scratchCenter);
      box.visible = true;
      box.scale.copy(scratchSize).multiplyScalar(SELECTION_BOX_PADDING);
      if (sphere) {
        sphere.visible = false;
      }
    } else if (sphere) {
      target.getWorldPosition(scratchWorld);
      marker.position.copy(scratchWorld);
      sphere.visible = true;
      sphere.scale.setScalar(BONE_SELECTION_SPHERE_RADIUS);
      if (box) {
        box.visible = false;
      }
    } else {
      marker.visible = false;
      return;
    }

    marker.visible = true;
  });

  return (
    <group ref={markerRef} visible={false}>
      <mesh ref={boxRef}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial wireframe color={SELECTION_HIGHLIGHT_COLOR} />
      </mesh>
      <mesh ref={sphereRef}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshBasicMaterial wireframe color={SELECTION_HIGHLIGHT_COLOR} />
      </mesh>
    </group>
  );
}

/**
 * Wireframe markers for the full multi-selection:
 * parts/bones from `$selection.objects`, or model-root AABBs when `kind === 'models'`.
 */
export function SelectionHighlight() {
  const { kind, objects, modelIds } = useStore($selection, {
    keys: ['kind', 'objects', 'modelIds'],
  });
  const { models } = useStore($model, { keys: ['models'] });

  if (kind === 'parts') {
    return (
      <>
        {objects.map((target) => (
          <SelectionMarker key={target.uuid} target={target} />
        ))}
      </>
    );
  }

  if (kind === 'models') {
    return (
      <>
        {modelIds.map((id) => {
          const entry = models.find((model) => model.id === id);
          if (!entry) {
            return null;
          }
          return (
            <SelectionMarker
              key={entry.id}
              target={entry.scene}
              preferBox
            />
          );
        })}
      </>
    );
  }

  return null;
}
