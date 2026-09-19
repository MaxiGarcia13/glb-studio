import { useEffect, useState } from 'react';
import { Button } from '@/components/button';
import { Modal } from '@/components/modal';
import { Text } from '@/components/text';
import { createFromKit } from '../actions/create-from-kit';
import { listStarterKits } from '../domain/kit';

interface FromKitModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Secondary picker for starter kits. File → New model stays empty-only.
 */
export function FromKitModal({ open, onClose }: FromKitModalProps) {
  const kits = listStarterKits();
  const [error, setError] = useState<string | null>(null);
  const [loadingKitId, setLoadingKitId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setError(null);
      setLoadingKitId(null);
    }
  }, [open]);

  const busy = loadingKitId !== null;

  return (
    <Modal
      open={open}
      title="From kit"
      onClose={() => {
        if (busy) {
          return;
        }
        setError(null);
        onClose();
      }}
      className="max-w-md"
    >
      <div className="flex flex-col gap-2">
        <Text variant="muted">
          Start from a preset — mesh kits stay editable as parts; the Block robot loads as a skinned character.
        </Text>
        {error && (
          <Text variant="error" size="sm" className="whitespace-normal">
            {error}
          </Text>
        )}
        {kits.map((kit) => (
          <Button
            key={kit.id}
            variant="default"
            disabled={busy}
            className="w-full flex flex-col items-start gap-1 px-4 py-2 ring-1 ring-border-strong/80 text-left h-auto"
            onClick={() => {
              setError(null);
              setLoadingKitId(kit.id);
              void createFromKit(kit.id)
                .then(() => {
                  setLoadingKitId(null);
                  setError(null);
                  onClose();
                })
                .catch((cause: unknown) => {
                  setLoadingKitId(null);
                  setError(
                    cause instanceof Error
                      ? cause.message
                      : `Could not load “${kit.label}” kit.`,
                  );
                });
            }}
          >
            <Text as="span" className="text-current font-semibold">
              {loadingKitId === kit.id ? `Loading ${kit.label}…` : kit.label}
            </Text>
            <Text as="span" variant="muted" className="text-current whitespace-normal">
              {kit.description}
            </Text>
          </Button>
        ))}
      </div>
    </Modal>
  );
}
