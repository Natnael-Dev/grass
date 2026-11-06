import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HowItWorks } from '../../src/ui/HowItWorks';
import { COPY } from '../../src/ui/copy';

class MockElement {
  public tagName: string;
  public className = '';
  public style: Record<string, string> = {};
  public children: MockElement[] = [];
  public parentElement: MockElement | null = null;
  public attributes = new Map<string, string>();
  public id = '';
  public title = '';
  public type = 'button';
  private _textContent = '';
  private _innerHTML = '';
  private listeners: Record<string, ((e?: unknown) => void)[]> = {};

  constructor(tagName: string) {
    this.tagName = tagName.toUpperCase();
  }

  get textContent(): string {
    if (this._textContent) return this._textContent;
    return this.children.map((c) => c.textContent).join('');
  }

  set textContent(val: string) {
    this._textContent = val;
  }

  get innerHTML(): string {
    return this._innerHTML;
  }

  set innerHTML(val: string) {
    this._innerHTML = val;
    this._textContent = val.replace(/<[^>]*>/g, '');
  }

  setAttribute(name: string, val: string): void {
    this.attributes.set(name, val);
  }

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }

  appendChild(child: MockElement): MockElement {
    this.children.push(child);
    child.parentElement = this;
    return child;
  }

  removeChild(child: MockElement): MockElement {
    this.children = this.children.filter((c) => c !== child);
    child.parentElement = null;
    return child;
  }

  addEventListener(event: string, fn: (e?: unknown) => void): void {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }

  removeEventListener(event: string, fn: (e?: unknown) => void): void {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((f) => f !== fn);
    }
  }

  dispatchEvent(event: {
    type: string;
    key?: string;
    shiftKey?: boolean;
    preventDefault?: () => void;
    target?: unknown;
  }): void {
    for (const fn of this.listeners[event.type] ?? []) {
      fn(event);
    }
  }

  click(): void {
    this.dispatchEvent({ type: 'click', target: this });
  }

  focus(): void {
    if (typeof globalThis.document !== 'undefined') {
      (globalThis.document as unknown as { activeElement: unknown }).activeElement = this;
    }
  }

  querySelectorAll(selector: string): MockElement[] {
    const res: MockElement[] = [];
    const walk = (node: MockElement): void => {
      for (const child of node.children) {
        if (selector.includes('button') && child.tagName === 'BUTTON') {
          res.push(child);
        }
        walk(child);
      }
    };
    walk(this);
    return res;
  }
}

if (typeof globalThis.document === 'undefined') {
  globalThis.document = {
    createElement: (tag: string) => new MockElement(tag),
    body: new MockElement('body'),
    activeElement: null,
  } as unknown as Document;
}

const windowListeners: Record<string, ((e: unknown) => void)[]> = {};
if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    addEventListener: (event: string, fn: (e: unknown) => void) => {
      if (!windowListeners[event]) windowListeners[event] = [];
      windowListeners[event].push(fn);
    },
    removeEventListener: (event: string, fn: (e: unknown) => void) => {
      if (windowListeners[event]) {
        windowListeners[event] = windowListeners[event].filter((f) => f !== fn);
      }
    },
  } as unknown as Window & typeof globalThis;
}

describe('HowItWorks', () => {
  beforeEach(() => {
    (globalThis.document as unknown as { activeElement: unknown }).activeElement = null;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets proper accessible modal dialog attributes', () => {
    const dialog = new HowItWorks();
    expect(dialog.dialog.getAttribute('role')).toBe('dialog');
    expect(dialog.dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.dialog.getAttribute('aria-labelledby')).toBe('how-it-works-title');
    expect(dialog.closeButton.getAttribute('aria-label')).toBe(COPY.howItWorks.closeButton);
    expect(dialog.getIsOpen()).toBe(false);

    dialog.dispose();
  });

  it('opens and closes with focus restoration', () => {
    const trigger = new MockElement('button');
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    const onClose = vi.fn();
    const dialog = new HowItWorks({ onClose });

    dialog.open(trigger as unknown as HTMLElement);
    expect(dialog.getIsOpen()).toBe(true);
    expect(dialog.scrim.style.display).toBe('flex');
    expect(document.activeElement).toBe(dialog.closeButton);

    dialog.close();
    expect(dialog.getIsOpen()).toBe(false);
    expect(dialog.scrim.style.display).toBe('none');
    expect(document.activeElement).toBe(trigger);
    expect(onClose).toHaveBeenCalled();

    dialog.dispose();
  });

  it('closes when Esc key is pressed', () => {
    const dialog = new HowItWorks();
    dialog.open();
    expect(dialog.getIsOpen()).toBe(true);

    // Simulate Escape key
    const escEvent = {
      type: 'keydown',
      key: 'Escape',
      preventDefault: vi.fn(),
    };
    for (const listener of windowListeners['keydown'] ?? []) {
      listener(escEvent);
    }

    expect(escEvent.preventDefault).toHaveBeenCalled();
    expect(dialog.getIsOpen()).toBe(false);

    dialog.dispose();
  });
});
