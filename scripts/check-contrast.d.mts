export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface RGBA extends RGB {
  a: number;
}

export interface ContrastResult {
  pair: string;
  ratio: number;
  min: number;
  pass: boolean;
}

export function hexToRgb(hex: string): RGB;
export function srgbToLinear(c: number): number;
export function relativeLuminance(rgb: RGB): number;
export function contrastRatio(rgb1: RGB, rgb2: RGB): number;
export function compositeOver(fg: RGBA, bg: RGB): RGB;
export function runContrastChecks(): { allPass: boolean; results: ContrastResult[] };
