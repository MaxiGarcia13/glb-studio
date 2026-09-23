import { sanitizeBaseName, uniqueTakenName } from '@/modules/export/utils/file-name';

/** Join sanitized zip path segments with `/` (JSZip nested entries). */
export function joinZipPath(...segments: string[]): string {
  const parts: string[] = [];
  for (const segment of segments) {
    const cleaned = sanitizeBaseName(segment);
    if (cleaned) {
      parts.push(cleaned);
    }
  }
  if (parts.length === 0) {
    return 'file';
  }
  return parts.join('/');
}

/** Unique folder / path segment (no extension); mutates `taken`. */
export function uniquePathSegment(base: string, taken: Set<string>): string {
  const sanitized = sanitizeBaseName(base) ?? 'export';
  const unique = uniqueTakenName(sanitized, taken);
  taken.add(unique);
  return unique;
}
