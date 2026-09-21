import type { SuggestedJointName } from '../constants/suggested-joint-names';
import {
  SUGGESTED_JOINT_NAMES,

} from '../constants/suggested-joint-names';

type LimbSide = 'Left' | 'Right';

interface BodyPartMatch {
  /** Mixamo-style suffix without side (e.g. Foot, UpLeg). */
  stem: string;
  /** Higher = more specific (toe beats foot). */
  specificity: number;
  /** Needs Left/Right prefix. */
  sided: boolean;
}

const BODY_PART_PATTERNS: ReadonlyArray<{
  pattern: RegExp;
  match: BodyPartMatch;
}> = [
  { pattern: /toe/, match: { stem: 'ToeBase', specificity: 50, sided: true } },
  { pattern: /ankle/, match: { stem: 'Foot', specificity: 45, sided: true } },
  { pattern: /foot|paw/, match: { stem: 'Foot', specificity: 40, sided: true } },
  { pattern: /knee/, match: { stem: 'Leg', specificity: 45, sided: true } },
  { pattern: /shin|calf|lowerleg/, match: { stem: 'Leg', specificity: 35, sided: true } },
  { pattern: /thigh|upleg|upperleg/, match: { stem: 'UpLeg', specificity: 40, sided: true } },
  // Limb hip socket (hip_right) — not the pelvis root (hips / pelvis).
  { pattern: /(?:^|_)hip(?:_|$)/, match: { stem: 'UpLeg', specificity: 42, sided: true } },
  { pattern: /(?:^|[^a-z])leg(?:[^a-z]|$)/, match: { stem: 'Leg', specificity: 30, sided: true } },
  { pattern: /wrist|hand/, match: { stem: 'Hand', specificity: 40, sided: true } },
  { pattern: /forearm|lowerarm/, match: { stem: 'ForeArm', specificity: 35, sided: true } },
  { pattern: /elbow/, match: { stem: 'ForeArm', specificity: 45, sided: true } },
  { pattern: /shoulder/, match: { stem: 'Shoulder', specificity: 35, sided: true } },
  { pattern: /(?:^|[^a-z])arm(?:[^a-z]|$)/, match: { stem: 'Arm', specificity: 30, sided: true } },
  { pattern: /upperchest/, match: { stem: 'UpperChest', specificity: 40, sided: false } },
  { pattern: /chest/, match: { stem: 'Chest', specificity: 30, sided: false } },
  { pattern: /spine/, match: { stem: 'Spine', specificity: 30, sided: false } },
  { pattern: /neck/, match: { stem: 'Neck', specificity: 30, sided: false } },
  { pattern: /head/, match: { stem: 'Head', specificity: 30, sided: false } },
  { pattern: /hips|pelvis/, match: { stem: 'Hips', specificity: 40, sided: false } },
];

/** Collapse separators and casing for keyword matching. */
export function normalizePartNameToken(name: string): string {
  return name
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function detectSide(token: string): LimbSide | null {
  if (
    /(?:^|_)(?:left|lft|l)(?:_|$)/.test(token)
    || token.startsWith('left')
    || token.endsWith('_l')
    || token.endsWith('left')
  ) {
    return 'Left';
  }
  if (
    /(?:^|_)(?:right|rgt|r)(?:_|$)/.test(token)
    || token.startsWith('right')
    || token.endsWith('_r')
    || token.endsWith('right')
  ) {
    return 'Right';
  }
  return null;
}

function detectBodyPart(token: string): BodyPartMatch | null {
  let best: BodyPartMatch | null = null;
  for (const { pattern, match } of BODY_PART_PATTERNS) {
    if (!pattern.test(token)) {
      continue;
    }
    if (!best || match.specificity > best.specificity) {
      best = match;
    }
  }
  return best;
}

function asSuggested(name: string): SuggestedJointName | null {
  return (SUGGESTED_JOINT_NAMES as readonly string[]).includes(name)
    ? (name as SuggestedJointName)
    : null;
}

/**
 * Pick a Mixamo-style joint suggestion from selected part display names.
 * Returns null when nothing confident matches (modal should not default to Hips).
 *
 * Examples: `ankle_right` + `foot` → `RightFoot`; `left_hand` → `LeftHand`.
 */
export function suggestJointNameFromPartNames(
  names: readonly string[],
): SuggestedJointName | null {
  if (names.length === 0) {
    return null;
  }

  const tokens = names.map(normalizePartNameToken).filter(Boolean);
  if (tokens.length === 0) {
    return null;
  }

  let side: LimbSide | null = null;
  let part: BodyPartMatch | null = null;

  for (const token of tokens) {
    const tokenSide = detectSide(token);
    if (tokenSide) {
      side = tokenSide;
    }
    const tokenPart = detectBodyPart(token);
    if (tokenPart && (!part || tokenPart.specificity > part.specificity)) {
      part = tokenPart;
    }
  }

  // Exact / near-exact match only when we lack a keyword body part, or a
  // single name is already a suggested joint (don't let "right_foot" beat "toe").
  if (!part || tokens.length === 1) {
    for (const token of tokens) {
      const compact = token.replace(/_/g, '');
      for (const suggested of SUGGESTED_JOINT_NAMES) {
        if (suggested.toLowerCase() === compact) {
          return suggested;
        }
      }
    }
  }

  if (!part) {
    return null;
  }

  if (!part.sided) {
    return asSuggested(part.stem);
  }

  // Limb without a clear side: do not invent Left/Right (or Hips).
  if (!side) {
    return null;
  }

  return asSuggested(`${side}${part.stem}`);
}
