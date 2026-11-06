/**
 * Core mathematical and interpolation utilities.
 * Pure functions with zero external dependencies.
 */

/**
 * Clamps a number between a minimum and maximum value.
 */
export function clamp(val: number, min: number, max: number): number {
  if (min > max) {
    throw new Error(`clamp: min (${min}) cannot be greater than max (${max})`);
  }
  return Math.min(Math.max(val, min), max);
}

/**
 * Linear interpolation between two numbers.
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Frame-rate independent exponential damping.
 * @param current Current value
 * @param target Target value
 * @param smoothing Smoothing factor (higher means slower approach)
 * @param dt Delta time in seconds
 */
export function damp(current: number, target: number, smoothing: number, dt: number): number {
  return lerp(current, target, 1 - Math.exp(-smoothing * Math.max(0, dt)));
}

/**
 * Smoothstep interpolation with cubic Hermite curve.
 */
export function smoothstep(min: number, max: number, value: number): number {
  if (min === max) {
    return value < min ? 0 : 1;
  }
  const x = clamp((value - min) / (max - min), 0, 1);
  return x * x * (3 - 2 * x);
}
