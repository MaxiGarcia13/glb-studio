import type { Kit, PartRecipe } from '@/modules/create/types/kit';

const IDENTITY = [0, 0, 0] as const;

/** Palette matched to the reference modern house. */
const WALL = '#f7f7f5';
const FOUNDATION = '#7a7e84';
const ROOF = '#3a3f46';
const FRAME = '#1e2228';
const GLASS = '#f0c44a';
const DOOR = '#9a9ea4';
const RAIL = '#b8bcc0';
const CHIMNEY = '#f0f0ee';

const FOUNDATION_H = 0.4;
const STOREY = 2.4;
const WALL_H = STOREY * 2;
const WALL_TOP = FOUNDATION_H + WALL_H;

const T = 0.16;
const ROOF_PITCH = (40 * Math.PI) / 180;
const OVERHANG = 0.3;
const ROOF_T = 0.12;

/**
 * Single rectangular body; ridge along X (gables on left/right).
 * Front dormer bay on the right-centre for door + upper balcony (matches reference).
 */
const BODY_W = 7.2;
const BODY_D = 5.4;
const BODY_X = 0;
const BODY_Z = 0;
const bodyHalfW = BODY_W / 2;
const bodyHalfD = BODY_D / 2;

/** Front-facing dormer / cross-gable bay. */
const DORMER_W = 3.4;
const DORMER_D = 1.35;
const DORMER_X = 0.85;
const DORMER_Z = bodyHalfD + DORMER_D / 2;
const dormerHalfW = DORMER_W / 2;
const dormerHalfD = DORMER_D / 2;

const mainRun = bodyHalfD + OVERHANG;
const mainSlopeLen = mainRun / Math.cos(ROOF_PITCH);
const mainRise = mainRun * Math.tan(ROOF_PITCH);

const dormerRun = dormerHalfW + OVERHANG * 0.6;
const dormerSlopeLen = dormerRun / Math.cos(ROOF_PITCH);
const dormerRise = dormerRun * Math.tan(ROOF_PITCH);

function box(
  name: string,
  parent: string,
  position: [number, number, number],
  params: { width: number; height: number; depth: number },
  color: PartRecipe['color'],
  rotation: [number, number, number] = [...IDENTITY],
): PartRecipe {
  return {
    kind: 'box',
    name,
    parent,
    position,
    rotation,
    params,
    color,
  };
}

/**
 * Gable end fill: vertical columns whose heights follow the roof pitch.
 * Height matches the *inner* (taller) edge of each column, plus a small push
 * into the roof slab underside — closes sawtooth gaps without white breaking
 * through the outer roof skin.
 */
function gableColumns(
  namePrefix: string,
  origin: [number, number, number],
  rise: number,
  /** Wall span covered by columns. */
  baseWidth: number,
  /** Roof half-span used for pitch (includes overhang) — drives column heights. */
  roofRun: number,
  facing: 'front' | 'left' | 'right',
  columns = 24,
): PartRecipe[] {
  const half = baseWidth / 2;
  const colW = baseWidth / columns;
  const thick = T * 0.55;
  /** Intersect roof underside (keep under outer skin ≈ ROOF_T). */
  const intoRoof = ROOF_T * 0.65;
  const parts: PartRecipe[] = [];

  const faceInset: [number, number, number]
    = facing === 'front'
      ? [origin[0], origin[1], origin[2] - thick * 0.55]
      : facing === 'left'
        ? [origin[0] + thick * 0.55, origin[1], origin[2]]
        : [origin[0] - thick * 0.55, origin[1], origin[2]];

  for (let i = 0; i < columns; i += 1) {
    const along = -half + colW * (i + 0.5);
    // Inner edge is closer to the ridge → taller roof; size to that + intoRoof.
    const innerDist = Math.max(0, Math.abs(along) - colW / 2);
    const height = rise * (1 - innerDist / roofRun) + intoRoof;
    if (height < 0.05) {
      continue;
    }

    if (facing === 'front') {
      parts.push(
        box(
          `${namePrefix}_${i}`,
          'Roof',
          [faceInset[0] + along, faceInset[1], faceInset[2]],
          { width: colW * 1.02, height, depth: thick },
          WALL,
        ),
      );
    } else {
      parts.push(
        box(
          `${namePrefix}_${i}`,
          'Roof',
          [faceInset[0], faceInset[1], faceInset[2] + along],
          { width: thick, height, depth: colW * 1.02 },
          WALL,
        ),
      );
    }
  }

  return parts;
}

