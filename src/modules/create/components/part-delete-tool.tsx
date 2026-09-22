import { useStore } from '@nanostores/react';

import { Button } from '@/components/button';
import { TrashIcon } from '@/components/icons/trash-icon';
import { $activeModel } from '@/modules/viewport/stores/model-store';
import { $selection } from '@/modules/viewport/stores/selection-store';
import {
  deleteSelectedPart,
  getDeleteSelectedPartAvailability,
} from '../actions/delete-selected-part';
import { $createPartsRevision } from '../stores/create-parts-revision-store';

export function PartDeleteTool() {
  useStore($activeModel);
  useStore($selection);
  useStore($createPartsRevision);

  const availability = getDeleteSelectedPartAvailability();
  const enabled = availability.enabled;

  return (
    <Button
      variant="ghost"
      disabled={!enabled}
      title={availability.reason}
      aria-label="Delete part"
      onClick={() => deleteSelectedPart()}
    >
      <TrashIcon aria-hidden />
    </Button>
  );
}
