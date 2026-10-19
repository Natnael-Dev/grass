import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EasterEggs } from '../../src/easter/eggs';
import { COPY } from '../../src/ui/copy';
import type { HintLine } from '../../src/ui/HintLine';

describe('EasterEggs', () => {
  let mockHintLine: HintLine;

  beforeEach(() => {
    vi.useFakeTimers();
    mockHintLine = {
      show: vi.fn(),
      fadeOut: vi.fn(),
      hideImmediately: vi.fn(),
      getIsVisible: vi.fn().mockReturnValue(false),
      setReducedMotion: vi.fn(),
      dispose: vi.fn(),
      element: {} as HTMLElement,
    } as unknown as HintLine;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('EE-1: exit keystroke buffer', () => {
    it('triggers onExitTriggered when typing e-x-i-t consecutively', () => {
      const onExit = vi.fn();
      const eggs = new EasterEggs({
        hintLine: mockHintLine,
        onExitTriggered: onExit,
      });

      eggs.onKeyDown({ key: 'e' } as KeyboardEvent);
      eggs.onKeyDown({ key: 'x' } as KeyboardEvent);
      eggs.onKeyDown({ key: 'i' } as KeyboardEvent);
      expect(onExit).not.toHaveBeenCalled();

      eggs.onKeyDown({ key: 't' } as KeyboardEvent);
      expect(onExit).toHaveBeenCalledTimes(1);

      eggs.dispose();
    });

    it('clears buffer after 2 seconds of inactivity', () => {
      const onExit = vi.fn();
      const eggs = new EasterEggs({
        hintLine: mockHintLine,
        onExitTriggered: onExit,
      });

      eggs.onKeyDown({ key: 'e' } as KeyboardEvent);
      eggs.onKeyDown({ key: 'x' } as KeyboardEvent);

      // Wait 2000 ms -> buffer clears
      vi.advanceTimersByTime(2000);
      expect(eggs.getBuffer()).toBe('');

      eggs.onKeyDown({ key: 'i' } as KeyboardEvent);
      eggs.onKeyDown({ key: 't' } as KeyboardEvent);
      expect(onExit).not.toHaveBeenCalled();

      eggs.dispose();
    });

    it('ignores keystrokes when help dialog is open', () => {
      const onExit = vi.fn();
      const eggs = new EasterEggs({
        hintLine: mockHintLine,
        onExitTriggered: onExit,
        isHelpOpen: () => true,
      });

      eggs.onKeyDown({ key: 'e' } as KeyboardEvent);
      eggs.onKeyDown({ key: 'x' } as KeyboardEvent);
      eggs.onKeyDown({ key: 'i' } as KeyboardEvent);
      eggs.onKeyDown({ key: 't' } as KeyboardEvent);
      expect(onExit).not.toHaveBeenCalled();

      eggs.dispose();
    });
  });

  describe('EE-2: 10s lie-down hold hint', () => {
    it('shows merge conflicts hint only once', () => {
      const eggs = new EasterEggs({ hintLine: mockHintLine });

      eggs.onHold10s();
      expect(mockHintLine.show).toHaveBeenCalledWith(COPY.eggs.ee2);

      // Subsequent triggers do nothing
      eggs.onHold10s();
      expect(mockHintLine.show).toHaveBeenCalledTimes(1);

      eggs.dispose();
    });
  });

  describe('EE-3: uptime announcements', () => {
    it('shows 3-minute and 10-minute break announcements once', () => {
      const eggs = new EasterEggs({ hintLine: mockHintLine });

      eggs.onUptime3Min();
      expect(mockHintLine.show).toHaveBeenCalledWith(COPY.eggs.ee3_3min);

      eggs.onUptime3Min();
      expect(mockHintLine.show).toHaveBeenCalledTimes(1);

      eggs.onUptime10Min();
      expect(mockHintLine.show).toHaveBeenCalledWith(COPY.eggs.ee3_10min);

      eggs.onUptime10Min();
      expect(mockHintLine.show).toHaveBeenCalledTimes(2);

      eggs.dispose();
    });
  });

  describe('EE-4: console greeting', () => {
    it('logs formatted greeting with ascii blade', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      EasterEggs.logConsoleGreeting();
      expect(consoleSpy).toHaveBeenCalled();
      const [msg] = consoleSpy.mock.calls[0]!;
      expect(msg).toContain('\\|/');
      expect(msg).toContain('hey dev');
      consoleSpy.mockRestore();
    });
  });
});
