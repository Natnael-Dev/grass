import { createPinkNoiseBuffer } from './noise';
import { calculateRustleParams } from './math';

export class Rustle {
  private ctx: AudioContext;
  private destination: AudioNode;

  private noiseBuffer: AudioBuffer | null = null;
  private accumulatedProbability = 0;
  private lastGrainTime = 0;

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.destination = destination;
    this.noiseBuffer = createPinkNoiseBuffer(this.ctx, 1.0);
  }

  /**
   * Called on each frame/brush movement:
   * Spawns grains according to brush speed and strength, capped at 12 grains/second.
   */
  public onBrush(speedPxPerSec: number, strength: number, dtSeconds: number): void {
    const { grainProbability, grainGain } = calculateRustleParams(
      speedPxPerSec,
      strength,
      dtSeconds,
    );

    if (grainProbability <= 0 || grainGain <= 0) {
      this.accumulatedProbability = 0;
      return;
    }

    this.accumulatedProbability += grainProbability;

    // Minimum interval between grains: 1/12s ≈ 83 ms
    const now = this.ctx.currentTime;
    if (this.accumulatedProbability >= 1.0 && now - this.lastGrainTime >= 0.08) {
      this.accumulatedProbability -= 1.0;
      this.lastGrainTime = now;
      this.spawnGrain(grainGain);
    }
  }

  private spawnGrain(strengthGain: number): void {
    if (!this.noiseBuffer) return;

    const now = this.ctx.currentTime;
    // Grain duration between 60 ms and 140 ms
    const duration = 0.06 + Math.random() * 0.08;

    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    // Random start offset in the noise buffer
    const maxOffset = Math.max(0, this.noiseBuffer.duration - duration);
    const startOffset = Math.random() * maxOffset;

    // Bandpass filter at 3.2 kHz (Q = 1.2)
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3200 + (Math.random() * 400 - 200), now);
    filter.Q.setValueAtTime(1.2, now);

    // Envelope gain (attack 10 ms, decay to duration)
    const envelope = this.ctx.createGain();
    const peakGain = strengthGain * (0.08 + Math.random() * 0.06);
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(peakGain, now + 0.01);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    // Stereo panning +/- 0.4
    let lastNode: AudioNode = envelope;
    if (this.ctx.createStereoPanner) {
      const panner = this.ctx.createStereoPanner();
      panner.pan.setValueAtTime((Math.random() * 2 - 1) * 0.4, now);
      envelope.connect(panner);
      lastNode = panner;
    }

    source.connect(filter);
    filter.connect(envelope);
    lastNode.connect(this.destination);

    source.start(now, startOffset, duration);

    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      envelope.disconnect();
    };
  }

  public dispose(): void {
    this.noiseBuffer = null;
  }
}
