import type { QualityTier, MoodName } from '../core/types';
export type { QualityTier, MoodName };

export interface AppFlags {
  quality: QualityTier | null;
  mood: MoodName | null;
  debug: boolean;
  seed: number;
  freeze: boolean;
  compare: boolean;
  camera: 'vista' | 'lying' | null;
  ui: boolean;
}

export function parseFlags(
  search = typeof window !== 'undefined' ? window.location.search : '',
): AppFlags {
  const params = new URLSearchParams(search);

  const rawQuality = params.get('quality') || params.get('tier');
  const quality =
    rawQuality === 'high' || rawQuality === 'medium' || rawQuality === 'low' ? rawQuality : null;

  const rawMood = params.get('mood');
  const mood = rawMood === 'dawn' || rawMood === 'golden' || rawMood === 'night' ? rawMood : null;

  const debug = params.get('debug') === '1' || params.get('debug') === 'true';
  const freeze = params.get('freeze') === '1' || params.get('freeze') === 'true';
  const compare = params.get('compare') === '1' || params.get('compare') === 'true';

  const rawCamera = params.get('camera');
  const camera = rawCamera === 'lying' || rawCamera === 'vista' ? rawCamera : null;

  const ui = params.get('ui') !== '0' && params.get('ui') !== 'false';

  const rawSeed = params.get('seed');
  const seed =
    rawSeed !== null && !Number.isNaN(parseInt(rawSeed, 10)) ? parseInt(rawSeed, 10) : 1337;

  return {
    quality,
    mood,
    debug,
    seed,
    freeze,
    compare,
    camera,
    ui,
  };
}
