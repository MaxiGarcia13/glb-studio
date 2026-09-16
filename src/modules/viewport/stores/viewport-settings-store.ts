import { map } from 'nanostores';
import { AXES_SIZE } from '../constants/world-axes';

const AXES_SIZE_MIN = 1;
const AXES_SIZE_MAX = 50;

/** Default position snap step (m); matches axes minor tick. */
export const GRID_STEP_METRES_DEFAULT = 0.1;
export const GRID_STEP_METRES_MIN = 0.01;
export const GRID_STEP_METRES_MAX = 10;

/** Default rotation snap step (degrees). */
export const ROTATION_STEP_DEGREES_DEFAULT = 15;
export const ROTATION_STEP_DEGREES_MIN = 1;
export const ROTATION_STEP_DEGREES_MAX = 180;

export interface ViewportSettingsState {
  axesVisible: boolean;
  axesSize: number;
  snapToGrid: boolean;
  gridStepMetres: number;
  snapRotation: boolean;
  rotationStepDegrees: number;
}

export const $viewportSettings = map<ViewportSettingsState>({
  axesVisible: false,
  axesSize: AXES_SIZE,
  snapToGrid: false,
  gridStepMetres: GRID_STEP_METRES_DEFAULT,
  snapRotation: false,
  rotationStepDegrees: ROTATION_STEP_DEGREES_DEFAULT,
});

export function setAxesVisible(visible: boolean): void {
  $viewportSettings.setKey('axesVisible', visible);
}

export function setAxesSize(size: number): void {
  $viewportSettings.setKey('axesSize', Math.min(AXES_SIZE_MAX, Math.max(AXES_SIZE_MIN, size)));
}

export function setSnapToGrid(enabled: boolean): void {
  $viewportSettings.setKey('snapToGrid', enabled);
}

export function setGridStepMetres(metres: number): void {
  $viewportSettings.setKey(
    'gridStepMetres',
    Math.min(GRID_STEP_METRES_MAX, Math.max(GRID_STEP_METRES_MIN, metres)),
  );
}

export function setSnapRotation(enabled: boolean): void {
  $viewportSettings.setKey('snapRotation', enabled);
}

export function setRotationStepDegrees(degrees: number): void {
  $viewportSettings.setKey(
    'rotationStepDegrees',
    Math.min(ROTATION_STEP_DEGREES_MAX, Math.max(ROTATION_STEP_DEGREES_MIN, degrees)),
  );
}
