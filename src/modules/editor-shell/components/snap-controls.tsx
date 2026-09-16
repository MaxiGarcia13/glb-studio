import { useStore } from '@nanostores/react';
import { useState } from 'react';
import { Input } from '@/components/input/input';
import { Text } from '@/components/text';
import {
  $viewportSettings,
  GRID_STEP_METRES_MAX,
  GRID_STEP_METRES_MIN,
  ROTATION_STEP_DEGREES_MAX,
  ROTATION_STEP_DEGREES_MIN,
  setGridStepMetres,
  setRotationStepDegrees,
  setSnapRotation,
  setSnapToGrid,
} from '@/modules/viewport/stores/viewport-settings-store';

export function SnapControls() {
  const { snapToGrid, gridStepMetres, snapRotation, rotationStepDegrees } = useStore(
    $viewportSettings,
    {
      keys: ['snapToGrid', 'gridStepMetres', 'snapRotation', 'rotationStepDegrees'],
    },
  );
  const [gridDraft, setGridDraft] = useState(String(gridStepMetres));
  const [rotationDraft, setRotationDraft] = useState(String(rotationStepDegrees));

  const handleSnapToGridChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSnapToGrid(event.target.checked);
  };

  const handleGridStepChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setGridDraft(value);
    if (value !== '') {
      setGridStepMetres(Number(value));
    }
  };

  const handleGridStepBlur = () => {
    setGridDraft(String(gridStepMetres));
  };

  const handleSnapRotationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSnapRotation(event.target.checked);
  };

  const handleRotationStepChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setRotationDraft(value);
    if (value !== '') {
      setRotationStepDegrees(Number(value));
    }
  };

  const handleRotationStepBlur = () => {
    setRotationDraft(String(rotationStepDegrees));
  };

  return (
    <div className="flex flex-col gap-2">
      <Text as="h2" variant="section">
        Snap
      </Text>
      <label className="flex items-center gap-2 cursor-pointer shrink-0">
        <input
          type="checkbox"
          checked={snapToGrid}
          onChange={handleSnapToGridChange}
          className="size-4 shrink-0 rounded-sm border-border-strong accent-accent"
        />
        <Text variant="muted">Snap to grid</Text>
      </label>
      <Input
        label="Grid step (m)"
        type="number"
        value={gridDraft}
        min={GRID_STEP_METRES_MIN}
        max={GRID_STEP_METRES_MAX}
        step={0.01}
        disabled={!snapToGrid}
        onChange={handleGridStepChange}
        onBlur={handleGridStepBlur}
      />
      <label className="flex items-center gap-2 cursor-pointer shrink-0">
        <input
          type="checkbox"
          checked={snapRotation}
          onChange={handleSnapRotationChange}
          className="size-4 shrink-0 rounded-sm border-border-strong accent-accent"
        />
        <Text variant="muted">Snap rotation</Text>
      </label>
      <Input
        label="Rotation step (°)"
        type="number"
        value={rotationDraft}
        min={ROTATION_STEP_DEGREES_MIN}
        max={ROTATION_STEP_DEGREES_MAX}
        step={1}
        disabled={!snapRotation}
        onChange={handleRotationStepChange}
        onBlur={handleRotationStepBlur}
      />
    </div>
  );
}
