import { importClipResults } from '@/modules/animation/stores/clip-store';
import { createModelGroup } from '@/modules/viewport/stores/model-group-store';
import { importModelResults } from '@/modules/viewport/stores/model-store';
import { routeContentImport } from '../adapters/content-router';

/**
 * Route picked files into models / shared clips / groups and commit them to
 * the editor stores. Continues past per-file router errors.
 */
export async function importContentFiles(files: File[]): Promise<void> {
  const { models, sharedClips, errors, groupsToCreate } = await routeContentImport(files);
  const loaded
    = models.length > 0 || errors.length > 0
      ? importModelResults(models, errors)
      : [];
  for (const group of groupsToCreate) {
    const ids = group.modelIndexes
      .map((index) => loaded[index]?.id)
      .filter((id): id is string => Boolean(id));
    createModelGroup(ids, { name: group.name });
  }
  if (sharedClips.length > 0) {
    importClipResults(sharedClips, null);
  }
}
