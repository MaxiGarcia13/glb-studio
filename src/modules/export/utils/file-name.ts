import { stripAssetExtension } from '@/utils/glb-parse';

export type ExportFormat = 'glb' | 'fbx';

export function stripExportExtension(fileName: string): string {
  return stripAssetExtension(fileName);
}

/**
 * Return `base` (+ optional extension) or `base-2`, `base-3`, … until free in
 * `taken`. Does not mutate `taken`.
 */
export function uniqueTakenName(
  base: string,
  taken: Set<string>,
  extension = '',
): string {
  const first = `${base}${extension}`;
  if (!taken.has(first)) {
    return first;
  }

  let index = 2;
  let candidate = `${base}-${index}${extension}`;
  while (taken.has(candidate)) {
    index++;
    candidate = `${base}-${index}${extension}`;
  }
  return candidate;
}

export function uniqueFileName(fileName: string, taken: Set<string>): string {
  const dotIndex = fileName.lastIndexOf('.');
  const base = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
  const extension = dotIndex > 0 ? fileName.slice(dotIndex) : '';
  return uniqueTakenName(base, taken, extension);
}

/** Strip path separators / control chars; trim. Empty → null. */
export function sanitizeBaseName(raw: string): string | null {
  const cleaned = raw
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.length > 0 ? cleaned : null;
}

/** Zip archive basename without `.zip` for the given export format. */
export function defaultZipBaseName(format: ExportFormat): string {
  return format === 'fbx' ? 'fbx-export' : 'glb-export';
}

/** Default download zip name including `.zip`. */
export function defaultExportZipFileName(format: ExportFormat): string {
  return `${defaultZipBaseName(format)}.zip`;
}

/** Ensure a `.glb` / `.fbx` basename; falls back to `fallback` when empty/invalid. */
export function resolveExportFileName(
  raw: string | undefined,
  fallback: string,
  format: ExportFormat,
): string {
  const fromRaw = sanitizeBaseName(stripExportExtension(raw ?? ''));
  const fromFallback = stripExportExtension(fallback);
  const base = fromRaw ?? (fromFallback || 'export');
  return `${base}.${format}`;
}

/** Ensure a `.zip` download name; falls back to `fallback` when empty/invalid. */
export function resolveZipFileName(
  raw: string | undefined,
  fallback: string,
  format: ExportFormat = 'glb',
): string {
  const withoutZip = (raw ?? '').replace(/\.zip$/i, '');
  const fromRaw = sanitizeBaseName(withoutZip);
  const fromFallback = fallback.replace(/\.zip$/i, '');
  const base = fromRaw ?? (fromFallback || defaultZipBaseName(format));
  return `${base}.zip`;
}
