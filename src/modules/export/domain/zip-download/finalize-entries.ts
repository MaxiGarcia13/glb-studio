import type { ZipEntry } from '@/modules/export/adapters/zip';
import type { ExportFormat } from '@/modules/export/utils/file-name';

import { ensureFbxFile } from '@/modules/export/services/ensure-fbx-file';
import { withModelExtension } from '@/utils/with-model-extension';

function isPngEntry(fileName: string): boolean {
  return fileName.toLowerCase().endsWith('.png');
}

/** Pack is always GLB bytes for models/clips; FBX path converts after naming. PNGs pass through. */
export async function finalizeEntries(
  entries: ZipEntry[],
  format: ExportFormat,
): Promise<ZipEntry[]> {
  if (format === 'glb') {
    return entries;
  }

  const converted: ZipEntry[] = [];
  for (const entry of entries) {
    if (isPngEntry(entry.fileName)) {
      converted.push(entry);
      continue;
    }

    const glbName = withModelExtension(entry.fileName, 'glb');
    const glbFile = new File([entry.arrayBuffer], glbName, {
      type: 'model/gltf-binary',
    });
    const fbxFile = await ensureFbxFile(glbFile);
    converted.push({
      fileName: entry.fileName,
      arrayBuffer: await fbxFile.arrayBuffer(),
    });
  }
  return converted;
}
