import * as THREE from 'three';
import type { MoodName } from '../core/types';
import { MOOD_PRESETS, type MoodPreset, getDefaultMood } from './moods';

export interface MoodState {
  currentMood: MoodName;
  targetMood: MoodName;
  progress: number;
  isFading: boolean;

  skyTop: THREE.Color;
  skyMid: THREE.Color;
  skyHorizon: THREE.Color;

  discColor: THREE.Color;
  discElevationDeg: number;
  discAzimuthDeg: number;
  discDir: THREE.Vector3;
  discSize: number;
  discHalo: number;

  lightColor: THREE.Color;
  lightIntensity: number;
  sunDir: THREE.Vector3;

  ambientColor: THREE.Color;
  ambientIntensity: number;

  grassBase: THREE.Color;
  grassTip: THREE.Color;
  terrainColor: THREE.Color;

  ridge1: THREE.Color;
  ridge2: THREE.Color;
  ridge3: THREE.Color;

  fogColor: THREE.Color;
  fogDensity: number;

  cloudColor: THREE.Color;
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

interface IntermediateValues {
  skyTop: THREE.Color;
  skyMid: THREE.Color;
  skyHorizon: THREE.Color;
  discColor: THREE.Color;
  discElevationDeg: number;
  discAzimuthDeg: number;
  discSize: number;
  discHalo: number;
  lightColor: THREE.Color;
  lightIntensity: number;
  ambientColor: THREE.Color;
  ambientIntensity: number;
  grassBase: THREE.Color;
  grassTip: THREE.Color;
  terrainColor: THREE.Color;
  ridge1: THREE.Color;
  ridge2: THREE.Color;
  ridge3: THREE.Color;
  fogColor: THREE.Color;
  fogDensity: number;
  cloudColor: THREE.Color;
  cloudCover: number;
  starsAmount: number;
  firefliesAmount: number;
  windStrength: number;
  vignette: number;
  audioWind: number;
  audioBirds: number;
  audioCrickets: number;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Smoothstep ease-in-out curve: 3t^2 - 2t^3
 */
function easeInOut(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return clamped * clamped * (3 - 2 * clamped);
}

export class MoodController {
  public static readonly FADE_DURATION = 2.5; // 2.5s per FR-04 and motion doc

  public readonly state: MoodState;
  public onMoodChange?: (mood: MoodName) => void;

  private isFading = false;
  private fadeElapsed = 0;
  private currentMood: MoodName;
  private targetMood: MoodName;

  // Preallocated snapshots for retargetable blending
  private readonly startSnap: IntermediateValues;
  private readonly targetColors = {
    skyTop: new THREE.Color(),
    skyMid: new THREE.Color(),
    skyHorizon: new THREE.Color(),
    discColor: new THREE.Color(),
    lightColor: new THREE.Color(),
    ambientColor: new THREE.Color(),
    grassBase: new THREE.Color(),
    grassTip: new THREE.Color(),
    terrainColor: new THREE.Color(),
    ridge1: new THREE.Color(),
    ridge2: new THREE.Color(),
    ridge3: new THREE.Color(),
    fogColor: new THREE.Color(),
    cloudColor: new THREE.Color(),
  };

