import type { ModelEntry } from '@/modules/viewport/types/model';
import { BoxGeometry, Group, Mesh, MeshBasicMaterial } from 'three';

import { describe, expect, it } from 'vitest';
import { writeCreatePart } from '@/modules/create/domain/part-data';
import { isExportableModel } from '@/modules/export/domain/exportable-model';

function model(
  partial: Pick<ModelEntry, 'id' | 'source'> & Partial<ModelEntry>,
): ModelEntry {
  return {
    fileName: `${partial.id}.glb`,
    scene: new Group(),
    ...partial,
  };
}

function stampedBoxScene(): Group {
  const scene = new Group();
  const mesh = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial());
  writeCreatePart(mesh, { kind: 'box', params: { width: 1, height: 1, depth: 1 } });
  scene.add(mesh);
  return scene;
}

describe('isExportableModel', () => {
  it('always exports imported models', () => {
    expect(isExportableModel(model({ id: 'imp', source: 'imported' }))).toBe(true);
  });

  it('skips empty created models and keeps ones with stamped parts', () => {
    expect(isExportableModel(model({ id: 'empty', source: 'created' }))).toBe(false);
    expect(
      isExportableModel(
        model({ id: 'kit', source: 'created', scene: stampedBoxScene() }),
      ),
    ).toBe(true);
  });
});
