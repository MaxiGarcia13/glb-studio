import { map } from 'nanostores';

export interface MakeJointUiState {
  open: boolean;
}

export const $makeJointUi = map<MakeJointUiState>({ open: false });

export function openMakeJointModal(): void {
  $makeJointUi.setKey('open', true);
}

export function closeMakeJointModal(): void {
  $makeJointUi.setKey('open', false);
}
