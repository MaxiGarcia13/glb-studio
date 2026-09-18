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

export function getStoredNumber(
  key: StorageKey,
  fallback: number,
  opts?: { min?: number; max?: number },
): number {
  const raw = getStoredString(key);
  if (raw === null) {
    return clamp(fallback, opts?.min, opts?.max);
  }

  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed)) {
    return clamp(fallback, opts?.min, opts?.max);
  }

  return clamp(parsed, opts?.min, opts?.max);
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
