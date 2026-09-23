import { defaultZipBaseName, stripExportExtension } from '@/modules/export/utils/file-name';

export function isDefaultZipBaseName(value: string): boolean {
  return (
    value === defaultZipBaseName('glb')
    || value === defaultZipBaseName('fbx')
    || value.trim() === ''
  );
}

export function countSharedWorkingClips(
  clips: { ownerModelId: string | null; clip: unknown }[],
): number {
  return clips.filter(
    (entry) => entry.ownerModelId === null && entry.clip !== null,
  ).length;
}

export function defaultModelNames(
  models: { id: string; fileName: string }[],
): Record<string, string> {
  const next: Record<string, string> = {};
  for (const model of models) {
    next[model.id] = stripExportExtension(model.fileName);
  }
  return next;
}

export function defaultGroupNames(
  groups: { id: string; name: string }[],
): Record<string, string> {
  const next: Record<string, string> = {};
  for (const group of groups) {
    next[group.id] = group.name;
  }
  return next;
}
