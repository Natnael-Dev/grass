export class Crickets {
  private ctx: AudioContext | null;
  private destination: AudioNode | null;
  private started = false;

  // Voices
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private osc3: OscillatorNode | null = null;
  private voiceGain: GainNode | null = null;

  // Amplitude modulator
  private amOsc: OscillatorNode | null = null;
  private amGain: GainNode | null = null;
  private amVca: GainNode | null = null;

  // Master cricket gain
  private outputGain: GainNode | null = null;
  private targetGain = 0;

  // Chirp rhythm scheduler
  private nextChirpTime = 0;

  constructor(ctx: AudioContext | null, destination: AudioNode | null) {
    this.ctx = ctx;
    this.destination = destination;
  }

  public start(): void {
    if (this.started || !this.ctx || !this.destination) return;

    const now = this.ctx.currentTime;

    // 1. Three detuned sine voices: 4.1 kHz, 4.35 kHz, 4.6 kHz
    this.osc1 = this.ctx.createOscillator();
    this.osc1.type = 'sine';
    this.osc1.frequency.setValueAtTime(4100, now);

    this.osc2 = this.ctx.createOscillator();
    this.osc2.type = 'sine';
    this.osc2.frequency.setValueAtTime(4350, now);

    this.osc3 = this.ctx.createOscillator();
    this.osc3.type = 'sine';
    this.osc3.frequency.setValueAtTime(4600, now);

    this.voiceGain = this.ctx.createGain();
    this.voiceGain.gain.setValueAtTime(0.33, now);

    this.osc1.connect(this.voiceGain);
    this.osc2.connect(this.voiceGain);
    this.osc3.connect(this.voiceGain);

    // 2. 28 Hz Amplitude Modulation
    // Base gain offset 0.5 + modulation [-0.5, +0.5] yields [0.0, 1.0] AM swing
    this.amOsc = this.ctx.createOscillator();
    this.amOsc.type = 'sine';
    this.amOsc.frequency.setValueAtTime(28, now);

    this.amGain = this.ctx.createGain();
    this.amGain.gain.setValueAtTime(0.5, now);
    this.amOsc.connect(this.amGain);

    this.amVca = this.ctx.createGain();
    this.amVca.gain.setValueAtTime(0.5, now);
    this.amGain.connect(this.amVca.gain);

    // 3. Output Gain node (controlled by mood.audioCrickets)
    this.outputGain = this.ctx.createGain();
    this.outputGain.gain.setValueAtTime(0, now);

    // Route carrier through modulated VCA into output
    this.voiceGain.connect(this.amVca);
    this.amVca.connect(this.outputGain);
    this.outputGain.connect(this.destination);

    this.osc1.start();
    this.osc2.start();
    this.osc3.start();
    this.amOsc.start();

    this.started = true;
    this.nextChirpTime = now + 0.5;
  }

  public update(audioCrickets: number): void {
    if (!this.started || !this.outputGain || !this.ctx) return;

    // Very low gain 0.02 - 0.035 scaled by mood
    this.targetGain = audioCrickets * 0.03;
    const now = this.ctx.currentTime;
    this.outputGain.gain.setTargetAtTime(this.targetGain, now, 0.1);
  }

  public isStarted(): boolean {
    return this.started;
  }

  public getTargetGain(): number {
    return this.targetGain;
  }

  public getVoiceGain(): GainNode | null {
    return this.voiceGain;
  }

  public getAmGain(): GainNode | null {
    return this.amGain;
  }

  public getAmVca(): GainNode | null {
    return this.amVca;
  }

  public getOutputGain(): GainNode | null {
    return this.outputGain;
  }

  public dispose(): void {
    if (this.osc1) {
      try {
        this.osc1.stop();
        this.osc1.disconnect();
      } catch {
        // Ignore errors
      }
      this.osc1 = null;
    }
    if (this.osc2) {
      try {
        this.osc2.stop();
        this.osc2.disconnect();
      } catch {
        // Ignore errors
      }
      this.osc2 = null;
    }
    if (this.osc3) {
      try {
        this.osc3.stop();
        this.osc3.disconnect();
      } catch {
        // Ignore errors
      }
      this.osc3 = null;
    }
    if (this.amOsc) {
      try {
        this.amOsc.stop();
        this.amOsc.disconnect();
      } catch {
        // Ignore errors
      }
      this.amOsc = null;
    }
    if (this.amGain) {
      try {
        this.amGain.disconnect();
      } catch {
        // Ignore errors
      }
      this.amGain = null;
    }
    if (this.amVca) {
      try {
        this.amVca.disconnect();
      } catch {
        // Ignore errors
      }
      this.amVca = null;
    }
    if (this.outputGain) {
      this.outputGain.disconnect();
      this.outputGain = null;
    }
    this.started = false;
    this.ctx = null;
    this.destination = null;
  }
}
