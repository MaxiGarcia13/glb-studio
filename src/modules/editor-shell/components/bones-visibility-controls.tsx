import { useStore } from '@nanostores/react';
import { Text } from '@/components/text';
import {
  $viewportSettings,
  setBonesVisible,
} from '@/modules/viewport/stores/viewport-settings-store';

export function BonesVisibilityControls() {
  const { bonesVisible } = useStore($viewportSettings, {
    keys: ['bonesVisible'],
  });

  const handleVisibleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBonesVisible(event.target.checked);
  };

  return (
    <div className="flex flex-col gap-2">
      <Text as="h2" variant="section">
        Bones
      </Text>
      <label className="flex items-center gap-2 cursor-pointer shrink-0">
        <input
          type="checkbox"
          checked={bonesVisible}
          onChange={handleVisibleChange}
          className="size-4 shrink-0 rounded-sm border-border-strong accent-accent"
        />
        <Text variant="muted">Show bones</Text>
      </label>
    </div>
  );
}
