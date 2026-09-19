import { Buffer } from 'node:buffer';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  convertGlbToFbx,
  glbToFbxConverter,
  GlbToFbxConvertError,
} from '@/modules/export/adapters/convert-glb-to-fbx';

describe('convertGlbToFbx', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects non-.glb names with 400 without calling the converter', async () => {
    const convert = vi
      .spyOn(glbToFbxConverter, 'run')
      .mockResolvedValue(new Uint8Array([1]));
    await expect(
      convertGlbToFbx('model.fbx', new ArrayBuffer(8)),
    ).rejects.toMatchObject({
      name: 'GlbToFbxConvertError',
      message: 'Only .glb files are accepted',
      status: 400,
    });
    expect(convert).not.toHaveBeenCalled();
  });

  it('rejects bodies over 4.5 MB with 413 without calling the converter', async () => {
    const convert = vi
      .spyOn(glbToFbxConverter, 'run')
      .mockResolvedValue(new Uint8Array([1]));
    const oversized = new ArrayBuffer(Math.floor(4.5 * 1024 * 1024) + 1);
    await expect(convertGlbToFbx('big.glb', oversized)).rejects.toBeInstanceOf(
      GlbToFbxConvertError,
    );
    await expect(convertGlbToFbx('big.GLB', oversized)).rejects.toMatchObject({
      status: 413,
      message: 'File exceeds 4.5 MB limit',
    });
    expect(convert).not.toHaveBeenCalled();
  });

  it('returns a Buffer from the mocked converter for a valid small .glb', async () => {
    vi.spyOn(glbToFbxConverter, 'run').mockResolvedValue(
      new TextEncoder().encode('Kaydara FBX'),
    );
    const data = new Uint8Array([1, 2, 3]).buffer;
    const result = await convertGlbToFbx('walk.glb', data);
    expect(glbToFbxConverter.run).toHaveBeenCalledOnce();
    expect(glbToFbxConverter.run).toHaveBeenCalledWith(
      'walk.glb',
      expect.any(Uint8Array),
    );
    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result.toString('utf8')).toBe('Kaydara FBX');
  });

  it('maps converter failures to GlbToFbxConvertError 500', async () => {
    vi.spyOn(glbToFbxConverter, 'run').mockRejectedValue(
      new Error('assimp blew up'),
    );
    await expect(
      convertGlbToFbx('walk.glb', new ArrayBuffer(8)),
    ).rejects.toMatchObject({
      name: 'GlbToFbxConvertError',
      message: 'assimp blew up',
      status: 500,
    });
  });
});
