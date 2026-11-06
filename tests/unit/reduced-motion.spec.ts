import { describe, it, expect, vi } from 'vitest';
import { Grass } from '../../src/world/Grass';
import { Fireflies } from '../../src/world/Fireflies';
import { MoodController } from '../../src/world/MoodController';
import { CameraRig } from '../../src/camera/CameraRig';
import { Entry } from '../../src/ui/Entry';
import { Store } from '../../src/app/store';

class MockOverlayElement {
  public style: Record<string, string> = {};
  public classes = new Set<string>();

  get classList() {
    return {
      add: (cls: string) => this.classes.add(cls),
      contains: (cls: string) => this.classes.has(cls),
    };
  }
}

class MockButtonElement {
  public disabled = false;
  public textContent = '';
  public focus = vi.fn();
  private listeners: Record<string, ((e?: unknown) => void)[]> = {};

  addEventListener(event: string, fn: (e?: unknown) => void): void {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }

  removeEventListener(event: string, fn: (e?: unknown) => void): void {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((f) => f !== fn);
    }
  }
}

describe('Reduced Motion Synchronization', () => {
  it('Grass: setReducedMotion adjusts uReduced uniform between 1.0 and 0.0', () => {
    const grass = new Grass();
    expect(grass.uReduced.value).toBe(0.0);

    grass.setReducedMotion(true);
    expect(grass.uReduced.value).toBe(1.0);

    grass.setReducedMotion(false);
    expect(grass.uReduced.value).toBe(0.0);
    grass.dispose();
  });

  it('Fireflies: setReducedMotion adjusts uReducedMotion uniform between 1.0 and 0.0', () => {
    const fireflies = new Fireflies();
    expect(fireflies.uReducedMotion.value).toBe(0.0);

    fireflies.setReducedMotion(true);
    expect(fireflies.uReducedMotion.value).toBe(1.0);

    fireflies.setReducedMotion(false);
    expect(fireflies.uReducedMotion.value).toBe(0.0);
    fireflies.dispose();
  });

  it('MoodController: shortens crossfade duration to 1.0s under reduced motion', () => {
    const controller = new MoodController('dawn');
    expect(controller.getFadeDuration()).toBe(2.5);

    controller.setReducedMotion(true);
    expect(controller.getFadeDuration()).toBe(1.0);

    controller.setMood('golden');
    expect(controller.state.isFading).toBe(true);

    controller.update(0.5);
    expect(controller.state.progress).toBeCloseTo(0.5, 2);
    expect(controller.state.isFading).toBe(true);

    controller.update(0.5);
    expect(controller.state.progress).toBe(1);
    expect(controller.state.isFading).toBe(false);
    expect(controller.state.currentMood).toBe('golden');
  });

  it('CameraRig: eliminates parallax sway, idle drift, gust and fov changes in reduced motion', () => {
    const rig = new CameraRig({ aspect: 16 / 9 });
    rig.setReducedMotion(true);
    expect(rig.getReducedMotion()).toBe(true);

    // Parallax input does not sway position or lookAt
    rig.setParallaxTarget(0.8, -0.6);
    rig.update(0.5);
    expect(rig.camera.position.x).toBe(0);

    // Idle drift and gust are muted
    rig.setIdle(true);
    rig.update(1.0);
    expect(rig.getIdleGustFactor()).toBe(1.0);

    // Lie-down completes linearly in 300ms with no FOV shift
    const baseFov = rig.camera.fov;
    rig.setLying(true);
    rig.update(0.15);
    expect(rig.getLyingFactor()).toBeCloseTo(0.5, 2);
    expect(rig.camera.fov).toBe(baseFov);

    rig.update(0.15);
    expect(rig.getLyingFactor()).toBe(1.0);
    expect(rig.camera.fov).toBe(baseFov);

    // startEntry creates no dolly offset
    rig.startEntry();
    expect(rig.camera.position.x).toBe(0);
    expect(rig.camera.position.z).toBe(10);
  });

  it('Entry: uses 400ms fade transition under reduced motion', () => {
    vi.useFakeTimers();
    const overlay = new MockOverlayElement();
    const button = new MockButtonElement();
    const entry = new Entry({
      overlayElement: overlay as unknown as HTMLElement,
      enterButton: button as unknown as HTMLButtonElement,
    });
    entry.setReducedMotion(true);

    entry.triggerEnter(false);
    expect(overlay.style.transition).toBe('opacity 400ms var(--ease-out)');
    expect(overlay.style.opacity).toBe('0');

    vi.advanceTimersByTime(400);
    expect(overlay.classList.contains('hidden')).toBe(true);

    entry.dispose();
    vi.useRealTimers();
  });

  it('Store: notifies subscribers of dynamic reduced motion state changes', () => {
    const store = new Store({
      quality: 'high',
      reducedMotion: false,
      isTouch: false,
      mood: 'golden',
      targetMood: 'golden',
      muted: true,
      hintsSeen: false,
    });

    const grass = new Grass();
    const fireflies = new Fireflies();
    const moodController = new MoodController('golden');

    store.subscribe((state, prev) => {
      if (state.reducedMotion !== prev.reducedMotion) {
        grass.setReducedMotion(state.reducedMotion);
        fireflies.setReducedMotion(state.reducedMotion);
        moodController.setReducedMotion(state.reducedMotion);
      }
    });

    store.setState({ reducedMotion: true });
    expect(grass.uReduced.value).toBe(1.0);
    expect(fireflies.uReducedMotion.value).toBe(1.0);
    expect(moodController.getFadeDuration()).toBe(1.0);

    store.setState({ reducedMotion: false });
    expect(grass.uReduced.value).toBe(0.0);
    expect(fireflies.uReducedMotion.value).toBe(0.0);
    expect(moodController.getFadeDuration()).toBe(2.5);

    grass.dispose();
    fireflies.dispose();
  });
});
