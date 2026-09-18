import { beforeEach, describe, expect, it, vi } from 'vitest';

import { STORAGE_KEYS } from '@/utils/local-storage/keys';
import {
  getStoredNumber,
  getStoredString,
  removeStored,
  setStoredNumber,
  setStoredString,
} from '@/utils/local-storage/local-storage';

function installMemoryLocalStorage(): void {
  const map = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key) => map.get(key) ?? null,
    key: (index) => [...map.keys()][index] ?? null,
    removeItem: (key) => {
      map.delete(key);
    },
    setItem: (key, value) => {
      map.set(key, String(value));
    },
  };

  vi.stubGlobal('window', { localStorage: storage });
  vi.stubGlobal('localStorage', storage);
}

describe('local-storage', () => {
  beforeEach(() => {
    installMemoryLocalStorage();
  });

  it('round-trips strings', () => {
    setStoredString(STORAGE_KEYS.libraryAsideWidth, '320');
    expect(getStoredString(STORAGE_KEYS.libraryAsideWidth)).toBe('320');
    removeStored(STORAGE_KEYS.libraryAsideWidth);
    expect(getStoredString(STORAGE_KEYS.libraryAsideWidth)).toBeNull();
  });

  it('reads numbers with clamp and fallback', () => {
    expect(getStoredNumber(STORAGE_KEYS.previewBarHeight, 224, { min: 160, max: 560 })).toBe(224);

    setStoredNumber(STORAGE_KEYS.previewBarHeight, 300);
    expect(getStoredNumber(STORAGE_KEYS.previewBarHeight, 224, { min: 160, max: 560 })).toBe(300);

    setStoredString(STORAGE_KEYS.previewBarHeight, '999');
    expect(getStoredNumber(STORAGE_KEYS.previewBarHeight, 224, { min: 160, max: 560 })).toBe(560);

    setStoredString(STORAGE_KEYS.previewBarHeight, 'not-a-number');
    expect(getStoredNumber(STORAGE_KEYS.previewBarHeight, 224, { min: 160, max: 560 })).toBe(224);
  });

  it('swallows localStorage failures', () => {
    const storage = window.localStorage;
    const spy = vi.spyOn(storage, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(() => setStoredNumber(STORAGE_KEYS.libraryAsideWidth, 400)).not.toThrow();
    spy.mockRestore();
  });
});
