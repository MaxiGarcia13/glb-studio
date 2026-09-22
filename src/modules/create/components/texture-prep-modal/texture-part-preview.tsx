import type { Color, Texture } from 'three';
import type { TextureWrapPresetId } from '@/modules/create/domain/texture-wrap-preset';
import type { PartKindId, PartSizeParams } from '@/modules/create/types/part';
import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { MeshStandardMaterial } from 'three';
import { getPartKind } from '@/modules/create/domain/part-kind';
import { syncMaterialMapAlpha } from '@/modules/create/domain/texture-map-alpha';
import { ViewportEnvironment } from '@/modules/viewport/components/viewport-environment';
import { DEFAULT_CAMERA_FOV } from '@/modules/viewport/constants/camera';
import { disposeScene } from '@/modules/viewport/utils/scene-dispose';

/** Closer framing than the editor home view — parts are ~0.2 m. */
const PREVIEW_CAMERA_POSITION = [0.55, 0.4, 0.7] as const;
const PREVIEW_CONTROLS_TARGET = [0, 0.1, 0] as const;

interface TexturePartPreviewProps {
  kindId: PartKindId;
  params: PartSizeParams;
  /** Flat color multiplier (matches the real part). */
  color?: Color;
  /**
   * Draft color map for the preview only. Caller owns lifecycle — this
   * component never disposes the texture.
   */
  draftTexture?: Texture | null;
  /**
   * Included so wrap/repeat changes on the same texture reference still
   * refresh the preview material (caller owns applying the preset).
   */
  wrapPreset?: TextureWrapPresetId;
}

/**
 * Isolated R3F preview of a created part with an optional draft color map.
 * Reuses `ViewportEnvironment` (same spirit as browse-part-kinds preview).
 */
export function TexturePartPreview({
  kindId,
  params,
  color,
  draftTexture = null,
  wrapPreset = 'clamp',
}: TexturePartPreviewProps) {
  const paramsKey = JSON.stringify(params);
  const mesh = useMemo(() => {
    const kind = getPartKind(kindId);
    return kind.createMesh(JSON.parse(paramsKey) as PartSizeParams);
  }, [kindId, paramsKey]);

  useEffect(() => {
    const material = mesh.material;
    if (!(material instanceof MeshStandardMaterial)) {
      return;
    }
    if (color) {
      material.color.copy(color);
    }
    material.map = draftTexture;
    if (draftTexture) {
      draftTexture.needsUpdate = true;
    }
    syncMaterialMapAlpha(material, draftTexture);
    material.needsUpdate = true;

    return () => {
      // Detach before mesh dispose so caller-owned drafts are not freed.
      material.map = null;
    };
  }, [mesh, color, draftTexture, wrapPreset]);

  useEffect(() => {
    return () => {
      const material = mesh.material;
      if (material instanceof MeshStandardMaterial) {
        material.map = null;
        syncMaterialMapAlpha(material, null);
      }
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
