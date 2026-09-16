import { Button } from '@/components/button';
import { CopyIcon } from '@/components/icons/copy-icon';
import { duplicateSelectedPart } from '../actions/duplicate-selected-part';
import { useSelectedCreatedPart } from '../hooks/use-selected-created-part';

export function PartDuplicateTool() {
  const part = useSelectedCreatedPart();
  const enabled = part !== null;

  return (
    <Button
      variant="ghost"
      disabled={!enabled}
      title={enabled ? 'Duplicate part' : 'Select a part to duplicate'}
      aria-label="Duplicate part"
      onClick={() => duplicateSelectedPart()}
    >
      <CopyIcon aria-hidden />
    </Button>
  );
}
