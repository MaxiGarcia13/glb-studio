import { sanitizeBaseName } from '@/modules/export/utils/file-name';

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
  if (!taken.has(sanitized)) {
    taken.add(sanitized);
    return sanitized;
  }

  let index = 2;
  let candidate = `${sanitized}-${index}`;
  while (taken.has(candidate)) {
    index++;
    candidate = `${sanitized}-${index}`;
  }
  taken.add(candidate);
  return candidate;
}
