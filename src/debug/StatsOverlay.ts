export interface StatsData {
  fps: number;
  tier: string;
  drawCalls: number;
  triangles: number;
  blades: number;
}

export class StatsOverlay {
  private element: HTMLDivElement | null = null;
  private lastUpdate = 0;
  private readonly updateIntervalMs = 200;

  constructor() {
    if (typeof document !== 'undefined') {
      this.element = document.createElement('div');
      this.element.id = 'stats-overlay';
      this.element.setAttribute('aria-hidden', 'true');
      this.element.style.position = 'fixed';
      this.element.style.top = '12px';
      this.element.style.left = '12px';
      this.element.style.zIndex = '9999';
      this.element.style.padding = '8px 12px';
      this.element.style.fontFamily = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';
      this.element.style.fontSize = '12px';
      this.element.style.lineHeight = '1.4';
      this.element.style.color = '#c5f277';
      this.element.style.background = 'rgba(10, 14, 28, 0.85)';
      this.element.style.backdropFilter = 'blur(8px)';
      this.element.style.border = '1px solid rgba(255, 255, 255, 0.16)';
      this.element.style.borderRadius = '8px';
      this.element.style.pointerEvents = 'none';
      this.element.style.userSelect = 'none';
      this.element.style.whiteSpace = 'pre';

      document.body.appendChild(this.element);
    }
  }

  public update(data: StatsData): void {
    if (!this.element) return;

    const now = performance.now();
    if (now - this.lastUpdate < this.updateIntervalMs) return;
    this.lastUpdate = now;

    const formattedTriangles =
      data.triangles > 1000 ? `${(data.triangles / 1000).toFixed(1)}k` : `${data.triangles}`;
    const formattedBlades =
      data.blades > 1000 ? `${(data.blades / 1000).toFixed(0)}k` : `${data.blades}`;

    this.element.textContent =
      `grass_ debug\n` +
      `fps:      ${Math.round(data.fps)}\n` +
      `tier:     ${data.tier}\n` +
      `calls:    ${data.drawCalls}\n` +
      `tris:     ${formattedTriangles}\n` +
      `blades:   ${formattedBlades}`;
  }

  public setVisible(visible: boolean): void {
    if (this.element) {
      this.element.style.display = visible ? 'block' : 'none';
    }
  }

  public dispose(): void {
    if (this.element && this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
      this.element = null;
    }
  }
}
