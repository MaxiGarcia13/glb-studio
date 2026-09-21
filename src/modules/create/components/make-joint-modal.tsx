import { useStore } from '@nanostores/react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { Modal } from '@/components/modal';
import { Select } from '@/components/select';
import { Text } from '@/components/text';
import { makeJointSelectedParts } from '@/modules/create/actions/make-joint-selected-parts';
import { SUGGESTED_JOINT_NAMES } from '@/modules/create/constants/suggested-joint-names';
import {
  $makeJointUi,
  closeMakeJointModal,
} from '@/modules/create/stores/make-joint-ui-store';

const SUGGESTED_OPTIONS = SUGGESTED_JOINT_NAMES.map((name) => ({
  value: name,
  label: name,
}));

function resolveJointName(suggested: string, custom: string): string | null {
  const trimmedCustom = custom.trim();
  if (trimmedCustom) {
    return trimmedCustom;
  }
  if (suggested) {
    return suggested;
  }
  return null;
}

export function MakeJointModal() {
  const { open } = useStore($makeJointUi);
  const [suggested, setSuggested] = useState<string>('Hips');
  const [custom, setCustom] = useState('');

  useEffect(() => {
    if (!open) {
      return;
    }
    setSuggested('Hips');
    setCustom('');
  }, [open]);

  const jointName = resolveJointName(suggested, custom);
  const canConfirm = Boolean(jointName);

  const onConfirm = () => {
    if (!jointName) {
      return;
    }
    const ok = makeJointSelectedParts({ name: jointName });
    if (ok) {
      closeMakeJointModal();
    }
  };

  return (
    <Modal
      open={open}
      title="Make joint"
      onClose={closeMakeJointModal}
      className="max-w-md"
    >
      <div className="flex flex-col gap-4">
        <Text variant="muted">
          Name this joint — it becomes a bone when you Skin. Use Group for
          organizing parts that should not become bones.
        </Text>
        <Select
          label="Suggested name"
          aria-label="Suggested joint name"
          options={SUGGESTED_OPTIONS}
          value={suggested}
          onChange={(event) => setSuggested(event.target.value)}
        />
        <Input
          label="Custom name (optional)"
          aria-label="Custom joint name"
          value={custom}
          placeholder="Overrides suggestion when set"
          onChange={(event) => setCustom(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && canConfirm) {
              event.preventDefault();
              onConfirm();
            }
          }}
        />
        <div className="flex justify-end gap-2">
          <Button variant="default" onClick={closeMakeJointModal}>
            Cancel
          </Button>
          <Button
            variant={canConfirm ? 'primary' : 'default'}
            disabled={!canConfirm}
            onClick={onConfirm}
          >
            Make joint
          </Button>
        </div>
      </div>
    </Modal>
  );
}
