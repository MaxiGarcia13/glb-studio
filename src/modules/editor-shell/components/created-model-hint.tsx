import { useStore } from '@nanostores/react';
import { Text } from '@/components/text';
import { $activeModel } from '@/modules/viewport/stores/model-store';
import { $selection } from '@/modules/viewport/stores/selection-store';

/**
 * First-run hint for a created empty model: no selection yet, so point the
 * user at adding a part and using the Edit tool.
 */
export function CreatedModelHint() {
  const activeModel = useStore($activeModel);
  const { object: selected } = useStore($selection, { keys: ['object'] });

  if (!activeModel || activeModel.source !== 'created' || selected) {
    return null;
  }

  return (
    <Text
      size="sm"
      variant="muted"
      className="pointer-events-none select-none drop-shadow-md"
    >
      Add a part, then use Edit
    </Text>
  );
}
