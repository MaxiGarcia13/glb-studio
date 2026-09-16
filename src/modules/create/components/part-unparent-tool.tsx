import { useStore } from '@nanostores/react';
import { useState } from 'react';
import { Button } from '@/components/button';
import { UnlinkIcon } from '@/components/icons/unlink-icon';
import { $activeModel } from '@/modules/viewport/stores/model-store';
import { unparentSelectedPart } from '../actions/unparent-selected-part';
import { useSelectedCreatedPart } from '../hooks/use-selected-created-part';

export function PartUnparentTool() {
  const part = useSelectedCreatedPart();
  const activeModel = useStore($activeModel);
  // Hierarchy is mutated on the Object3D tree; bump after unparent so enabled state refreshes.
  const [hierarchyEpoch, setHierarchyEpoch] = useState(0);

  const partsRoot
    = activeModel?.source === 'created' ? activeModel.scene : null;
  const nested
    = part !== null
      && partsRoot !== null
      && part.mesh.parent !== null
      && part.mesh.parent !== partsRoot;
  void hierarchyEpoch;

  return (
    <Button
      variant="ghost"
      disabled={!nested}
      title={nested ? 'Unparent part' : 'Select a nested part to unparent'}
      aria-label="Unparent part"
      onClick={() => {
        if (unparentSelectedPart()) {
          setHierarchyEpoch((epoch) => epoch + 1);
        }
      }}
    >
      <UnlinkIcon aria-hidden />
    </Button>
  );
}
