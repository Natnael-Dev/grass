import { describe, it, expect } from 'vitest';
import { ICONS, createSvgIcon } from '../../src/ui/icons';

describe('ICONS', () => {
  it('creates valid SVG markup with aria-hidden="true" and stroke-width 1.5', () => {
    const icon = createSvgIcon('<path d="M0 0" />');
    expect(icon).toContain('<svg');
    expect(icon).toContain('aria-hidden="true"');
    expect(icon).toContain('stroke-width="1.5"');
    expect(icon).toContain('width="18"');
    expect(icon).toContain('height="18"');
  });

  it('provides all 7 required icons per design-system.md', () => {
    expect(ICONS.dawn).toContain('viewBox="0 0 18 18"');
    expect(ICONS.golden).toContain('circle');
    expect(ICONS.night).toContain('path');
    expect(ICONS.soundOn).toContain('path');
    expect(ICONS.soundOff).toContain('path');
    expect(ICONS.help).toContain('circle');
    expect(ICONS.close).toContain('path');
  });
});
