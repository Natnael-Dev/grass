import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MoodSwitch } from '../../src/ui/MoodSwitch';
import { SoundToggle } from '../../src/ui/SoundToggle';
import { Uptime } from '../../src/ui/Uptime';
import { Hud } from '../../src/ui/Hud';

// Lightweight DOM shim for unit testing DOM components in Node runner
class MockElement {
  public tagName: string;
  public className = '';
  public style: Record<string, string> = {};
  public children: MockElement[] = [];
  public parentElement: MockElement | null = null;
  public attributes = new Map<string, string>();
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
    // Extract plain text for simple innerHTML assignments like <span>dawn</span>
    const textMatch = val.replace(/<[^>]*>/g, '');
    this._textContent = textMatch;
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

  dispatchEvent(event: { type: string }): void {
    for (const fn of this.listeners[event.type] ?? []) {
      fn(event);
    }
  }

  click(): void {
    this.dispatchEvent({ type: 'click' });
  }

  querySelectorAll(selector: string): MockElement[] {
    const res: MockElement[] = [];
    const walk = (node: MockElement): void => {
      for (const child of node.children) {
        if (selector === 'button' && child.tagName === 'BUTTON') {
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
  } as unknown as Document;
}

describe('MoodSwitch', () => {
  it('renders 3 mood pills with correct labels and ARIA pressed states', () => {
    const onSelect = vi.fn();
    const moodSwitch = new MoodSwitch({ initialMood: 'golden', onSelect });

    const buttons = moodSwitch.element.querySelectorAll('button');
    expect(buttons).toHaveLength(3);

    const dawnBtn = buttons[0]!;
    const goldenBtn = buttons[1]!;
    const nightBtn = buttons[2]!;

    expect(dawnBtn.textContent).toContain('dawn');
    expect(goldenBtn.textContent).toContain('golden');
    expect(nightBtn.textContent).toContain('night');

    expect(goldenBtn.getAttribute('aria-pressed')).toBe('true');
    expect(dawnBtn.getAttribute('aria-pressed')).toBe('false');

    // Click dawn
    dawnBtn.click();
    expect(onSelect).toHaveBeenCalledWith('dawn');
    expect(dawnBtn.getAttribute('aria-pressed')).toBe('true');
    expect(goldenBtn.getAttribute('aria-pressed')).toBe('false');

    moodSwitch.dispose();
  });
});

describe('SoundToggle', () => {
  it('updates aria-label and aria-pressed on toggle', () => {
    const onToggle = vi.fn();
    const toggle = new SoundToggle({ initialMuted: false, onToggle });

    expect(toggle.element.getAttribute('aria-pressed')).toBe('true');
    expect(toggle.element.getAttribute('aria-label')).toBe('sound on');

    toggle.element.click();
    expect(onToggle).toHaveBeenCalledWith(true);
    expect(toggle.element.getAttribute('aria-pressed')).toBe('false');
    expect(toggle.element.getAttribute('aria-label')).toBe('sound off');

    toggle.dispose();
  });
});

describe('Uptime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('formats seconds into mm:ss display', () => {
    const uptime = new Uptime();
    expect(uptime.element.textContent).toBe('uptime outside: 00:00');

    uptime.setSeconds(65);
    expect(uptime.element.textContent).toBe('uptime outside: 01:05');

    uptime.advance(5);
    expect(uptime.element.textContent).toBe('uptime outside: 01:10');

    uptime.dispose();
  });

  it('triggers 3-minute and 10-minute milestones', () => {
    const onMinute3 = vi.fn();
    const onMinute10 = vi.fn();
    const uptime = new Uptime({ onMinute3, onMinute10 });

    uptime.setSeconds(179);
    expect(onMinute3).not.toHaveBeenCalled();

    uptime.tick(); // 180s
    expect(onMinute3).toHaveBeenCalledTimes(1);

    uptime.tick(); // 181s - should not trigger again
    expect(onMinute3).toHaveBeenCalledTimes(1);

    uptime.setSeconds(599);
    expect(onMinute10).not.toHaveBeenCalled();

    uptime.tick(); // 600s
    expect(onMinute10).toHaveBeenCalledTimes(1);

    uptime.dispose();
  });
});

describe('Hud', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('assembles landmarks and handles fade-on-activity', () => {
    const hud = new Hud({
      initialMood: 'golden',
      initialMuted: false,
    });

    expect(hud.element.tagName.toLowerCase()).toBe('nav');
    expect(hud.element.getAttribute('aria-label')).toBe('controls');
    expect(hud.element.style.opacity).toBe('1');

    // Pointer scene activity starts 4s fade timer
    hud.onPointerSceneActivity();
    expect(hud.element.style.opacity).toBe('1');

    vi.advanceTimersByTime(3999);
    expect(hud.element.style.opacity).toBe('1');

    vi.advanceTimersByTime(1);
    expect(hud.element.style.opacity).toBe('0.45');

    // Leaving scene restores immediately
    hud.onPointerLeaveScene();
    expect(hud.element.style.opacity).toBe('1');

    hud.dispose();
  });
});