  constructor(initialMood?: MoodName | null) {
    const resolvedMood = initialMood ?? getDefaultMood();
    this.currentMood = resolvedMood;
    this.targetMood = resolvedMood;

    const initialPreset = MOOD_PRESETS[resolvedMood];

    this.state = {
      currentMood: resolvedMood,
      targetMood: resolvedMood,
      progress: 1,
      isFading: false,

      skyTop: new THREE.Color(initialPreset.skyTop),
      skyMid: new THREE.Color(initialPreset.skyMid),
      skyHorizon: new THREE.Color(initialPreset.skyHorizon),

      discColor: new THREE.Color(initialPreset.discColor),
      discElevationDeg: initialPreset.discElevationDeg,
      discAzimuthDeg: initialPreset.discAzimuthDeg,
      discDir: new THREE.Vector3(),
      discSize: initialPreset.discSize,
      discHalo: initialPreset.discHalo,

      lightColor: new THREE.Color(initialPreset.lightColor),
      lightIntensity: initialPreset.lightIntensity,
      sunDir: new THREE.Vector3(),

      ambientColor: new THREE.Color(initialPreset.ambientColor),
      ambientIntensity: initialPreset.ambientIntensity,

      grassBase: new THREE.Color(initialPreset.grassBase),
      grassTip: new THREE.Color(initialPreset.grassTip),
      terrainColor: new THREE.Color(initialPreset.terrainColor),

      ridge1: new THREE.Color(initialPreset.ridge[0]),
      ridge2: new THREE.Color(initialPreset.ridge[1]),
      ridge3: new THREE.Color(initialPreset.ridge[2]),

      fogColor: new THREE.Color(initialPreset.fogColor),
      fogDensity: initialPreset.fogDensity,

      cloudColor: new THREE.Color(initialPreset.cloudColor),
      cloudCover: initialPreset.cloudCover,

      starsAmount: initialPreset.starsAmount,
      firefliesAmount: initialPreset.firefliesAmount,
      windStrength: initialPreset.windStrength,
      vignette: initialPreset.vignette,

      audio: {
        wind: initialPreset.audio.wind,
        birds: initialPreset.audio.birds,
        crickets: initialPreset.audio.crickets,
      },
    };

    this.startSnap = {
      skyTop: new THREE.Color(initialPreset.skyTop),
      skyMid: new THREE.Color(initialPreset.skyMid),
      skyHorizon: new THREE.Color(initialPreset.skyHorizon),
      discColor: new THREE.Color(initialPreset.discColor),
      discElevationDeg: initialPreset.discElevationDeg,
      discAzimuthDeg: initialPreset.discAzimuthDeg,
      discSize: initialPreset.discSize,
      discHalo: initialPreset.discHalo,
      lightColor: new THREE.Color(initialPreset.lightColor),
      lightIntensity: initialPreset.lightIntensity,
      ambientColor: new THREE.Color(initialPreset.ambientColor),
      ambientIntensity: initialPreset.ambientIntensity,
      grassBase: new THREE.Color(initialPreset.grassBase),
      grassTip: new THREE.Color(initialPreset.grassTip),
      terrainColor: new THREE.Color(initialPreset.terrainColor),
      ridge1: new THREE.Color(initialPreset.ridge[0]),
      ridge2: new THREE.Color(initialPreset.ridge[1]),
      ridge3: new THREE.Color(initialPreset.ridge[2]),
      fogColor: new THREE.Color(initialPreset.fogColor),
      fogDensity: initialPreset.fogDensity,
      cloudColor: new THREE.Color(initialPreset.cloudColor),
      cloudCover: initialPreset.cloudCover,
      starsAmount: initialPreset.starsAmount,
      firefliesAmount: initialPreset.firefliesAmount,
      windStrength: initialPreset.windStrength,
      vignette: initialPreset.vignette,
      audioWind: initialPreset.audio.wind,
      audioBirds: initialPreset.audio.birds,
      audioCrickets: initialPreset.audio.crickets,
    };

    this.computeDiscVectors();
  }

  public setMood(target: MoodName, immediate = false): void {
    if (this.targetMood === target && !this.isFading) {
      return;
    }

    if (immediate) {
      this.currentMood = target;
      this.targetMood = target;
      this.isFading = false;
      this.fadeElapsed = 0;
      this.state.currentMood = target;
      this.state.targetMood = target;
      this.state.progress = 1;
      this.state.isFading = false;
      this.applyPreset(MOOD_PRESETS[target]);
      this.snapshotToStart();
      this.onMoodChange?.(target);
      return;
    }

    // Capture current interpolated state as starting point for seamless retargeting
    this.snapshotToStart();
    this.targetMood = target;
    this.state.targetMood = target;
    this.isFading = true;
    this.state.isFading = true;
    this.fadeElapsed = 0;
    this.state.progress = 0;

    // Cache target colors
    const targetPreset = MOOD_PRESETS[target];
    this.targetColors.skyTop.set(targetPreset.skyTop);
    this.targetColors.skyMid.set(targetPreset.skyMid);
    this.targetColors.skyHorizon.set(targetPreset.skyHorizon);
    this.targetColors.discColor.set(targetPreset.discColor);
    this.targetColors.lightColor.set(targetPreset.lightColor);
    this.targetColors.ambientColor.set(targetPreset.ambientColor);
    this.targetColors.grassBase.set(targetPreset.grassBase);
    this.targetColors.grassTip.set(targetPreset.grassTip);
    this.targetColors.terrainColor.set(targetPreset.terrainColor);
    this.targetColors.ridge1.set(targetPreset.ridge[0]);
    this.targetColors.ridge2.set(targetPreset.ridge[1]);
    this.targetColors.ridge3.set(targetPreset.ridge[2]);
    this.targetColors.fogColor.set(targetPreset.fogColor);
    this.targetColors.cloudColor.set(targetPreset.cloudColor);
  }

