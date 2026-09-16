import { useStore } from '@nanostores/react';
import { Text } from '@/components/text';

import { $selection } from '../stores/selection-store';

export function SelectionNameOverlay() {
  const { object: selected, objects, kind, modelIds } = useStore($selection, {
    keys: ['object', 'objects', 'kind', 'modelIds'],
  });

  if (kind === 'models' && modelIds.length > 0) {
    const label = modelIds.length === 1
      ? '1 model'
      : `${modelIds.length} models`;
    return (
      <Text
        size="sm"
        variant="muted"
        title={label}
        className="pointer-events-none select-none drop-shadow-md"
      >
        {label}
      </Text>
    );
  }

  if (!selected) {
    return null;
  }

  const extra = objects.length > 1 ? ` (+${objects.length - 1})` : '';
  const label = `${selected.name}${extra}`;

  return (
    <Text
      size="sm"
      variant="muted"
      title={label}
      className="pointer-events-none select-none drop-shadow-md"
    >
      {label}
    </Text>
  );
}
