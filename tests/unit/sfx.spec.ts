import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Sfx } from '../../src/audio/Sfx';

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
  public frequency = new MockAudioParam(1800);
  public Q = new MockAudioParam(1.0);
  public type: BiquadFilterType = 'bandpass';
}

class MockOscillatorNode extends MockAudioNode {
  public frequency = new MockAudioParam(520);
  public type: OscillatorType = 'sine';
  start = vi.fn();
  stop = vi.fn();
  onended: (() => void) | null = null;
}

class MockBufferSourceNode extends MockAudioNode {
  public buffer: unknown = null;
  start = vi.fn();
  stop = vi.fn();
  onended: (() => void) | null = null;
}

class MockAudioContext {
  public currentTime = 5.0;
  public sampleRate = 44100;

  createGain = vi.fn(() => new MockGainNode());
  createBiquadFilter = vi.fn(() => new MockBiquadFilterNode());
  createOscillator = vi.fn(() => new MockOscillatorNode());
  createBufferSource = vi.fn(() => new MockBufferSourceNode());
  createBuffer = vi.fn((channels: number, length: number, sampleRate: number) => ({
    numberOfChannels: channels,
    length,
    sampleRate,
    getChannelData: vi.fn(() => new Float32Array(length)),
  }));
}

describe('Sfx', () => {
  let mockCtx: MockAudioContext;
  let mockSfxBus: MockAudioNode;

  beforeEach(() => {
    mockCtx = new MockAudioContext();
    mockSfxBus = new MockAudioNode();
  });

  it('triggers seed scatter sound effect with noise puff and sine blip', () => {
    const sfx = new Sfx(mockCtx as unknown as AudioContext, mockSfxBus as unknown as AudioNode);
    sfx.playSeedScatter();

    expect(mockCtx.createBufferSource).toHaveBeenCalled();
    expect(mockCtx.createBiquadFilter).toHaveBeenCalled();
    expect(mockCtx.createOscillator).toHaveBeenCalled();
    expect(mockCtx.createGain).toHaveBeenCalled();

    sfx.dispose();
  });
});