/**
 * Pitched roof slab — ground-origin box at slope midpoint, single-axis pitch.
 */
function roofSlab(
  name: string,
  mid: [number, number, number],
  size: { width: number; depth: number },
  rotation: [number, number, number],
): PartRecipe {
  const [rx, , rz] = rotation;
  const centerOffset: [number, number, number]
    = rx !== 0
      ? [0, (ROOF_T / 2) * Math.cos(rx), (ROOF_T / 2) * Math.sin(rx)]
      : [-(ROOF_T / 2) * Math.sin(rz), (ROOF_T / 2) * Math.cos(rz), 0];

  return box(
    name,
    'Roof',
    [
      mid[0] - centerOffset[0],
      mid[1] - centerOffset[1],
      mid[2] - centerOffset[2],
    ],
    { width: size.width, height: ROOF_T, depth: size.depth },
    ROOF,
    rotation,
  );
}

/**
 * Lit window: dark frame + warm glass.
 * Wall boxes are centered on the face (depth T), so openings must sit past
 * the outer face (T/2) or they z-fight and flicker.
 */
function windowPane(
  name: string,
  position: [number, number, number],
  size: { width: number; height: number },
  facing: 'front' | 'back' | 'left' | 'right',
): PartRecipe[] {
  const frameT = 0.05;
  const glassT = 0.045;
  /** Clear of wall outer face + small gap (avoids z-fighting). */
  const proud = T / 2 + 0.12;
  const sideFacing = facing === 'left' || facing === 'right';

  const outward
    = facing === 'front'
      ? ([0, 0, proud] as const)
      : facing === 'back'
        ? ([0, 0, -proud] as const)
        : facing === 'left'
          ? ([-proud, 0, 0] as const)
          : ([proud, 0, 0] as const);

  const [px, py, pz] = position;
  const frameOut = 0.85;
  const glassOut = 1;

  return [
    box(
      `${name}_frame`,
      'Openings',
      [px + outward[0] * frameOut, py, pz + outward[2] * frameOut],
      {
        width: sideFacing ? frameT : size.width + 0.12,
        height: size.height + 0.12,
        depth: sideFacing ? size.width + 0.12 : frameT,
      },
      FRAME,
    ),
    box(
      name,
      'Openings',
      [px + outward[0] * glassOut, py + 0.06, pz + outward[2] * glassOut],
      {
        width: sideFacing ? glassT : size.width,
        height: size.height,
        depth: sideFacing ? size.width : glassT,
      },
      GLASS,
    ),
  ];
}

/**
 * Modern two-storey gable house from existing primitives — metres, grounded, named parts.
 * From kit flow (US-27); New model stays empty.
 */
