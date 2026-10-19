import type { MoodName } from '../core/types';

export interface MoodPreset {
  skyTop: string;
  skyMid: string;
  skyHorizon: string;
  discColor: string;
  discElevationDeg: number;
  discAzimuthDeg: number;
  discSize: number;
  discHalo: number;
  lightColor: string;
  lightIntensity: number;
  ambientColor: string;
  ambientIntensity: number;
  grassBase: string;
  grassTip: string;
  terrainColor: string;
  ridge: [string, string, string];
  fogColor: string;
  fogDensity: number;
  cloudColor: string;
  cloudCover: number;
  starsAmount: number;
  firefliesAmount: number;
  windStrength: number;
  vignette: number;
  audio: {
    wind: number;
    birds: number;
    crickets: number;
  };
}

export const MOOD_PRESETS: Record<MoodName, Readonly<MoodPreset>> = {
  dawn: {
    skyTop: '#4a5a9c',
    skyMid: '#c88fb0',
    skyHorizon: '#ffc9a3',
    discColor: '#fff0d0',
    discElevationDeg: 6,
    discAzimuthDeg: 35,
    discSize: 0.03,
    discHalo: 0.35,
    lightColor: '#ffd9b8',
    lightIntensity: 0.9,
    ambientColor: '#8e86b8',
    ambientIntensity: 0.55,
    grassBase: '#2f6b4a',
    grassTip: '#a8d878',
    terrainColor: '#355f3d',
    ridge: ['#7a6f9c', '#9a86a8', '#c09aac'],
    fogColor: '#e8b9a8',
    fogDensity: 0.02,
    cloudColor: '#ffd2c0',
    cloudCover: 0.45,
    starsAmount: 0,
    firefliesAmount: 0,
    windStrength: 0.75,
    vignette: 0.3,
    audio: {
      wind: 0.7,
      birds: 0.9,
      crickets: 0,
    },
  },
  golden: {
    skyTop: '#5b8fd0',
    skyMid: '#f0b27a',
    skyHorizon: '#ffd89a',
    discColor: '#fff3c4',
    discElevationDeg: 14,
    discAzimuthDeg: 30,
    discSize: 0.036,
    discHalo: 0.45,
    lightColor: '#ffcf8a',
    lightIntensity: 1.1,
    ambientColor: '#a8a0b0',
    ambientIntensity: 0.6,
    grassBase: '#3d7a3a',
    grassTip: '#d4e36a',
    terrainColor: '#4a7a3a',
    ridge: ['#8a9a7a', '#b0a890', '#d6bf9a'],
    fogColor: '#f3cf9f',
    fogDensity: 0.016,
    cloudColor: '#fff0d8',
    cloudCover: 0.4,
    starsAmount: 0,
    firefliesAmount: 0,
    windStrength: 0.9,
    vignette: 0.22,
    audio: {
      wind: 0.8,
      birds: 0.6,
      crickets: 0,
    },
  },
  night: {
    skyTop: '#060b24',
    skyMid: '#101b4a',
    skyHorizon: '#24366e',
    discColor: '#f4f1e0',
    discElevationDeg: 38,
    discAzimuthDeg: 25,
    discSize: 0.026,
    discHalo: 0.3,
    lightColor: '#8fa8ff',
    lightIntensity: 0.45,
    ambientColor: '#1c2a5c',
    ambientIntensity: 0.5,
    grassBase: '#0c2a2a',
    grassTip: '#2f6f5a',
    terrainColor: '#0d2a28',
    ridge: ['#101a3c', '#16254f', '#1d2f62'],
    fogColor: '#0f1a3a',
    fogDensity: 0.02,
    cloudColor: '#3a4a8a',
    cloudCover: 0.35,
    starsAmount: 1,
    firefliesAmount: 1,
    windStrength: 0.55,
    vignette: 0.38,
    audio: {
      wind: 0.5,
      birds: 0,
      crickets: 0.9,
    },
  },
};

/**
 * Determine initial mood:
 * - If stored preference exists, use it.
 * - Else derive from local time:
 *   - 05:00 - 09:59 -> dawn
 *   - 10:00 - 18:59 -> golden
 *   - 19:00 - 04:59 -> night
 */
export function getDefaultMood(date = new Date(), storedMood?: MoodName | null): MoodName {
  if (storedMood && (storedMood === 'dawn' || storedMood === 'golden' || storedMood === 'night')) {
    return storedMood;
  }

  const hours = date.getHours();
  if (hours >= 5 && hours < 10) {
    return 'dawn';
  }
  if (hours >= 10 && hours < 19) {
    return 'golden';
  }
  return 'night';
}
