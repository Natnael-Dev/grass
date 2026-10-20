/**
 * Sfx:
 * Procedural sound effects generator (seed scatter puff & blip).
 * Connects directly to sfxBus (bypassing ambience lowpass filter).
 */

export class Sfx {
  private ctx: AudioContext | null;
  private sfxBus: AudioNode | null;
  private noiseBuffer: AudioBuffer | null = null;

  constructor(ctx: AudioContext | null, sfxBus: AudioNode | null) {
    this.ctx = ctx;
    this.sfxBus = sfxBus;

    if (this.ctx) {
      this.initNoiseBuffer();
    }
  }

  private initNoiseBuffer(): void {
    if (!this.ctx) return;
    const duration = 0.2; // 200 ms noise buffer
    const length = Math.floor(this.ctx.sampleRate * duration);
    this.noiseBuffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }

  /**
   * Play seed scatter effect:
   * 140 ms noise "pff" (bandpass 1.8 kHz) + soft sine blip (520 -> 680 Hz, 90 ms).
   */
  public playSeedScatter(): void {
    if (!this.ctx || !this.sfxBus || !this.noiseBuffer) return;

    const now = this.ctx.currentTime;

    // 1. Noise puff: 140 ms bandpass 1800 Hz
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1800, now);
    noiseFilter.Q.setValueAtTime(1.0, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.2, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxBus);

    noiseSource.start(now);
    noiseSource.stop(now + 0.14);

    noiseSource.onended = () => {
      noiseSource.disconnect();
      noiseFilter.disconnect();
      noiseGain.disconnect();
    };

    // 2. Soft sine blip: 520 Hz -> 680 Hz over 90 ms
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.09);

    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.08, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(oscGain);
    oscGain.connect(this.sfxBus);

    osc.start(now);
    osc.stop(now + 0.09);

    osc.onended = () => {
      osc.disconnect();
      oscGain.disconnect();
    };
  }

  public dispose(): void {
    this.noiseBuffer = null;
    this.ctx = null;
    this.sfxBus = null;
  }
}
