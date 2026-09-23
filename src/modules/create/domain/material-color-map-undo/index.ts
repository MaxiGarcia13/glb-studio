/**
 * Material color-map undo helpers (US-46 / US-48).
 * Implementation is split by concern; this module re-exports the public surface.
 */
export {
  cloneColorMapTexture,
  snapshotMaterialColorMap,
} from './clone';
export {
  collectStackOwnedColorMaps,
  disposeMaterialColorMapCommand,
  disposeMaterialColorMapCommandSafely,
  disposeMaterialColorMapSnapshot,
  disposeUndoableCommandResources,
  releaseOrphanColorMap,
  type MaterialColorMapCommand,
} from './stack';
export {
  applyMaterialColorMapCommand,
  assignMaterialColorMapLive,
  restoreMaterialColorMap,
} from './apply';
