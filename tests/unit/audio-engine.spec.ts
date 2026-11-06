import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AudioEngine } from '../../src/audio/AudioEngine';

class MockAudioParam {
  public value: number;
  constructor(initial = 1) {
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
  public frequency = new MockAudioParam(18000);
  public Q = new MockAudioParam(0.7);
  public type: BiquadFilterType = 'lowpass';
}

class MockDynamicsCompressorNode extends MockAudioNode {
  public threshold = new MockAudioParam(-12);
  public knee = new MockAudioParam(10);
  public ratio = new MockAudioParam(3);
  public attack = new MockAudioParam(0.01);
  public release = new MockAudioParam(0.25);
}

class MockAudioContext {
  public state: AudioContextState = 'suspended';
  public currentTime = 0;
  public sampleRate = 44100;
  public destination = new MockAudioNode();

  createGain = vi.fn(() => new MockGainNode());
  createBiquadFilter = vi.fn(() => new MockBiquadFilterNode());
  createDynamicsCompressor = vi.fn(() => new MockDynamicsCompressorNode());
  createBuffer = vi.fn((channels: number, length: number, sampleRate: number) => ({
    numberOfChannels: channels,
    length,
    sampleRate,
    getChannelData: vi.fn(() => new Float32Array(length)),
  }));
  createBufferSource = vi.fn(() => ({
    buffer: null,
    loop: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    onended: null,
  }));

  resume = vi.fn(async () => {
    this.state = 'running';
  });
  suspend = vi.fn(async () => {
    this.state = 'suspended';
  });
  close = vi.fn(async () => {
    this.state = 'closed';
  });
}

describe('AudioEngine', () => {
  let mockCtx: MockAudioContext;

  beforeEach(() => {
    mockCtx = new MockAudioContext();
  });

  it('initializes in suspended or unstarted state and builds graph on unlock', async () => {
    const engine = new AudioEngine({ context: mockCtx as unknown as AudioContext });
    expect(engine.isUnlocked()).toBe(false);

    await engine.unlock();
    expect(engine.isUnlocked()).toBe(true);
    expect(mockCtx.resume).toHaveBeenCalled();
    expect(mockCtx.state).toBe('running');
  });

  it('configures master gain to 0.5 default when unmuted', async () => {
    const engine = new AudioEngine({ context: mockCtx as unknown as AudioContext });
    await engine.unlock();

    expect(engine.getMasterGain()).toBe(0.5);
    expect(engine.isMuted()).toBe(false);
  });

  it('ramps mute to 0 over 300 ms and restores on unmute', async () => {
    const engine = new AudioEngine({ context: mockCtx as unknown as AudioContext });
    await engine.unlock();

    // Mute
    engine.setMuted(true);
    expect(engine.isMuted()).toBe(true);
    expect(engine.getMasterGainNode().gain.linearRampToValueAtTime).toHaveBeenCalledWith(0, 0.3);

    // Unmute
    mockCtx.currentTime = 1.0;
    engine.setMuted(false);
    expect(engine.isMuted()).toBe(false);
    expect(engine.getMasterGainNode().gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.5, 1.3);
  });

  it('modulates ambience lowpass filter and wind gain on lie-down', async () => {
    const engine = new AudioEngine({ context: mockCtx as unknown as AudioContext });
    await engine.unlock();

    const ambienceFilter = engine.getAmbienceFilterNode();
    expect(ambienceFilter.frequency.value).toBe(18000);

    // Lie down start
    mockCtx.currentTime = 2.0;
    engine.setLyingDown(true);
    expect(engine.isLyingDown()).toBe(true);
    expect(ambienceFilter.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(2200, 3.1);

    // Lie down release
    mockCtx.currentTime = 10.0;
    engine.setLyingDown(false);
    expect(engine.isLyingDown()).toBe(false);
    expect(ambienceFilter.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(18000, 11.1);
  });

  it('suspends on handleVisibilityChange(hidden) and resumes on visible', async () => {
    const engine = new AudioEngine({ context: mockCtx as unknown as AudioContext });
    await engine.unlock();

    engine.handleVisibilityChange(true); // hidden
    expect(mockCtx.suspend).toHaveBeenCalled();

    engine.handleVisibilityChange(false); // visible
    expect(mockCtx.resume).toHaveBeenCalled();
  });

  it('does not resume on visibilitychange visible if muted or not unlocked', () => {
    const engine = new AudioEngine({
      context: mockCtx as unknown as AudioContext,
      initialMuted: true,
    });
    // Not unlocked
    engine.handleVisibilityChange(false);
    expect(mockCtx.resume).not.toHaveBeenCalled();
  });

  it('handles environment with no Web Audio gracefully without throwing', () => {
    const engine = new AudioEngine({ context: null as unknown as AudioContext });
    expect(engine.isSupported()).toBe(false);
    expect(() => {
      engine.unlock();
      engine.setMuted(true);
      engine.setLyingDown(true);
      engine.handleVisibilityChange(true);
      engine.dispose();
    }).not.toThrow();
  });
});
