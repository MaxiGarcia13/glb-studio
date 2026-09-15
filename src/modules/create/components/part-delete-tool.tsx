import { TrashIcon } from '@/components/icons/trash-icon';
import { deleteSelectedPart } from '../actions/delete-selected-part';
import { useSelectedCreatedPart } from '../hooks/use-selected-created-part';

export function PartDeleteTool() {
  const part = useSelectedCreatedPart();
  const enabled = part !== null;

  return (
    <button
      type="button"
      disabled={!enabled}
      title={enabled ? 'Delete part' : 'Select a part to delete'}
      aria-label="Delete part"
      onClick={() => deleteSelectedPart()}
      className={
        enabled
          ? 'flex size-9 cursor-pointer items-center justify-center rounded-sm text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white'
          : 'flex size-9 cursor-not-allowed items-center justify-center rounded-sm text-zinc-600 opacity-50'
      }
    >
      <TrashIcon aria-hidden />
    </button>
  );
}
