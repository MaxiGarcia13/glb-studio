/**
 * Maintainer script — generate public/kits/block-robot.glb from the mesh kit recipe.
 * Run: npm run kits:block-robot
 */
import { Buffer } from 'node:buffer';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { Bone, SkinnedMesh } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { buildRigidSkinnedSceneFromKit } from '@/modules/create/domain/build-rigid-skinned-kit-scene';
import { BLOCK_ROBOT_MESH_RECIPE } from '@/modules/create/domain/kits/block-robot';
import { exportGlbBinary } from '@/modules/export/adapters/gltf-exporter';

/** GLTFExporter binary path uses FileReader; Node does not provide it. */
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

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'public', 'kits');
const OUT_FILE = path.join(OUT_DIR, 'block-robot.glb');

async function main(): Promise<void> {
  const scene = buildRigidSkinnedSceneFromKit(BLOCK_ROBOT_MESH_RECIPE);
  scene.name = 'Block robot';
  const buffer = await exportGlbBinary(scene, []);

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(OUT_FILE, Buffer.from(buffer));

  const report = await inspectGlb(buffer);
  console.log(`Wrote ${OUT_FILE} (${buffer.byteLength} bytes)`);
  console.log(`Bones (${report.bones.length}): ${report.bones.join(', ')}`);
  console.log(`Skinned meshes: ${report.skinnedMeshes}`);
  console.log(`Animations: ${report.animations}`);
  if (report.animations !== 0) {
    throw new Error('Expected no embedded animations');
  }
  if (report.bones.length !== 17) {
    throw new Error(`Expected 17 bones, got ${report.bones.length}`);
  }
  if (report.skinnedMeshes < 1) {
    throw new Error('Expected at least one SkinnedMesh');
  }
}

function inspectGlb(buffer: ArrayBuffer): Promise<{
  bones: string[];
  skinnedMeshes: number;
  animations: number;
}> {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.parse(
      buffer,
      '',
      (gltf) => {
        const bones: string[] = [];
        let skinnedMeshes = 0;
        gltf.scene.traverse((object) => {
          if (object instanceof Bone) {
            bones.push(object.name);
          }
          if (object instanceof SkinnedMesh) {
            skinnedMeshes += 1;
          }
        });
        resolve({
          bones,
          skinnedMeshes,
          animations: gltf.animations.length,
        });
      },
      reject,
    );
  });
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
