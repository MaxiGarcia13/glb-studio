import type { ModelEntry } from '@/modules/viewport/types/model';

import {
  Bone,
  BoxGeometry,
  DataTexture,
  Group,
  MeshStandardMaterial,
  RGBAFormat,
  Skeleton,
  SkinnedMesh,
  UnsignedByteType,
} from 'three';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { seedSessionSkinsFromModel } from '@/modules/create/actions/seed-session-skins';
import { restoreSessionSkinsFromScene } from '@/modules/create/domain/restore-session-skins-from-scene';
import {
  SESSION_SKIN_NODE_KEY,
  SESSION_SKINS_MANIFEST_KEY,
} from '@/modules/create/domain/session-skins-manifest';
import {
  appendSessionSkin,
  getSessionSkinWardrobe,
  resetSessionSkinsStoreForTests,
  setActiveSessionSkinId,
} from '@/modules/create/stores/session-skins-store';
import { attachSessionSkinsForExport } from '@/modules/export/domain/attach-session-skins-for-export';
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
  images?: unknown[];
  extras?: Record<string, unknown>;
  nodes?: Array<{ extras?: Record<string, unknown>; name?: string }>;
  scenes?: Array<{ extras?: Record<string, unknown> }>;
}

function parseGlbJson(buffer: ArrayBuffer): GlbJson {
  const view = new DataView(buffer);
  const jsonLength = view.getUint32(12, true);
  const jsonBytes = new Uint8Array(buffer, 20, jsonLength);
  const text = new TextDecoder().decode(jsonBytes).replace(/\0+$/g, '').trimEnd();
  return JSON.parse(text) as GlbJson;
}

function solidTexture(name: string, rgba: [number, number, number, number]): DataTexture {
  const data = new Uint8Array(rgba);
  const texture = new DataTexture(data, 1, 1, RGBAFormat, UnsignedByteType);
  texture.needsUpdate = true;
  texture.name = name;
  texture.flipY = false;
  return texture;
}

function makeSkinnedModel(map: DataTexture | null): ModelEntry {
  const material = new MeshStandardMaterial();
  if (map) {
    material.map = map;
  }
  const bone = new Bone();
  const mesh = new SkinnedMesh(new BoxGeometry(1, 1, 1), material);
  mesh.add(bone);
  mesh.bind(new Skeleton([bone]));
  const scene = new Group();
  scene.name = 'Hero';
  scene.add(mesh);
  return {
    id: 'model-1',
    fileName: 'hero.glb',
    scene,
    source: 'imported',
  };
}

afterEach(() => {
  resetSessionSkinsStoreForTests();
});

describe('flat export embeds all session skins', () => {
  let red: DataTexture;
  let blue: DataTexture;

  beforeEach(() => {
    red = solidTexture('red.png', [255, 0, 0, 255]);
    blue = solidTexture('blue.png', [0, 0, 255, 255]);
  });

  it('attach helpers restore the full wardrobe and clean up', () => {
    const model = makeSkinnedModel(red);
    appendSessionSkin(model.id, { texture: red, label: 'Red', id: 'skin-red' });
    appendSessionSkin(model.id, { texture: blue, label: 'Blue', id: 'skin-blue' });
    setActiveSessionSkinId(model.id, 'skin-red');

    const wardrobe = getSessionSkinWardrobe(model.id);
    const detach = attachSessionSkinsForExport(model.scene, wardrobe);
    let helperCount = 0;
    model.scene.traverse((object) => {
      if (object.userData[SESSION_SKIN_NODE_KEY]) {
        helperCount++;
      }
    });
    expect(helperCount).toBe(2);
    expect(model.scene.userData[SESSION_SKINS_MANIFEST_KEY]).toMatchObject({
      activeSkinId: 'skin-red',
      skins: [
        { id: 'skin-red', label: 'Red' },
        { id: 'skin-blue', label: 'Blue' },
      ],
    });

    // Simulate a fresh session after import: clear store, keep stamped scene.
    resetSessionSkinsStoreForTests();
    expect(restoreSessionSkinsFromScene(model)).toBe(true);
    const restored = getSessionSkinWardrobe(model.id);
    expect(restored.skins.map((entry) => entry.label)).toEqual(['Red', 'Blue']);
    expect(restored.activeSkinId).toBe('skin-red');
    expect(model.scene.userData[SESSION_SKINS_MANIFEST_KEY]).toBeUndefined();

    helperCount = 0;
    model.scene.traverse((object) => {
      if (object.userData[SESSION_SKIN_NODE_KEY]) {
        helperCount++;
      }
    });
    expect(helperCount).toBe(0);

    // detach is a no-op after restore already stripped helpers; call for API completeness
    detach();
  });

  it('packModelGlb embeds multiple images and leaves the live scene clean', async () => {
    const model = makeSkinnedModel(red);
    appendSessionSkin(model.id, { texture: red, label: 'Red', id: 'skin-red' });
    appendSessionSkin(model.id, { texture: blue, label: 'Blue', id: 'skin-blue' });

    const packed = await packModelGlb(model, [], {
      sessionWardrobe: getSessionSkinWardrobe(model.id),
    });
    const json = parseGlbJson(packed.arrayBuffer);

    expect(json.images?.length).toBeGreaterThanOrEqual(2);

    const hasManifest
      = json.scenes?.some((scene) => scene.extras?.[SESSION_SKINS_MANIFEST_KEY])
        || json.nodes?.some((node) => node.extras?.[SESSION_SKINS_MANIFEST_KEY])
        || json.extras?.[SESSION_SKINS_MANIFEST_KEY];
    expect(hasManifest).toBeTruthy();

    let helperCount = 0;
    model.scene.traverse((object) => {
      if (object.userData[SESSION_SKIN_NODE_KEY]) {
        helperCount++;
      }
    });
    expect(helperCount).toBe(0);
    expect(model.scene.userData[SESSION_SKINS_MANIFEST_KEY]).toBeUndefined();
  });

  it('skips wardrobe embed when embedSessionSkins is false', async () => {
    const model = makeSkinnedModel(red);
    appendSessionSkin(model.id, { texture: red, label: 'Red', id: 'skin-red' });
    appendSessionSkin(model.id, { texture: blue, label: 'Blue', id: 'skin-blue' });

    const packed = await packModelGlb(model, [], {
      includeClips: false,
      embedSessionSkins: false,
    });
    const json = parseGlbJson(packed.arrayBuffer);

    // Only the live active map (one image), no session-skins extras.
    expect(json.images?.length).toBe(1);
    const hasManifest
      = json.scenes?.some((scene) => scene.extras?.[SESSION_SKINS_MANIFEST_KEY])
        || json.nodes?.some((node) => node.extras?.[SESSION_SKINS_MANIFEST_KEY])
        || json.extras?.[SESSION_SKINS_MANIFEST_KEY];
    expect(hasManifest).toBeFalsy();
  });

  it('seedSessionSkinsFromModel prefers embedded wardrobe over single-map seed', () => {
    const model = makeSkinnedModel(red);
    appendSessionSkin(model.id, { texture: red, label: 'Red', id: 'skin-red' });
    appendSessionSkin(model.id, { texture: blue, label: 'Blue', id: 'skin-blue' });
    attachSessionSkinsForExport(model.scene, getSessionSkinWardrobe(model.id));
    // Leave helpers attached as if just loaded from GLB.
    resetSessionSkinsStoreForTests();

    expect(seedSessionSkinsFromModel(model)).toBe(true);
    expect(getSessionSkinWardrobe(model.id).skins).toHaveLength(2);
  });
});
