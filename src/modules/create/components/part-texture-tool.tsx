import { useStore } from '@nanostores/react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/button';
import { TextureIcon } from '@/components/icons/texture-icon';
import { $selection } from '@/modules/viewport/stores/selection-store';
import { clearPartColorMap } from '../domain/part-color-map';
import { useSelectedCreatedPart } from '../hooks/use-selected-created-part';
import { findMeshStandardMaterial } from '../utils/selected-part';
import { TexturePrepModal } from './texture-prep-modal';

function toolTitle(enabled: boolean, hasMap: boolean): string {
  if (!enabled) {
    return 'Select a part to edit texture';
  }
  if (hasMap) {
    return 'Part texture — click to prepare, right-click to clear';
  }
  return 'Part texture';
}

export function PartTextureTool() {
  const part = useSelectedCreatedPart();
  const material = part ? findMeshStandardMaterial(part.mesh) : null;
  const { object: selected } = useStore($selection, { keys: ['object'] });
  const [hasMap, setHasMap] = useState(false);
  const [prepOpen, setPrepOpen] = useState(false);
  const enabled = part !== null && material !== null;

  useEffect(() => {
    setHasMap(Boolean(material?.map));
    if (!enabled) {
      setPrepOpen(false);
    }
  }, [material, selected, enabled]);

  const handleClear = () => {
    if (!material?.map) {
      return;
    }
    clearPartColorMap(material);
    setHasMap(false);
  };

  const title = toolTitle(enabled, hasMap);

  return (
    <>
      <Button
        variant={hasMap ? 'primary' : 'ghost'}
        disabled={!enabled}
        title={title}
        aria-label={hasMap ? 'Prepare or clear part texture' : 'Part texture'}
        aria-pressed={hasMap}
        onClick={() => {
          if (enabled) {
            setPrepOpen(true);
          }
        }}
        onContextMenu={(event) => {
          event.preventDefault();
          handleClear();
        }}
      >
        <TextureIcon aria-hidden />
      </Button>
      <TexturePrepModal
        open={prepOpen}
        onClose={() => setPrepOpen(false)}
        onApplied={() => setHasMap(true)}
      />
    </>
  );
}
