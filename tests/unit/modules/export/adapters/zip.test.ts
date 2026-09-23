import { describe, expect, it } from 'vitest';

import { buildZipArchive } from '@/modules/export/adapters/zip';

describe('buildZipArchive', () => {
  it('preserves entry file names', async () => {
    const blob = await buildZipArchive([
      { fileName: 'hero.glb', arrayBuffer: new Uint8Array([1]).buffer },
      { fileName: 'Walk.glb', arrayBuffer: new Uint8Array([2]).buffer },
    ]);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
  });

  it('rejects duplicate entry names instead of silently renaming', async () => {
    await expect(
      buildZipArchive([
        { fileName: 'hero.glb', arrayBuffer: new Uint8Array([1]).buffer },
        { fileName: 'hero.glb', arrayBuffer: new Uint8Array([2]).buffer },
      ]),
    ).rejects.toThrow('Duplicate zip entry: hero.glb');
  });
});
