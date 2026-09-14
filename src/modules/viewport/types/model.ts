import type * as THREE from 'three';

export type ModelLibraryPhase = 'idle' | 'loading' | 'loaded' | 'error';

export interface ModelEntry {
  id: string;
  fileName: string;
  blobUrl: string;
  scene: THREE.Group;
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
}
