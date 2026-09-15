export interface PartSizeParamsById {
  box: { width: number; height: number; depth: number };
  sphere: { radius: number };
  cylinder: { radius: number; height: number };
  capsule: { radius: number; length: number };
}

export type PartKindId = keyof PartSizeParamsById;

export type PartSizeParams<K extends PartKindId = PartKindId> = PartSizeParamsById[K];

export type PartSizeParamKey = 'width' | 'height' | 'depth' | 'radius' | 'length';

export interface PartSizeField {
  param: PartSizeParamKey;
  label: string;
  min: number;
}
