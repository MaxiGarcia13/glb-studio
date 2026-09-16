export interface PartSizeParamsById {
  box: { width: number; height: number; depth: number };
  sphere: { radius: number };
  cylinder: { radius: number; height: number };
  capsule: { radius: number; length: number };
  plane: { width: number; height: number };
  cone: { radius: number; height: number };
  torus: { radius: number; tube: number };
  triangle: { radius: number };
  polygon: { radius: number; sides: number };
  circle: { radius: number };
  ring: { innerRadius: number; outerRadius: number };
  tetrahedron: { radius: number };
  octahedron: { radius: number };
  icosahedron: { radius: number };
  dodecahedron: { radius: number };
}

export type PartKindId = keyof PartSizeParamsById;

export type PartSizeParams<K extends PartKindId = PartKindId> = PartSizeParamsById[K];

export type PartSizeParamKey
  = | 'width'
    | 'height'
    | 'depth'
    | 'radius'
    | 'length'
    | 'tube'
    | 'sides'
    | 'innerRadius'
    | 'outerRadius';

export interface PartSizeField {
  param: PartSizeParamKey;
  label: string;
  min: number;
  /** Input step; defaults to 0.01. Use 1 for counts like polygon sides. */
  step?: number;
  /** When true, values are rounded to integers in `setPartSizeParam`. */
  integer?: boolean;
  /**
   * Unit shown after the label. Default `'m'`. Use `null` for unitless fields
   * (e.g. polygon sides).
   */
  unit?: 'm' | null;
}
