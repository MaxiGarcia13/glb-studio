import type { OrbitControlsRef } from './model-framing';
import { useStore } from '@nanostores/react';
import { OrbitControls } from '@react-three/drei';
import { useEffect } from 'react';
import { MOUSE, TOUCH } from 'three';
import { DEFAULT_CAMERA_TARGET } from '../constants/camera';
import { $editTool } from '../stores/edit-tool-store';

/** Default OrbitControls mapping (Blender-like): LMB orbit, RMB pan. */
const EDIT_MOUSE_BUTTONS = {
  LEFT: MOUSE.ROTATE,
  MIDDLE: MOUSE.DOLLY,
  RIGHT: MOUSE.PAN,
} as const;

/** Hand / Navigate: LMB pans so you can travel the world; RMB orbits. */
const NAVIGATE_MOUSE_BUTTONS = {
  LEFT: MOUSE.PAN,
  MIDDLE: MOUSE.DOLLY,
  RIGHT: MOUSE.ROTATE,
} as const;

const EDIT_TOUCHES = {
  ONE: TOUCH.ROTATE,
  TWO: TOUCH.DOLLY_PAN,
} as const;

const NAVIGATE_TOUCHES = {
  ONE: TOUCH.PAN,
  TWO: TOUCH.DOLLY_ROTATE,
} as const;

interface ViewportOrbitControlsProps {
  controlsRef: React.RefObject<OrbitControlsRef | null>;
}

/**
 * OrbitControls wired to `$editTool`: Navigate remaps primary drag to pan
 * so the hand tool moves through the world; Edit / Move keep orbit-first.
 */
export function ViewportOrbitControls({ controlsRef }: ViewportOrbitControlsProps) {
  const editTool = useStore($editTool);
  const isNavigate = editTool === 'navigate';

  useEffect(() => {
    const orbit = controlsRef.current;
    if (!orbit) {
      return;
    }
    // Leaving a gizmo drag can leave orbit disabled; Navigate must always move.
    if (isNavigate) {
      orbit.enabled = true;
    }
  }, [controlsRef, isNavigate]);

  return (
    <OrbitControls
      enableDamping
      zoomToCursor
      ref={controlsRef}
      target={[...DEFAULT_CAMERA_TARGET]}
      mouseButtons={isNavigate ? NAVIGATE_MOUSE_BUTTONS : EDIT_MOUSE_BUTTONS}
      touches={isNavigate ? NAVIGATE_TOUCHES : EDIT_TOUCHES}
    />
  );
}
