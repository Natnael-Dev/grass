import { createPinkNoiseBuffer } from './noise';
import { calculateWindGain } from './math';

export class Wind {
  private ctx: AudioContext;
  private destination: AudioNode;
  private started = false;

  private noiseBuffer: AudioBuffer | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;

  // Filter & LFO nodes
  private bandpassFilter: BiquadFilterNode | null = null;
  private highpassFilter: BiquadFilterNode | null = null;
  private lfoOsc: OscillatorNode | null = null;
  private lfoFreqGain: GainNode | null = null;
  private lfoAmpGain: GainNode | null = null;

  // Master layer gain
  private outputGain: GainNode | null = null;
  private targetGain = 0;

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.destination = destination;
  }

  public start(): void {
    if (this.started) return;

    this.noiseBuffer = createPinkNoiseBuffer(this.ctx, 4.0);

    // 1. Looping Noise Source
    this.noiseSource = this.ctx.createBufferSource();
    this.noiseSource.buffer = this.noiseBuffer;
    this.noiseSource.loop = true;

    // 2. Primary Bandpass Filter (f0 = 420 Hz, Q = 0.7)
    this.bandpassFilter = this.ctx.createBiquadFilter();
    this.bandpassFilter.type = 'bandpass';
    this.bandpassFilter.frequency.setValueAtTime(420, this.ctx.currentTime);
    this.bandpassFilter.Q.setValueAtTime(0.7, this.ctx.currentTime);

    // 3. Second Highpass Layer (1.2 kHz hiss layer at low gain)
    this.highpassFilter = this.ctx.createBiquadFilter();
    this.highpassFilter.type = 'highpass';
    this.highpassFilter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    this.highpassFilter.Q.setValueAtTime(0.7, this.ctx.currentTime);

    const hissGain = this.ctx.createGain();
    hissGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    // 4. LFO at 0.07 Hz modulating cutoff (+/- 160 Hz) and amplitude
    this.lfoOsc = this.ctx.createOscillator();
    this.lfoOsc.type = 'sine';
    this.lfoOsc.frequency.setValueAtTime(0.07, this.ctx.currentTime);

    this.lfoFreqGain = this.ctx.createGain();
    this.lfoFreqGain.gain.setValueAtTime(160, this.ctx.currentTime);

    this.lfoOsc.connect(this.lfoFreqGain);
    this.lfoFreqGain.connect(this.bandpassFilter.frequency);

    // 5. Output Gain Node
    this.outputGain = this.ctx.createGain();
    this.outputGain.gain.setValueAtTime(0, this.ctx.currentTime);

    // Connect graph:
    // noiseSource -> bandpassFilter -> outputGain -> destination
    // noiseSource -> highpassFilter -> hissGain -> outputGain
    this.noiseSource.connect(this.bandpassFilter);
    this.bandpassFilter.connect(this.outputGain);

    this.noiseSource.connect(this.highpassFilter);
    this.highpassFilter.connect(hissGain);
    hissGain.connect(this.outputGain);

    this.outputGain.connect(this.destination);

    // Start audio sources
    this.noiseSource.start();
    this.lfoOsc.start();
    this.started = true;
  }

  public update(audioWind: number, windStrength: number, isLyingDown = false): void {
    if (!this.started || !this.outputGain) return;

    const baseGain = calculateWindGain(audioWind, windStrength);
    const lieMultiplier = isLyingDown ? 1.25 : 1.0;
    this.targetGain = baseGain * lieMultiplier;

    const now = this.ctx.currentTime;
    this.outputGain.gain.setTargetAtTime(this.targetGain, now, 0.1);
  }

  public isStarted(): boolean {
    return this.started;
  }

  public getTargetGain(): number {
    return this.targetGain;
  }

  public dispose(): void {
    if (this.noiseSource) {
      try {
        this.noiseSource.stop();
        this.noiseSource.disconnect();
      } catch {
        // Ignore already stopped errors
      }
      this.noiseSource = null;
    }
    if (this.lfoOsc) {
      try {
        this.lfoOsc.stop();
        this.lfoOsc.disconnect();
      } catch {
        // Ignore errors
      }
      this.lfoOsc = null;
    }
    if (this.outputGain) {
      this.outputGain.disconnect();
      this.outputGain = null;
    }
    this.started = false;
  }
}
