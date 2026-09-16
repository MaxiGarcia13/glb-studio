import { Button } from '@/components/button';
import { TrashIcon } from '@/components/icons/trash-icon';
import { deleteSelectedPart } from '../actions/delete-selected-part';
import { useSelectedCreatedPart } from '../hooks/use-selected-created-part';

export function PartDeleteTool() {
  const part = useSelectedCreatedPart();
  const enabled = part !== null;

  return (
    <Button
      variant="ghost"
      disabled={!enabled}
      title={enabled ? 'Delete part' : 'Select a part to delete'}
      aria-label="Delete part"
      onClick={() => deleteSelectedPart()}
    >
      <TrashIcon aria-hidden />
    </Button>
  );
}
