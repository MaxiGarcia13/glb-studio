/** True when the runtime looks like Apple (⌘ vs Ctrl in chord labels). */
export function isMacPlatform(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform)
    || /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent);
}
