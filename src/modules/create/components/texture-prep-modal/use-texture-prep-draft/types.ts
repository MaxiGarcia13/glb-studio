import type { MeshStandardMaterial, Texture } from 'three';
import type { ImageCropRect } from '@/modules/create/domain/texture-crop';
import type { TextureWrapPresetId } from '@/modules/create/domain/texture-wrap-preset';

export interface UseTexturePrepDraftArgs {
  open: boolean;
  partId: string | null;
  seededMap: Texture | null;
  onClose: () => void;
}

export interface TexturePrepDraft {
  draftTexture: Texture | null;
  sourceName: string | null;
  thumbUrl: string | null;
  error: string | null;
  warnings: string[];
  busy: boolean;
  canApply: boolean;
  wrapPreset: TextureWrapPresetId;
  pickFile: (file: File | undefined) => Promise<void>;
  flipX: () => Promise<void>;
  flipY: () => Promise<void>;
  cropToRegion: (crop: ImageCropRect) => Promise<boolean>;
  setWrapPreset: (preset: TextureWrapPresetId) => void;
  removeBackground: () => Promise<void>;
  /** @returns true when the draft was committed onto the material. */
  apply: (material: MeshStandardMaterial) => boolean;
  close: () => void;
}
