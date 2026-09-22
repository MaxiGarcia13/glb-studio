import type { StorageKey } from './keys';

function canUseLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function getStoredString(key: StorageKey): string | null {
  if (!canUseLocalStorage()) {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function setStoredString(key: StorageKey, value: string): void {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Private mode / quota — ignore
  }
}

export function removeStored(key: StorageKey): void {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/**
 * Read a stored string and map it through `parse`. Missing key, thrown parse,
 * or `null` from parse → `fallback`.
 */
export function getStoredParsed<T>(
  key: StorageKey,
  parse: (raw: string) => T | null,
  fallback: T,
): T {
  const raw = getStoredString(key);
  if (raw === null) {
    return fallback;
  }

  try {
    const value = parse(raw);
    return value === null ? fallback : value;
  } catch {
    return fallback;
  }
}

/** JSON.parse + optional validate; invalid / missing → `fallback`. */
export function getStoredJson<T>(
  key: StorageKey,
  fallback: T,
  validate?: (value: unknown) => T | null,
): T {
  return getStoredParsed(
    key,
    (raw) => {
      const parsed: unknown = JSON.parse(raw);
      return validate ? validate(parsed) : (parsed as T);
    },
    fallback,
  );
}

export function setStoredJson(key: StorageKey, value: unknown): void {
  setStoredString(key, JSON.stringify(value));
}

export function getStoredNumber(
  key: StorageKey,
  fallback: number,
  opts?: { min?: number; max?: number },
): number {
  return getStoredParsed(
    key,
    (raw) => {
      const parsed = Number.parseFloat(raw);
      if (!Number.isFinite(parsed)) {
        return null;
      }
      return clamp(parsed, opts?.min, opts?.max);
    },
    clamp(fallback, opts?.min, opts?.max),
  );
}

export function setStoredNumber(key: StorageKey, value: number): void {
  if (!Number.isFinite(value)) {
    return;
  }

  setStoredString(key, String(value));
}

function clamp(value: number, min?: number, max?: number): number {
  let next = value;
  if (min !== undefined) {
    next = Math.max(min, next);
  }
  if (max !== undefined) {
    next = Math.min(max, next);
  }
  return next;
}
