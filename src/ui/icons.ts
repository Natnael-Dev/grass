/**
 * Inline semantic SVGs per design-system.md:
 * 1.5 px stroke, 18 px dimensions, no external library.
 */

export function createSvgIcon(paths: string, viewBox = '0 0 18 18', size = 18): string {
  return `<svg width="${size}" height="${size}" viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
}

export const ICONS = {
  dawn: createSvgIcon(`
    <path d="M9 13.5A4.5 4.5 0 0 1 4.5 9h9a4.5 4.5 0 0 1-4.5 4.5Z" />
    <path d="M2 15h14" />
    <path d="M9 2v2.5" />
    <path d="m4.2 4.2 1.8 1.8" />
    <path d="m13.8 4.2-1.8 1.8" />
  `),

  golden: createSvgIcon(`
    <circle cx="9" cy="9" r="3.5" />
    <path d="M9 1.5v2" />
    <path d="M9 14.5v2" />
    <path d="M1.5 9h2" />
    <path d="M14.5 9h2" />
    <path d="m3.7 3.7 1.4 1.4" />
    <path d="m12.9 12.9 1.4 1.4" />
    <path d="m3.7 14.3 1.4-1.4" />
    <path d="m12.9 5.1 1.4-1.4" />
  `),

  night: createSvgIcon(`
    <path d="M14.2 10.2A6 6 0 1 1 7.8 3.8a4.8 4.8 0 0 0 6.4 6.4Z" />
  `),

  soundOn: createSvgIcon(`
    <path d="M7.5 4.5 4.5 7H2v4h2.5l3 2.5v-9Z" />
    <path d="M11 6a4 4 0 0 1 0 6" />
    <path d="M13.5 3.5a7.5 7.5 0 0 1 0 11" />
  `),

  soundOff: createSvgIcon(`
    <path d="M7.5 4.5 4.5 7H2v4h2.5l3 2.5v-9Z" />
    <path d="m11.5 6.5 4 5" />
    <path d="m15.5 6.5-4 5" />
  `),

  help: createSvgIcon(`
    <circle cx="9" cy="9" r="7.5" />
    <path d="M6.8 7a2.2 2.2 0 0 1 4.2.8c0 1.5-2 2-2 3.2" />
    <path d="M9 14.5h.01" />
  `),

  close: createSvgIcon(`
    <path d="m4.5 4.5 9 9" />
    <path d="m13.5 4.5-9 9" />
  `),
} as const;
