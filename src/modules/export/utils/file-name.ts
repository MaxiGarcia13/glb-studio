import { GLTF_EXTENSION_PATTERN } from '@/utils/glb-parse';

export function stripGlbExtension(fileName: string): string {
  return fileName.replace(GLTF_EXTENSION_PATTERN, '');
}

export function uniqueFileName(fileName: string, taken: Set<string>): string {
  if (!taken.has(fileName)) {
    return fileName;
  }

  const dotIndex = fileName.lastIndexOf('.');
  const base = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
  const extension = dotIndex > 0 ? fileName.slice(dotIndex) : '';

  let index = 2;
  let candidate = `${base}-${index}${extension}`;
  while (taken.has(candidate)) {
    index++;
    candidate = `${base}-${index}${extension}`;
  }
  return candidate;
}

/** Strip path separators / control chars; trim. Empty → null. */
export function sanitizeBaseName(raw: string): string | null {
  const cleaned = raw
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.length > 0 ? cleaned : null;
}

/** Ensure a `.glb` basename; falls back to `fallback` when empty/invalid. */
export function resolveGlbFileName(raw: string | undefined, fallback: string): string {
  const fromRaw = sanitizeBaseName(stripGlbExtension(raw ?? ''));
  const fromFallback = stripGlbExtension(fallback);
  const base = fromRaw ?? (fromFallback || 'export');
  return `${base}.glb`;
}

/** Ensure a `.zip` download name; falls back to `fallback` when empty/invalid. */
export function resolveZipFileName(raw: string | undefined, fallback: string): string {
  const withoutZip = (raw ?? '').replace(/\.zip$/i, '');
  const fromRaw = sanitizeBaseName(withoutZip);
  const fromFallback = fallback.replace(/\.zip$/i, '');
  const base = fromRaw ?? (fromFallback || 'glb-export');
  return `${base}.zip`;
}
