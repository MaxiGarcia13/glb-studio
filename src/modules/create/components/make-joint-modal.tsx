import type { Object3D } from 'three';
import type { NamedConnectorInput } from '@/modules/create/domain/make-joint-plan';
import { useStore } from '@nanostores/react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/button';
import { Modal } from '@/components/modal';
import { Text } from '@/components/text';
import { resolveGroupPartsContext } from '@/modules/create/actions/group-selected-parts';
import { makeJointSelectedParts } from '@/modules/create/actions/make-joint-selected-parts';
import { isCreateJoint } from '@/modules/create/domain/group-data';
import {
  $makeJointUi,
  closeMakeJointModal,
} from '@/modules/create/stores/make-joint-ui-store';
import {
  findMeshStandardMaterial,
  toHexColor,
} from '@/modules/create/utils/selected-part';

const FALLBACK_SWATCH = '#71717a';

function previewSwatch(object: Object3D): string {
  const material = findMeshStandardMaterial(object);
  return material ? toHexColor(material) : FALLBACK_SWATCH;
}

/** Skin does not need fancy labels — use the part name or hinge_N. */
function autoConnectorName(object: Object3D, index: number): string {
  const trimmed = object.name.trim();
  if (trimmed) {
    return trimmed;
  }
  return `hinge_${index + 1}`;
}

export function MakeJointModal() {
  const { open } = useStore($makeJointUi);
  const [nodes, setNodes] = useState<Object3D[]>([]);
  const [markedIds, setMarkedIds] = useState<Set<string>>(() => new Set());
  const [includeNew, setIncludeNew] = useState(true);

  useEffect(() => {
    if (!open) {
      return;
    }
    const context = resolveGroupPartsContext();
    setNodes(context?.nodes ?? []);
    setMarkedIds(new Set());
    setIncludeNew(true);
  }, [open]);

  const connectorCount = markedIds.size + (includeNew ? 1 : 0);
  const canConnect = nodes.length >= 2 && connectorCount >= 1;

  const onToggleMarked = (uuid: string) => {
    setMarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(uuid)) {
        next.delete(uuid);
      } else {
        next.add(uuid);
      }
      return next;
    });
  };

  const onConnect = () => {
    if (!canConnect) {
      return;
    }

    const connectors: NamedConnectorInput[] = [];
    if (includeNew && markedIds.size === 0) {
      connectors.push({ source: { kind: 'new' }, name: 'connector' });
    }
    let hingeIndex = 0;
    for (const node of nodes) {
      if (!markedIds.has(node.uuid)) {
        continue;
      }
      connectors.push({
        source: { kind: 'node', object: node },
        name: autoConnectorName(node, hingeIndex),
      });
      hingeIndex += 1;
    }

    const ok = makeJointSelectedParts({ connectors });
    if (ok) {
      closeMakeJointModal();
    }
  };

  return (
    <Modal
      open={open}
      title="Make connector"
      onClose={closeMakeJointModal}
      className="max-w-md"
    >
      <div className="flex flex-col gap-4">
        <Text variant="muted">
          Select the parts for the limbs. Mark only bend points — one shared
          hips, then each knee and ankle. Leave long parts unmarked. Connect
          builds a tree so rotating a bend moves everything below it.
        </Text>
        <div className="flex flex-col gap-2">
          <Text variant="muted">Selection</Text>
          <div className="border-border flex max-h-56 flex-col gap-2 overflow-y-auto rounded-sm border p-2">
            <label
              className={
                includeNew && markedIds.size === 0
                  ? 'bg-surface-hover flex cursor-pointer items-start gap-2 rounded-sm p-2'
                  : 'hover:bg-surface-hover flex cursor-pointer items-start gap-2 rounded-sm p-2'
              }
            >
              <input
                type="checkbox"
                className="accent-accent mt-1"
                checked={includeNew}
                onChange={(event) => setIncludeNew(event.target.checked)}
              />
              <span className="flex min-w-0 flex-col gap-2">
                <Text as="span">New connector</Text>
                <Text variant="muted" as="span">
                  Empty bend between the top part and the rest (when nothing
                  else is marked)
                </Text>
              </span>
            </label>
            {nodes.map((object) => {
              const checked = markedIds.has(object.uuid);
              return (
                <label
                  key={object.uuid}
                  className={
                    checked
                      ? 'bg-surface-hover flex cursor-pointer items-center gap-2 rounded-sm p-2'
                      : 'hover:bg-surface-hover flex cursor-pointer items-center gap-2 rounded-sm p-2'
                  }
                >
                  <input
                    type="checkbox"
                    className="accent-accent"
                    checked={checked}
                    onChange={() => onToggleMarked(object.uuid)}
                  />
                  <span
                    className="border-border size-4 shrink-0 rounded-sm border"
                    style={{ backgroundColor: previewSwatch(object) }}
                    aria-hidden
                  />
                  <span className="flex min-w-0 flex-col gap-2">
                    <Text as="span">{object.name || 'Unnamed'}</Text>
                    <Text variant="muted" as="span">
                      {isCreateJoint(object)
                        ? 'Existing connector'
                        : 'Part'}
                    </Text>
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="default" onClick={closeMakeJointModal}>
            Cancel
          </Button>
          <Button
            variant={canConnect ? 'primary' : 'default'}
            disabled={!canConnect}
            onClick={onConnect}
          >
            Connect
          </Button>
        </div>
      </div>
    </Modal>
  );
}
