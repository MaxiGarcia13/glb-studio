import { useStore } from '@nanostores/react';
import { useEffect, useId, useState } from 'react';
import { ColorPickerIcon } from '@/components/icons/color-picker-icon';
import { $selection } from '@/modules/viewport/stores/selection-store';
import { useSelectedCreatedPartMaterial } from '../hooks/use-selected-created-part';
import { toHexColor } from '../utils/selected-part';

export function PartColorTool() {
  const material = useSelectedCreatedPartMaterial();
  const { object: selected } = useStore($selection, { keys: ['object'] });
  const inputId = useId();
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
    <label
      htmlFor={inputId}
      title={enabled ? 'Part color' : 'Select a part to edit color'}
      className={
        enabled
          ? 'flex size-9 cursor-pointer items-center justify-center rounded-sm text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white'
          : 'flex size-9 cursor-not-allowed items-center justify-center rounded-sm text-zinc-600 opacity-50'
      }
    >
      <ColorPickerIcon aria-hidden />
      <input
        id={inputId}
        type="color"
        aria-label="Part color"
        disabled={!enabled}
        value={draft}
        onChange={handleColorChange}
        onBlur={handleBlur}
        className="sr-only"
      />
    </label>
  );
}
