import * as THREE from 'three';

export interface RendererOptions {
  canvas: HTMLCanvasElement;
  dprCap?: number;
  antialias?: boolean;
}

export class Renderer {
  public readonly gl: THREE.WebGLRenderer;
  public readonly canvas: HTMLCanvasElement;
  private dprCap: number;
  private resizeObserver: ResizeObserver | null = null;
  private onResizeCallback: ((width: number, height: number, dpr: number) => void) | null = null;

  constructor(options: RendererOptions) {
    this.canvas = options.canvas;
    this.dprCap = options.dprCap ?? 2.0;

    const glContext = this.canvas.getContext('webgl2');
    if (!glContext) {
      throw new Error('WebGL2 is not supported by your browser or hardware.');
    }

    this.gl = new THREE.WebGLRenderer({
      canvas: this.canvas,
      context: glContext,
      antialias: options.antialias ?? true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
      alpha: false,
    });

    this.gl.outputColorSpace = THREE.SRGBColorSpace;
    this.gl.toneMapping = THREE.NoToneMapping;
    this.updateSize();
    this.setupResizeObserver();
  }

  public setDprCap(cap: number): void {
    this.dprCap = cap;
    this.updateSize();
  }

  public setOnResize(callback: (width: number, height: number, dpr: number) => void): void {
    this.onResizeCallback = callback;
  }

  public updateSize(): void {
    const width = this.canvas.clientWidth || window.innerWidth || 800;
    const height = this.canvas.clientHeight || window.innerHeight || 600;
    const dpr = Math.min(window.devicePixelRatio || 1, this.dprCap);

    this.gl.setPixelRatio(dpr);
    this.gl.setSize(width, height, false);

    if (this.onResizeCallback) {
      this.onResizeCallback(width, height, dpr);
    }
  }

  public render(scene: THREE.Scene, camera: THREE.Camera): void {
    this.gl.render(scene, camera);
  }

  public getDrawCallInfo(): {
    drawCalls: number;
    triangles: number;
    points: number;
    lines: number;
  } {
    return {
      drawCalls: this.gl.info.render.calls,
      triangles: this.gl.info.render.triangles,
      points: this.gl.info.render.points,
      lines: this.gl.info.render.lines,
    };
  }

  private setupResizeObserver(): void {
    if (typeof ResizeObserver !== 'undefined' && this.canvas.parentElement) {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateSize();
      });
      this.resizeObserver.observe(this.canvas.parentElement);
    } else if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.handleWindowResize);
    }
  }

  private handleWindowResize = (): void => {
    this.updateSize();
  };

  public dispose(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.handleWindowResize);
    }
    this.gl.dispose();
  }
}
