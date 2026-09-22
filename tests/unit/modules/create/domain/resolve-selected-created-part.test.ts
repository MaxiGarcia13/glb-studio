import type { ModelEntry } from '@/modules/viewport/types/model';
import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import { describe, expect, it } from 'vitest';
import {
  CREATE_PART_USER_DATA_KEY,
} from '@/modules/create/domain/part-data';
import {
  canOpenTexturePrep,
  resolveSelectedCreatedPart,
} from '@/modules/create/domain/resolve-selected-created-part';

function stampedBox(): Mesh {
  const mesh = new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial());
  mesh.userData[CREATE_PART_USER_DATA_KEY] = {
    kind: 'box',
    params: { width: 1, height: 1, depth: 1 },
  };
  return mesh;
}

function modelEntry(
  source: ModelEntry['source'],
  scene: Group,
): ModelEntry {
  return {
    id: `model-${source}`,
    fileName: 'test',
    scene,
    source,
  };
}

describe('resolveSelectedCreatedPart', () => {
  it('returns the stamped part on a focused created model', () => {
    const scene = new Group();
    const mesh = stampedBox();
    scene.add(mesh);
    const part = resolveSelectedCreatedPart(modelEntry('created', scene), mesh);

    expect(part?.mesh).toBe(mesh);
    expect(part?.record.kind).toBe('box');
  });

  it('returns null when focus is an imported model', () => {
    const scene = new Group();
    const mesh = stampedBox();
    scene.add(mesh);

    expect(
      resolveSelectedCreatedPart(modelEntry('imported', scene), mesh),
    ).toBeNull();
    expect(canOpenTexturePrep(modelEntry('imported', scene), mesh)).toBe(
      false,
    );
  });

  it('returns null for an unstamped mesh on a created model', () => {
    const scene = new Group();
    const mesh = new Mesh(
      new BoxGeometry(1, 1, 1),
      new MeshStandardMaterial(),
    );
    scene.add(mesh);

    expect(
      resolveSelectedCreatedPart(modelEntry('created', scene), mesh),
    ).toBeNull();
  });

  it('returns null when the mesh is outside the active scene', () => {
    const scene = new Group();
    const other = new Group();
    const mesh = stampedBox();
    other.add(mesh);

    expect(
      resolveSelectedCreatedPart(modelEntry('created', scene), mesh),
    ).toBeNull();
  });

  it('returns null with no selection or no active model', () => {
    const scene = new Group();
    expect(resolveSelectedCreatedPart(null, stampedBox())).toBeNull();
    expect(
      resolveSelectedCreatedPart(modelEntry('created', scene), null),
    ).toBeNull();
  });
});
