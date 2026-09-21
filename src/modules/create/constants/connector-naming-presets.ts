/**
 * Optional naming packs for Make connector.
 * Presets only suggest names — users can always type anything (animals, props, etc.).
 */

export type ConnectorNamingPresetId = 'custom' | 'humanoid' | 'quad';

export interface ConnectorNameOption {
  /** Value written onto the joint / bone. */
  value: string;
  /** Plain-language label in the UI. */
  label: string;
}

export interface ConnectorNamingPreset {
  id: ConnectorNamingPresetId;
  /** Dropdown label. */
  label: string;
  /** Short help under the preset control. */
  hint: string;
  options: readonly ConnectorNameOption[];
}

const HUMANOID_OPTIONS: readonly ConnectorNameOption[] = [
  { value: 'Hips', label: 'Hips (pelvis)' },
  { value: 'Spine', label: 'Spine' },
  { value: 'Chest', label: 'Chest' },
  { value: 'UpperChest', label: 'Upper chest' },
  { value: 'Neck', label: 'Neck' },
  { value: 'Head', label: 'Head' },
  { value: 'LeftShoulder', label: 'Left shoulder' },
  { value: 'LeftArm', label: 'Left upper arm (shoulder hinge)' },
  { value: 'LeftForeArm', label: 'Left forearm (elbow hinge)' },
  { value: 'LeftHand', label: 'Left hand (wrist hinge)' },
  { value: 'RightShoulder', label: 'Right shoulder' },
  { value: 'RightArm', label: 'Right upper arm (shoulder hinge)' },
  { value: 'RightForeArm', label: 'Right forearm (elbow hinge)' },
  { value: 'RightHand', label: 'Right hand (wrist hinge)' },
  { value: 'LeftUpLeg', label: 'Left thigh (hip hinge)' },
  { value: 'LeftLeg', label: 'Left shin (knee hinge)' },
  { value: 'LeftFoot', label: 'Left foot (ankle hinge)' },
  { value: 'LeftToeBase', label: 'Left toes' },
  { value: 'RightUpLeg', label: 'Right thigh (hip hinge)' },
  { value: 'RightLeg', label: 'Right shin (knee hinge)' },
  { value: 'RightFoot', label: 'Right foot (ankle hinge)' },
  { value: 'RightToeBase', label: 'Right toes' },
];

/** Readable names for four-legged / animal-style rigs (not Mixamo-locked). */
const QUAD_OPTIONS: readonly ConnectorNameOption[] = [
  { value: 'Hips', label: 'Hips (pelvis)' },
  { value: 'Spine', label: 'Spine' },
  { value: 'Chest', label: 'Chest' },
  { value: 'Neck', label: 'Neck' },
  { value: 'Head', label: 'Head' },
  { value: 'Tail', label: 'Tail root' },
  { value: 'TailMid', label: 'Tail mid' },
  { value: 'TailTip', label: 'Tail tip' },
  { value: 'LeftFrontUpper', label: 'Front left upper' },
  { value: 'LeftFrontLower', label: 'Front left lower' },
  { value: 'LeftFrontFoot', label: 'Front left paw / foot' },
  { value: 'RightFrontUpper', label: 'Front right upper' },
  { value: 'RightFrontLower', label: 'Front right lower' },
  { value: 'RightFrontFoot', label: 'Front right paw / foot' },
  { value: 'LeftHindUpper', label: 'Hind left upper' },
  { value: 'LeftHindLower', label: 'Hind left lower' },
  { value: 'LeftHindFoot', label: 'Hind left paw / foot' },
  { value: 'RightHindUpper', label: 'Hind right upper' },
  { value: 'RightHindLower', label: 'Hind right lower' },
  { value: 'RightHindFoot', label: 'Hind right paw / foot' },
];

export const CONNECTOR_NAMING_PRESETS: Record<
  ConnectorNamingPresetId,
  ConnectorNamingPreset
> = {
  custom: {
    id: 'custom',
    label: 'Custom (any model)',
    hint: 'Type your own names — robots, animals, props, anything.',
    options: [],
  },
  humanoid: {
    id: 'humanoid',
    label: 'Humanoid',
    hint: 'Plain labels that save as common animation bone names (thigh ≠ shin).',
    options: HUMANOID_OPTIONS,
  },
  quad: {
    id: 'quad',
    label: 'Four-legged',
    hint: 'Suggestions for animals and creatures — rename freely if needed.',
    options: QUAD_OPTIONS,
  },
};

export const CONNECTOR_NAMING_PRESET_OPTIONS = (
  Object.values(CONNECTOR_NAMING_PRESETS) as ConnectorNamingPreset[]
).map((preset) => ({
  value: preset.id,
  label: preset.label,
}));

export function isConnectorNamingPresetId(
  value: string,
): value is ConnectorNamingPresetId {
  return value === 'custom' || value === 'humanoid' || value === 'quad';
}

/** Select options for the active preset (empty when Custom). */
export function connectorPresetSelectOptions(
  presetId: ConnectorNamingPresetId,
): { value: string; label: string }[] {
  return CONNECTOR_NAMING_PRESETS[presetId].options.map((option) => ({
    value: option.value,
    label: option.label,
  }));
}
