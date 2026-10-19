import { test, expect } from '@playwright/test';

test.describe('Milestone M8: UI Shell, Hints, Help, Uptime, Easter Eggs, 404 (Gate G7)', () => {
  test('J1: First visit desktop golden path (entry, hud, hints, modal, exit screen)', async ({
    page,
  }) => {
    test.setTimeout(120000);

    // Clear localStorage to ensure first-visit state and explicit golden mood
    await page.goto('/?debug=1&freeze=1&mood=golden');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForFunction(() => Boolean(window.__grass?.app));

    // 1. Entry Overlay Verification
    const overlay = page.locator('#entry-overlay');
    await expect(overlay).toBeVisible();
    await expect(page.locator('.entry-wordmark')).toContainText('grass_');
    await expect(page.locator('.entry-tagline')).toHaveText(
      'go outside for a minute. your build will wait.',
    );
    const enterBtn = page.locator('#btn-enter');
    await expect(enterBtn).toHaveText('step outside');
    await expect(enterBtn).toBeEnabled();

    // Capture Entry Screen screenshot
    await page.screenshot({ path: 'tracking/evidence/M8/entry-screen.png' });

    // 2. Click "step outside"
    await enterBtn.click();
    await expect(overlay).toBeHidden({ timeout: 5000 });

    // 3. HUD Shell is active
    const hud = page.locator('nav.hud');
    await expect(hud).toBeVisible();
    await expect(page.locator('.hud-wordmark')).toContainText('grass_');
    await expect(page.locator('.uptime-counter')).toContainText('uptime outside: 00:');
    await expect(page.locator('.sound-toggle-btn')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.mood-btn[aria-pressed="true"]')).toContainText('golden');

    // 4. First-visit hint triggers (+1.5 s after entry)
    const hintLine = page.locator('.hint-line');
    await expect(hintLine).toBeVisible({ timeout: 10000 });
    await expect(hintLine).toContainText('>');

    // Capture screenshots of HUD and Hint in active state
    await page.screenshot({ path: 'tracking/evidence/M8/hud-active.png' });
    await page.screenshot({ path: 'tracking/evidence/M8/hint-active.png' });

    // 5. Open "how it works" modal dialog
    const helpBtn = page.locator('.help-btn');
    await helpBtn.click();
    const dialogScrim = page.locator('.how-it-works-scrim');
    await expect(dialogScrim).toBeVisible();
    const dialog = page.locator('.how-it-works-dialog');
    await expect(dialog).toHaveAttribute('role', 'dialog');
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(page.locator('#how-it-works-title')).toHaveText('how it works');

    // Capture Dialog How-It-Works screenshot
    await page.screenshot({ path: 'tracking/evidence/M8/dialog-how-it-works.png' });

    // Press Escape to close modal
    await page.keyboard.press('Escape');
    await expect(dialogScrim).toBeHidden();

    // 6. Easter Egg EE-1: type 'exit'
    await page.keyboard.type('exit');
    await page.waitForTimeout(1000); // 800 ms fade
    const exitScreen = page.locator('.exit-screen');
    await expect(exitScreen).toBeVisible();
    await expect(exitScreen).toContainText('$ ./grass');
    await expect(exitScreen).toContainText('process exited with code 0');

    // Capture Exit Screen screenshot
    await page.screenshot({ path: 'tracking/evidence/M8/exit-screen.png' });

    // Click [ re-run ]
    const rerunBtn = page.locator('.rerun-btn');
    await rerunBtn.click();
    await expect(exitScreen).toBeHidden();
  });

  test('J2: Returning visit restores mood, mute, and suppresses hints', async ({ page }) => {
    test.setTimeout(60000);

    // Set saved state in localStorage before visiting
    await page.goto('/?debug=1&freeze=1');
    await page.evaluate(() => {
      localStorage.setItem('grass:mood', 'night');
      localStorage.setItem('grass:muted', 'true');
      localStorage.setItem('grass:hints-seen', '1');
    });

    await page.reload();
    await page.waitForFunction(() => Boolean(window.__grass?.app));

    // Verify restored state on startup
    const state = await page.evaluate(() => window.__grass!.getState());
    expect(state.mood).toBe('night');
    expect(state.muted).toBe(true);
    expect(state.hintsSeen).toBe(true);

    // Click step outside
    await page.locator('#btn-enter').click();
    await page.waitForTimeout(1000);

    // Verify HUD reflects restored states
    await expect(page.locator('.mood-btn[aria-pressed="true"]')).toContainText('night');
    await expect(page.locator('.sound-toggle-btn')).toHaveAttribute('aria-pressed', 'false');

    // Advance 3 seconds -> verify hint is NOT shown
    await page.waitForTimeout(3000);
    const hintLine = page.locator('.hint-line');
    await expect(hintLine).toBeHidden();
  });

  test('J4: Keyboard-only navigation, shortcuts, and dialog focus trap', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto('/?debug=1&freeze=1&mood=golden');
    await page.waitForFunction(() => Boolean(window.__grass?.app));

    // 1. Enter meadow via Enter key
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1100);
    await expect(page.locator('#entry-overlay')).toBeHidden();

    // 2. Mood shortcuts: 1 (dawn), 2 (golden), 3 (night)
    await page.keyboard.press('1');
    await expect(page.locator('.mood-btn[aria-pressed="true"]')).toContainText('dawn');

    await page.keyboard.press('3');
    await expect(page.locator('.mood-btn[aria-pressed="true"]')).toContainText('night');

    // 3. Mute shortcut: M
    await page.keyboard.press('m');
    await expect(page.locator('.sound-toggle-btn')).toHaveAttribute('aria-pressed', 'false');

    await page.keyboard.press('m');
    await expect(page.locator('.sound-toggle-btn')).toHaveAttribute('aria-pressed', 'true');

    // 4. Open Help Dialog via '?'
    await page.keyboard.press('?');
    const dialogScrim = page.locator('.how-it-works-scrim');
    await expect(dialogScrim).toBeVisible();

    // 5. Focus Trap verification: Close button is focused
    const closeBtn = page.locator('.close-btn');
    await expect(closeBtn).toBeFocused();

    // Tab through all focusable items in dialog
    await page.keyboard.press('Tab');
    // Shift+Tab returns to close button
    await page.keyboard.press('Shift+Tab');
    await expect(closeBtn).toBeFocused();

    // Close dialog via Escape
    await page.keyboard.press('Escape');
    await expect(dialogScrim).toBeHidden();
  });

  test('Easter Eggs EE-2 and EE-3 trigger expected hints', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto('/?debug=1&freeze=1');
    await page.evaluate(() => {
      localStorage.setItem('grass:hints-seen', '1');
    });
    await page.reload();
    await page.waitForFunction(() => Boolean(window.__grass?.app));

    await page.evaluate(() => {
      window.__grass?.enter();
    });
    await page.waitForTimeout(500);

    // EE-2: Hold for 10 s -> fatal merge conflicts
    await page.evaluate(() => {
      window.__grass?.app.easterEggs.onHold10s();
      window.__grass?.app.hintLine.skipTyping();
    });
    const hintLine = page.locator('.hint-line');
    await expect(hintLine).toBeVisible();
    await expect(hintLine).toContainText('> fatal: no merge conflicts in this meadow.');

    // EE-3: 3-minute milestone
    await page.evaluate(() => {
      window.__grass?.app.easterEggs.onUptime3Min();
      window.__grass?.app.hintLine.skipTyping();
    });
    await expect(hintLine).toContainText(
      "> you've been outside 3 minutes. your build is probably fine.",
    );
  });

  test('Static 404 page renders properly with links and tokens', async ({ page }) => {
    test.setTimeout(30000);

    await page.goto('/404.html');

    await expect(page).toHaveTitle('404: grass not found');
    await expect(page.locator('h1')).toHaveText('404: grass not found');
    await expect(page.locator('p')).toHaveText("this patch of the internet doesn't exist.");

    const link = page.locator('a');
    await expect(link).toHaveText('go back outside');
    await expect(link).toHaveAttribute('href', '/');

    // Capture 404 screenshot
    await page.screenshot({ path: 'tracking/evidence/M8/404-page.png' });
  });
});
