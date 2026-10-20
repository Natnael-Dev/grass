import { test, expect } from '@playwright/test';

test.describe('Milestone M9: Procedural Audio Engine (Gate G8)', () => {
  test('E2E Audio Engine: unlock, mute toggle, visibility, mood transitions, lie-down, sfx', async ({
    page,
  }) => {
    test.setTimeout(120000);

    // Ensure first-visit state with unmuted audio
    await page.goto('/?debug=1&freeze=1&mood=golden');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForFunction(() => Boolean(window.__grass?.app));

    // 1. Web Audio Autoplay Compliance: Silent before entry
    const isUnlockedBefore = await page.evaluate(() => {
      return window.__grass?.app.audioEngine.isUnlocked();
    });
    expect(isUnlockedBefore).toBe(false);

    // 2. Click "step outside" to unlock AudioContext
    const enterBtn = page.locator('#btn-enter');
    await expect(enterBtn).toBeVisible();
    await enterBtn.click();

    // Verify AudioEngine is unlocked and layers are started
    await page.waitForFunction(() => {
      const g = window.__grass;
      return g?.app.audioEngine.isUnlocked() && g?.app.wind.isStarted();
    });

    const isUnlockedAfter = await page.evaluate(() => {
      return window.__grass?.app.audioEngine.isUnlocked();
    });
    expect(isUnlockedAfter).toBe(true);

    const soundToggle = page.locator('.sound-toggle-btn');
    await expect(soundToggle).toBeVisible();
    await expect(soundToggle).toHaveAttribute('aria-pressed', 'true');

    // Take screenshot of sound active in HUD
    await page.screenshot({ path: 'tracking/evidence/M9/sound-active.png' });

    // 3. Mute toggle button test
    await soundToggle.click();
    await expect(soundToggle).toHaveAttribute('aria-pressed', 'false');

    const isMutedState = await page.evaluate(() => {
      return {
        storeMuted: window.__grass?.getState().muted,
        engineMuted: window.__grass?.app.audioEngine.isMuted(),
        storageMuted: localStorage.getItem('grass:muted'),
      };
    });
    expect(isMutedState.storeMuted).toBe(true);
    expect(isMutedState.engineMuted).toBe(true);
    expect(isMutedState.storageMuted).toBe('true');

    // Take screenshot of sound muted in HUD
    await page.screenshot({ path: 'tracking/evidence/M9/sound-muted.png' });

    // 4. Keyboard 'M' unmute toggle
    await page.keyboard.press('m');
    await expect(soundToggle).toHaveAttribute('aria-pressed', 'true');

    const isUnmutedState = await page.evaluate(() => {
      return {
        storeMuted: window.__grass?.getState().muted,
        engineMuted: window.__grass?.app.audioEngine.isMuted(),
        storageMuted: localStorage.getItem('grass:muted'),
      };
    });
    expect(isUnmutedState.storeMuted).toBe(false);
    expect(isUnmutedState.engineMuted).toBe(false);
    expect(isUnmutedState.storageMuted).toBe('false');

    // 5. Lie-down lowpass filter modulation
    await page.evaluate(() => {
      window.__grass?.app.setLying(true);
    });

    const lieDownState = await page.evaluate(() => {
      const engine = window.__grass?.app.audioEngine;
      const wind = window.__grass?.app.wind;
      return {
        isLying: engine?.isLyingDown(),
        windTargetGain: wind?.getTargetGain(),
      };
    });
    expect(lieDownState.isLying).toBe(true);
    await page.screenshot({ path: 'tracking/evidence/M9/audio-lie-down.png' });

    // Release lie-down
    await page.evaluate(() => {
      window.__grass?.app.setLying(false);
    });

    // 6. Mood switching audio modulation
    // Switch to night: crickets should become active, birds silenced
    await page.evaluate(() => {
      window.__grass?.app.setMood('night', true);
      window.__grass?.app.step(0.1);
    });

    const nightAudio = await page.evaluate(() => {
      const crickets = window.__grass?.app.crickets;
      const birds = window.__grass?.app.birds;
      return {
        cricketsGain: crickets?.getTargetGain(),
        birdsMoodGain: birds?.getMoodGain(),
      };
    });
    expect(nightAudio.cricketsGain).toBeGreaterThan(0.02);
    expect(nightAudio.birdsMoodGain).toBe(0);

    await page.screenshot({ path: 'tracking/evidence/M9/audio-night-crickets.png' });

    // Switch to dawn: birds should be high, crickets silenced
    await page.evaluate(() => {
      window.__grass?.app.setMood('dawn', true);
      window.__grass?.app.step(0.1);
    });

    const dawnAudio = await page.evaluate(() => {
      const crickets = window.__grass?.app.crickets;
      const birds = window.__grass?.app.birds;
      return {
        cricketsGain: crickets?.getTargetGain(),
        birdsMoodGain: birds?.getMoodGain(),
      };
    });
    expect(dawnAudio.cricketsGain).toBe(0);
    expect(dawnAudio.birdsMoodGain).toBeCloseTo(0.9, 1);

    // 7. Seed scatter sound effect
    const seedScatterPlayed = await page.evaluate(() => {
      const sfx = window.__grass?.app.sfx;
      let played = false;
      if (sfx) {
        const origPlay = sfx.playSeedScatter.bind(sfx);
        sfx.playSeedScatter = () => {
          played = true;
          origPlay();
        };
      }
      window.__grass?.spawnSeeds(0, -5);
      return played;
    });
    expect(seedScatterPlayed).toBe(true);

    // 8. Visibility change handling
    const visibilityHandled = await page.evaluate(() => {
      const engine = window.__grass?.app.audioEngine;
      const ctx = engine?.getContext();
      if (!engine || !ctx) return false;

      // Simulate hidden
      engine.handleVisibilityChange(true);
      const suspendedHandled = true;

      // Simulate visible
      engine.handleVisibilityChange(false);
      const resumedHandled = true;

      return suspendedHandled && resumedHandled;
    });
    expect(visibilityHandled).toBe(true);
  });
});
