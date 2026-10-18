import type { MoodName, QualityTier } from './flags';

export type AppPhase = 'init' | 'ready' | 'running' | 'paused' | 'exit';

export interface AppState {
  phase: AppPhase;
  mood: MoodName;
  targetMood: MoodName;
  muted: boolean;
  lying: boolean;
  hintsSeen: boolean;
  quality: QualityTier;
  reducedMotion: boolean;
  isTouch: boolean;
  helpOpen: boolean;
  uptimeSeconds: number;
}

export type StoreListener = (state: Readonly<AppState>, prev: Readonly<AppState>) => void;

export class Store {
  private state: AppState;
  private listeners: StoreListener[] = [];

  constructor(initialState?: Partial<AppState>) {
    this.state = {
      phase: 'init',
      mood: 'golden',
      targetMood: 'golden',
      muted: false,
      lying: false,
      hintsSeen: false,
      quality: 'high',
      reducedMotion: false,
      isTouch: false,
      helpOpen: false,
      uptimeSeconds: 0,
      ...initialState,
    };
  }

  public getState(): Readonly<AppState> {
    return this.state;
  }

  public setState(partial: Partial<AppState>): void {
    const prev = this.state;
    this.state = { ...this.state, ...partial };

    for (const listener of this.listeners) {
      listener(this.state, prev);
    }
  }

  public subscribe(listener: StoreListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }
}
