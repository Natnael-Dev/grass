/**
 * Audio math & synthesis utilities:
 * Pure mathematical functions for gain calculation, noise shaping, and looping crossfades.
 */

/**
 * Spec formula for wind layer gain:
 * gain = mood.audioWind * (0.6 + 0.4 * windStrength)
 */
export function calculateWindGain(audioWind: number, windStrength: number): number {
  return Math.max(0, audioWind * (0.6 + 0.4 * windStrength));
}

export interface RustleParams {
  grainProbability: number;
  grainGain: number;
}

/**
 * Spec for rustle grains:
 * - Rate proportional to brush speed, max 12 grains/s
 * - Gain proportional to brush strength
 * - None when still
 */
export function calculateRustleParams(
  brushSpeedPxPerSec: number,
  brushStrength: number,
  dtSeconds: number,
): RustleParams {
  if (brushSpeedPxPerSec <= 10 || brushStrength <= 0.001) {
    return { grainProbability: 0, grainGain: 0 };
  }

  // Speed of 1000 px/s maps to max 12 grains/sec
  const speedNorm = Math.min(1.0, brushSpeedPxPerSec / 1000);
  const grainsPerSec = speedNorm * 12.0;
  const grainProbability = grainsPerSec * dtSeconds;
  const grainGain = Math.min(1.0, Math.max(0, brushStrength));

  return { grainProbability, grainGain };
}

/**
 * Generates normalized pink-noise samples using the Paul Kellet / Voss filter algorithm.
 * Pink noise has equal energy per octave (-3 dB/octave).
 */
export function generatePinkNoiseData(sampleRate: number, length: number): Float32Array {
  const output = new Float32Array(length);

  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;

  let maxVal = 0.001;

  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;

    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;

    const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    b6 = white * 0.115926;

    output[i] = pink;
    const abs = Math.abs(pink);
    if (abs > maxVal) {
      maxVal = abs;
    }
  }

  // Normalize to peak 0.95 to leave headroom
  const normFactor = 0.95 / maxVal;
  for (let i = 0; i < length; i++) {
    output[i] = (output[i] ?? 0) * normFactor;
  }

  return output;
}

/**
 * Smoothly windows the head and tail of an audio buffer with a cosine curve
 * so that boundary values and derivatives are continuous (eliminating loop clicks).
 */
export function applyLoopCrossfade(data: Float32Array, crossfadeLength: number): void {
  const len = data.length;
  const fade = Math.min(crossfadeLength, Math.floor(len / 4));

  for (let i = 0; i < fade; i++) {
    const w = 0.5 * (1 - Math.cos((Math.PI * i) / fade));
    data[i] = (data[i] ?? 0) * w;
    const tailIndex = len - 1 - i;
    data[tailIndex] = (data[tailIndex] ?? 0) * w;
  }
}
