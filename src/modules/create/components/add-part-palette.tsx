import { useStore } from '@nanostores/react';
import { useState } from 'react';
import { ActionMenu } from '@/components/action-menu';
import { BlocksIcon } from '@/components/icons/blocks-icon';
import { $activeModel } from '@/modules/viewport/stores/model-store';
import { addPart } from '../actions/add-part';
import { getPartKind } from '../domain/part-kind';
import {
  loadRecentKinds,
  recordRecentKind,
  resolveCompactMenuKinds,
} from '../domain/recent-part-kinds';

/**
 * Compact Add-part menu for the create rail: five MRU/suggested kinds + See more.
 * Caller mounts only when a created model is focused.
 */
export function AddPartPalette() {
  const activeModel = useStore($activeModel);
  const [recent, setRecent] = useState(loadRecentKinds);

  if (!activeModel || activeModel.source !== 'created') {
    return null;
  }

  const modelId = activeModel.id;
  const compactIds = resolveCompactMenuKinds(recent);

  return (
    <ActionMenu
      aria-label="Add part"
      side="top"
      align="start"
      icon={<BlocksIcon aria-hidden />}
      onOpenChange={(open) => {
        if (open) {
          setRecent(loadRecentKinds());
        }
      }}
      items={[
        ...compactIds.map((id) => {
          const kind = getPartKind(id);
          return {
            id: kind.id,
            label: kind.label,
            onSelect: () => {
              addPart(modelId, kind.id);
              setRecent(recordRecentKind(loadRecentKinds(), kind.id));
            },
          };
        }),
        {
          id: 'see-more',
          label: 'See more',
          // Browse modal — US-38 See more tasks.
          onSelect: () => undefined,
        },
      ]}
    />
  );
}
