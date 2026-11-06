/**
 * AudioEngine:
 * Central Web Audio graph manager adhering strictly to docs/01-design/audio-design.md.
 *
 * Graph topology:
 *   layers → ambienceBus (lowpass filter, gain) → master (gain) → compressor (light) → destination
 *   sfxBus → master (gain) [bypasses ambience lowpass filter]
 */

export interface AudioEngineOptions {
  context?: AudioContext | null;
  initialMuted?: boolean;
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private unlocked = false;
  private muted = false;
  private lyingDown = false;
  private supported = true;

  // Master bus nodes
  private masterGainNode!: GainNode;
  private compressorNode!: DynamicsCompressorNode;

  // Ambience bus nodes
  private ambienceFilterNode!: BiquadFilterNode;
  private ambienceGainNode!: GainNode;

  // SFX bus nodes
  private sfxGainNode!: GainNode;

  // Constants
  public static readonly DEFAULT_MASTER_GAIN = 0.5;
  public static readonly MUTE_RAMP_DURATION = 0.3; // 300 ms
  public static readonly AMBIENCE_FILTER_DEFAULT = 18000; // 18 kHz
  public static readonly AMBIENCE_FILTER_LIE_DOWN = 2200; // 2.2 kHz
  public static readonly LIE_DOWN_RAMP_DURATION = 1.1; // 1.1 s

  constructor(options: AudioEngineOptions = {}) {
    this.muted = options.initialMuted ?? false;

    if (options.context !== undefined) {
      this.ctx = options.context;
    } else if (typeof window !== 'undefined') {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        try {
          this.ctx = new AudioCtxClass();
        } catch {
          this.ctx = null;
        }
      }
    }

    if (!this.ctx) {
      this.supported = false;
      return;
    }

    this.setupGraph();
  }

  private setupGraph(): void {
    if (!this.ctx) return;

    // 1. Master Gain & Compressor
    this.masterGainNode = this.ctx.createGain();
    this.masterGainNode.gain.setValueAtTime(
      this.muted ? 0 : AudioEngine.DEFAULT_MASTER_GAIN,
      this.ctx.currentTime,
    );

    this.compressorNode = this.ctx.createDynamicsCompressor();
    // Light limiter/compressor settings: threshold -12 dB, knee 10 dB, ratio 3, attack 0.01s, release 0.25s
    this.compressorNode.threshold.setValueAtTime(-12, this.ctx.currentTime);
    this.compressorNode.knee.setValueAtTime(10, this.ctx.currentTime);
    this.compressorNode.ratio.setValueAtTime(3, this.ctx.currentTime);
    this.compressorNode.attack.setValueAtTime(0.01, this.ctx.currentTime);
    this.compressorNode.release.setValueAtTime(0.25, this.ctx.currentTime);

    this.masterGainNode.connect(this.compressorNode);
    this.compressorNode.connect(this.ctx.destination);

    // 2. Ambience Bus: Filter (18 kHz lowpass) -> Gain -> Master
    this.ambienceFilterNode = this.ctx.createBiquadFilter();
    this.ambienceFilterNode.type = 'lowpass';
    this.ambienceFilterNode.frequency.setValueAtTime(
      AudioEngine.AMBIENCE_FILTER_DEFAULT,
      this.ctx.currentTime,
    );
    this.ambienceFilterNode.Q.setValueAtTime(0.7, this.ctx.currentTime);

    this.ambienceGainNode = this.ctx.createGain();
    this.ambienceGainNode.gain.setValueAtTime(1.0, this.ctx.currentTime);

    this.ambienceFilterNode.connect(this.ambienceGainNode);
    this.ambienceGainNode.connect(this.masterGainNode);

    // 3. SFX Bus: Gain -> Master (bypasses ambience lowpass filter)
    this.sfxGainNode = this.ctx.createGain();
    this.sfxGainNode.gain.setValueAtTime(1.0, this.ctx.currentTime);
    this.sfxGainNode.connect(this.masterGainNode);
  }

  /**
   * Unlock AudioContext inside a user gesture handler (entry button click).
   */
  public async unlock(): Promise<void> {
    if (!this.ctx || this.unlocked) return;

    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (err) {
        console.warn('AudioContext failed to resume:', err);
      }
    }

    this.unlocked = true;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (!this.ctx || !this.masterGainNode) return;

    const now = this.ctx.currentTime;
    const targetGain = muted ? 0 : AudioEngine.DEFAULT_MASTER_GAIN;

    // 300 ms linear ramp
    this.masterGainNode.gain.setValueAtTime(this.masterGainNode.gain.value, now);
    this.masterGainNode.gain.linearRampToValueAtTime(
      targetGain,
      now + AudioEngine.MUTE_RAMP_DURATION,
    );
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public getMasterGain(): number {
    return this.muted ? 0 : AudioEngine.DEFAULT_MASTER_GAIN;
  }

  /**
   * Modulate ambience filter and wind during lie-down:
   * lowpass cutoff ramps from 18 kHz -> 2.2 kHz over 1.1 s (cosy, closer).
   */
  public setLyingDown(lying: boolean): void {
    this.lyingDown = lying;
    if (!this.ctx || !this.ambienceFilterNode) return;

    const now = this.ctx.currentTime;
    const targetFreq = lying
      ? AudioEngine.AMBIENCE_FILTER_LIE_DOWN
      : AudioEngine.AMBIENCE_FILTER_DEFAULT;

    this.ambienceFilterNode.frequency.setValueAtTime(this.ambienceFilterNode.frequency.value, now);
    this.ambienceFilterNode.frequency.exponentialRampToValueAtTime(
      targetFreq,
      now + AudioEngine.LIE_DOWN_RAMP_DURATION,
    );
  }

  public isLyingDown(): boolean {
    return this.lyingDown;
  }

  /**
   * Handle page visibility:
   * hidden -> ctx.suspend()
   * visible -> ctx.resume() (if unlocked and not muted)
   */
  public handleVisibilityChange(hidden: boolean): void {
    if (!this.ctx || !this.unlocked) return;

    if (hidden) {
      if (this.ctx.state === 'running') {
        void this.ctx.suspend();
      }
    } else {
      if (this.ctx.state === 'suspended' && !this.muted) {
        void this.ctx.resume();
      }
    }
  }

  public isUnlocked(): boolean {
    return this.unlocked;
  }

  public isSupported(): boolean {
    return this.supported && this.ctx !== null;
  }

  public getContext(): AudioContext | null {
    return this.ctx;
  }

  public getAmbienceBus(): AudioNode {
    return this.ambienceFilterNode;
  }

  public getSfxBus(): AudioNode {
    return this.sfxGainNode;
  }

  public getMasterGainNode(): GainNode {
    return this.masterGainNode;
  }

  public getAmbienceFilterNode(): BiquadFilterNode {
    return this.ambienceFilterNode;
  }

  public dispose(): void {
    if (this.ctx && this.ctx.state !== 'closed') {
      try {
        void this.ctx.close();
      } catch {
        // Ignore close errors on dispose
      }
    }
    this.unlocked = false;
  }
}
