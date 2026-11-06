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
