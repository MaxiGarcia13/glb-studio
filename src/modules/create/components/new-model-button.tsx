import { Button } from '@/components/button';
import { PlusIcon } from '@/components/icons/plus-icon';
import { createEmptyModel } from '@/modules/create/actions/create-empty-model';

export function NewModelButton() {
  return (
    <Button
      onClick={() => createEmptyModel()}
      variant="ghost"
      aria-label="New model"
      title="New model"
      className="shrink-0 p-2"
    >
      <PlusIcon />
    </Button>
  );
}
