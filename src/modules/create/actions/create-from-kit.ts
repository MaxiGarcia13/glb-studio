import type { KitId, MeshKit, SkinnedKit } from '@/modules/create/types/kit';
import { Group } from 'three';
import { loadModelFromFile } from '@/modules/viewport/adapters/model-loader';
import { importModelResults } from '@/modules/viewport/stores/model-store';
import { instantiateKitParts } from '../domain/instantiate-kit';
import { getKit } from '../domain/kit';
import { isMeshKit, isSkinnedKit } from '../domain/kit-kind';
import { bumpCreatePartsRevision } from '../stores/create-parts-revision-store';
import {
  addCreatedModelToLibrary,
  nextCreatedModelFileName,
} from './add-created-model';

/**
 * Create a model from a registered starter kit (not `empty`).
 * Mesh kits → created path; skinned kits → imported path (US-33).
 */
export async function createFromKit(kitId: Exclude<KitId, 'empty'>): Promise<void> {
  const kit = getKit(kitId);

  if (isSkinnedKit(kit)) {
    await createFromSkinnedKit(kit);
    return;
  }

  if (!isMeshKit(kit)) {
    throw new Error(`Unknown kit kind for "${kitId}"`);
  }

  createFromMeshKit(kit);
}

function createFromMeshKit(kit: MeshKit): void {
  const scene = new Group();
  scene.name = kit.label;

  instantiateKitParts(scene, kit);
  addCreatedModelToLibrary(scene, nextCreatedModelFileName(kit.label));
  bumpCreatePartsRevision();
}

async function createFromSkinnedKit(kit: SkinnedKit): Promise<void> {
  const { url, defaultFileName } = kit.skinnedAsset;
  const fileName = defaultFileName ?? `${kit.label}.glb`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error(
      `Could not load “${kit.label}” kit — network error fetching ${url}.`,
    );
  }

  if (!response.ok) {
    throw new Error(
      `Could not load “${kit.label}” kit — missing or unreachable asset (${response.status}).`,
    );
  }

  const blob = await response.blob();
  const file = new File([blob], fileName, {
    type: blob.type || 'model/gltf-binary',
  });

  let result;
  try {
    result = await loadModelFromFile(file);
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : 'invalid skinned GLB';
    throw new Error(`Could not load “${kit.label}” kit — ${detail}.`);
  }

  // Only mutate the library after a successful skinned parse.
  importModelResults([result]);
}
