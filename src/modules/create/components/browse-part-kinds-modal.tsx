import type { PartKindId } from '@/modules/create/types/part';
import { useEffect, useState } from 'react';
import { Button } from '@/components/button';
import { Modal } from '@/components/modal';
import { Text } from '@/components/text';
import { DEFAULT_PART_SUGGESTION_ORDER } from '../constants/default-part-suggestions';
import { listPartKindGroups } from '../domain/part-kind';
import { PartKindPreview } from './part-kind-preview';

const DEFAULT_SELECTED_KIND: PartKindId = DEFAULT_PART_SUGGESTION_ORDER[0];

interface BrowsePartKindsModalProps {
  open: boolean;
  onClose: () => void;
  /** Confirm — caller adds the part, records MRU, and closes. */
  onPickKind: (kindId: PartKindId) => void;
}

/**
 * Full part-kind catalog grouped Solids / Planar / Polyhedra (US-38 See more).
 * Slim kind rail (left) + hero 3D preview; a kind is always selected.
 */
export function BrowsePartKindsModal({
  open,
  onClose,
  onPickKind,
}: BrowsePartKindsModalProps) {
  const groups = listPartKindGroups();
  const [selectedKindId, setSelectedKindId] = useState<PartKindId>(DEFAULT_SELECTED_KIND);

  useEffect(() => {
    if (open) {
      setSelectedKindId(DEFAULT_SELECTED_KIND);
    }
  }, [open]);

  return (
    <Modal
      open={open}
      title="Add part"
      onClose={onClose}
      className="max-w-4xl h-[min(90vh,42rem)]"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 sm:flex-row h-[min(70vh,32rem)]">
        <div className="flex max-h-48 w-full shrink-0 flex-col gap-4 overflow-y-auto sm:max-h-none sm:w-52 px-1">
          {groups.map((group) => (
            <section key={group.id} className="flex flex-col gap-2" aria-label={group.label}>
              <Text as="h2" variant="section" size="xs">
                {group.label}
              </Text>
              <div className="flex flex-col gap-2" role="listbox" aria-label={group.label}>
                {group.kinds.map((kind) => {
                  const selected = selectedKindId === kind.id;
                  return (
                    <Button
                      key={kind.id}
                      variant="default"
                      role="option"
                      aria-selected={selected}
                      className={
                        selected
                          ? 'w-full justify-start px-2 py-2 ring-2 ring-border-strong bg-surface-hover text-left'
                          : 'w-full justify-start px-2 py-2 ring-1 ring-border-strong/80 text-left'
                      }
                      onClick={() => setSelectedKindId(kind.id)}
                    >
                      <Text as="span" className="text-current truncate">
                        {kind.label}
                      </Text>
                    </Button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
          <div
            className="min-h-0 flex-1 overflow-hidden rounded-sm border border-border bg-canvas"
            aria-label={`Preview of ${selectedKindId}`}
          >
            <PartKindPreview key={selectedKindId} kindId={selectedKindId} />
          </div>
          <Button
            variant="primary"
            className="w-full shrink-0"
            onClick={() => onPickKind(selectedKindId)}
          >
            Add part
          </Button>
        </div>
      </div>
    </Modal>
  );
}
