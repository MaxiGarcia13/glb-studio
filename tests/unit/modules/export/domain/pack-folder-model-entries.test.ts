import type { ClipEntry } from '@/modules/animation/types/clip';
import type { SessionSkinEntry } from '@/modules/create/types/session-skins';
import type { ModelEntry } from '@/modules/viewport/types/model';

import { AnimationClip, Group, Texture } from 'three';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getSessionSkinWardrobe } from '@/modules/create/stores/session-skins-store';
import { packFolderModelEntries } from '@/modules/export/domain/zip-download/pack-folder-model-entries';

vi.mock('@/modules/export/domain/model-glb', async () => {
  const actual = await vi.importActual<
    typeof import('@/modules/export/domain/model-glb')
  >('@/modules/export/domain/model-glb');
  return {
    ...actual,
    packModelGlb: vi.fn(async (model: ModelEntry) => ({
      arrayBuffer: new Uint8Array([1]).buffer,
      fileName: `${model.fileName}`,
    })),
  };
});

vi.mock('@/modules/export/domain/clip-glb', () => ({
  packClipGlb: vi.fn(async (entry: ClipEntry) => ({
    arrayBuffer: new Uint8Array([2]).buffer,
    fileName: `${entry.name}.glb`,
  })),
}));

vi.mock('@/modules/export/adapters/png-from-texture', () => ({
  pngArrayBufferFromTexture: vi.fn(async () => new Uint8Array([3]).buffer),
}));

vi.mock('@/modules/create/stores/session-skins-store', () => ({
  getSessionSkinWardrobe: vi.fn(),
}));

function model(id: string): ModelEntry {
  return {
    id,
    fileName: `${id}.glb`,
    scene: new Group(),
    source: 'imported',
  };
}

function clip(id: string, name: string, ownerModelId: string | null): ClipEntry {
  return {
    id,
    name,
    status: 'ready',
    ownerModelId,
    timeScale: 1,
    trimIn: 0,
    trimOut: 1,
    clip: new AnimationClip(name, 1, []),
  } as ClipEntry;
}

describe('packFolderModelEntries', () => {
  beforeEach(() => {
    vi.mocked(getSessionSkinWardrobe).mockReturnValue({
      skins: [],
      activeSkinId: null,
    });
  });

  it('packs mesh + owned clip under Base/ and animations/', async () => {
    const entry = model('hero');
    const owned = clip('c1', 'Idle', 'hero');
    const result = await packFolderModelEntries({
      model: entry,
      clips: [owned],
      format: 'glb',
      takenNames: new Set(),
      takenFolderBases: new Set(),
    });

    expect(result.entries.map((item) => item.fileName)).toEqual([
      'hero/hero.glb',
      'hero/animations/Idle.glb',
    ]);
    expect(result.packedSharedClipIds).toEqual([]);
  });

  it('writes every session skin as PNG under skins/', async () => {
    const texture = new Texture();
    const skins: SessionSkinEntry[] = [
      { id: 's1', label: 'Red', texture },
      { id: 's2', label: 'Blue', texture },
    ];
    vi.mocked(getSessionSkinWardrobe).mockReturnValue({
      skins,
      activeSkinId: 's1',
    });

    const result = await packFolderModelEntries({
      model: model('hero'),
      clips: [],
      format: 'fbx',
      modelFileName: 'Captain',
      takenNames: new Set(),
      takenFolderBases: new Set(),
    });

    expect(result.entries.map((item) => item.fileName)).toEqual([
      'Captain/Captain.fbx',
      'Captain/skins/Red.png',
      'Captain/skins/Blue.png',
    ]);
  });

  it('records shared clip ids packed under animations/', async () => {
    const shared = clip('share-1', 'Walk', null);
    const result = await packFolderModelEntries({
      model: model('hero'),
      clips: [shared],
      format: 'glb',
      takenNames: new Set(),
      takenFolderBases: new Set(),
    });

    expect(result.packedSharedClipIds).toEqual(['share-1']);
    expect(result.entries.some((item) =>
      item.fileName === 'hero/animations/Walk.glb',
    )).toBe(true);
  });
});
