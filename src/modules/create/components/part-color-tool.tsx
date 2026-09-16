import { useStore } from '@nanostores/react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/button';
import { ColorPickerIcon } from '@/components/icons/color-picker-icon';
import { $selection } from '@/modules/viewport/stores/selection-store';
import { useSelectedCreatedPartMaterial } from '../hooks/use-selected-created-part';
import { toHexColor } from '../utils/selected-part';

export function PartColorTool() {
  const material = useSelectedCreatedPartMaterial();
  const { object: selected } = useStore($selection, { keys: ['object'] });
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState('#808080');
  const enabled = material !== null;

  useEffect(() => {
    if (material) {
      setDraft(toHexColor(material));
    }
  }, [material, selected]);

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!material) {
      return;
    }
    const value = event.target.value;
    setDraft(value);
    material.color.set(value);
  };

  const handleBlur = () => {
    if (material) {
      setDraft(toHexColor(material));
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="color"
        aria-label="Part color"
        disabled={!enabled}
        value={draft}
        onChange={handleColorChange}
        onBlur={handleBlur}
        className="sr-only"
      />
      <Button
        variant="ghost"
        disabled={!enabled}
        title={enabled ? 'Part color' : 'Select a part to edit color'}
        aria-label="Part color"
        onClick={() => inputRef.current?.click()}
      >
        <ColorPickerIcon aria-hidden />
      </Button>
    </>
  );
}
