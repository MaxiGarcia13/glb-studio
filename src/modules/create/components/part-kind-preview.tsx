import type { PartKindId } from '@/modules/create/types/part';
import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { ViewportEnvironment } from '@/modules/viewport/components/viewport-environment';
import { DEFAULT_CAMERA_FOV } from '@/modules/viewport/constants/camera';
import { disposeScene } from '@/modules/viewport/utils/scene-dispose';
import { getPartKind } from '../domain/part-kind';

/** Closer framing than the editor home view — parts are ~0.2 m. */
const PREVIEW_CAMERA_POSITION = [0.55, 0.4, 0.7] as const;
const PREVIEW_CONTROLS_TARGET = [0, 0.1, 0] as const;

interface PartKindPreviewProps {
  kindId: PartKindId;
}

/**
 * Isolated R3F preview of a part kind’s default mesh on the shared viewport
 * environment (lights + ground). Disposes mesh on kind change / unmount.
 */
export function PartKindPreview({ kindId }: PartKindPreviewProps) {
  const mesh = useMemo(() => {
    const kind = getPartKind(kindId);
    return kind.createMesh({ ...kind.defaultParams });
  }, [kindId]);

  useEffect(() => {
    return () => {
      disposeScene(mesh);
    };
  }, [mesh]);

  return (
    <Canvas
      camera={{
        position: [...PREVIEW_CAMERA_POSITION],
        fov: DEFAULT_CAMERA_FOV,
      }}
      className="h-full w-full"
    >
      <ViewportEnvironment />
      <primitive object={mesh} />
      <OrbitControls
        enablePan={false}
        target={[...PREVIEW_CONTROLS_TARGET]}
        minDistance={0.25}
        maxDistance={2}
      />
    </Canvas>
  );
}
