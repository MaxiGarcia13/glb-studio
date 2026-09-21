import { describe, expect, it } from 'vitest';

import {
  CONNECTOR_NAMING_PRESETS,
  connectorPresetSelectOptions,
  isConnectorNamingPresetId,
} from '@/modules/create/constants/connector-naming-presets';

describe('connector naming presets', () => {
  it('keeps custom empty so any model can type free names', () => {
    expect(CONNECTOR_NAMING_PRESETS.custom.options).toEqual([]);
    expect(connectorPresetSelectOptions('custom')).toEqual([]);
  });

  it('exposes plain-language humanoid labels that save Mixamo-style values', () => {
    const thigh = CONNECTOR_NAMING_PRESETS.humanoid.options.find(
      (option) => option.value === 'RightUpLeg',
    );
    const shin = CONNECTOR_NAMING_PRESETS.humanoid.options.find(
      (option) => option.value === 'RightLeg',
    );
    expect(thigh?.label).toMatch(/thigh/i);
    expect(shin?.label).toMatch(/shin/i);
  });

  it('offers four-legged suggestions without requiring Mixamo limb names', () => {
    const values = CONNECTOR_NAMING_PRESETS.quad.options.map(
      (option) => option.value,
    );
    expect(values).toContain('LeftHindFoot');
    expect(values).toContain('Tail');
    expect(values).not.toContain('LeftUpLeg');
  });

  it('narrows preset ids', () => {
    expect(isConnectorNamingPresetId('quad')).toBe(true);
    expect(isConnectorNamingPresetId('dragon')).toBe(false);
  });
});
