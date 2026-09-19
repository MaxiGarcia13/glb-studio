export type ModelExtension = 'glb' | 'fbx';

/** True when `fileName` ends with `.${extension}` (case-insensitive). */
export function hasModelExtension(
  fileName: string,
  extension: ModelExtension,
): boolean {
  return new RegExp(`\\.${extension}$`, 'i').test(fileName);
}

/** Replace a trailing `.glb` / `.fbx` with `extension` (case-insensitive). */
export function withModelExtension(
  fileName: string,
  extension: ModelExtension,
): string {
  return fileName.replace(/\.(?:glb|fbx)$/i, `.${extension}`);
}
