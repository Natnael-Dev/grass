import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Renderer } from '../../src/core/Renderer';
import { FallbackScreen } from '../../src/ui/FallbackScreen';
import { COPY } from '../../src/ui/copy';

function createMockWebGLContext() {
  const target: Record<string | symbol, unknown> = {
    VERSION: 7938,
    RENDERER: 7937,
    VENDOR: 7936,
    MAX_VERTEX_ATTRIBS: 16,
    MAX_TEXTURE_IMAGE_UNITS: 16,
    getContextAttributes: vi.fn().mockReturnValue({
      alpha: false,
      antialias: true,
      depth: true,
      stencil: false,
    }),
    getExtension: vi.fn().mockReturnValue(null),
    getParameter: vi.fn((param: unknown) => {
      if (param === 7938 || param === 'VERSION' || param === undefined) return 'WebGL 2.0';
      if (param === 7937 || param === 'RENDERER') return 'WebKit WebGL';
      if (param === 7936 || param === 'VENDOR') return 'WebKit';
      return 16;
    }),
    getShaderPrecisionFormat: vi.fn().mockReturnValue({
      precision: 23,
      rangeMin: 127,
      rangeMax: 127,
    }),
  };

  return new Proxy(target, {
    get(t, prop) {
      if (prop in t) return t[prop];
      if (typeof prop === 'string') {
        if (prop === prop.toUpperCase()) {
          return 1;
        }
        const fn = vi.fn();
        t[prop] = fn;
        return fn;
      }
      return undefined;
    },
  });
}

class MockCanvas {
  public width = 800;
  public height = 600;
  public clientWidth = 800;
  public clientHeight = 600;
  public parentElement = null;
  private glContext: unknown = null;
  private listeners: Record<string, ((e?: unknown) => void)[]> = {};

  getContext(type: string) {
    if (type === 'webgl2') {
      if (!this.glContext) {
        this.glContext = createMockWebGLContext();
      }
      return this.glContext;
    }
    return null;
  }

  addEventListener(event: string, fn: (e?: unknown) => void): void {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }

  removeEventListener(event: string, fn: (e?: unknown) => void): void {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((f) => f !== fn);
    }
  }

  dispatchEvent(event: { type: string; preventDefault?: () => void }): void {
    for (const fn of this.listeners[event.type] ?? []) {
      fn(event);
    }
  }
}

describe('WebGL Context Lost Recovery & Fallback Handling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('Renderer: prevents default on webglcontextlost to allow browser recovery', () => {
    const mockCanvas = new MockCanvas();
    let lostFired = false;
    let defaultPrevented = false;

    const renderer = new Renderer({
      canvas: mockCanvas as unknown as HTMLCanvasElement,
      onContextLost: () => {
        lostFired = true;
      },
    });

    const event = {
      type: 'webglcontextlost',
      preventDefault: () => {
        defaultPrevented = true;
      },
    };

    mockCanvas.dispatchEvent(event);

    expect(defaultPrevented).toBe(true);
    expect(lostFired).toBe(true);

    renderer.dispose();
  });

  it('Renderer: calls onContextRestored callback when context is restored', () => {
    const mockCanvas = new MockCanvas();
    let restoredFired = false;

    const renderer = new Renderer({
      canvas: mockCanvas as unknown as HTMLCanvasElement,
      onContextRestored: () => {
        restoredFired = true;
      },
    });

    mockCanvas.dispatchEvent({ type: 'webglcontextrestored' });
    expect(restoredFired).toBe(true);

    renderer.dispose();
  });

  it('FallbackScreen: displays recovery toast and cleans up correctly', () => {
    const mockContainer = {
      appendChild: vi.fn(),
      removeChild: vi.fn(),
    } as unknown as HTMLElement;

    const screen = new FallbackScreen({ container: mockContainer });

    // Mock document.createElement for node unit test
    const origCreateElement = globalThis.document?.createElement;
    interface MockCreatedElement {
      tag: string;
      className: string;
      style: Record<string, string>;
      setAttribute: (k: string, v: string) => void;
      textContent: string;
      parentElement: unknown;
      appendChild: (c: unknown) => void;
      addEventListener: (event: string, fn: () => void) => void;
      focus: () => void;
    }
    const createdElements: MockCreatedElement[] = [];

    const docMock = {
      createElement: (tag: string) => {
        const el = {
          tag,
          className: '',
          style: {},
          setAttribute: vi.fn(),
          textContent: '',
          parentElement: mockContainer,
          appendChild: vi.fn(),
          addEventListener: vi.fn(),
          focus: vi.fn(),
        };
        createdElements.push(el);
        return el;
      },
      body: mockContainer,
    };
    (globalThis as unknown as { document: unknown }).document = docMock;

    screen.showRecoveryToast();
    expect(screen.toastElement).not.toBeNull();
    expect(screen.toastElement?.textContent).toBe(COPY.states.contextLost);

    screen.hideRecoveryToast();
    expect(screen.toastElement).toBeNull();

    // Test Fallback overlay appearance and action
    let reloadClicked = false;
    const reloadScreen = new FallbackScreen({
      container: mockContainer,
      onReload: () => {
        reloadClicked = true;
      },
    });

    reloadScreen.showFallback();
    expect(reloadScreen.overlayElement).not.toBeNull();

    // Trigger click on button
    const btn = createdElements.find((e) => e.className === 'btn-reload');
    expect(btn).toBeDefined();
    if (btn) {
      const clickCalls = (
        btn.addEventListener as unknown as {
          mock: { calls: Array<[string, () => void]> };
        }
      ).mock.calls;
      const clickHandler = clickCalls.find((call) => call[0] === 'click')?.[1];
      clickHandler?.();
      expect(reloadClicked).toBe(true);
    }

    reloadScreen.dispose();

    // Restore document
    if (origCreateElement) {
      (globalThis as unknown as { document: unknown }).document = {
        createElement: origCreateElement,
      };
    } else {
      delete (globalThis as unknown as { document?: unknown }).document;
    }
  });
});
