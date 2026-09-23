import {
  Bone,
  BoxGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { beforeAll, describe, expect, it } from 'vitest';

import { writeCreateJoint } from '@/modules/create/domain/hierarchy/group-data';
import { writeCreatePart } from '@/modules/create/domain/part-data';
import { convertCreatedSceneToSkinned } from '@/modules/create/domain/skinning/convert-created-scene-to-skinned';
import { packModelGlb } from '@/modules/export/domain/model-glb';
import { isUsableSkinnedModelScene } from '@/modules/import/domain/model-scene-kind';

/** GLTFExporter binary path uses FileReader; Node / Vitest do not provide it. */
beforeAll(() => {
  if (typeof globalThis.FileReader !== 'undefined') {
    return;
  }
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
});

function createPart(name: string): Mesh {
  const mesh = new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial());
  mesh.name = name;
  writeCreatePart(mesh, {
    kind: 'box',
    params: { width: 1, height: 1, depth: 1 },
  });
  return mesh;
}

function createGroup(name: string): Group {
  const group = new Group();
  group.name = name;
  writeCreateJoint(group);
  return group;
}

function skinnableScene(): Group {
  const scene = new Group();
  scene.name = 'Hero';
  const hips = createGroup('Hips');
  const spine = createGroup('Spine');
  hips.position.set(0, 1, 0);
  spine.position.set(0, 0.5, 0);
  scene.add(hips);
  hips.add(createPart('torso'), spine);
  spine.add(createPart('chest'));
  return scene;
}

function parseGlb(buffer: ArrayBuffer) {
  const loader = new GLTFLoader();
  return new Promise<Awaited<ReturnType<typeof loader.parseAsync>>>((resolve, reject) => {
    loader.parse(buffer, '', resolve, reject);
  });
}

describe('skinned model GLB round-trip (US-34)', () => {
  it('exports a user-skinned scene that re-imports as a usable skinned model', async () => {
    const skinned = convertCreatedSceneToSkinned(skinnableScene());
    const packed = await packModelGlb(
      {
        id: 'm1',
        fileName: 'hero.glb',
        scene: skinned,
        source: 'imported',
      },
      [],
    );

    expect(packed.fileName).toBe('hero.glb');

    const gltf = await parseGlb(packed.arrayBuffer);

    expect(isUsableSkinnedModelScene(gltf.scene)).toBe(true);

    const bones: string[] = [];
    gltf.scene.traverse((object) => {
      if (object instanceof Bone) {
        bones.push(object.name);
      }
    });
    expect(bones).toEqual(expect.arrayContaining(['Hips', 'Spine']));
  });
});
