import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HintSequencer } from '../../src/ui/HintSequencer';
import { HintLine } from '../../src/ui/HintLine';
import { COPY } from '../../src/ui/copy';
import { safeStorage } from '../../src/core/storage';

class MockElement {
  public tagName = 'DIV';
  public className = '';
  public style: Record<string, string> = {};
  public children: MockElement[] = [];
  public parentElement: MockElement | null = null;
  public textContent = '';
  public attributes = new Map<string, string>();

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
}

if (typeof globalThis.document === 'undefined') {
  globalThis.document = {
    createElement: () => new MockElement(),
    body: new MockElement(),
  } as unknown as Document;
}

describe('HintLine', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders hint line with aria-live and handles typewriter and fade', () => {
    const hintLine = new HintLine();
    expect(hintLine.element.getAttribute('aria-live')).toBe('polite');

    hintLine.show('test hint');
    expect(hintLine.getIsVisible()).toBe(true);

    hintLine.fadeOut();
    vi.advanceTimersByTime(1000);
    expect(hintLine.getIsVisible()).toBe(false);

    hintLine.dispose();
  });
});

describe('HintSequencer', () => {
  let mockHintLine: HintLine;

  beforeEach(() => {
    vi.useFakeTimers();
    safeStorage.setHintsSeen(false);
    mockHintLine = {
      show: vi.fn(),
      fadeOut: vi.fn(),
      hideImmediately: vi.fn(),
      getIsVisible: vi.fn().mockReturnValue(false),
      setReducedMotion: vi.fn(),
      dispose: vi.fn(),
      element: new MockElement() as unknown as HTMLElement,
    } as unknown as HintLine;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows single hint after entry and dismisses with fadeOut on first interaction', () => {
    const onComplete = vi.fn();
    const sequencer = new HintSequencer({
      hintLine: mockHintLine,
      isTouch: false,
      hintsSeen: false,
      onComplete,
    });

    sequencer.start();
    expect(mockHintLine.show).not.toHaveBeenCalled();

    // +1.2 s -> Hint appears
    vi.advanceTimersByTime(1200);
    expect(mockHintLine.show).toHaveBeenCalledWith(COPY.hints.desktop[0]);

    // On brush interaction -> dismiss immediately with fade
    sequencer.onBrush(15);
    expect(mockHintLine.fadeOut).toHaveBeenCalled();
    expect(sequencer.isCompleted()).toBe(true);
    expect(safeStorage.getHintsSeen()).toBe(true);
    expect(onComplete).toHaveBeenCalled();

    sequencer.dispose();
  });

  it('uses touch copy variant when isTouch is true', () => {
    const sequencer = new HintSequencer({
      hintLine: mockHintLine,
      isTouch: true,
      hintsSeen: false,
    });

    sequencer.start();
    vi.advanceTimersByTime(1200);
    expect(mockHintLine.show).toHaveBeenCalledWith(COPY.hints.touch[0]);

    sequencer.dispose();
  });

  it('does nothing when hintsSeen is true (returning visitor)', () => {
    const sequencer = new HintSequencer({
      hintLine: mockHintLine,
      hintsSeen: true,
    });

    sequencer.start();
    vi.advanceTimersByTime(5000);
    expect(mockHintLine.show).not.toHaveBeenCalled();
    expect(sequencer.isCompleted()).toBe(true);

    sequencer.dispose();
  });
});
