export type GestureState = 'idle' | 'pressing' | 'dragging' | 'holding';

export type GestureSource = 'pointer' | 'keyboard' | null;

export interface TapEventData {
  clientX: number;
  clientY: number;
}

export interface GestureEventMap {
  tap: TapEventData;
  holdStart: void;
  holdEnd: void;
  ee2Trigger: void;
}

export interface GestureClassifierOptions {
  holdDelayMs?: number; // default 250
  dragThresholdPx?: number; // default 8
  ee2HoldDurationMs?: number; // default 10000
}

export class GestureClassifier {
  private state: GestureState = 'idle';
  private source: GestureSource = null;

  private readonly holdDelayMs: number;
  private readonly dragThresholdPx: number;
  private readonly ee2HoldDurationMs: number;

  private startX = 0;
  private startY = 0;
  private currentX = 0;
  private currentY = 0;
  private downTime = 0;
  private ee2Triggered = false;

  private listeners: Map<keyof GestureEventMap, Array<(data: unknown) => void>> = new Map();

  constructor(options: GestureClassifierOptions = {}) {
    this.holdDelayMs = options.holdDelayMs ?? 250;
    this.dragThresholdPx = options.dragThresholdPx ?? 8;
    this.ee2HoldDurationMs = options.ee2HoldDurationMs ?? 10000;
  }

  public getState(): GestureState {
    return this.state;
  }

  public isHolding(): boolean {
    return this.state === 'holding';
  }

  public on<K extends keyof GestureEventMap>(
    event: K,
    handler: (data: GestureEventMap[K]) => void,
  ): () => void {
    let list = this.listeners.get(event);
    if (!list) {
      list = [];
      this.listeners.set(event, list);
    }
    list.push(handler as (data: unknown) => void);
    return () => {
      const current = this.listeners.get(event);
      if (current) {
        this.listeners.set(
          event,
          current.filter((h) => h !== handler),
        );
      }
    };
  }

  private emit<K extends keyof GestureEventMap>(event: K, data: GestureEventMap[K]): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      for (const handler of handlers) {
        handler(data);
      }
    }
  }

  public onPointerDown(clientX: number, clientY: number, timeMs?: number): void {
    const now = timeMs ?? (typeof performance !== 'undefined' ? performance.now() : Date.now());
    this.state = 'pressing';
    this.source = 'pointer';
    this.startX = clientX;
    this.startY = clientY;
    this.currentX = clientX;
    this.currentY = clientY;
    this.downTime = now;
    this.ee2Triggered = false;
  }

  public onPointerMove(clientX: number, clientY: number, timeMs?: number): void {
    this.currentX = clientX;
    this.currentY = clientY;

    if (this.state === 'pressing') {
      const dx = clientX - this.startX;
      const dy = clientY - this.startY;
      const dist = Math.hypot(dx, dy);

      if (dist > this.dragThresholdPx) {
        this.state = 'dragging';
      }
    }

    if (timeMs !== undefined) {
      this.update(timeMs);
    }
  }

  public onPointerUp(clientX: number, clientY: number, timeMs?: number): void {
    if (timeMs !== undefined) {
      this.update(timeMs);
    }

    if (this.source === 'pointer') {
      if (this.state === 'pressing') {
        this.emit('tap', { clientX, clientY });
        this.state = 'idle';
        this.source = null;
      } else if (this.state === 'holding') {
        this.emit('holdEnd', undefined as void);
        this.state = 'idle';
        this.source = null;
      } else if (this.state === 'dragging') {
        this.state = 'idle';
        this.source = null;
      }
    }
  }

  public onPointerCancel(): void {
    if (this.source === 'pointer') {
      if (this.state === 'holding') {
        this.emit('holdEnd', undefined as void);
      }
      this.state = 'idle';
      this.source = null;
    }
  }

  public onKeyDown(event: KeyboardEvent, timeMs?: number): void {
    if (event.code === 'Space' || event.key === ' ') {
      if (event.repeat) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      if (target) {
        const tagName = target.tagName?.toLowerCase();
        if (
          tagName === 'input' ||
          tagName === 'textarea' ||
          tagName === 'button' ||
          tagName === 'select' ||
          target.closest('dialog') !== null
        ) {
          return;
        }
      }

      event.preventDefault?.();

      if (this.state === 'idle') {
        const now = timeMs ?? (typeof performance !== 'undefined' ? performance.now() : Date.now());
        this.state = 'holding';
        this.source = 'keyboard';
        this.downTime = now;
        this.ee2Triggered = false;
        this.emit('holdStart', undefined as void);
      }
    }
  }

  public onKeyUp(event: KeyboardEvent): void {
    if (event.code === 'Space' || event.key === ' ') {
      if (this.source === 'keyboard' && this.state === 'holding') {
        this.emit('holdEnd', undefined as void);
        this.state = 'idle';
        this.source = null;
      }
    }
  }

  public update(timeMs?: number): void {
    const now = timeMs ?? (typeof performance !== 'undefined' ? performance.now() : Date.now());

    if (this.state === 'pressing') {
      if (now - this.downTime >= this.holdDelayMs) {
        this.state = 'holding';
        this.emit('holdStart', undefined as void);
      }
    }

    if (this.state === 'holding') {
      if (!this.ee2Triggered && now - this.downTime >= this.ee2HoldDurationMs) {
        this.ee2Triggered = true;
        this.emit('ee2Trigger', undefined as void);
      }
    }
  }

  public reset(): void {
    if (this.state === 'holding') {
      this.emit('holdEnd', undefined as void);
    }
    this.state = 'idle';
    this.source = null;
  }

  public dispose(): void {
    this.reset();
    this.listeners.clear();
  }
}
