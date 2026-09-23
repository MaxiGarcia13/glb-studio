import {
  Bone,
  BoxGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Skeleton,
  SkinnedMesh,
  Texture,
} from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { applyUndoableCommand } from '@/modules/animation/stores/clip-store/actions/apply-undoable-command';
import {
  $commandStack,
  clearUndoStack,
  takeUndoCommand,
} from '@/modules/animation/stores/undo-stack-store';
import { commitMaterialColorMapChange } from '@/modules/create/actions/commit-material-color-map';
import { applyColorMap } from '@/modules/create/domain/material-color-map';
import { writeCreatePart } from '@/modules/create/domain/part-data';
import {
  $materialMapsRevision,
} from '@/modules/create/stores/material-maps-revision-store';
import { $model } from '@/modules/viewport/stores/model-store';

function namedTexture(name: string): Texture {
  const texture = new Texture({
    width: 4,
    height: 4,
    data: new Uint8ClampedArray(4 * 4 * 4),
  } as never);
  texture.name = name;
  texture.needsUpdate = true;
  return texture;
}

function stampedPart(): Mesh {
  const mesh = new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial());
  writeCreatePart(mesh, {
    kind: 'box',
    params: { width: 1, height: 1, depth: 1 },
  });
  return mesh;
}

function skinnedTarget(): SkinnedMesh {
  const bone = new Bone();
  const mesh = new SkinnedMesh(
    new BoxGeometry(1, 1, 1),
    new MeshStandardMaterial(),
  );
  mesh.bind(new Skeleton([bone]));
  return mesh;
}

describe('commitMaterialColorMapChange', () => {
  beforeEach(() => {
    clearUndoStack();
    $materialMapsRevision.set(0);
    $model.set({
      models: [],
      activeModelId: null,
      previewModelIds: [],
      phase: 'idle',
      error: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearUndoStack();
  });

  it('pushes materialColorMap on create apply and restores on undo', () => {
    const mesh = stampedPart();
    const scene = new Group();
    scene.add(mesh);
    $model.set({
      models: [
        {
          id: 'model-1',
          fileName: 'created.glb',
          scene,
          source: 'created',
        },
      ],
      activeModelId: 'model-1',
      previewModelIds: ['model-1'],
      phase: 'idle',
      error: null,
    });

    const material = mesh.material as MeshStandardMaterial;
    const next = namedTexture('logo.png');
    commitMaterialColorMapChange({
      modelId: 'model-1',
      meshUuid: mesh.uuid,
      material,
      next,
    });

    expect(material.map?.name).toBe('logo.png');
    expect($commandStack.get().past).toHaveLength(1);
    expect($commandStack.get().past[0]?.id).toBe('materialColorMap');

    const command = takeUndoCommand();
    expect(command).not.toBeNull();
    applyUndoableCommand(command!, 'undo');
    expect(material.map).toBeNull();
  });

  it('pushes materialColorMap on create clear and restores the map on undo', () => {
    const mesh = stampedPart();
    const scene = new Group();
    scene.add(mesh);
    $model.set({
      models: [
        {
          id: 'model-1',
          fileName: 'created.glb',
          scene,
          source: 'created',
        },
      ],
      activeModelId: 'model-1',
      previewModelIds: ['model-1'],
      phase: 'idle',
      error: null,
    });

    const material = mesh.material as MeshStandardMaterial;
    applyColorMap(material, namedTexture('keep.png'));
    commitMaterialColorMapChange({
      modelId: 'model-1',
      meshUuid: mesh.uuid,
      material,
      next: null,
    });

    expect(material.map).toBeNull();
    const command = takeUndoCommand();
    applyUndoableCommand(command!, 'undo');
    expect(material.map?.name).toBe('keep.png');
  });

  it('pushes materialColorMap on skinned apply/clear and restores on undo', () => {
    const mesh = skinnedTarget();
    const scene = new Group();
    scene.add(mesh);
    $model.set({
      models: [
        {
          id: 'model-skin',
          fileName: 'character.glb',
          scene,
          source: 'imported',
        },
      ],
      activeModelId: 'model-skin',
      previewModelIds: ['model-skin'],
      phase: 'idle',
      error: null,
    });

    const material = mesh.material as MeshStandardMaterial;
    commitMaterialColorMapChange({
      modelId: 'model-skin',
      meshUuid: mesh.uuid,
      material,
      next: namedTexture('atlas.png'),
    });
    expect(material.map?.name).toBe('atlas.png');
    expect($commandStack.get().past).toHaveLength(1);

    commitMaterialColorMapChange({
      modelId: 'model-skin',
      meshUuid: mesh.uuid,
      material,
      next: null,
    });
    expect(material.map).toBeNull();
    expect($commandStack.get().past).toHaveLength(2);

    applyUndoableCommand(takeUndoCommand()!, 'undo');
    expect(material.map?.name).toBe('atlas.png');
  });

  it('bumps materialMapsRevision on commit and on undo', () => {
    const mesh = stampedPart();
    const scene = new Group();
    scene.add(mesh);
    $model.set({
      models: [
        {
          id: 'model-1',
          fileName: 'created.glb',
          scene,
          source: 'created',
        },
      ],
      activeModelId: 'model-1',
      previewModelIds: ['model-1'],
      phase: 'idle',
      error: null,
    });

    const material = mesh.material as MeshStandardMaterial;
    commitMaterialColorMapChange({
      modelId: 'model-1',
      meshUuid: mesh.uuid,
      material,
      next: namedTexture('logo.png'),
    });
    expect($materialMapsRevision.get()).toBe(1);

    applyUndoableCommand(takeUndoCommand()!, 'undo');
    expect($materialMapsRevision.get()).toBe(2);
    expect(material.map).toBeNull();
  });
});
