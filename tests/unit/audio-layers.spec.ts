import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Wind } from '../../src/audio/Wind';
import { Rustle } from '../../src/audio/Rustle';
import { Crickets } from '../../src/audio/Crickets';
import { Birds } from '../../src/audio/Birds';

class MockAudioParam {
  public value: number;
  constructor(initial = 0) {
    this.value = initial;
  }
  setValueAtTime = vi.fn((v: number) => {
    this.value = v;
  });
  linearRampToValueAtTime = vi.fn((v: number) => {
    this.value = v;
  });
  exponentialRampToValueAtTime = vi.fn((v: number) => {
    this.value = v;
  });
  setTargetAtTime = vi.fn((v: number) => {
    this.value = v;
  });
}

class MockAudioNode {
  public connectedTo: unknown[] = [];
  connect = vi.fn((target: unknown) => {
    this.connectedTo.push(target);
    return target;
  });
  disconnect = vi.fn(() => {
    this.connectedTo = [];
  });
}

class MockGainNode extends MockAudioNode {
  public gain = new MockAudioParam(1);
}

class MockBiquadFilterNode extends MockAudioNode {
  public frequency = new MockAudioParam(1000);
  public Q = new MockAudioParam(1.0);
  public type: BiquadFilterType = 'bandpass';
}

class MockOscillatorNode extends MockAudioNode {
  public frequency = new MockAudioParam(440);
  public type: OscillatorType = 'sine';
  start = vi.fn();
  stop = vi.fn();
  onended: (() => void) | null = null;
}

class MockStereoPannerNode extends MockAudioNode {
  public pan = new MockAudioParam(0);
}

class MockBufferSourceNode extends MockAudioNode {
  public buffer: unknown = null;
  public loop = false;
  start = vi.fn();
  stop = vi.fn();
  onended: (() => void) | null = null;
}

class MockAudioContext {
  public state: AudioContextState = 'running';
  public currentTime = 10.0;
  public sampleRate = 44100;
  public destination = new MockAudioNode();

  createGain = vi.fn(() => new MockGainNode());
  createBiquadFilter = vi.fn(() => new MockBiquadFilterNode());
  createOscillator = vi.fn(() => new MockOscillatorNode());
  createStereoPanner = vi.fn(() => new MockStereoPannerNode());
  createBufferSource = vi.fn(() => new MockBufferSourceNode());
  createBuffer = vi.fn((channels: number, length: number, sampleRate: number) => ({
    numberOfChannels: channels,
    length,
    sampleRate,
    getChannelData: vi.fn(() => new Float32Array(length)),
  }));
}

describe('Procedural Audio Layers', () => {
  let mockCtx: MockAudioContext;
  let mockDestination: MockAudioNode;

  beforeEach(() => {
    mockCtx = new MockAudioContext();
    mockDestination = new MockAudioNode();
  });

  describe('Wind', () => {
    it('creates dual-layer wind graph with LFO modulation', () => {
      const wind = new Wind(
        mockCtx as unknown as AudioContext,
        mockDestination as unknown as AudioNode,
      );
      expect(wind.isStarted()).toBe(false);

      wind.start();
      expect(wind.isStarted()).toBe(true);
      expect(mockCtx.createBufferSource).toHaveBeenCalled();
      expect(mockCtx.createBiquadFilter).toHaveBeenCalled();
      expect(mockCtx.createOscillator).toHaveBeenCalled(); // 0.07 Hz LFO
    });

    it('updates gain with mood audioWind and windStrength, and applies 1.25x lying multiplier', () => {
      const wind = new Wind(
        mockCtx as unknown as AudioContext,
        mockDestination as unknown as AudioNode,
      );
      wind.start();

      // Normal standing golden mood: audio.wind = 0.8, windStrength = 0.9
      wind.update(0.8, 0.9, false);
      const expectedGain = 0.8 * (0.6 + 0.4 * 0.9); // 0.768
      expect(wind.getTargetGain()).toBeCloseTo(expectedGain, 4);

      // Lying down: x1.25 multiplier
      wind.update(0.8, 0.9, true);
      expect(wind.getTargetGain()).toBeCloseTo(expectedGain * 1.25, 4);

      wind.dispose();
    });
  });

  describe('Rustle', () => {
    it('does not spawn grains when stationary (speed <= 10)', () => {
      const rustle = new Rustle(
        mockCtx as unknown as AudioContext,
        mockDestination as unknown as AudioNode,
      );
      rustle.onBrush(0, 0, 0.016);
      expect(mockCtx.createBufferSource).not.toHaveBeenCalled();
    });

    it('schedules grain when brushing with high speed and strength', () => {
      const rustle = new Rustle(
        mockCtx as unknown as AudioContext,
        mockDestination as unknown as AudioNode,
      );
      // Speed 800 px/s over 0.2s = expected grains > 1
      rustle.onBrush(800, 1.0, 0.2);
      expect(mockCtx.createBufferSource).toHaveBeenCalled();
    });
  });

  describe('Crickets', () => {
    it('initializes 3 oscillator voices, routes carrier through modulated AM VCA, and controls output gain via mood', () => {
      const crickets = new Crickets(
        mockCtx as unknown as AudioContext,
        mockDestination as unknown as AudioNode,
      );
      crickets.start();

      const voiceGain = crickets.getVoiceGain() as unknown as MockGainNode;
      const amGain = crickets.getAmGain() as unknown as MockGainNode;
      const amVca = crickets.getAmVca() as unknown as MockGainNode;
      const outputGain = crickets.getOutputGain() as unknown as MockGainNode;

      expect(voiceGain).toBeDefined();
      expect(amGain).toBeDefined();
      expect(amVca).toBeDefined();
      expect(outputGain).toBeDefined();

      // Verify real audio graph signal path:
      // 1. AM modulator connects to VCA gain parameter
      expect(amGain.connectedTo).toContain(amVca.gain);
      // 2. Carrier voices pass into modulated VCA
      expect(voiceGain.connectedTo).toContain(amVca);
      // 3. Modulated VCA feeds master output gain
      expect(amVca.connectedTo).toContain(outputGain);
      // 4. Output gain feeds destination bus
      expect(outputGain.connectedTo).toContain(mockDestination);

      // Verify VCA baseline gain is 0.5 (for [0.0, 1.0] swing when modulated by +/-0.5)
      expect(amVca.gain.value).toBe(0.5);

      // Night mood: crickets gain = 0.9
      crickets.update(0.9);
      expect(crickets.getTargetGain()).toBeCloseTo(0.9 * 0.03, 4);

      // Golden mood: crickets gain = 0
      crickets.update(0);
      expect(crickets.getTargetGain()).toBe(0);

      crickets.dispose();
    });
  });

  describe('Birds', () => {
    it('does not schedule chirps when mood audioBirds is 0 (night)', () => {
      const birds = new Birds(
        mockCtx as unknown as AudioContext,
        mockDestination as unknown as AudioNode,
      );
      birds.start();

      birds.update(0, 1.0); // Night
      expect(birds.isPlaying()).toBe(false);

      birds.dispose();
    });

    it('activates and schedules chirps during dawn/golden', () => {
      const birds = new Birds(
        mockCtx as unknown as AudioContext,
        mockDestination as unknown as AudioNode,
      );
      birds.start();

      birds.update(0.9, 0.05); // Dawn
      expect(birds.getMoodGain()).toBe(0.9);

      birds.dispose();
    });
  });
});
