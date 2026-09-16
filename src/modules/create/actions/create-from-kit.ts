import type { KitId } from '@/modules/create/types/kit';
import { Group } from 'three';
import { instantiateKitParts } from '../domain/instantiate-kit';
import { getKit } from '../domain/kit';
import { bumpCreatePartsRevision } from '../stores/create-parts-revision-store';
import {
  addCreatedModelToLibrary,
  nextCreatedModelFileName,
} from './add-created-model';

/**
 * Create a model from a registered starter kit (not `empty`).
 * Same library / preview / focus path as `createEmptyModel`.
 */
export function createFromKit(kitId: Exclude<KitId, 'empty'>): void {
  const kit = getKit(kitId);
  const scene = new Group();
  scene.name = kit.label;

  instantiateKitParts(scene, kit);
  addCreatedModelToLibrary(scene, nextCreatedModelFileName(kit.label));
  bumpCreatePartsRevision();
}
