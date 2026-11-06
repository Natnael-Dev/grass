import { describe, it, expect, vi } from 'vitest';
import { AdaptiveQuality } from '../../src/core/AdaptiveQuality';
import type { QualityTier } from '../../src/core/types';

describe('AdaptiveQuality Controller', () => {
  it('initializes with default options and starts in warm-up', () => {
    const aq = new AdaptiveQuality();
    expect(aq.getTier()).toBe('high');
    expect(aq.getIsLocked()).toBe(false);
    expect(aq.isWarmupComplete()).toBe(false);

    const metrics = aq.getMetrics();
    expect(metrics.currentTier).toBe('high');
    expect(metrics.isLocked).toBe(false);
    expect(metrics.warmupRemainingSec).toBeCloseTo(3.0, 1);
  });

  it('respects manualOverride locking', () => {
    const onTierChange = vi.fn();
    const aq = new AdaptiveQuality({
      manualOverride: true,
      initialTier: 'high',
      warmupDurationSec: 0,
      onTierChange,
    });

    expect(aq.getIsLocked()).toBe(true);

    // Feed slow frames (30 FPS -> 0.0333s)
    for (let i = 0; i < 150; i++) {
      aq.recordFrame(0.0333);
    }

    expect(aq.getTier()).toBe('high');
    expect(onTierChange).not.toHaveBeenCalled();
  });

  it('calculates average FPS, p95, variance, and standard deviation accurately', () => {
    const aq = new AdaptiveQuality({ windowSize: 10, warmupDurationSec: 0 });

    // Feed five 16ms frames and five 20ms frames
    for (let i = 0; i < 5; i++) aq.recordFrame(0.016);
    for (let i = 0; i < 5; i++) aq.recordFrame(0.02);

    const avgMs = aq.getAverageFrameTimeMs();
    expect(avgMs).toBeCloseTo(18.0, 1);

    const avgFps = aq.getAverageFps();
    expect(avgFps).toBeCloseTo(1000 / 18.0, 1);

    const variance = aq.getVarianceMs2();
    expect(variance).toBeCloseTo(4.0, 1); // diffs are ±2ms, squared is 4ms^2

    const stdDev = aq.getStdDevMs();
    expect(stdDev).toBeCloseTo(2.0, 1);

    const p95 = aq.getP95FrameTimeMs();
    expect(p95).toBeCloseTo(20.0, 1);
  });

  it('does not downgrade during warm-up period even if frame rate is low', () => {
    const onTierChange = vi.fn();
    const aq = new AdaptiveQuality({
      warmupDurationSec: 2.0,
      initialTier: 'high',
      onTierChange,
    });

    // Feed 30 FPS frames for 1.5 seconds (under 2.0s warmup)
    for (let i = 0; i < 45; i++) {
      aq.recordFrame(0.0333);
    }

    expect(aq.isWarmupComplete()).toBe(false);
    expect(aq.getTier()).toBe('high');
    expect(onTierChange).not.toHaveBeenCalled();
  });

  it('triggers down-tiering below 45 FPS after warm-up', () => {
    const tierChanges: { newTier: QualityTier; prevTier: QualityTier; reason: string }[] = [];
    const aq = new AdaptiveQuality({
      warmupDurationSec: 1.0,
      cooldownDurationSec: 2.0,
      initialTier: 'high',
      downgradeFpsThreshold: 45.0,
      onTierChange: (newTier, prevTier, reason) => {
        tierChanges.push({ newTier, prevTier, reason });
      },
    });

    // Pass warmup with normal frames
    for (let i = 0; i < 60; i++) {
      aq.recordFrame(0.0167);
    }
    expect(aq.isWarmupComplete()).toBe(true);
    expect(aq.getTier()).toBe('high');

    // Feed slow frames (30 FPS -> 33.3ms)
    for (let i = 0; i < 40; i++) {
      aq.recordFrame(0.0333);
    }

    expect(aq.getTier()).toBe('medium');
    expect(tierChanges).toHaveLength(1);
    expect(tierChanges[0]!.prevTier).toBe('high');
    expect(tierChanges[0]!.newTier).toBe('medium');
  });

  it('enforces cooldown period between tier changes', () => {
    const tierChanges: QualityTier[] = [];
    const aq = new AdaptiveQuality({
      warmupDurationSec: 0,
      cooldownDurationSec: 2.0,
      initialTier: 'high',
      downgradeFpsThreshold: 45.0,
      onTierChange: (newTier) => tierChanges.push(newTier),
    });

    // Trigger first down-tier to medium
    for (let i = 0; i < 40; i++) {
      aq.recordFrame(0.0333);
    }
    expect(aq.getTier()).toBe('medium');
    expect(tierChanges).toEqual(['medium']);

    // Continue feeding slow frames during cooldown (e.g. 1.0s elapsed < 2.0s cooldown)
    for (let i = 0; i < 30; i++) {
      aq.recordFrame(0.0333);
    }
    // Should still be medium during cooldown
    expect(aq.getTier()).toBe('medium');
    expect(tierChanges).toEqual(['medium']);

    // Complete the cooldown (advance > 1.5s more at 30 FPS)
    for (let i = 0; i < 50; i++) {
      aq.recordFrame(0.0333);
    }

    // Now should down-tier to low
    expect(aq.getTier()).toBe('low');
    expect(tierChanges).toEqual(['medium', 'low']);
  });

  it('clamps at low tier and does not exceed maxDowngrades', () => {
    const aq = new AdaptiveQuality({
      warmupDurationSec: 0,
      cooldownDurationSec: 2.0,
      initialTier: 'high',
      maxDowngrades: 2,
    });

    // Down to medium (40 frames * 0.04s = 1.6s, < 2.0s cooldown)
    for (let i = 0; i < 40; i++) aq.recordFrame(0.04);
    expect(aq.getTier()).toBe('medium');

    // Advance past cooldown (55 frames * 0.04s = 2.2s > 2.0s cooldown)
    for (let i = 0; i < 55; i++) aq.recordFrame(0.04);
    expect(aq.getTier()).toBe('low');

    // Advance past cooldown again (60 frames * 0.04s = 2.4s > 2.0s cooldown)
    // Further slow frames must stay clamped at low and not exceed maxDowngrades
    for (let i = 0; i < 60; i++) aq.recordFrame(0.05);
    expect(aq.getTier()).toBe('low');
  });

  it('supports up-tiering with hysteresis at stable 60 FPS', () => {
    const tierChanges: QualityTier[] = [];
    const aq = new AdaptiveQuality({
      warmupDurationSec: 0,
      cooldownDurationSec: 0.5,
      initialTier: 'medium',
      upgradeFpsThreshold: 58.0,
      windowSize: 60,
      allowAutoUpgrade: true,
      onTierChange: (newTier) => tierChanges.push(newTier),
    });

    // Feed perfectly stable 60 FPS frames (16.6ms) for full window
    for (let i = 0; i < 70; i++) {
      aq.recordFrame(0.0166);
    }

    expect(aq.getTier()).toBe('high');
    expect(tierChanges).toEqual(['high']);
  });

  it('manual setTier updates tier and locks auto-adaptation', () => {
    const aq = new AdaptiveQuality({
      initialTier: 'high',
      warmupDurationSec: 0,
    });

    aq.setTier('low', true);
    expect(aq.getTier()).toBe('low');
    expect(aq.getIsLocked()).toBe(true);

    // Fast 60 FPS frames should NOT auto-upgrade
    for (let i = 0; i < 150; i++) {
      aq.recordFrame(0.0166);
    }
    expect(aq.getTier()).toBe('low');
  });

  it('circular buffer wraps seamlessly without memory leak or NaN', () => {
    const aq = new AdaptiveQuality({ windowSize: 30, warmupDurationSec: 0 });

    for (let i = 0; i < 1000; i++) {
      const dt = 0.016 + Math.sin(i) * 0.002;
      aq.recordFrame(dt);
    }

    const metrics = aq.getMetrics();
    expect(metrics.averageFps).toBeGreaterThan(50);
    expect(metrics.averageFps).toBeLessThan(70);
    expect(Number.isFinite(metrics.varianceMs2)).toBe(true);
    expect(Number.isFinite(metrics.p95FrameTimeMs)).toBe(true);
  });
});
