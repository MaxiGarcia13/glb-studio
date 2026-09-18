import type { ModelEntry } from '@/modules/viewport/types/model';
import type { ModelGroup } from '@/modules/viewport/types/model-group';

import { Group } from 'three';
import { describe, expect, it } from 'vitest';
import { resolveExportUnits } from '@/modules/export/domain/zip-download';

function model(id: string, source: ModelEntry['source'] = 'imported'): ModelEntry {
  return {
    id,
    fileName: `${id}.glb`,
    scene: new Group(),
    source,
  };
}

function group(id: string, modelIds: string[]): ModelGroup {
  return { id, name: id, modelIds };
}

describe('resolveExportUnits', () => {
  it('returns one single unit per ungrouped exportable model', () => {
    const models = [model('a'), model('b')];
    expect(resolveExportUnits(models, [])).toEqual([
      { kind: 'single', group: null, models: [models[0]] },
      { kind: 'single', group: null, models: [models[1]] },
    ]);
  });

  it('merges groups with ≥2 exportable members', () => {
    const models = [model('a'), model('b'), model('c')];
    const g = group('g1', ['a', 'b']);
    expect(resolveExportUnits(models, [g])).toEqual([
      { kind: 'group', group: g, models: [models[0], models[1]] },
      { kind: 'single', group: null, models: [models[2]] },
    ]);
  });

  it('emits a single unit when a group has only one exportable member', () => {
    const models = [model('a'), model('b')];
    const g = group('g1', ['a', 'missing']);
    expect(resolveExportUnits(models, [g])).toEqual([
      { kind: 'single', group: null, models: [models[0]] },
      { kind: 'single', group: null, models: [models[1]] },
    ]);
  });

  it('omits empty created models from units', () => {
    const models = [model('imp'), model('empty', 'created')];
    expect(resolveExportUnits(models, [])).toEqual([
      { kind: 'single', group: null, models: [models[0]] },
    ]);
  });

  it('skips groups whose members are all non-exportable', () => {
    const empty = model('empty', 'created');
    expect(resolveExportUnits([empty], [group('g1', ['empty'])])).toEqual([]);
  });
});
