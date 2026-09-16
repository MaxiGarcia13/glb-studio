import { useStore } from '@nanostores/react';
import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { PICK_DRAG_THRESHOLD_PX } from '../constants/selection';
import { findModelEntryForObject } from '../domain/model-scene';
import { pickObjectAcrossRoots } from '../domain/object-pick';
import { $editTool } from '../stores/edit-tool-store';
import { $model, focusModel } from '../stores/model-store';
import { clearSelection, selectObject } from '../stores/selection-store';

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
        if (owner) {
          focusModel(owner.id);
        }
        return;
      }

      if (owner) {
        focusModel(owner.id);
      }
      selectObject(picked);
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointerup', onPointerUp);
    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
    };
  }, [gl, camera, viewport, models, previewModelIds]);
}
