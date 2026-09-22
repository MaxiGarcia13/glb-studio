import { describe, expect, it } from 'vitest';
import {
  TEXTURE_PREP_SOFT_EDGE_PX,
  texturePrepSoftWarnings,
} from '@/modules/create/domain/texture-prep-guidance';

describe('texturePrepSoftWarnings', () => {
  it('returns no warnings for a modest square image', () => {
    expect(texturePrepSoftWarnings(512, 512)).toEqual([]);
  });

  it('warns when aspect is far from square', () => {
    expect(texturePrepSoftWarnings(1600, 400)).toEqual([
      'Image is not square-ish; crop or pick a closer aspect for a better fit.',
    ]);
  });

  it('warns when long edge exceeds soft cap but is under hard max', () => {
    const edge = TEXTURE_PREP_SOFT_EDGE_PX + 1;
    expect(texturePrepSoftWarnings(edge, edge)).toEqual([
      `Image is large (${edge}px on the long edge). Aim for ≤ ${TEXTURE_PREP_SOFT_EDGE_PX}px when you can.`,
    ]);
  });

  it('can emit both aspect and size warnings', () => {
    const warnings = texturePrepSoftWarnings(4096, 1024);
    expect(warnings).toHaveLength(2);
    expect(warnings[0]).toMatch(/square-ish/);
    expect(warnings[1]).toMatch(/large \(4096px/);
  });
});
