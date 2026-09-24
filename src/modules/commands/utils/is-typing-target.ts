/**
 * True when keyboard focus is in a control that owns typing, so editor
 * shortcuts must not fire (focus rules).
 */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
    return true;
  }

  if (target.isContentEditable) {
    return true;
  }

  // Nested editable (e.g. child of contenteditable) still owns keys.
  return target.closest('[contenteditable=""], [contenteditable="true"]') !== null;
}
