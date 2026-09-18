import type { ModelGroupManifest } from '@/modules/export/domain/model-group-manifest';

import { describe, expect, it } from 'vitest';
import {
  MODEL_GROUP_MANIFEST_VERSION,
  parseModelGroupManifest,
} from '@/modules/export/domain/model-group-manifest';

function validManifest(
  overrides: Partial<ModelGroupManifest> = {},
): ModelGroupManifest {
  return {
    version: MODEL_GROUP_MANIFEST_VERSION,
    name: ' Duo ',
    members: [
      {
        fileName: 'a.glb',
        prefix: 'a_',
        source: 'imported',
        clips: [{ exportName: 'a_Idle', name: 'Idle' }],
      },
      {
        fileName: 'b.glb',
        prefix: 'b_',
        source: 'created',
        clips: [],
      },
    ],
    ...overrides,
  };
}

describe('parseModelGroupManifest', () => {
  it('accepts a trimmed valid manifest with ≥2 members', () => {
    expect(parseModelGroupManifest(validManifest())).toEqual({
      version: MODEL_GROUP_MANIFEST_VERSION,
      name: 'Duo',
      members: validManifest().members,
    });
  });

  it('rejects non-objects and wrong versions', () => {
    expect(parseModelGroupManifest(null)).toBeNull();
    expect(parseModelGroupManifest(undefined)).toBeNull();
    expect(parseModelGroupManifest('x')).toBeNull();
    expect(parseModelGroupManifest(validManifest({ version: 0 }))).toBeNull();
    expect(parseModelGroupManifest(validManifest({ version: 2 }))).toBeNull();
  });

  it('rejects empty or whitespace-only names', () => {
    expect(parseModelGroupManifest(validManifest({ name: '' }))).toBeNull();
    expect(parseModelGroupManifest(validManifest({ name: '   ' }))).toBeNull();
  });

  it('rejects manifests with fewer than two members', () => {
    expect(
      parseModelGroupManifest(
        validManifest({
          members: [
            {
              fileName: 'a.glb',
              prefix: 'a_',
              source: 'imported',
              clips: [],
            },
          ],
        }),
      ),
    ).toBeNull();
    expect(parseModelGroupManifest(validManifest({ members: [] }))).toBeNull();
    expect(
      parseModelGroupManifest({
        version: MODEL_GROUP_MANIFEST_VERSION,
        name: 'Duo',
        members: 'nope',
      }),
    ).toBeNull();
  });

  it('rejects invalid member or clip records', () => {
    expect(
      parseModelGroupManifest(
        validManifest({
          members: [
            {
              fileName: '',
              prefix: 'a_',
              source: 'imported',
              clips: [],
            },
            {
              fileName: 'b.glb',
              prefix: 'b_',
              source: 'created',
              clips: [],
            },
          ],
        }),
      ),
    ).toBeNull();

    expect(
      parseModelGroupManifest(
        validManifest({
          members: [
            {
              fileName: 'a.glb',
              prefix: '',
              source: 'imported',
              clips: [],
            },
            {
              fileName: 'b.glb',
              prefix: 'b_',
              source: 'created',
              clips: [],
            },
          ],
        }),
      ),
    ).toBeNull();

    expect(
      parseModelGroupManifest(
        validManifest({
          members: [
            {
              fileName: 'a.glb',
              prefix: 'a_',
              source: 'kit' as 'imported',
              clips: [],
            },
            {
              fileName: 'b.glb',
              prefix: 'b_',
              source: 'created',
              clips: [],
            },
          ],
        }),
      ),
    ).toBeNull();

    expect(
      parseModelGroupManifest(
        validManifest({
          members: [
            {
              fileName: 'a.glb',
              prefix: 'a_',
              source: 'imported',
              clips: [{ exportName: '', name: 'Idle' }],
            },
            {
              fileName: 'b.glb',
              prefix: 'b_',
              source: 'created',
              clips: [],
            },
          ],
        }),
      ),
    ).toBeNull();
  });
});
