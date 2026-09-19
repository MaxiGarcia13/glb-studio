import type { ExportFormat } from '@/modules/export/utils/file-name';

export function formatLabel(format: ExportFormat, plural: boolean): string {
  if (format === 'fbx') {
    return plural ? 'FBXs' : 'FBX';
  }
  return plural ? 'GLBs' : 'GLB';
}
