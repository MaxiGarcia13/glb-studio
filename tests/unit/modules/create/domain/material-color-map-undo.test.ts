import type { MaterialColorMapCommand } from '@/modules/create/domain/material-color-map-undo';
import {
  BoxGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Texture,
} from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { applyUndoableCommand } from '@/modules/animation/stores/clip-store/actions/apply-undoable-command';
import {
  clearUndoStack,
  pushUndoableCommand,
  takeRedoCommand,
  takeUndoCommand,
} from '@/modules/animation/stores/undo-stack-store';
import {
  applyColorMap,
  clearColorMap,
  replaceColorMap,
} from '@/modules/create/domain/material-color-map';
import {
  cloneColorMapTexture,
  disposeMaterialColorMapCommand,
  snapshotMaterialColorMap,
} from '@/modules/create/domain/material-color-map-undo';
import { markTextureMapHasAlpha } from '@/modules/create/domain/texture-map-alpha';
import { $model } from '@/modules/viewport/stores/model-store';

function stubCanvasDocument() {
  const context = { drawImage: vi.fn() };
  const canvas = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => context),
  };
  vi.stubGlobal('document', {
    createElement: vi.fn((tag: string) => {
      if (tag === 'canvas') {
        return canvas;
      }
      throw new Error(`Unexpected element: ${tag}`);
    }),
  });
  return { canvas, context };
}

function canvasTexture(name: string): Texture {
  const canvas = document.createElement('canvas') as unknown as HTMLCanvasElement;
  canvas.width = 8;
  canvas.height = 8;
  const texture = new Texture(canvas);
  texture.name = name;
  texture.flipY = false;
  texture.needsUpdate = true;
  return texture;
}

function setModel(mesh: Mesh): void {
  const scene = new Group();
  scene.add(mesh);
  $model.set({
    models: [
      {
        id: 'model-1',
        fileName: 'skinned.glb',
        scene,
        source: 'imported',
      },
    ],
    activeModelId: 'model-1',
    previewModelIds: ['model-1'],
    phase: 'idle',
    error: null,
  });
}

function pushMapCommand(
  mesh: Mesh,
  beforeLive: Texture | null,
  afterLive: Texture | null,
): MaterialColorMapCommand {
  const material = mesh.material as MeshStandardMaterial;
  material.map = beforeLive;
  const before = snapshotMaterialColorMap(material);
  if (afterLive) {
    replaceColorMap(material, afterLive);
  } else {
    clearColorMap(material);
  }
  const after = snapshotMaterialColorMap(material);
  const command: MaterialColorMapCommand = {
    id: 'materialColorMap',
    modelId: 'model-1',
    meshUuid: mesh.uuid,
    before,
    after,
  };
  pushUndoableCommand(command);
  return command;
}

function undoOnce(): void {
  const command = takeUndoCommand();
  expect(command).not.toBeNull();
  applyUndoableCommand(command!, 'undo');
}

function redoOnce(): void {
  const command = takeRedoCommand();
  expect(command).not.toBeNull();
  applyUndoableCommand(command!, 'redo');
}

describe('materialColorMap undo (US-46)', () => {
  beforeEach(() => {
    stubCanvasDocument();
    clearUndoStack();
    $model.set({
      models: [],
      activeModelId: null,
      previewModelIds: [],
      phase: 'idle',
      error: null,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    clearUndoStack();
  });

  it('clones into a distinct texture so stack ownership is independent', () => {
    const source = canvasTexture('skin.png');
    const a = cloneColorMapTexture(source);
    const b = cloneColorMapTexture(source);
    expect(a).not.toBe(source);
    expect(b).not.toBe(source);
    expect(a).not.toBe(b);
    expect(a.image).not.toBe(source.image);
    expect(b.image).not.toBe(a.image);
    expect(a.name).toBe('skin.png');
    expect(a.flipY).toBe(false);
  });

  it('undo restores the previous map; redo restores the committed map', () => {
    const mesh = new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial());
    setModel(mesh);
    const beforeTex = canvasTexture('before.png');
    const afterTex = canvasTexture('after.png');
    applyColorMap(mesh.material as MeshStandardMaterial, beforeTex);

    pushMapCommand(mesh, beforeTex, afterTex);
    expect((mesh.material as MeshStandardMaterial).map?.name).toBe('after.png');

    undoOnce();
    expect((mesh.material as MeshStandardMaterial).map?.name).toBe('before.png');

    redoOnce();
    expect((mesh.material as MeshStandardMaterial).map?.name).toBe('after.png');
  });

  it('undo after clear restores the map; does not dispose stack clones', () => {
    const mesh = new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial());
    setModel(mesh);
    const beforeTex = canvasTexture('keep.png');
    applyColorMap(mesh.material as MeshStandardMaterial, beforeTex);

    const command = pushMapCommand(mesh, beforeTex, null);
    expect((mesh.material as MeshStandardMaterial).map).toBeNull();

    const beforeDispose = vi.spyOn(command.before.map!, 'dispose');
    const afterWasNull = command.after.map;
    expect(afterWasNull).toBeNull();

    undoOnce();
    expect((mesh.material as MeshStandardMaterial).map?.name).toBe('keep.png');
    expect(beforeDispose).not.toHaveBeenCalled();

    redoOnce();
    expect((mesh.material as MeshStandardMaterial).map).toBeNull();
    expect(beforeDispose).not.toHaveBeenCalled();

    disposeMaterialColorMapCommand(command);
  });

  it('restores alpha cutout flags from the snapshot map', () => {
    const mesh = new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial());
    setModel(mesh);
    const withAlpha = canvasTexture('cutout.png');
    markTextureMapHasAlpha(withAlpha, true);
    applyColorMap(mesh.material as MeshStandardMaterial, withAlpha);

    pushMapCommand(mesh, withAlpha, null);
    expect((mesh.material as MeshStandardMaterial).transparent).toBe(false);

    undoOnce();
    const material = mesh.material as MeshStandardMaterial;
    expect(material.map?.name).toBe('cutout.png');
    expect(material.transparent).toBe(true);
    expect(material.alphaTest).toBe(0.5);
  });
});
