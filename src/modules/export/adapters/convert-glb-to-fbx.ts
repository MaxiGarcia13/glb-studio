import { Buffer } from 'node:buffer';
import { AssimpError, createAssimp } from 'libassimp';
import { hasModelExtension } from '@/utils/with-model-extension';

const MAX_BODY_BYTES = 4.5 * 1024 * 1024; // 4.5 MB

export type GlbToFbxConverter = (
  fileName: string,
  bytes: Uint8Array,
) => Promise<Uint8Array>;

let wasmAssimp: Awaited<ReturnType<typeof createAssimp>> | null = null;

async function getWasmAssimp(): Promise<
  NonNullable<typeof wasmAssimp>
> {
  if (!wasmAssimp) {
    wasmAssimp = await createAssimp({ backend: 'wasm' });
  }
  return wasmAssimp;
}

/** Default `libassimp` WASM binding; tests may replace `run`. */
export const glbToFbxConverter: { run: GlbToFbxConverter } = {
  async run(fileName, bytes) {
    const assimp = await getWasmAssimp();
    const { files } = await assimp.convert(
      { name: fileName, bytes },
      { to: 'fbx' },
    );
    const out = files[0];
    if (!out?.bytes?.byteLength) {
      throw new GlbToFbxConvertError('Conversion produced no output', 500);
    }
    return out.bytes;
  },
};

export class GlbToFbxConvertError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'GlbToFbxConvertError';
  }
}

export async function convertGlbToFbx(
  fileName: string,
  data: ArrayBuffer,
): Promise<Buffer> {
  if (!hasModelExtension(fileName, 'glb')) {
    throw new GlbToFbxConvertError('Only .glb files are accepted', 400);
  }
  if (data.byteLength > MAX_BODY_BYTES) {
    throw new GlbToFbxConvertError('File exceeds 4.5 MB limit', 413);
  }

  const bytes = new Uint8Array(data);
  try {
    const fbxBytes = await glbToFbxConverter.run(fileName, bytes);
    return Buffer.from(fbxBytes);
  } catch (err) {
    if (err instanceof GlbToFbxConvertError) {
      throw err;
    }
    const message
      = err instanceof AssimpError || err instanceof Error
        ? err.message
        : 'Conversion failed';
    throw new GlbToFbxConvertError(message, 500);
  }
}
