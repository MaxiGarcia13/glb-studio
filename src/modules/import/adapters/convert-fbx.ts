import { Buffer } from 'node:buffer';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const require = createRequire(import.meta.url);

const MAX_BODY_BYTES = 4.5 * 1024 * 1024; // 4.5 MB

export type FbxConverter = (
  srcFile: string,
  destFile: string,
  args?: string[],
) => Promise<string>;

/** Default `fbx2gltf` binding; tests may replace `run`. */
export const fbxConverter: { run: FbxConverter } = {
  run: require('fbx2gltf'),
};

function isFbxName(name: string): boolean {
  return /\.fbx$/i.test(name);
}

export class FbxConvertError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'FbxConvertError';
  }
}

export async function convertFbxToGlb(
  fileName: string,
  data: ArrayBuffer,
): Promise<Buffer> {
  if (!isFbxName(fileName)) {
    throw new FbxConvertError('Only .fbx files are accepted', 400);
  }
  if (data.byteLength > MAX_BODY_BYTES) {
    throw new FbxConvertError('File exceeds 4.5 MB limit', 413);
  }

  const tmpDir = await mkdtemp(join(tmpdir(), 'fbx-'));
  const srcPath = join(tmpDir, 'input.fbx');
  const destPath = join(tmpDir, 'output.glb');

  try {
    await writeFile(srcPath, Buffer.from(data));
    await fbxConverter.run(srcPath, destPath);
    return readFile(destPath);
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
}
