import type { ModelEntry } from '@/modules/viewport/types/model';

import { listCreatedParts } from '@/modules/create/domain/list-created-parts';

/**
 * Whether a library model should appear in the export zip.
 * Created models with no stamped mesh parts are skipped (empty New models).
 * Imported models are always exportable.
 */
export function isExportableModel(model: ModelEntry): boolean {
  if (model.source !== 'created') {
    return true;
  }
  return listCreatedParts(model.scene).length > 0;
}
