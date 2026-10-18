import { describe, it, expect, vi } from 'vitest';
import { parseFlags } from '../../src/app/flags';
import { detectCapabilities } from '../../src/app/capabilities';
import { Store } from '../../src/app/store';

describe('flags', () => {
  it('parses empty query string to defaults', () => {
    const flags = parseFlags('');
    expect(flags.quality).toBeNull();
    expect(flags.mood).toBeNull();
    expect(flags.debug).toBe(false);
    expect(flags.freeze).toBe(false);
    expect(flags.seed).toBe(1337);
  });

  it('parses custom query flags correctly', () => {
    const flags = parseFlags('?quality=low&mood=night&debug=1&seed=42&freeze=1');
    expect(flags.quality).toBe('low');
    expect(flags.mood).toBe('night');
    expect(flags.debug).toBe(true);
    expect(flags.freeze).toBe(true);
    expect(flags.seed).toBe(42);
  });

  it('ignores invalid quality or mood values', () => {
    const flags = parseFlags('?quality=ultra&mood=cyberpunk');
    expect(flags.quality).toBeNull();
    expect(flags.mood).toBeNull();
  });
});

describe('capabilities', () => {
  it('returns valid capabilities and respects tier override', () => {
    const capsHigh = detectCapabilities('high');
    expect(capsHigh.tier).toBe('high');
    expect(capsHigh.dprCap).toBe(2.0);

    const capsLow = detectCapabilities('low');
    expect(capsLow.tier).toBe('low');
    expect(capsLow.dprCap).toBe(1.25);
  });
});

describe('store', () => {
  it('manages state updates and notifies subscribers', () => {
    const store = new Store({ mood: 'golden', quality: 'high' });
    expect(store.getState().mood).toBe('golden');

    const listener = vi.fn();
    const unsub = store.subscribe(listener);

    store.setState({ mood: 'night' });
    expect(store.getState().mood).toBe('night');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ mood: 'night' }),
      expect.objectContaining({ mood: 'golden' }),
    );

    unsub();
    store.setState({ mood: 'dawn' });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
