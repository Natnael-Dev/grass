export class Birds {
  private ctx: AudioContext;
  private destination: AudioNode;
  private started = false;

  private moodGain = 0;
  private nextChirpTime = 0;
  private timerId: ReturnType<typeof setTimeout> | null = null;

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.destination = destination;
  }

  public start(): void {
    if (this.started) return;
    this.started = true;
    this.scheduleNextChirp();
  }

  public update(audioBirds: number, _dtSeconds?: number): void {
    this.moodGain = audioBirds;
    if (this.moodGain <= 0.001) {
      return;
    }

    const now = this.ctx.currentTime;
    if (now >= this.nextChirpTime && this.started) {
      this.playChirpSequence();
      this.scheduleNextChirp();
    }
  }

  private scheduleNextChirp(): void {
    // Chirp every 2 to 7 seconds (randomized)
    const interval = 2.0 + Math.random() * 5.0;
    this.nextChirpTime = this.ctx.currentTime + interval;
  }

  private playChirpSequence(): void {
    if (this.moodGain <= 0.001) return;

    // 1 to 3 syllables in a sequence
    const syllableCount = 1 + Math.floor(Math.random() * 3);
    const baseTime = this.ctx.currentTime + 0.02;
    const panVal = (Math.random() * 2 - 1) * 0.6;

    for (let i = 0; i < syllableCount; i++) {
      const syllableStart = baseTime + i * (0.12 + Math.random() * 0.06);
      this.playSyllable(syllableStart, panVal);
    }
  }

  private playSyllable(startTime: number, pan: number): void {
    // 70 - 120 ms duration
    const duration = 0.07 + Math.random() * 0.05;

    // Main carrier sine sweep: 3200 -> 4800 Hz
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    const startFreq = 3200 + Math.random() * 400;
    const endFreq = 4600 + Math.random() * 400;

    osc.frequency.setValueAtTime(startFreq, startTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration);

    // 25 Hz vibrato modulator
    const vibrato = this.ctx.createOscillator();
    vibrato.type = 'sine';
    vibrato.frequency.setValueAtTime(25, startTime);

    const vibratoGain = this.ctx.createGain();
    vibratoGain.gain.setValueAtTime(60, startTime); // +/- 60 Hz pitch vibrato

    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc.frequency);

    // Envelope
    const envelope = this.ctx.createGain();
    const peakGain = this.moodGain * 0.06;
    envelope.gain.setValueAtTime(0, startTime);
    envelope.gain.linearRampToValueAtTime(peakGain, startTime + duration * 0.3);
    envelope.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    // Panner
    let lastNode: AudioNode = envelope;
    if (this.ctx.createStereoPanner) {
      const panner = this.ctx.createStereoPanner();
      panner.pan.setValueAtTime(pan, startTime);
      envelope.connect(panner);
      lastNode = panner;
    }

    osc.connect(envelope);
    lastNode.connect(this.destination);

    osc.start(startTime);
    vibrato.start(startTime);
    osc.stop(startTime + duration);
    vibrato.stop(startTime + duration);

    osc.onended = () => {
      osc.disconnect();
      vibrato.disconnect();
      vibratoGain.disconnect();
      envelope.disconnect();
    };
  }

  public isPlaying(): boolean {
    return this.started && this.moodGain > 0.001;
  }

  public getMoodGain(): number {
    return this.moodGain;
  }

  public dispose(): void {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.started = false;
  }
}
