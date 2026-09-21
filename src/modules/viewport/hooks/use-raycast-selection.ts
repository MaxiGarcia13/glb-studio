import { useStore } from '@nanostores/react';
import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import {
  resolveJointPickTarget,
  resolveShiftCreatePartPick,
} from '@/modules/create/domain/resolve-joint-pick';
import {
  openContextMenuAtPointer,
  openContextMenuForModel,
  openContextMenuForPart,
} from '../actions/open-selection-context-menu';
import { PICK_DRAG_THRESHOLD_PX } from '../constants/selection';
import { findModelEntryForObject } from '../domain/model-scene';
import { pickObjectAcrossRoots } from '../domain/object-pick';
import { $editTool } from '../stores/edit-tool-store';
import { $model, focusModel } from '../stores/model-store';
import {
  $selection,
  clearSelection,
  replaceObjectInSelection,
  selectObject,
  toggleModelId,
  toggleObject,
} from '../stores/selection-store';

export function useRaycastSelection(): void {
  const { models, previewModelIds } = useStore($model, {
    keys: ['models', 'previewModelIds'],
  });
  const gl = useThree((state) => state.gl);
  const camera = useThree((state) => state.camera);
  const viewport = useThree((state) => state.size);

  useEffect(() => {
    const canvas = gl.domElement;
    const dragOrigin = { x: 0, y: 0 };

    const onPointerDown = (event: PointerEvent) => {
      dragOrigin.x = event.clientX;
      dragOrigin.y = event.clientY;
    };

    const onPointerUp = (event: PointerEvent) => {
      // Right button is reserved for orbit/pan + context menu (handled below).
      if (event.button === 2) {
        return;
      }

      const distance = Math.hypot(event.clientX - dragOrigin.x, event.clientY - dragOrigin.y);
      if (distance > PICK_DRAG_THRESHOLD_PX) {
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      if (
        pointer.x < 0
        || pointer.y < 0
        || pointer.x > viewport.width
        || pointer.y > viewport.height
      ) {
        return;
      }

      const previewSet = new Set(previewModelIds);
      const previewScenes = models
        .filter((model) => previewSet.has(model.id))
        .map((model) => model.scene);

      if (previewScenes.length === 0) {
        clearSelection();
        return;
      }

      const picked = pickObjectAcrossRoots(previewScenes, camera, pointer, viewport);
      const owner = picked ? findModelEntryForObject(picked, models) : null;

      const editTool = $editTool.get();
      if (editTool === 'navigate') {
        return;
      }

      if (editTool === 'move') {
        if (!owner) {
          return;
        }
        if (event.shiftKey) {
          toggleModelId(owner.id);
          return;
        }
        focusModel(owner.id);
        return;
      }

      // Edit tool — Shift+click multi-select (group promote + drill-in on created parts).
      if (event.shiftKey) {
        if (!picked) {
          return;
        }
        if (owner) {
          focusModel(owner.id, { preserveSelection: true });
        }
        if (owner?.source === 'created') {
          const pick = resolveShiftCreatePartPick(picked, $selection.get().objects);
          if (pick.type === 'replace') {
            replaceObjectInSelection(pick.from, pick.to);
          } else {
            toggleObject(pick.object);
          }
          return;
        }
        toggleObject(picked);
        return;
      }

      const target = picked
        ? (
          owner?.source === 'created'
            ? resolveJointPickTarget(picked, $selection.get().objects)
            : picked
        )
        : null;
      if (owner) {
        focusModel(owner.id);
      }
      selectObject(target);
    };

    const onContextMenu = (event: MouseEvent) => {
      // Always suppress the browser menu on the canvas.
      event.preventDefault();

      const distance = Math.hypot(event.clientX - dragOrigin.x, event.clientY - dragOrigin.y);
      // Dragged RMB = orbit/pan; don't open the editor menu.
      if (distance > PICK_DRAG_THRESHOLD_PX) {
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      if (
        pointer.x < 0
        || pointer.y < 0
        || pointer.x > viewport.width
        || pointer.y > viewport.height
      ) {
        return;
      }

      const previewSet = new Set(previewModelIds);
      const previewScenes = models
        .filter((model) => previewSet.has(model.id))
        .map((model) => model.scene);

      if (previewScenes.length === 0) {
        openContextMenuAtPointer(event);
        return;
      }

      const picked = pickObjectAcrossRoots(previewScenes, camera, pointer, viewport);
      const owner = picked ? findModelEntryForObject(picked, models) : null;
      const editTool = $editTool.get();

      if (picked && owner) {
        if (editTool === 'move') {
          openContextMenuForModel(event, owner.id);
          return;
        }
        const target = owner.source === 'created'
          ? resolveJointPickTarget(picked, $selection.get().objects)
          : picked;
        openContextMenuForPart(event, target, owner.id);
        return;
      }

      openContextMenuAtPointer(event);
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('contextmenu', onContextMenu);
    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('contextmenu', onContextMenu);
    };
  }, [gl, camera, viewport, models, previewModelIds]);
}