  public update(dt: number): void {
    if (!this.isFading) {
      return;
    }

    this.fadeElapsed += dt;
    const rawT = Math.min(1, this.fadeElapsed / MoodController.FADE_DURATION);
    const t = easeInOut(rawT);
    this.state.progress = rawT;

    const targetPreset = MOOD_PRESETS[this.targetMood];
    const start = this.startSnap;

    // 1. Color interpolation in linear-sRGB space
    this.state.skyTop.lerpColors(start.skyTop, this.targetColors.skyTop, t);
    this.state.skyMid.lerpColors(start.skyMid, this.targetColors.skyMid, t);
    this.state.skyHorizon.lerpColors(start.skyHorizon, this.targetColors.skyHorizon, t);

    this.state.discColor.lerpColors(start.discColor, this.targetColors.discColor, t);
    this.state.lightColor.lerpColors(start.lightColor, this.targetColors.lightColor, t);
    this.state.ambientColor.lerpColors(start.ambientColor, this.targetColors.ambientColor, t);

    this.state.grassBase.lerpColors(start.grassBase, this.targetColors.grassBase, t);
    this.state.grassTip.lerpColors(start.grassTip, this.targetColors.grassTip, t);
    this.state.terrainColor.lerpColors(start.terrainColor, this.targetColors.terrainColor, t);

    this.state.ridge1.lerpColors(start.ridge1, this.targetColors.ridge1, t);
    this.state.ridge2.lerpColors(start.ridge2, this.targetColors.ridge2, t);
    this.state.ridge3.lerpColors(start.ridge3, this.targetColors.ridge3, t);

    this.state.fogColor.lerpColors(start.fogColor, this.targetColors.fogColor, t);
    this.state.cloudColor.lerpColors(start.cloudColor, this.targetColors.cloudColor, t);

    // 2. Spherical disc angles (arc through sky)
    this.state.discElevationDeg = lerp(start.discElevationDeg, targetPreset.discElevationDeg, t);
    this.state.discAzimuthDeg = lerp(start.discAzimuthDeg, targetPreset.discAzimuthDeg, t);
    this.computeDiscVectors();

    // 3. Scalar parameters
    this.state.discSize = lerp(start.discSize, targetPreset.discSize, t);
    this.state.discHalo = lerp(start.discHalo, targetPreset.discHalo, t);
    this.state.lightIntensity = lerp(start.lightIntensity, targetPreset.lightIntensity, t);
    this.state.ambientIntensity = lerp(start.ambientIntensity, targetPreset.ambientIntensity, t);
    this.state.fogDensity = lerp(start.fogDensity, targetPreset.fogDensity, t);
    this.state.cloudCover = lerp(start.cloudCover, targetPreset.cloudCover, t);
    this.state.starsAmount = lerp(start.starsAmount, targetPreset.starsAmount, t);
    this.state.firefliesAmount = lerp(start.firefliesAmount, targetPreset.firefliesAmount, t);
    this.state.windStrength = lerp(start.windStrength, targetPreset.windStrength, t);
    this.state.vignette = lerp(start.vignette, targetPreset.vignette, t);

    this.state.audio.wind = lerp(start.audioWind, targetPreset.audio.wind, t);
    this.state.audio.birds = lerp(start.audioBirds, targetPreset.audio.birds, t);
    this.state.audio.crickets = lerp(start.audioCrickets, targetPreset.audio.crickets, t);

    // Check completion
    if (rawT >= 1) {
      this.isFading = false;
      this.currentMood = this.targetMood;
      this.state.currentMood = this.targetMood;
      this.state.isFading = false;
      this.state.progress = 1;
      this.applyPreset(targetPreset);
      this.onMoodChange?.(this.targetMood);
    }
  }

