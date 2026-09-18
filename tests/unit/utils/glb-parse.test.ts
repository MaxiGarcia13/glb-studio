import { describe, expect, it } from 'vitest';

import { preserveGltfExtension } from '@/utils/glb-parse';

describe('preserveGltfExtension', () => {
  it('appends the previous gltf extension when next has none', () => {
    expect(preserveGltfExtension('hero', 'old.glb')).toBe('hero.glb');
    expect(preserveGltfExtension('hero', 'old.GLTF')).toBe('hero.GLTF');
  });

  it('keeps next when it already has a gltf extension', () => {
    expect(preserveGltfExtension('hero.gltf', 'old.glb')).toBe('hero.gltf');
    expect(preserveGltfExtension('hero.GLB', 'old.gltf')).toBe('hero.GLB');
  });

  it('keeps next when it has any other suffix', () => {
    expect(preserveGltfExtension('hero.zip', 'old.glb')).toBe('hero.zip');
    expect(preserveGltfExtension('hero.bak', 'old.gltf')).toBe('hero.bak');
  });

  it('returns next unchanged when previous has no gltf extension', () => {
    expect(preserveGltfExtension('hero', 'old')).toBe('hero');
    expect(preserveGltfExtension('hero', 'old.zip')).toBe('hero');
  });
});
