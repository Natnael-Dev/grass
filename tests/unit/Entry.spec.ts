import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Entry } from '../../src/ui/Entry';
import { COPY } from '../../src/ui/copy';

class MockButton {
  public disabled = false;
  public textContent = '';
  public focused = false;
  private listeners: Record<string, ((e?: unknown) => void)[]> = {};

  addEventListener(event: string, fn: (e?: unknown) => void): void {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }

  removeEventListener(event: string, fn: (e?: unknown) => void): void {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((f) => f !== fn);
    }
  }

  focus(): void {
    this.focused = true;
  }

  click(): void {
    for (const fn of this.listeners['click'] ?? []) {
      fn({ type: 'click' });
    }
  }

  pressKey(key: string): void {
    for (const fn of this.listeners['keydown'] ?? []) {
      fn({ type: 'keydown', key, preventDefault: vi.fn() });
    }
  }
}

class MockOverlay {
  public style: Record<string, string> = {};
  public classes = new Set<string>();

  get classList() {
    return {
      add: (cls: string) => this.classes.add(cls),
      contains: (cls: string) => this.classes.has(cls),
    };
  }
}

describe('Entry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sets loading state after 300 ms delay', () => {
    const btn = new MockButton();
    const overlay = new MockOverlay();
    const entry = new Entry({
      enterButton: btn as unknown as HTMLButtonElement,
      overlayElement: overlay as unknown as HTMLElement,
    });

    entry.setLoading();
    // At t=0 ms, not yet loading
    expect(btn.disabled).toBe(false);

    vi.advanceTimersByTime(299);
    expect(btn.disabled).toBe(false);

    vi.advanceTimersByTime(1);
    expect(btn.disabled).toBe(true);
    expect(btn.textContent).toBe(COPY.entry.buttonLoading);

    entry.dispose();
  });

  it('sets ready state and focuses the button', () => {
    const btn = new MockButton();
    const overlay = new MockOverlay();
    const entry = new Entry({
      enterButton: btn as unknown as HTMLButtonElement,
      overlayElement: overlay as unknown as HTMLElement,
    });

    entry.setReady();
    expect(btn.disabled).toBe(false);
    expect(btn.textContent).toBe(COPY.entry.button);
    expect(btn.focused).toBe(true);

    entry.dispose();
  });

  it('triggers onEnter on button click with 900 ms fade', () => {
    const btn = new MockButton();
    const overlay = new MockOverlay();
    const onEnter = vi.fn();
    const entry = new Entry({
      enterButton: btn as unknown as HTMLButtonElement,
      overlayElement: overlay as unknown as HTMLElement,
      onEnter,
    });

    btn.click();
    expect(onEnter).toHaveBeenCalledWith({ viaKeyboard: false });
    expect(overlay.style.opacity).toBe('0');
    expect(overlay.style.pointerEvents).toBe('none');

    vi.advanceTimersByTime(900);
    expect(overlay.style.display).toBe('none');
    expect(overlay.classes.has('hidden')).toBe(true);

    entry.dispose();
  });

  it('triggers onEnter on Enter keypress with viaKeyboard=true', () => {
    const btn = new MockButton();
    const overlay = new MockOverlay();
    const onEnter = vi.fn();
    const entry = new Entry({
      enterButton: btn as unknown as HTMLButtonElement,
      overlayElement: overlay as unknown as HTMLElement,
      onEnter,
    });

    btn.pressKey('Enter');
    expect(onEnter).toHaveBeenCalledWith({ viaKeyboard: true });

    entry.dispose();
  });
});
