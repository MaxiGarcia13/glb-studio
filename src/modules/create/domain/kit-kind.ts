import type { Kit, MeshKit, SkinnedKit } from '@/modules/create/types/kit';

export function isMeshKit(kit: Kit): kit is MeshKit {
  return 'parts' in kit;
}

export function isSkinnedKit(kit: Kit): kit is SkinnedKit {
  return 'skinnedAsset' in kit;
}
