import { AudioEngine } from './AudioEngine';
import { Wind } from './Wind';
import { Rustle } from './Rustle';
import { Crickets } from './Crickets';
import { Birds } from './Birds';
import { Sfx } from './Sfx';

export interface AudioCoordinatorOptions {
  initialMuted: boolean;
}

export class AudioCoordinator {
  public readonly engine: AudioEngine;
  public readonly wind: Wind;
  public readonly rustle: Rustle;
  public readonly crickets: Crickets;
  public readonly birds: Birds;
  public readonly sfx: Sfx;

  constructor(options: AudioCoordinatorOptions) {
    this.engine = new AudioEngine({ initialMuted: options.initialMuted });
    const audioCtx = this.engine.getContext();
    const ambienceBus = this.engine.getAmbienceBus();
    const sfxBus = this.engine.getSfxBus();

    this.wind = new Wind(audioCtx, ambienceBus);
    this.rustle = new Rustle(audioCtx, ambienceBus);
    this.crickets = new Crickets(audioCtx, ambienceBus);
    this.birds = new Birds(audioCtx, ambienceBus);
    this.sfx = new Sfx(audioCtx, sfxBus);
  }

  public async unlock(): Promise<void> {
    await this.engine.unlock();
  }

  public isUnlocked(): boolean {
    return this.engine.isUnlocked();
  }

  public isSupported(): boolean {
    return this.engine.isSupported();
  }

  public startAmbience(): void {
    void this.unlock().then(() => {
      this.wind.start();
      this.crickets.start();
      this.birds.start();
    });
  }

  public update(
    audioState: { wind: number; birds: number; crickets: number },
    effectiveWindStrength: number,
    dt: number,
  ): void {
    this.wind.update(audioState.wind, effectiveWindStrength, this.engine.isLyingDown());
    this.crickets.update(audioState.crickets);
    this.birds.update(audioState.birds, dt);
  }

  public onBrush(speed: number, strength: number, dt: number): void {
    this.rustle.onBrush(speed, strength, dt);
  }

  public setLyingDown(lying: boolean): void {
    this.engine.setLyingDown(lying);
  }

  public setMuted(muted: boolean): void {
    this.engine.setMuted(muted);
  }

  public isMuted(): boolean {
    return this.engine.isMuted();
  }

  public handleVisibilityChange(hidden: boolean): void {
    this.engine.handleVisibilityChange(hidden);
  }

  public dispose(): void {
    this.wind.dispose();
    this.rustle.dispose();
    this.crickets.dispose();
    this.birds.dispose();
    this.sfx.dispose();
    this.engine.dispose();
  }
}
