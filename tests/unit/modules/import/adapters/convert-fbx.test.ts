import { Buffer } from 'node:buffer';
import { writeFile } from 'node:fs/promises';
import { describe, expect, it, vi } from 'vitest';

import {
  convertFbxToGlb,
  FbxConvertError,
} from '@/modules/import/adapters/convert-fbx';

describe('convertFbxToGlb', () => {
  it('rejects non-.fbx names with 400 without calling the converter', async () => {
    const convert = vi.fn();
    await expect(
      convertFbxToGlb('model.glb', new ArrayBuffer(8), convert),
    ).rejects.toMatchObject({
      name: 'FbxConvertError',
      message: 'Only .fbx files are accepted',
      status: 400,
    });
    expect(convert).not.toHaveBeenCalled();
  });

  it('rejects bodies over 4.5 MB with 413 without calling the converter', async () => {
    const convert = vi.fn();
    const oversized = new ArrayBuffer(Math.floor(4.5 * 1024 * 1024) + 1);
    await expect(
      convertFbxToGlb('big.fbx', oversized, convert),
    ).rejects.toBeInstanceOf(FbxConvertError);
    await expect(
      convertFbxToGlb('big.FBX', oversized, convert),
    ).rejects.toMatchObject({
      status: 413,
      message: 'File exceeds 4.5 MB limit',
    });
    expect(convert).not.toHaveBeenCalled();
  });

  it('writes through the mocked converter for a valid small .fbx', async () => {
    const convert = vi.fn(async (_src: string, dest: string) => {
      await writeFile(dest, Buffer.from('glTF'));
      return dest;
    });
    const data = new Uint8Array([1, 2, 3]).buffer;
    const result = await convertFbxToGlb('walk.fbx', data, convert);
    expect(convert).toHaveBeenCalledOnce();
    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result.toString('utf8')).toBe('glTF');
  });
});