export const SIMPLE_BUILDING_KIT: Kit<'simple-building'> = {
  id: 'simple-building',
  label: 'Modern house',
  description:
    'A two-storey white house with pitched roofs, lit windows, porch, and balconies.',
  groups: [
    { name: 'Foundation', position: [0, 0, 0] },
    { name: 'Main', position: [0, 0, 0] },
    { name: 'Dormer', position: [0, 0, 0] },
    { name: 'Roof', position: [0, 0, 0] },
    { name: 'Openings', position: [0, 0, 0] },
    { name: 'Details', position: [0, 0, 0] },
  ],
  parts: [
    // —— Foundation ——
    box(
      'plinth',
      'Foundation',
      [0.2, 0, 0.35],
      { width: BODY_W + 0.6, height: FOUNDATION_H, depth: BODY_D + DORMER_D + 0.5 },
      FOUNDATION,
    ),
    box(
      'floor',
      'Foundation',
      [BODY_X, FOUNDATION_H, BODY_Z + DORMER_D * 0.25],
      {
        width: BODY_W - T,
        height: 0.08,
        depth: BODY_D + DORMER_D * 0.5 - T,
      },
      FOUNDATION,
    ),

    // —— Main body walls ——
    box(
      'wall_front',
      'Main',
      [BODY_X, FOUNDATION_H, BODY_Z + bodyHalfD],
      { width: BODY_W, height: WALL_H, depth: T },
      WALL,
    ),
    box(
      'wall_back',
      'Main',
      [BODY_X, FOUNDATION_H, BODY_Z - bodyHalfD],
      { width: BODY_W, height: WALL_H, depth: T },
      WALL,
    ),
    box(
      'wall_left',
      'Main',
      [BODY_X - bodyHalfW, FOUNDATION_H, BODY_Z],
      { width: T, height: WALL_H, depth: BODY_D },
      WALL,
    ),
    box(
      'wall_right',
      'Main',
      [BODY_X + bodyHalfW, FOUNDATION_H, BODY_Z],
      { width: T, height: WALL_H, depth: BODY_D },
      WALL,
    ),

    // —— Front dormer bay (full-height cross-gable) ——
    box(
      'dormer_front',
      'Dormer',
      [DORMER_X, FOUNDATION_H, DORMER_Z + dormerHalfD],
      { width: DORMER_W, height: WALL_H, depth: T },
      WALL,
    ),
    box(
      'dormer_left',
      'Dormer',
      [DORMER_X - dormerHalfW, FOUNDATION_H, DORMER_Z],
      { width: T, height: WALL_H, depth: DORMER_D },
      WALL,
    ),
    box(
      'dormer_right',
      'Dormer',
      [DORMER_X + dormerHalfW, FOUNDATION_H, DORMER_Z],
      { width: T, height: WALL_H, depth: DORMER_D },
      WALL,
    ),

    // —— Ceilings ——
    box(
      'ceiling_main',
      'Roof',
      [BODY_X, WALL_TOP - 0.05, BODY_Z],
      { width: BODY_W - T, height: 0.08, depth: BODY_D - T },
      WALL,
    ),
    box(
      'ceiling_dormer',
      'Roof',
      [DORMER_X, WALL_TOP - 0.05, DORMER_Z],
      { width: DORMER_W - T, height: 0.08, depth: DORMER_D - T },
      WALL,
    ),

    // —— Main gable roof (ridge // X) ——
    roofSlab(
      'roof_main_front',
      [BODY_X, WALL_TOP + mainRise / 2, BODY_Z + mainRun / 2],
      { width: BODY_W + OVERHANG * 2, depth: mainSlopeLen },
      [ROOF_PITCH, 0, 0],
    ),
    roofSlab(
      'roof_main_back',
      [BODY_X, WALL_TOP + mainRise / 2, BODY_Z - mainRun / 2],
      { width: BODY_W + OVERHANG * 2, depth: mainSlopeLen },
      [-ROOF_PITCH, 0, 0],
    ),

    // Side gable fills (close triangular holes under main roof)
    ...gableColumns(
      'gable_left',
      [BODY_X - bodyHalfW, WALL_TOP, BODY_Z],
      mainRise,
      BODY_D,
      mainRun,
      'left',
    ),
    ...gableColumns(
      'gable_right',
      [BODY_X + bodyHalfW, WALL_TOP, BODY_Z],
      mainRise,
      BODY_D,
      mainRun,
      'right',
    ),

    // —— Dormer cross-gable roof (ridge // Z, faces front) ——
    roofSlab(
      'roof_dormer_left',
      [DORMER_X - dormerRun / 2, WALL_TOP + dormerRise / 2, DORMER_Z],
      { width: dormerSlopeLen, depth: DORMER_D + OVERHANG * 1.4 },
      [0, 0, ROOF_PITCH],
    ),
    roofSlab(
      'roof_dormer_right',
      [DORMER_X + dormerRun / 2, WALL_TOP + dormerRise / 2, DORMER_Z],
      { width: dormerSlopeLen, depth: DORMER_D + OVERHANG * 1.4 },
      [0, 0, -ROOF_PITCH],
    ),

    // Front (+ back) dormer gable fills — columns follow the pitch
    ...gableColumns(
      'gable_dormer_front',
      [DORMER_X, WALL_TOP, DORMER_Z + dormerHalfD],
      dormerRise,
      DORMER_W,
      dormerRun,
      'front',
    ),
    ...gableColumns(
      'gable_dormer_back',
      [DORMER_X, WALL_TOP, DORMER_Z - dormerHalfD],
      dormerRise,
      DORMER_W,
      dormerRun,
      'front',
    ),

    // —— Chimney on main ridge ——
    box(
      'chimney',
      'Roof',
      [BODY_X - 2.2, WALL_TOP + mainRise * 0.7, BODY_Z - 0.4],
      { width: 0.42, height: 0.95, depth: 0.42 },
      CHIMNEY,
    ),
    box(
      'chimney_cap',
      'Roof',
      [BODY_X - 2.2, WALL_TOP + mainRise * 0.7 + 0.95, BODY_Z - 0.4],
      { width: 0.52, height: 0.07, depth: 0.52 },
      ROOF,
    ),

    // —— Entrance (centred under dormer, like the reference) ——
    box(
      'porch_surround',
      'Details',
      [DORMER_X, FOUNDATION_H, DORMER_Z + dormerHalfD - 0.2],
      { width: 1.55, height: 2.45, depth: 0.55 },
      FOUNDATION,
    ),
    box(
      'door_frame',
      'Openings',
      [DORMER_X, FOUNDATION_H + 0.08, DORMER_Z + dormerHalfD + T / 2 + 0.1],
      { width: 1.15, height: 2.25, depth: 0.06 },
      FRAME,
    ),
    box(
      'door',
      'Openings',
      [DORMER_X, FOUNDATION_H + 0.12, DORMER_Z + dormerHalfD + T / 2 + 0.14],
      { width: 0.95, height: 2.1, depth: 0.05 },
      DOOR,
    ),
    box(
      'step_1',
      'Details',
      [DORMER_X, 0, DORMER_Z + dormerHalfD + 0.55],
      { width: 1.4, height: 0.14, depth: 0.38 },
      FOUNDATION,
    ),
    box(
      'step_2',
      'Details',
      [DORMER_X, 0.14, DORMER_Z + dormerHalfD + 0.38],
      { width: 1.4, height: 0.14, depth: 0.38 },
      FOUNDATION,
    ),

    // —— Balconies ——
    box(
      'balcony_left_deck',
      'Details',
      [BODY_X - 2.6, FOUNDATION_H + STOREY, BODY_Z + bodyHalfD + 0.38],
      { width: 1.5, height: 0.08, depth: 0.75 },
      FOUNDATION,
    ),
    box(
      'balcony_left_rail',
      'Details',
      [BODY_X - 2.6, FOUNDATION_H + STOREY + 0.08, BODY_Z + bodyHalfD + 0.72],
      { width: 1.5, height: 0.85, depth: 0.04 },
      RAIL,
    ),
    box(
      'balcony_dormer_deck',
      'Details',
      [DORMER_X, FOUNDATION_H + STOREY, DORMER_Z + dormerHalfD + 0.42],
      { width: 2.8, height: 0.08, depth: 0.85 },
      FOUNDATION,
    ),
    box(
      'balcony_dormer_rail_front',
      'Details',
      [DORMER_X, FOUNDATION_H + STOREY + 0.08, DORMER_Z + dormerHalfD + 0.82],
      { width: 2.8, height: 0.85, depth: 0.04 },
      RAIL,
    ),
    box(
      'balcony_dormer_rail_left',
      'Details',
      [DORMER_X - 1.4, FOUNDATION_H + STOREY + 0.08, DORMER_Z + dormerHalfD + 0.42],
      { width: 0.04, height: 0.85, depth: 0.85 },
      RAIL,
    ),
    box(
      'balcony_dormer_rail_right',
      'Details',
      [DORMER_X + 1.4, FOUNDATION_H + STOREY + 0.08, DORMER_Z + dormerHalfD + 0.42],
      { width: 0.04, height: 0.85, depth: 0.85 },
      RAIL,
    ),

    // —— Downspouts ——
    {
      kind: 'cylinder',
      name: 'downspout_left',
      parent: 'Details',
      position: [
        BODY_X - bodyHalfW - 0.06,
        FOUNDATION_H,
        BODY_Z + bodyHalfD - 0.2,
      ],
      rotation: [...IDENTITY],
      params: { radius: 0.045, height: WALL_H + 0.15 },
      color: ROOF,
    },
    {
      kind: 'cylinder',
      name: 'downspout_right',
      parent: 'Details',
      position: [
        BODY_X + bodyHalfW + 0.06,
        FOUNDATION_H,
        BODY_Z + bodyHalfD - 0.2,
      ],
      rotation: [...IDENTITY],
      params: { radius: 0.045, height: WALL_H + 0.15 },
      color: ROOF,
    },

    // —— Windows (aligned grids; front door/balcony kept) ——
    // Front: left of dormer + strip right of dormer (clear of corner clip)
    ...windowPane(
      'win_front_left',
      [BODY_X - 2.35, FOUNDATION_H + 0.7, BODY_Z + bodyHalfD],
      { width: 1.15, height: 1.4 },
      'front',
    ),
    ...windowPane(
      'win_front_right',
      // Dormer right edge ≈ 2.55; wall corner ≈ 3.6 — keep clear of both
      [BODY_X + 2.95, FOUNDATION_H + 0.7, BODY_Z + bodyHalfD],
      { width: 0.85, height: 1.4 },
      'front',
    ),
    ...windowPane(
      'win_upper_left',
      [BODY_X - 2.5, FOUNDATION_H + STOREY + 0.4, BODY_Z + bodyHalfD],
      { width: 1.05, height: 1.65 },
      'front',
    ),
    ...windowPane(
      'win_dormer_l',
      [DORMER_X - 0.95, FOUNDATION_H + STOREY + 0.4, DORMER_Z + dormerHalfD],
      { width: 0.85, height: 1.65 },
      'front',
    ),
    ...windowPane(
      'win_dormer_c',
      [DORMER_X, FOUNDATION_H + STOREY + 0.4, DORMER_Z + dormerHalfD],
      { width: 0.85, height: 1.65 },
      'front',
    ),
    ...windowPane(
      'win_dormer_r',
      [DORMER_X + 0.95, FOUNDATION_H + STOREY + 0.4, DORMER_Z + dormerHalfD],
      { width: 0.85, height: 1.65 },
      'front',
    ),

    // Left side — 2×2 grid (same Z columns, same sizes)
    ...windowPane(
      'win_left_gf',
      [BODY_X - bodyHalfW, FOUNDATION_H + 0.7, BODY_Z + 1.2],
      { width: 1.1, height: 1.4 },
      'left',
    ),
    ...windowPane(
      'win_left_gb',
      [BODY_X - bodyHalfW, FOUNDATION_H + 0.7, BODY_Z - 1.2],
      { width: 1.1, height: 1.4 },
      'left',
    ),
    ...windowPane(
      'win_left_uf',
      [BODY_X - bodyHalfW, FOUNDATION_H + STOREY + 0.45, BODY_Z + 1.2],
      { width: 1.1, height: 1.4 },
      'left',
    ),
    ...windowPane(
      'win_left_ub',
      [BODY_X - bodyHalfW, FOUNDATION_H + STOREY + 0.45, BODY_Z - 1.2],
      { width: 1.1, height: 1.4 },
      'left',
    ),

    // Right side — mirror of left (2×2)
    ...windowPane(
      'win_right_gf',
      [BODY_X + bodyHalfW, FOUNDATION_H + 0.7, BODY_Z + 1.2],
      { width: 1.1, height: 1.4 },
      'right',
    ),
    ...windowPane(
      'win_right_gb',
      [BODY_X + bodyHalfW, FOUNDATION_H + 0.7, BODY_Z - 1.2],
      { width: 1.1, height: 1.4 },
      'right',
    ),
    ...windowPane(
      'win_right_uf',
      [BODY_X + bodyHalfW, FOUNDATION_H + STOREY + 0.45, BODY_Z + 1.2],
      { width: 1.1, height: 1.4 },
      'right',
    ),
    ...windowPane(
      'win_right_ub',
      [BODY_X + bodyHalfW, FOUNDATION_H + STOREY + 0.45, BODY_Z - 1.2],
      { width: 1.1, height: 1.4 },
      'right',
    ),

    // Back — 2×2 grid
    ...windowPane(
      'win_back_gl',
      [BODY_X - 1.7, FOUNDATION_H + 0.7, BODY_Z - bodyHalfD],
      { width: 1.1, height: 1.4 },
      'back',
    ),
    ...windowPane(
      'win_back_gr',
      [BODY_X + 1.7, FOUNDATION_H + 0.7, BODY_Z - bodyHalfD],
      { width: 1.1, height: 1.4 },
      'back',
    ),
    ...windowPane(
      'win_back_ul',
      [BODY_X - 1.7, FOUNDATION_H + STOREY + 0.45, BODY_Z - bodyHalfD],
      { width: 1.1, height: 1.4 },
      'back',
    ),
    ...windowPane(
      'win_back_ur',
      [BODY_X + 1.7, FOUNDATION_H + STOREY + 0.45, BODY_Z - bodyHalfD],
      { width: 1.1, height: 1.4 },
      'back',
    ),
  ],
};
