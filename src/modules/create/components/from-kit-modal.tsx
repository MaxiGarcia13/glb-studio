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

  return (
    <Modal
      open={open}
      title="From kit"
      onClose={onClose}
      className="max-w-md"
    >
      <div className="flex flex-col gap-2">
        <Text variant="muted">
          Start from a preset. You can edit every part afterward.
        </Text>
        {kits.map((kit) => (
          <Button
            key={kit.id}
            variant="default"
            className="w-full flex flex-col items-start gap-1 px-4 py-2 ring-1 ring-border-strong/80 text-left h-auto"
            onClick={() => {
              createFromKit(kit.id);
              onClose();
            }}
          >
            <Text as="span" className="text-current font-semibold">
              {kit.label}
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