  private computeDiscVectors(): void {
    const radEl = (this.state.discElevationDeg * Math.PI) / 180;
    const radAz = (this.state.discAzimuthDeg * Math.PI) / 180;
    const y = Math.sin(radEl);
    const rxz = Math.cos(radEl);
    const x = rxz * Math.sin(radAz);
    const z = -rxz * Math.cos(radAz);

    this.state.discDir.set(x, y, z).normalize();
    this.state.sunDir.copy(this.state.discDir);
  }

  private snapshotToStart(): void {
    this.startSnap.skyTop.copy(this.state.skyTop);
    this.startSnap.skyMid.copy(this.state.skyMid);
    this.startSnap.skyHorizon.copy(this.state.skyHorizon);
    this.startSnap.discColor.copy(this.state.discColor);
    this.startSnap.discElevationDeg = this.state.discElevationDeg;
    this.startSnap.discAzimuthDeg = this.state.discAzimuthDeg;
    this.startSnap.discSize = this.state.discSize;
    this.startSnap.discHalo = this.state.discHalo;
    this.startSnap.lightColor.copy(this.state.lightColor);
    this.startSnap.lightIntensity = this.state.lightIntensity;
    this.startSnap.ambientColor.copy(this.state.ambientColor);
    this.startSnap.ambientIntensity = this.state.ambientIntensity;
    this.startSnap.grassBase.copy(this.state.grassBase);
    this.startSnap.grassTip.copy(this.state.grassTip);
    this.startSnap.terrainColor.copy(this.state.terrainColor);
    this.startSnap.ridge1.copy(this.state.ridge1);
    this.startSnap.ridge2.copy(this.state.ridge2);
    this.startSnap.ridge3.copy(this.state.ridge3);
    this.startSnap.fogColor.copy(this.state.fogColor);
    this.startSnap.fogDensity = this.state.fogDensity;
    this.startSnap.cloudColor.copy(this.state.cloudColor);
    this.startSnap.cloudCover = this.state.cloudCover;
    this.startSnap.starsAmount = this.state.starsAmount;
    this.startSnap.firefliesAmount = this.state.firefliesAmount;
    this.startSnap.windStrength = this.state.windStrength;
    this.startSnap.vignette = this.state.vignette;
    this.startSnap.audioWind = this.state.audio.wind;
    this.startSnap.audioBirds = this.state.audio.birds;
    this.startSnap.audioCrickets = this.state.audio.crickets;
  }

  private applyPreset(preset: MoodPreset): void {
    this.state.skyTop.set(preset.skyTop);
    this.state.skyMid.set(preset.skyMid);
    this.state.skyHorizon.set(preset.skyHorizon);
    this.state.discColor.set(preset.discColor);
    this.state.discElevationDeg = preset.discElevationDeg;
    this.state.discAzimuthDeg = preset.discAzimuthDeg;
    this.state.discSize = preset.discSize;
    this.state.discHalo = preset.discHalo;
    this.state.lightColor.set(preset.lightColor);
    this.state.lightIntensity = preset.lightIntensity;
    this.state.ambientColor.set(preset.ambientColor);
    this.state.ambientIntensity = preset.ambientIntensity;
    this.state.grassBase.set(preset.grassBase);
    this.state.grassTip.set(preset.grassTip);
    this.state.terrainColor.set(preset.terrainColor);
    this.state.ridge1.set(preset.ridge[0]);
    this.state.ridge2.set(preset.ridge[1]);
    this.state.ridge3.set(preset.ridge[2]);
    this.state.fogColor.set(preset.fogColor);
    this.state.fogDensity = preset.fogDensity;
    this.state.cloudColor.set(preset.cloudColor);
    this.state.cloudCover = preset.cloudCover;
    this.state.starsAmount = preset.starsAmount;
    this.state.firefliesAmount = preset.firefliesAmount;
    this.state.windStrength = preset.windStrength;
    this.state.vignette = preset.vignette;
    this.state.audio.wind = preset.audio.wind;
    this.state.audio.birds = preset.audio.birds;
    this.state.audio.crickets = preset.audio.crickets;
    this.computeDiscVectors();
  }
}
