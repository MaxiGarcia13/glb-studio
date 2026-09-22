import type {
  MeshStandardMaterial,
} from 'three';
import {
  DataTexture,
  Group,
  RGBAFormat,
  UnsignedByteType,
} from 'three';
import { beforeAll, describe, expect, it } from 'vitest';

import { applyPartColorMap } from '@/modules/create/domain/part-color-map';
import { spawnPart } from '@/modules/create/domain/spawn-part';
import { packModelGlb } from '@/modules/export/domain/model-glb';

/** Minimal valid 1×1 PNG (red). */
const TINY_PNG = Uint8Array.from([
  0x89,
  0x50,
  0x4E,
  0x47,
  0x0D,
  0x0A,
  0x1A,
  0x0A,
  0x00,
  0x00,
  0x00,
  0x0D,
  0x49,
  0x48,
  0x44,
  0x52,
  0x00,
  0x00,
  0x00,
  0x01,
  0x00,
  0x00,
  0x00,
  0x01,
  0x08,
  0x02,
  0x00,
  0x00,
  0x00,
  0x90,
  0x77,
  0x53,
  0xDE,
  0x00,
  0x00,
  0x00,
  0x0C,
  0x49,
  0x44,
  0x41,
  0x54,
  0x08,
  0xD7,
  0x63,
  0xF8,
  0xCF,
  0xC0,
  0x00,
  0x00,
  0x00,
  0x03,
  0x00,
  0x01,
  0x00,
  0x05,
  0xFE,
  0x02,
  0xFE,
  0x00,
  0x00,
  0x00,
  0x00,
  0x49,
  0x45,
  0x4E,
  0x44,
  0xAE,
  0x42,
  0x60,
  0x82,
]);

/** GLTFExporter binary path uses FileReader + canvas; Node / Vitest lack both. */
beforeAll(() => {
  if (typeof globalThis.FileReader === 'undefined') {
    class NodeFileReader {
      result: ArrayBuffer | null = null;
      onloadend: ((event: ProgressEvent<FileReader>) => void) | null = null;

      readAsArrayBuffer(blob: Blob): void {
        void blob.arrayBuffer().then((buffer) => {
          this.result = buffer;
          this.onloadend?.(
            { target: this } as unknown as ProgressEvent<FileReader>,
          );
        });
      }
    }
    globalThis.FileReader = NodeFileReader as unknown as typeof FileReader;
  }

  if (typeof globalThis.ImageData === 'undefined') {
    class NodeImageData {
      data: Uint8ClampedArray;
      width: number;
      height: number;

      constructor(
        data: Uint8ClampedArray,
        width: number,
        height: number,
      ) {
        this.data = data;
        this.width = width;
        this.height = height;
      }
    }
    globalThis.ImageData = NodeImageData as unknown as typeof ImageData;
  }

  if (typeof globalThis.document === 'undefined') {
    class FakeCanvas {
      width = 0;
      height = 0;

      getContext(): CanvasRenderingContext2D {
        return {
          translate: () => undefined,
          scale: () => undefined,
          drawImage: () => undefined,
          putImageData: () => undefined,
        } as unknown as CanvasRenderingContext2D;
      }

      toBlob(callback: (blob: Blob | null) => void): void {
        callback(new Blob([TINY_PNG], { type: 'image/png' }));
      }
    }

    globalThis.document = {
      createElement: (tag: string) => {
        if (tag === 'canvas') {
          return new FakeCanvas() as unknown as HTMLCanvasElement;
        }
        throw new Error(`Unexpected createElement(${tag})`);
      },
    } as unknown as Document;
  }
});

interface GlbJson {
  images?: Array<{ bufferView?: number; mimeType?: string }>;
  textures?: Array<{ source?: number }>;
  materials?: Array<{
    pbrMetallicRoughness?: {
      baseColorTexture?: { index: number };
    };
  }>;
  bufferViews?: Array<{ byteLength: number }>;
}

function parseGlbJson(buffer: ArrayBuffer): GlbJson {
  const view = new DataView(buffer);
  const jsonLength = view.getUint32(12, true);
  const jsonBytes = new Uint8Array(buffer, 20, jsonLength);
  // GLB JSON chunks are padded with spaces to 4-byte alignment.
  const text = new TextDecoder().decode(jsonBytes).replace(/\0+$/g, '').trimEnd();
  return JSON.parse(text) as GlbJson;
}

function solidColorMap(): DataTexture {
  const data = new Uint8Array([
    255,
    0,
    0,
    255,
    0,
    255,
    0,
    255,
    0,
    0,
    255,
    255,
    255,
    255,
    0,
    255,
  ]);
  const texture = new DataTexture(data, 2, 2, RGBAFormat, UnsignedByteType);
  texture.needsUpdate = true;
  texture.name = 'box-map.png';
  texture.flipY = true;
  return texture;
}

describe('created model color map export (US-28)', () => {
  it('embeds the part color map in the packed GLB', async () => {
    const scene = new Group();
    const mesh = spawnPart(scene, 'box');
    const material = mesh.material as MeshStandardMaterial;
    material.color.set(0x4080C0);
    applyPartColorMap(material, solidColorMap());

    const packed = await packModelGlb(
      {
        id: 'created-1',
        fileName: 'Textured box.glb',
        scene,
        source: 'created',
      },
      [],
    );

    const json = parseGlbJson(packed.arrayBuffer);

    expect(json.images?.length).toBeGreaterThanOrEqual(1);
    expect(json.textures?.length).toBeGreaterThanOrEqual(1);

    const textured = json.materials?.some(
      (entry) => entry.pbrMetallicRoughness?.baseColorTexture !== undefined,
    );
    expect(textured).toBe(true);

    const image = json.images?.[0];
    expect(image?.mimeType).toMatch(/^image\//);
    expect(typeof image?.bufferView).toBe('number');
    const view = json.bufferViews?.[image!.bufferView!];
    expect(view?.byteLength).toBeGreaterThan(0);
  });
});
