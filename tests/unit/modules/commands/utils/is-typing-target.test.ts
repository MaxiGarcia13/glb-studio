import { beforeEach, describe, expect, it, vi } from 'vitest';

import { isTypingTarget } from '@/modules/commands/utils/is-typing-target';

class FakeHTMLElement {
  tagName: string;
  isContentEditable: boolean;
  #closestMatch: FakeHTMLElement | null;

  constructor(
    tagName: string,
    options: {
      isContentEditable?: boolean;
      closestMatch?: FakeHTMLElement | null;
    } = {},
  ) {
    this.tagName = tagName;
    this.isContentEditable = options.isContentEditable ?? false;
    this.#closestMatch = options.closestMatch ?? null;
  }

  closest(_selector: string): FakeHTMLElement | null {
    return this.#closestMatch;
  }
}

describe('isTypingTarget', () => {
  beforeEach(() => {
    vi.stubGlobal('HTMLElement', FakeHTMLElement);
  });

  it('is false for null and non-elements', () => {
    expect(isTypingTarget(null)).toBe(false);
    expect(isTypingTarget({} as EventTarget)).toBe(false);
  });

  it('is true for input, textarea, and select', () => {
    expect(isTypingTarget(new FakeHTMLElement('INPUT') as unknown as EventTarget)).toBe(
      true,
    );
    expect(
      isTypingTarget(new FakeHTMLElement('TEXTAREA') as unknown as EventTarget),
    ).toBe(true);
    expect(
      isTypingTarget(new FakeHTMLElement('SELECT') as unknown as EventTarget),
    ).toBe(true);
  });

  it('is true for contenteditable hosts and nested editable descendants', () => {
    expect(
      isTypingTarget(
        new FakeHTMLElement('DIV', {
          isContentEditable: true,
        }) as unknown as EventTarget,
      ),
    ).toBe(true);

    const editableHost = new FakeHTMLElement('DIV');
    expect(
      isTypingTarget(
        new FakeHTMLElement('SPAN', {
          closestMatch: editableHost,
        }) as unknown as EventTarget,
      ),
    ).toBe(true);
  });

  it('is false for ordinary non-editable elements', () => {
    expect(
      isTypingTarget(
        new FakeHTMLElement('BUTTON', {
          closestMatch: null,
        }) as unknown as EventTarget,
      ),
    ).toBe(false);
  });
});
