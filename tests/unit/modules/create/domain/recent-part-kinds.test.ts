import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_PART_SUGGESTION_ORDER } from '@/modules/create/constants/default-part-suggestions';
import {
  loadRecentKinds,
  prependRecentKind,
  recordRecentKind,
  resolveCompactMenuKinds,
  sanitizeRecentKinds,
} from '@/modules/create/domain/recent-part-kinds';
import { STORAGE_KEYS } from '@/utils/local-storage/keys';
import { setStoredString } from '@/utils/local-storage/local-storage';

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

describe('resolveCompactMenuKinds', () => {
  it('cold start uses the default suggestion order', () => {
    expect(resolveCompactMenuKinds([])).toEqual([...DEFAULT_PART_SUGGESTION_ORDER]);
  });

  it('pads unused defaults after MRU entries', () => {
    expect(resolveCompactMenuKinds(['torus'])).toEqual([
      'torus',
      'box',
      'sphere',
      'capsule',
      'dodecahedron',
    ]);
  });

  it('keeps MRU order and skips defaults already present', () => {
    expect(resolveCompactMenuKinds(['cone', 'box'])).toEqual([
      'cone',
      'box',
      'sphere',
      'capsule',
      'dodecahedron',
    ]);
  });

  it('truncates to five when MRU already fills the window', () => {
    expect(
      resolveCompactMenuKinds([
        'torus',
        'cylinder',
        'plane',
        'ring',
        'triangle',
        'polygon',
      ]),
    ).toEqual(['torus', 'cylinder', 'plane', 'ring', 'triangle']);
  });
});

describe('prependRecentKind / recordRecentKind', () => {
  beforeEach(() => {
    installMemoryLocalStorage();
  });

  it('promotes an existing kind to the front without duplicates', () => {
    expect(prependRecentKind(['torus', 'box', 'sphere'], 'box')).toEqual([
      'box',
      'torus',
      'sphere',
    ]);
  });

  it('truncates to five when recording a sixth distinct kind', () => {
    const recent = ['torus', 'box', 'sphere', 'capsule', 'dodecahedron'] as const;
    expect(prependRecentKind(recent, 'cone')).toEqual([
      'cone',
      'torus',
      'box',
      'sphere',
      'capsule',
    ]);
  });

  it('persists the updated MRU window', () => {
    const next = recordRecentKind(['box'], 'torus');
    expect(next).toEqual(['torus', 'box']);
    expect(loadRecentKinds()).toEqual(['torus', 'box']);
  });
});

describe('sanitizeRecentKinds / loadRecentKinds', () => {
  beforeEach(() => {
    installMemoryLocalStorage();
  });

  it('drops invalid entries, duplicates, and overflow', () => {
    expect(
      sanitizeRecentKinds([
        'box',
        'not-a-kind',
        'box',
        'sphere',
        'capsule',
        'dodecahedron',
        'cone',
        'torus',
        42,
        null,
      ]),
    ).toEqual(['box', 'sphere', 'capsule', 'dodecahedron', 'cone']);
  });

  it('treats missing or invalid storage as empty (cold start)', () => {
    expect(loadRecentKinds()).toEqual([]);

    setStoredString(STORAGE_KEYS.recentPartKinds, '{');
    expect(loadRecentKinds()).toEqual([]);

    setStoredString(STORAGE_KEYS.recentPartKinds, '"nope"');
    expect(loadRecentKinds()).toEqual([]);

    setStoredString(STORAGE_KEYS.recentPartKinds, '["box","??","sphere"]');
    expect(loadRecentKinds()).toEqual(['box', 'sphere']);
  });
});
