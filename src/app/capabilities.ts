import type { QualityTier } from './flags';

export interface Capabilities {
  hasWebGL2: boolean;
  isTouch: boolean;
  reducedMotion: boolean;
  tier: QualityTier;
  dprCap: number;
}

export function detectCapabilities(overrideTier?: QualityTier | null): Capabilities {
  let hasWebGL2 = false;
  if (typeof document !== 'undefined') {
    try {
      const canvas = document.createElement('canvas');
      hasWebGL2 = Boolean(canvas.getContext('webgl2'));
    } catch {
      hasWebGL2 = false;
    }
  }

  let isTouch = false;
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
    isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  let reducedMotion = false;
  if (typeof window !== 'undefined' && window.matchMedia) {
    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Determine initial quality tier
  let tier: QualityTier = 'high';
  if (overrideTier) {
    tier = overrideTier;
  } else if (isTouch) {
    tier = 'medium';
  } else if (
    typeof navigator !== 'undefined' &&
    navigator.hardwareConcurrency &&
    navigator.hardwareConcurrency <= 4
  ) {
    tier = 'medium';
  }

  // DPR caps defined in docs/01-design/design-system.md:
  // high: 2.0, medium: 1.5, low: 1.25
  const dprCaps: Record<QualityTier, number> = {
    high: 2.0,
    medium: 1.5,
    low: 1.25,
  };

  return {
    hasWebGL2,
    isTouch,
    reducedMotion,
    tier,
    dprCap: dprCaps[tier],
  };
}
