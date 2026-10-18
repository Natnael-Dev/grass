import { describe, it, expect, vi } from 'vitest';
import { Loop } from '../../src/core/Loop';

describe('render and animation Loop', () => {
  it('subscribes and receives step ticks', () => {
    const loop = new Loop();
    const ticks: Array<{ dt: number; elapsed: number }> = [];

    const unsubscribe = loop.subscribe((dt, elapsed) => {
      ticks.push({ dt, elapsed });
    });

    loop.step(0.016);
    loop.step(0.016);

    expect(ticks.length).toBe(2);
    expect(ticks[0]?.dt).toBeCloseTo(0.016, 4);
    expect(ticks[1]?.elapsed).toBeCloseTo(0.032, 4);

    unsubscribe();
    loop.step(0.016);
    expect(ticks.length).toBe(2);
    loop.dispose();
  });

  it('clamps dt to 0.1s to prevent explosions', () => {
    const loop = new Loop();
    let receivedDt = 0;

    loop.subscribe((dt) => {
      receivedDt = dt;
    });

    // Simulate a massive 5-second frame freeze
    loop.step(5.0);
    expect(receivedDt).toBe(0.1);
    expect(loop.getElapsed()).toBe(0.1);
    loop.dispose();
  });

  it('clamps negative dt to 0', () => {
    const loop = new Loop();
    let receivedDt = -1;

    loop.subscribe((dt) => {
      receivedDt = dt;
    });

    loop.step(-0.5);
    expect(receivedDt).toBe(0);
    expect(loop.getElapsed()).toBe(0);
    loop.dispose();
  });

  it('supports frozen deterministic time stepping', () => {
    const loop = new Loop({ freeze: true, fixedDt: 0.02 });
    expect(loop.getFrameCount()).toBe(0);

    const received: number[] = [];
    loop.subscribe((dt) => {
      received.push(dt);
    });

    loop.step(0.02);
    expect(received[0]).toBe(0.02);
    expect(loop.getFrameCount()).toBe(1);
    loop.dispose();
  });

  it('stops and starts correctly', () => {
    let animFrameCalled = false;
    let cancelCalled = false;

    vi.stubGlobal('requestAnimationFrame', () => {
      animFrameCalled = true;
      return 123;
    });
    vi.stubGlobal('cancelAnimationFrame', () => {
      cancelCalled = true;
    });

    const loop = new Loop();
    expect(loop.isRunning()).toBe(false);

    loop.start();
    expect(loop.isRunning()).toBe(true);
    expect(animFrameCalled).toBe(true);

    loop.stop();
    expect(loop.isRunning()).toBe(false);
    expect(cancelCalled).toBe(true);

    loop.dispose();
    vi.unstubAllGlobals();
  });
});
