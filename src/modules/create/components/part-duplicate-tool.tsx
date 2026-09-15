import { CopyIcon } from '@/components/icons/copy-icon';
import { duplicateSelectedPart } from '../actions/duplicate-selected-part';
import { useSelectedCreatedPart } from '../hooks/use-selected-created-part';

export function PartDuplicateTool() {
  const part = useSelectedCreatedPart();
  const enabled = part !== null;

  return (
    <button
      type="button"
      disabled={!enabled}
      title={enabled ? 'Duplicate part' : 'Select a part to duplicate'}
      aria-label="Duplicate part"
      onClick={() => duplicateSelectedPart()}
      className={
        enabled
          ? 'flex size-9 cursor-pointer items-center justify-center rounded-sm text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white'
          : 'flex size-9 cursor-not-allowed items-center justify-center rounded-sm text-zinc-600 opacity-50'
      }
    >
      <CopyIcon aria-hidden />
    </button>
  );
}
