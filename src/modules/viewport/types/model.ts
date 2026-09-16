import type * as THREE from 'three';

export type ModelLibraryPhase = 'idle' | 'loading' | 'loaded' | 'error';

export type ModelSource = 'imported' | 'created';

export interface ModelEntry {
  id: string;
  fileName: string;
  /** Present for imported models; created-from-kit models have no file blob. */
  blobUrl?: string;
  scene: THREE.Group;
  source: ModelSource;
}

export interface ModelLibraryState {
  models: ModelEntry[];
  /** Models visible in the viewport (library eye toggle). */
  previewModelIds: string[];
  /** Focused model for gizmo, transport bar, and export. */
  activeModelId: string | null;
  phase: ModelLibraryPhase;
  error: string | null;
}

export interface ModelLoadResult {
  fileName: string;
  scene: THREE.Group;
  blobUrl: string;
  animations: THREE.AnimationClip[];
  /** How the library should treat this load (skinned = imported, mesh-only = created). */
  source: ModelSource;
}
