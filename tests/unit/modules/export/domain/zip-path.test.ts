import { describe, expect, it } from 'vitest';

import {
  joinZipPath,
  uniquePathSegment,
} from '@/modules/export/domain/zip-download/zip-path';

describe('joinZipPath', () => {
  it('joins sanitized segments with /', () => {
    expect(joinZipPath('Hero', 'animations', 'Walk.glb')).toBe(
      'Hero/animations/Walk.glb',
    );
  });

  it('strips empty segments and sanitizes path chars', () => {
    expect(joinZipPath('A/B', '', 'skins', 'Red.png')).toBe('A-B/skins/Red.png');
  });

  it('falls back when every segment is empty', () => {
    expect(joinZipPath('', '   ')).toBe('file');
  });
});

describe('uniquePathSegment', () => {
  it('returns the base when free and records it', () => {
    const taken = new Set<string>();
    expect(uniquePathSegment('Hero', taken)).toBe('Hero');
    expect(taken.has('Hero')).toBe(true);
  });

  it('adds numeric suffixes on collision', () => {
    const taken = new Set(['Hero']);
    expect(uniquePathSegment('Hero', taken)).toBe('Hero-2');
    expect(uniquePathSegment('Hero', taken)).toBe('Hero-3');
  });
});
