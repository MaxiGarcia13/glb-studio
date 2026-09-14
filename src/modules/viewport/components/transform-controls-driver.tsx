import type { ComponentRef } from 'react';

import type { OrbitControlsRef } from './model-framing';
import { useStore } from '@nanostores/react';
import { TransformControls } from '@react-three/drei';
import { useEffect, useRef } from 'react';
import { pause } from '@/modules/animation/stores/clip-store/actions/playback';
import { restorePose } from '@/modules/animation/stores/clip-store/actions/restore-pose';
import { $clips } from '@/modules/animation/stores/clip-store/store';
import {
  resumeMixerBindings,
  sampleMixerAt,
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
  const { scene } = useActiveModel();
  const gizmoRef = useRef<TransformControlsRef>(null);

  const isMove = editTool === 'move';
  const gizmoObject = isMove ? scene : selected;
  const gizmoMode = isMove ? 'translate' : mode;
  const gizmoSpace = isMove ? 'world' : 'local';

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
      } else if (!$poseDirty.get()) {
        resumeMixerBindings();
      } else if (isMove && $clips.get().activeClipId) {
        // Show the clip's start pose under the new root while Save is pending.
        sampleMixerAt(0);
      }
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

  return <TransformControls ref={gizmoRef} object={gizmoObject} mode={gizmoMode} space={gizmoSpace} />;
}
