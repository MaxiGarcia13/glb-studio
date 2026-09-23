import type { Group, Object3D } from 'three';
import { cn } from '@maxigarcia/js-utils';
import { useStore } from '@nanostores/react';
import { BoneIcon } from '@/components/icons/bone-icon';
import { Text } from '@/components/text';
import { LibrarySectionCollapsible } from '@/modules/editor-shell/components/library-section-collapsible';
import { openContextMenuForPart } from '@/modules/viewport/actions/open-selection-context-menu';
import { setEditTool } from '@/modules/viewport/stores/edit-tool-store';
import { $model, selectModel } from '@/modules/viewport/stores/model-store';
import {
  $selection,
  selectObject,
  toggleObject,
} from '@/modules/viewport/stores/selection-store';
import { isCreateHierarchyNode } from '../domain/group-data';
import { listCreatedPartEntries } from '../domain/list-created-parts';
import { readPartColorMapEntry } from '../domain/read-part-color-map';
import { $createPartsRevision } from '../stores/create-parts-revision-store';
import { $materialMapsRevision } from '../stores/material-maps-revision-store';
import { PartTextureRow } from './part-texture-row';

interface PartOutlinerProps {
  modelId: string;
  scene: Group;
  className?: string;
}

/**
 * Library outliner of stamped parts and empty groups for a created model.
 * Parents use `LibrarySectionCollapsible` (closed by default). BoneIcon marks part rows.
 * Textured parts nest a Library texture row (US-48). Click a row to focus the model
 * (if needed), switch to Edit, and select the node. Shift+click toggles membership.
 */
export function PartOutliner({ modelId, scene, className }: PartOutlinerProps) {
  useStore($createPartsRevision);
  useStore($materialMapsRevision);
  const { object: active, objects } = useStore($selection, {
    keys: ['object', 'objects'],
  });
  const entries = listCreatedPartEntries(scene);

  if (entries.length === 0) {
    return null;
  }

  const entryByUuid = new Map(entries.map((entry) => [entry.object.uuid, entry]));
  const roots = entries.filter(({ depth }) => depth === 0).map(({ object }) => object);

  function getChildren(object: Object3D): Object3D[] {
    return object.children.filter((child) => isCreateHierarchyNode(child));
  }

  function selectNode(object: Object3D, event: React.MouseEvent) {
    if ($model.get().activeModelId !== modelId) {
      selectModel(modelId);
    }
    setEditTool('edit');
    if (event.shiftKey) {
      toggleObject(object);
      return;
    }
    selectObject(object);
  }

  function renderTextureRow(object: Object3D) {
    const colorMap = readPartColorMapEntry(object);
    if (!colorMap) {
      return null;
    }
    return (
      <PartTextureRow
        modelId={modelId}
        mesh={colorMap.mesh}
        material={colorMap.material}
        label={colorMap.label}
      />
    );
  }

  function renderNode(object: Object3D) {
    const entry = entryByUuid.get(object.uuid);
    if (!entry) {
      return null;
    }

    const children = getChildren(object);
    const label = object.name || object.uuid;
    const isSelected = objects.includes(object);
    const isActive = active === object;
    const { isGroup } = entry;
    const textureRow = renderTextureRow(object);

    const title = (
      <button
        type="button"
        title={label}
        className="min-w-0 flex-1 cursor-pointer truncate text-left"
        onClick={(event) => {
          event.stopPropagation();
          selectNode(object, event);
        }}
        onContextMenu={(event) => {
          openContextMenuForPart(event, object, modelId);
        }}
      >
        <Text
          as="span"
          className={cn(
            'min-w-0 truncate',
            isGroup && 'italic',
            isActive || isSelected ? 'text-fg' : 'text-current',
          )}
        >
          {label}
        </Text>
      </button>
    );

    if (children.length === 0) {
      const partRow = (
        <div
          role="treeitem"
          aria-selected={isSelected}
          className={cn(
            'flex w-full min-h-8 items-center gap-2 rounded-sm px-2 py-2 transition-colors',
            isActive
              ? 'bg-surface-hover text-fg'
              : isSelected
                ? 'bg-control text-fg'
                : 'text-fg hover:bg-surface-hover/40',
          )}
        >
          <span className="inline-flex h-8 w-4 shrink-0" aria-hidden />
          {!isGroup
            ? (
                <span className="shrink-0 text-fg-muted" aria-hidden>
                  <BoneIcon />
                </span>
              )
            : null}
          <button
            type="button"
            title={label}
            className="min-w-0 flex-1 cursor-pointer truncate text-left"
            onClick={(event) => selectNode(object, event)}
            onContextMenu={(event) => {
              openContextMenuForPart(event, object, modelId);
            }}
          >
            <Text
              as="span"
              className={cn(
                'min-w-0 truncate text-current',
                isGroup && 'italic',
              )}
            >
              {label}
            </Text>
          </button>
        </div>
      );

      if (!textureRow) {
        return <div key={object.uuid}>{partRow}</div>;
      }

      return (
        <div key={object.uuid} className="flex flex-col gap-2">
          {partRow}
          <div className="pl-4">{textureRow}</div>
        </div>
      );
    }

    return (
      <LibrarySectionCollapsible
        key={object.uuid}
        title={title}
        defaultOpen={false}
        selected={isActive || isSelected}
        showChevron
        showTreeGuide
      >
        {textureRow}
        {children.map((child) => renderNode(child))}
      </LibrarySectionCollapsible>
    );
  }

  return (
    <div
      className={cn('flex flex-col gap-2', className)}
      role="tree"
      aria-label="Parts"
    >
      {roots.map((object) => renderNode(object))}
    </div>
  );
}
