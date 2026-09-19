import type { ModelEntry } from '@/modules/viewport/types/model';
import type { ModelGroup } from '@/modules/viewport/types/model-group';

import { isExportableModel } from '../exportable-model';

export interface ExportUnit {
  kind: 'group' | 'single';
  group: ModelGroup | null;
  models: ModelEntry[];
}

/**
 * Each editor model group with ≥2 exportable members → one merged unit;
 * leftover / ungrouped exportable models → one unit each.
 * Created models with no stamped mesh parts are omitted.
 */
export function resolveExportUnits(
  models: readonly ModelEntry[],
  groups: readonly ModelGroup[],
): ExportUnit[] {
  const exportable = models.filter(isExportableModel);
  const byId = new Map(exportable.map((model) => [model.id, model]));
  const units: ExportUnit[] = [];
  const consumed = new Set<string>();

  for (const group of groups) {
    const members = group.modelIds.flatMap((id) => {
      const model = byId.get(id);
      return model ? [model] : [];
    });
    if (members.length === 0) {
      continue;
    }
    for (const member of members) {
      consumed.add(member.id);
    }
    if (members.length >= 2) {
      units.push({ kind: 'group', group, models: members });
    } else {
      units.push({ kind: 'single', group: null, models: members });
    }
  }

  for (const model of exportable) {
    if (!consumed.has(model.id)) {
      units.push({ kind: 'single', group: null, models: [model] });
    }
  }

  return units;
}
