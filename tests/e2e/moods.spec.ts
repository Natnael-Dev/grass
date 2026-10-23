import { test, expect } from '@playwright/test';

test.describe('M4 Mood System & Crossfade', () => {
  test.setTimeout(60000);

  test('boots with URL mood flag and switches moods via dev keys 1, 2, 3', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // 1. Boot with explicit mood=golden
    await page.goto('/?mood=golden&debug=1&freeze=1');
    await page.waitForFunction(() => Boolean(window.__grass?.app));

    let state = await page.evaluate(() => window.__grass?.getState());
    expect(state?.mood).toBe('golden');

    // 2. Press dev key '1' for Dawn
    await page.keyboard.press('1');
    state = await page.evaluate(() => window.__grass?.getState());
    expect(state?.targetMood).toBe('dawn');

    const isFadingToDawn = await page.evaluate(
      () => window.__grass?.app.moodController.state.isFading,
    );
    expect(isFadingToDawn).toBe(true);

    // Fast-forward fade in app loop
    await page.evaluate(() => window.__grass?.app.moodController.update(2.5));
    state = await page.evaluate(() => window.__grass?.getState());
    expect(state?.mood).toBe('dawn');

    // 3. Press dev key '3' for Night
    await page.keyboard.press('3');
    state = await page.evaluate(() => window.__grass?.getState());
    expect(state?.targetMood).toBe('night');

    await page.evaluate(() => window.__grass?.app.moodController.update(2.5));
    state = await page.evaluate(() => window.__grass?.getState());
    expect(state?.mood).toBe('night');

    // 4. Press dev key '2' for Golden
    await page.keyboard.press('2');
    state = await page.evaluate(() => window.__grass?.getState());
    expect(state?.targetMood).toBe('golden');

    await page.evaluate(() => window.__grass?.app.moodController.update(2.5));
    state = await page.evaluate(() => window.__grass?.getState());
    expect(state?.mood).toBe('golden');

    expect(consoleErrors).toEqual([]);
  });
});
