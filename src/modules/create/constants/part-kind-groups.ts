import type { PartKindId } from '@/modules/create/types/part';

/**
 * Browse-modal sections matching `constants/part-kinds/{solids,planar,polyhedra}.ts`.
 * Order within each group follows the registry file export order.
 */
export const PART_KIND_GROUPS = [
  {
    id: 'solids',
    label: 'Solids',
    kindIds: ['box', 'sphere', 'cylinder', 'capsule', 'cone', 'torus'],
  },
  {
    id: 'planar',
    label: 'Planar',
    kindIds: ['plane', 'triangle', 'polygon', 'circle', 'ring'],
  },
  {
    id: 'polyhedra',
    label: 'Polyhedra',
    kindIds: ['tetrahedron', 'octahedron', 'icosahedron', 'dodecahedron'],
  },
] as const satisfies readonly {
  id: string;
  label: string;
  kindIds: readonly PartKindId[];
}[];

export type PartKindGroupId = (typeof PART_KIND_GROUPS)[number]['id'];
