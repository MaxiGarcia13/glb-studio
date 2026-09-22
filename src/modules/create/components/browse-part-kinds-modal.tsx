import type { PartKindId } from '@/modules/create/types/part';
import { Button } from '@/components/button';
import { Modal } from '@/components/modal';
import { Text } from '@/components/text';
import { listPartKindGroups } from '../domain/part-kind';

interface BrowsePartKindsModalProps {
  open: boolean;
  onClose: () => void;
  /** Called when the user picks a kind — caller adds the part, records MRU, and closes. */
  onPickKind: (kindId: PartKindId) => void;
}

/**
 * Full part-kind catalog grouped Solids / Planar / Polyhedra (US-38 See more).
 */
export function BrowsePartKindsModal({
  open,
  onClose,
  onPickKind,
}: BrowsePartKindsModalProps) {
  const groups = listPartKindGroups();

  return (
    <Modal open={open} title="Add part" onClose={onClose} className="max-w-md">
      <div className="flex flex-col gap-4">
        {groups.map((group) => (
          <section key={group.id} className="flex flex-col gap-2" aria-label={group.label}>
            <Text as="h2" variant="section" size="xs">
              {group.label}
            </Text>
            <div className="flex flex-col gap-2">
              {group.kinds.map((kind) => (
                <Button
                  key={kind.id}
                  variant="default"
                  className="w-full justify-start px-4 py-2 ring-1 ring-border-strong/80 text-left"
                  onClick={() => onPickKind(kind.id)}
                >
                  <Text as="span" className="text-current">
                    {kind.label}
                  </Text>
                </Button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Modal>
  );
}
