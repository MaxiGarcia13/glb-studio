import { Bone, Group } from 'three';
import { describe, expect, it } from 'vitest';

import {
  BIND_LENGTH_EPSILON,
  computePositionScaleRatio,
} from '@/modules/animation/domain/bind-length-ratio';

function bone(name: string, length: number): Bone {
  const next = new Bone();
  next.name = name;
  next.position.set(0, length, 0);
  return next;
}

function sceneWithBones(...bones: Bone[]): Group {
  const scene = new Group();
  for (const next of bones) {
    scene.add(next);
  }
  return scene;
}

describe('computePositionScaleRatio', () => {
  it('returns the median target/source ratio over usable mapped pairs', () => {
    const scene = sceneWithBones(
      bone('Hips', 2),
      bone('Spine', 4),
      bone('Head', 6),
    );
    const mapping = new Map([
      ['srcHips', 'Hips'],
      ['srcSpine', 'Spine'],
      ['srcHead', 'Head'],
    ]);
    const sourceBindLengths = {
      srcHips: 1,
      srcSpine: 2,
      srcHead: 3,
    };

    // ratios: 2/1=2, 4/2=2, 6/3=2 → median 2
    expect(computePositionScaleRatio(mapping, sourceBindLengths, scene)).toBe(2);
  });

  it('averages the two middle samples when the count is even', () => {
    const scene = sceneWithBones(bone('A', 2), bone('B', 6));
    const mapping = new Map([
      ['sa', 'A'],
      ['sb', 'B'],
    ]);
    // ratios: 2/1=2, 6/2=3 → median (2+3)/2 = 2.5
    expect(
      computePositionScaleRatio(mapping, { sa: 1, sb: 2 }, scene),
    ).toBe(2.5);
  });

  it('skips missing lengths and near-zero degenerate bones', () => {
    const scene = sceneWithBones(
      bone('Ok', 2),
      bone('Tiny', BIND_LENGTH_EPSILON / 10),
    );
    const mapping = new Map([
      ['missingSource', 'Ok'],
      ['srcTiny', 'Tiny'],
      ['srcOk', 'Ok'],
      ['srcMissingTarget', 'Gone'],
    ]);

    expect(
      computePositionScaleRatio(
        mapping,
        {
          srcTiny: 1,
          srcOk: 1,
          srcMissingTarget: 1,
        },
        scene,
      ),
    ).toBe(2);
  });

  it('returns null when no usable pair remains', () => {
    const scene = sceneWithBones(bone('Hips', 0));
    expect(
      computePositionScaleRatio(
        new Map([['srcHips', 'Hips']]),
        { srcHips: 1 },
        scene,
      ),
    ).toBeNull();
    expect(
      computePositionScaleRatio(new Map(), { srcHips: 1 }, scene),
    ).toBeNull();
  });
});
