import type { ComponentRef } from 'react';

import type { OrbitControlsRef } from './model-framing';
import { useStore } from '@nanostores/react';
import { TransformControls } from '@react-three/drei';
import { useEffect, useRef } from 'react';
import { commitPendingPose } from '@/modules/animation/stores/clip-store/actions/commit-pending-pose';
import { pause } from '@/modules/animation/stores/clip-store/actions/playback';
import { restorePose } from '@/modules/animation/stores/clip-store/actions/restore-pose';
import {
  resumeMixerBindings,
  suspendMixerBindings,
} from '@/modules/animation/utils/mixer-session';
import { useActiveModel } from '../hooks/use-active-model';
import { $editTool } from '../stores/edit-tool-store';
import {
  $poseDirty,
  $poseEditKind,
  capturePreEditTransform,
  markPoseDirty,
} from '../stores/pose-edit-store';
import { $selection } from '../stores/selection-store';
import { $transformMode } from '../stores/transform-mode-store';
import { $viewportSettings } from '../stores/viewport-settings-store';

export type TransformControlsRef = ComponentRef<typeof TransformControls>;

interface TransformControlsEvents {
  addEventListener: (type: 'dragging-changed' | 'objectChange', listener: (event: { value?: boolean }) => void) => void;
  removeEventListener: (type: 'dragging-changed' | 'objectChange', listener: (event: { value?: boolean }) => void) => void;
}

export interface TransformControlsDriverProps {
  controlsRef: React.RefObject<OrbitControlsRef | null>;
}

export function TransformControlsDriver({ controlsRef }: TransformControlsDriverProps) {
  const { object: selected } = useStore($selection, { keys: ['object'] });
  const mode = useStore($transformMode);
  const editTool = useStore($editTool);
  const { activeModel, scene } = useActiveModel();
  const {
    snapToGrid,
    gridStepMetres,
    snapRotation,
    rotationStepDegrees,
  } = useStore($viewportSettings, {
    keys: ['snapToGrid', 'gridStepMetres', 'snapRotation', 'rotationStepDegrees'],
  });
  const gizmoRef = useRef<TransformControlsRef>(null);

  const isMove = editTool === 'move';
  const gizmoObject
    = editTool === 'navigate'
      ? null
      : isMove
        ? scene
        : selected;
  const gizmoMode = mode;
  const gizmoSpace = isMove ? 'world' : 'local';

  // Built-in TC snaps (US-25): created models only. Rotation snap is radians.
  const created = activeModel?.source === 'created';
  const translationSnap = created && snapToGrid ? gridStepMetres : null;
  const rotationSnap
    = created && snapRotation ? (rotationStepDegrees * Math.PI) / 180 : null;

  useEffect(() => {
    const gizmo = gizmoRef.current as TransformControlsEvents | null;
    const orbit = controlsRef.current;
    if (!gizmo || !orbit) {
      return;
    }

    const onDraggingChanged = (event: { value?: boolean }) => {
      const dragging = Boolean(event.value);
      orbit.enabled = !dragging;
      if (dragging) {
        pause();
        suspendMixerBindings();
        return;
      }
      // Drag end: commit the gesture (one undo entry) or resume if nothing changed.
      if ($poseDirty.get()) {
        commitPendingPose();
        return;
      }
      resumeMixerBindings();
    };

    const onObjectChange = () => {
      const kind = isMove ? 'modelRoot' : 'selection';
      if ($poseDirty.get() && $poseEditKind.get() !== kind) {
        restorePose();
      }
      if (!$poseDirty.get() && gizmoObject) {
        capturePreEditTransform(gizmoObject, kind);
      }
      suspendMixerBindings();
      markPoseDirty();
    };

    gizmo.addEventListener('dragging-changed', onDraggingChanged);
    gizmo.addEventListener('objectChange', onObjectChange);
    return () => {
      gizmo.removeEventListener('dragging-changed', onDraggingChanged);
      gizmo.removeEventListener('objectChange', onObjectChange);
      orbit.enabled = true;
    };
  }, [controlsRef, gizmoObject, isMove]);

  if (!gizmoObject) {
    return null;
  }

  return (
    <TransformControls
      key={gizmoObject.uuid}
      ref={gizmoRef}
      object={gizmoObject}
      mode={gizmoMode}
      space={gizmoSpace}
      translationSnap={translationSnap}
      rotationSnap={rotationSnap}
    />
  );
}
