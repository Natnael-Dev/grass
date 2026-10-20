import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('FR-18 Metadata & Assets Specification', () => {
  it('includes complete favicon, Open Graph, and Twitter metadata in index.html', () => {
    const htmlPath = path.resolve('index.html');
    expect(fs.existsSync(htmlPath)).toBe(true);
    const html = fs.readFileSync(htmlPath, 'utf8');

    // Favicon link
    expect(html).toContain('<link rel="icon" type="image/svg+xml" href="/favicon.svg" />');

    // Open Graph tags
    expect(html).toContain(
      '<meta property="og:title" content="grass — a tiny meadow for a one-minute break" />',
    );
    expect(html).toContain('property="og:description"');
    expect(html).toContain('<meta property="og:image" content="/og.png" />');
    expect(html).toContain('<meta property="og:type" content="website" />');

    // Twitter card tags
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image" />');
    expect(html).toContain(
      '<meta name="twitter:title" content="grass — a tiny meadow for a one-minute break" />',
    );
    expect(html).toContain('name="twitter:description"');
    expect(html).toContain('<meta name="twitter:image" content="/og.png" />');
  });

  it('provides a valid SVG favicon under 1 KB', () => {
    const faviconPath = path.resolve('public/favicon.svg');
    expect(fs.existsSync(faviconPath)).toBe(true);

    const stat = fs.statSync(faviconPath);
    expect(stat.size).toBeLessThan(1024); // Must be < 1 KB per asset specification

    const content = fs.readFileSync(faviconPath, 'utf8');
    expect(content).toContain('<svg');
    expect(content).toContain('</svg>');
    expect(content).toContain('viewBox');
  });
});
