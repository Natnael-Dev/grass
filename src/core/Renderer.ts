import * as THREE from 'three';

export interface RendererOptions {
  canvas: HTMLCanvasElement;
  dprCap?: number;
  antialias?: boolean;
  onContextLost?: () => void;
  onContextRestored?: () => void;
}

export class Renderer {
  public readonly gl: THREE.WebGLRenderer;
  public readonly canvas: HTMLCanvasElement;
  private dprCap: number;
  private resizeObserver: ResizeObserver | null = null;
  private onResizeCallback: ((width: number, height: number, dpr: number) => void) | null = null;
  private contextLostHandler: ((e: Event) => void) | null = null;
  private contextRestoredHandler: (() => void) | null = null;
  private onContextLostCallback: (() => void) | null = null;
  private onContextRestoredCallback: (() => void) | null = null;

  constructor(options: RendererOptions) {
    this.canvas = options.canvas;
    this.dprCap = options.dprCap ?? 2.0;
    this.onContextLostCallback = options.onContextLost ?? null;
    this.onContextRestoredCallback = options.onContextRestored ?? null;

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
    this.gl.toneMapping = THREE.ACESFilmicToneMapping;
    this.gl.toneMappingExposure = 1.0;
    this.updateSize();
    this.setupResizeObserver();
    this.setupContextLostListeners();
  }

  private setupContextLostListeners(): void {
    this.contextLostHandler = (e: Event) => {
      // Must call preventDefault to permit WebGL context restoration
      e.preventDefault();
      this.onContextLostCallback?.();
    };

    this.contextRestoredHandler = () => {
      this.updateSize();
      this.onContextRestoredCallback?.();
    };

    this.canvas.addEventListener('webglcontextlost', this.contextLostHandler);
    this.canvas.addEventListener('webglcontextrestored', this.contextRestoredHandler);
  }

  public setOnContextLost(callback: () => void): void {
    this.onContextLostCallback = callback;
  }

  public setOnContextRestored(callback: () => void): void {
    this.onContextRestoredCallback = callback;
  }

  public setDprCap(cap: number): void {
    this.dprCap = cap;
    this.updateSize();
  }

  public setOnResize(callback: (width: number, height: number, dpr: number) => void): void {
    this.onResizeCallback = callback;
  }

  public updateSize(): void {
    const winWidth = typeof window !== 'undefined' ? window.innerWidth : 800;
    const winHeight = typeof window !== 'undefined' ? window.innerHeight : 600;
    const winDpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1;

    const width = this.canvas.clientWidth || winWidth || 800;
    const height = this.canvas.clientHeight || winHeight || 600;
    const dpr = Math.min(winDpr || 1, this.dprCap);

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
    if (this.contextLostHandler) {
      this.canvas.removeEventListener('webglcontextlost', this.contextLostHandler);
      this.contextLostHandler = null;
    }
    if (this.contextRestoredHandler) {
      this.canvas.removeEventListener('webglcontextrestored', this.contextRestoredHandler);
      this.contextRestoredHandler = null;
    }
    this.gl.dispose();
  }
}
