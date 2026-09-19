import type { SkinnedKit } from '@/modules/create/types/kit';

/** Pre-skinned Block robot GLB (US-33). Mesh recipe lives in `block-robot.ts`. */
export const BLOCK_ROBOT_SKINNED_KIT: SkinnedKit<'block-robot'> = {
  id: 'block-robot',
  label: 'Block robot',
  description:
    'A slender skinned humanoid with real bones — browse joints and import clips like any character.',
  skinnedAsset: {
    url: '/kits/block-robot.glb',
    defaultFileName: 'Block robot.glb',
  },
};
