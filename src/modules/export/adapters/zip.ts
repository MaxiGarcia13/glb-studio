import JSZip from 'jszip';

export interface ZipEntry {
  fileName: string;
  arrayBuffer: ArrayBuffer;
}

/**
 * Pack entries into a zip blob. Entry names must already be unique — the
 * export orchestrator owns collision suffixes; this adapter does not rename.
 */
export async function buildZipArchive(entries: ZipEntry[]): Promise<Blob> {
  const zip = new JSZip();
  const taken = new Set<string>();

  for (const entry of entries) {
    if (taken.has(entry.fileName)) {
      throw new Error(`Duplicate zip entry: ${entry.fileName}`);
    }
    taken.add(entry.fileName);
    zip.file(entry.fileName, entry.arrayBuffer);
  }

  return zip.generateAsync({ type: 'blob' });
}
