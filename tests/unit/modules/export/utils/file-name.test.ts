import { describe, expect, it } from 'vitest';

import {
  defaultExportZipFileName,
  defaultZipBaseName,
  resolveExportFileName,
  resolveZipFileName,
  sanitizeBaseName,
  stripExportExtension,
  stripGlbExtension,
  uniqueFileName,
  uniqueTakenName,
} from '@/modules/export/utils/file-name';

describe('stripGlbExtension', () => {
  it('strips .glb / .gltf case-insensitively', () => {
    expect(stripGlbExtension('hero.glb')).toBe('hero');
    expect(stripGlbExtension('Hero.GLTF')).toBe('Hero');
    expect(stripGlbExtension('plain')).toBe('plain');
  });
});

describe('stripExportExtension', () => {
  it('strips .glb / .gltf / .fbx case-insensitively', () => {
    expect(stripExportExtension('hero.glb')).toBe('hero');
    expect(stripExportExtension('Hero.GLTF')).toBe('Hero');
    expect(stripExportExtension('walk.FBX')).toBe('walk');
    expect(stripExportExtension('plain')).toBe('plain');
  });
});

describe('sanitizeBaseName', () => {
  it('replaces forbidden characters and collapses whitespace', () => {
    expect(sanitizeBaseName('  a/b\\c?d%*:|"<>e  ')).toBe('a-b-c-d-------e');
    expect(sanitizeBaseName('hello   world')).toBe('hello world');
  });

  it('returns null for empty or whitespace-only input', () => {
    expect(sanitizeBaseName('')).toBeNull();
    expect(sanitizeBaseName('   ')).toBeNull();
    expect(sanitizeBaseName('???')).toBe('---');
  });
});

describe('uniqueTakenName', () => {
  it('returns the base when free', () => {
    expect(uniqueTakenName('Idle', new Set())).toBe('Idle');
  });

  it('appends -2, -3, … until free', () => {
    const taken = new Set(['Idle', 'Idle-2']);
    expect(uniqueTakenName('Idle', taken)).toBe('Idle-3');
  });

  it('keeps an extension after the suffix', () => {
    const taken = new Set(['a.glb']);
    expect(uniqueTakenName('a', taken, '.glb')).toBe('a-2.glb');
  });
});

describe('uniqueFileName', () => {
  it('returns the original name when free', () => {
    expect(uniqueFileName('a.glb', new Set())).toBe('a.glb');
  });

  it('appends -2, -3, … before the extension when taken', () => {
    const taken = new Set(['a.glb', 'a-2.glb']);
    expect(uniqueFileName('a.glb', taken)).toBe('a-3.glb');
  });

  it('handles names without an extension', () => {
    const taken = new Set(['readme']);
    expect(uniqueFileName('readme', taken)).toBe('readme-2');
  });
});

describe('defaultZipBaseName / defaultExportZipFileName', () => {
  it('returns format-specific defaults', () => {
    expect(defaultZipBaseName('glb')).toBe('glb-export');
    expect(defaultZipBaseName('fbx')).toBe('fbx-export');
    expect(defaultExportZipFileName('glb')).toBe('glb-export.zip');
    expect(defaultExportZipFileName('fbx')).toBe('fbx-export.zip');
  });
});

describe('resolveExportFileName', () => {
  it('appends the requested format extension', () => {
    expect(resolveExportFileName('hero.gltf', 'export.glb', 'glb')).toBe(
      'hero.glb',
    );
    expect(resolveExportFileName('hero.fbx', 'export.glb', 'fbx')).toBe(
      'hero.fbx',
    );
    expect(resolveExportFileName('hero', 'export.glb', 'fbx')).toBe('hero.fbx');
    expect(resolveExportFileName(undefined, 'fallback.glb', 'fbx')).toBe(
      'fallback.fbx',
    );
    expect(resolveExportFileName(undefined, '', 'glb')).toBe('export.glb');
  });

  it('falls back and sanitizes when raw is empty or invalid', () => {
    expect(resolveExportFileName(undefined, 'fallback.glb', 'glb')).toBe(
      'fallback.glb',
    );
    expect(resolveExportFileName('???', 'fallback.glb', 'glb')).toBe('---.glb');
    expect(resolveExportFileName('', '', 'glb')).toBe('export.glb');
    expect(resolveExportFileName('path/to/model.glb', 'x.glb', 'glb')).toBe(
      'path-to-model.glb',
    );
  });
});

describe('resolveZipFileName', () => {
  it('ensures a .zip name from raw or fallback', () => {
    expect(resolveZipFileName('pack', 'glb-export.zip')).toBe('pack.zip');
    expect(resolveZipFileName('pack.ZIP', 'glb-export.zip')).toBe('pack.zip');
    expect(resolveZipFileName(undefined, 'glb-export.zip')).toBe(
      'glb-export.zip',
    );
    expect(resolveZipFileName('   ', '')).toBe('glb-export.zip');
  });

  it('uses format-specific zip default when fallback is empty', () => {
    expect(resolveZipFileName(undefined, '', 'fbx')).toBe('fbx-export.zip');
    expect(resolveZipFileName('   ', '', 'glb')).toBe('glb-export.zip');
  });
});
