import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Vignette } from '../../src/ui/Vignette';

class MockElement {
  public style: Record<string, string> = {};
  public dataset: Record<string, string> = {};
  public remove = vi.fn();
  public setAttribute = vi.fn();
}

describe('Vignette', () => {
  let mockEl: MockElement;

  beforeEach(() => {
    mockEl = new MockElement();
  });

  it('initializes with base intensity', () => {
    const vignette = new Vignette(mockEl as unknown as HTMLElement, { baseIntensity: 0.35 });
    expect(vignette.getEffectiveIntensity()).toBeCloseTo(0.35, 2);
    expect(mockEl.style.background).toContain('0.350');
    vignette.dispose();
  });

  it('increases intensity by +0.25 over 1.1s ease-out when lying down', () => {
    const vignette = new Vignette(mockEl as unknown as HTMLElement, { baseIntensity: 0.35 });
    vignette.setLying(true);

    // After 0.5s of transition
    for (let i = 0; i < 10; i++) {
      vignette.update(0.05);
    }
    expect(vignette.getEffectiveIntensity()).toBeGreaterThan(0.35);
    expect(vignette.getEffectiveIntensity()).toBeLessThan(0.6);

    // After 1.2s total (transition complete)
    for (let i = 0; i < 14; i++) {
      vignette.update(0.05);
    }
    expect(vignette.getEffectiveIntensity()).toBeCloseTo(0.6, 2); // 0.35 + 0.25
    expect(mockEl.style.background).toContain('0.600');
    vignette.dispose();
  });

  it('restores base intensity over 0.9s ease-inout when releasing lie-down', () => {
    const vignette = new Vignette(mockEl as unknown as HTMLElement, { baseIntensity: 0.35 });
    vignette.setLying(true);
    for (let i = 0; i < 24; i++) {
      vignette.update(0.05);
    }
    expect(vignette.getEffectiveIntensity()).toBeCloseTo(0.6, 2);

    vignette.setLying(false);
    for (let i = 0; i < 20; i++) {
      vignette.update(0.05); // 1.0s (> 0.9s)
    }
    expect(vignette.getEffectiveIntensity()).toBeCloseTo(0.35, 2);
    expect(mockEl.style.background).toContain('0.350');
    vignette.dispose();
  });

  it('keeps intensity unchanged in reduced motion mode', () => {
    const vignette = new Vignette(mockEl as unknown as HTMLElement, {
      baseIntensity: 0.35,
      reducedMotion: true,
    });
    vignette.setLying(true);
    for (let i = 0; i < 24; i++) {
      vignette.update(0.05);
    }
    // Reduced motion specifies: no vignette change
    expect(vignette.getEffectiveIntensity()).toBeCloseTo(0.35, 2);
    expect(mockEl.style.background).toContain('0.350');
    vignette.dispose();
  });
});
