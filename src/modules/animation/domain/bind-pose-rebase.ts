import type { AnimationClip, KeyframeTrack } from 'three';
import type { ClipEntry } from '@/modules/animation/types/clip';
import type { PreEditTransform } from '@/modules/viewport/stores/pose-edit-store';
import { Quaternion } from 'three';
import { splitTrackName } from '@/modules/animation/domain/clip-validate';

/** Local TRS delta: apply as p' = p + position, q' = deltaQ * q, s' = s * scale. */
export interface BindPoseDelta {
  position: [number, number, number];
  quaternion: [number, number, number, number];
  scale: [number, number, number];
}

const _deltaQ = new Quaternion();
const _sampleQ = new Quaternion();

function safeScaleRatio(next: number, prev: number): number {
  if (Math.abs(prev) < 1e-8) {
    return next;
  }
  return next / prev;
}

/** Delta that maps `from` local TRS onto `to` (pre-edit snapshot → current object). */
export function computeBindPoseDelta(
  from: PreEditTransform,
  to: {
    position: { x: number; y: number; z: number };
    quaternion: { x: number; y: number; z: number; w: number };
    scale: { x: number; y: number; z: number };
  },
): BindPoseDelta {
  const fromQ = new Quaternion(
    from.quaternion.x,
    from.quaternion.y,
    from.quaternion.z,
    from.quaternion.w,
  );
  const toQ = new Quaternion(to.quaternion.x, to.quaternion.y, to.quaternion.z, to.quaternion.w);
  const deltaQ = toQ.clone().multiply(fromQ.clone().invert());

  return {
    position: [
      to.position.x - from.position.x,
      to.position.y - from.position.y,
      to.position.z - from.position.z,
    ],
    quaternion: [deltaQ.x, deltaQ.y, deltaQ.z, deltaQ.w],
    scale: [
      safeScaleRatio(to.scale.x, from.scale.x),
      safeScaleRatio(to.scale.y, from.scale.y),
      safeScaleRatio(to.scale.z, from.scale.z),
    ],
  };
}

/** Compose `second` after `first` (apply first, then second). */
export function composeBindPoseDeltas(first: BindPoseDelta, second: BindPoseDelta): BindPoseDelta {
  const a = new Quaternion(
    first.quaternion[0],
    first.quaternion[1],
    first.quaternion[2],
    first.quaternion[3],
  );
  const b = new Quaternion(
    second.quaternion[0],
    second.quaternion[1],
    second.quaternion[2],
    second.quaternion[3],
  );
  const composed = b.multiply(a);

  return {
    position: [
      first.position[0] + second.position[0],
      first.position[1] + second.position[1],
      first.position[2] + second.position[2],
    ],
    quaternion: [composed.x, composed.y, composed.z, composed.w],
    scale: [
      first.scale[0] * second.scale[0],
      first.scale[1] * second.scale[1],
      first.scale[2] * second.scale[2],
    ],
  };
}

function isIdentityDelta(delta: BindPoseDelta): boolean {
  const [px, py, pz] = delta.position;
  const [qx, qy, qz, qw] = delta.quaternion;
  const [sx, sy, sz] = delta.scale;
  return (
    Math.abs(px) < 1e-8
    && Math.abs(py) < 1e-8
    && Math.abs(pz) < 1e-8
    && Math.abs(qx) < 1e-8
    && Math.abs(qy) < 1e-8
    && Math.abs(qz) < 1e-8
    && Math.abs(qw - 1) < 1e-8
    && Math.abs(sx - 1) < 1e-8
    && Math.abs(sy - 1) < 1e-8
    && Math.abs(sz - 1) < 1e-8
  );
}

function applyDeltaToPositionTrack(track: KeyframeTrack, delta: BindPoseDelta): void {
  const values = track.values;
  for (let i = 0; i < values.length; i += 3) {
    values[i] += delta.position[0];
    values[i + 1] += delta.position[1];
    values[i + 2] += delta.position[2];
  }
}

function applyDeltaToQuaternionTrack(track: KeyframeTrack, delta: BindPoseDelta): void {
  _deltaQ.set(delta.quaternion[0], delta.quaternion[1], delta.quaternion[2], delta.quaternion[3]);
  const values = track.values;
  for (let i = 0; i < values.length; i += 4) {
    _sampleQ.set(values[i], values[i + 1], values[i + 2], values[i + 3]);
    _sampleQ.premultiply(_deltaQ);
    values[i] = _sampleQ.x;
    values[i + 1] = _sampleQ.y;
    values[i + 2] = _sampleQ.z;
    values[i + 3] = _sampleQ.w;
  }
}

function applyDeltaToScaleTrack(track: KeyframeTrack, delta: BindPoseDelta): void {
  const values = track.values;
  for (let i = 0; i < values.length; i += 3) {
    values[i] *= delta.scale[0];
    values[i + 1] *= delta.scale[1];
    values[i + 2] *= delta.scale[2];
  }
}

function applyDeltaToNodeTracks(
  clip: AnimationClip,
  nodeName: string,
  delta: BindPoseDelta,
): void {
  for (const track of clip.tracks) {
    const { nodeName: trackNode, suffix } = splitTrackName(track.name);
    if (trackNode !== nodeName || !suffix) {
      continue;
    }
    if (suffix === '.position') {
      applyDeltaToPositionTrack(track, delta);
    } else if (suffix === '.quaternion') {
      applyDeltaToQuaternionTrack(track, delta);
    } else if (suffix === '.scale') {
      applyDeltaToScaleTrack(track, delta);
    }
  }
}

/** Mutate `clip` tracks for `nodeName` by `delta`. No-op when delta is identity. */
export function rebaseClipNode(
  clip: AnimationClip,
  nodeName: string,
  delta: BindPoseDelta,
): AnimationClip {
  if (isIdentityDelta(delta)) {
    return clip;
  }
  applyDeltaToNodeTracks(clip, nodeName, delta);
  return clip;
}

/** Apply every node delta in `overrides` to `clip` (mutates tracks in place). */
export function rebaseClipWithOverrides(
  clip: AnimationClip,
  overrides: Readonly<Record<string, BindPoseDelta>>,
): AnimationClip {
  for (const [nodeName, delta] of Object.entries(overrides)) {
    rebaseClipNode(clip, nodeName, delta);
  }
  return clip;
}

/**
 * Clone library entries and rebase `nodeName` tracks by `delta` on each clip
 * (and sourceClip when distinct). Pure — no store writes.
 */
export function rebaseClipEntriesForNode(
  entries: readonly ClipEntry[],
  nodeName: string,
  delta: BindPoseDelta,
): ClipEntry[] {
  return entries.map((entry) => {
    if (!entry.clip) {
      return entry;
    }
    const clip = entry.clip.clone();
    rebaseClipNode(clip, nodeName, delta);
    const sourceClip
      = entry.sourceClip && entry.sourceClip !== entry.clip
        ? rebaseClipNode(entry.sourceClip.clone(), nodeName, delta)
        : clip;
    return { ...entry, clip, sourceClip };
  });
}
