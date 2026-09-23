import type { ZipEntry } from '@/modules/export/adapters/zip';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { finalizeEntries } from '@/modules/export/domain/zip-download/finalize-entries';

vi.mock('@/modules/export/services/ensure-fbx-file', () => ({
  ensureFbxFile: vi.fn(async (file: File) => {
    const buffer = await file.arrayBuffer();
    return new File([buffer], file.name.replace(/\.glb$/i, '.fbx'), {
      type: 'application/octet-stream',
    });
  }),
}));

function entry(fileName: string, bytes = [1, 2, 3]): ZipEntry {
  return { fileName, arrayBuffer: new Uint8Array(bytes).buffer };
}

describe('finalizeEntries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes GLB entries through unchanged', async () => {
    const entries = [entry('Hero.glb'), entry('Hero/skins/Red.png')];
    await expect(finalizeEntries(entries, 'glb')).resolves.toEqual(entries);
  });

  it('converts non-PNG entries to FBX and leaves PNG untouched', async () => {
    const entries = [
      entry('Hero/Hero.fbx', [9, 9]),
      entry('Hero/skins/Red.png', [4, 5]),
      entry('Walk.fbx', [7]),
    ];
    const result = await finalizeEntries(entries, 'fbx');
    expect(result).toHaveLength(3);
    expect(result[0]?.fileName).toBe('Hero/Hero.fbx');
    expect(result[1]?.fileName).toBe('Hero/skins/Red.png');
    expect(new Uint8Array(result[1]!.arrayBuffer)).toEqual(
      new Uint8Array([4, 5]),
    );
    expect(result[2]?.fileName).toBe('Walk.fbx');
  });
});
