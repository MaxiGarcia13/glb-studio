import type { KitId } from '@/modules/create/types/kit';
import type { ModelEntry } from '@/modules/viewport/types/model';

import { Color, Group, MeshStandardMaterial } from 'three';
import { getKit } from '@/modules/create/domain/kit';
import { getPartKind } from '@/modules/create/domain/part-kind';
import { $model } from '@/modules/viewport/stores/model-store';

let nextCreatedModelIndex = 1;

export function createModelFromKit(kitId: KitId): void {
  const kit = getKit(kitId);
  const scene = new Group();
  scene.name = kit.label;

  for (const recipe of kit.parts) {
    const kind = getPartKind(recipe.kind);
    const mesh = kind.createMesh(recipe.params);
    mesh.name = recipe.name;
    mesh.position.set(...recipe.position);
    mesh.rotation.set(...recipe.rotation);
    if (recipe.scale) {
      mesh.scale.set(...recipe.scale);
    }
    if (mesh.material instanceof MeshStandardMaterial) {
      mesh.material.color = new Color(recipe.color);
    }
    scene.add(mesh);
  }

  const state = $model.get();
  const id = `model-created-${nextCreatedModelIndex++}`;
  const fileName = `New model ${state.models.length + 1}.glb`;

  const entry: ModelEntry = {
    id,
    fileName,
    scene,
    source: 'created',
  };

  $model.set({
    models: [...state.models, entry],
    previewModelIds: [...state.previewModelIds, id],
    activeModelId: id,
    phase: state.models.length === 0 ? 'loaded' : state.phase,
    error: null,
  });
}
