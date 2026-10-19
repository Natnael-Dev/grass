import { describe, it, expect } from 'vitest';
import { COPY } from '../../src/ui/copy';

describe('COPY single source of truth', () => {
  it('has exact entry copy per copywriting.md', () => {
    expect(COPY.entry.wordmark).toBe('grass_');
    expect(COPY.entry.tagline).toBe('go outside for a minute. your build will wait.');
    expect(COPY.entry.button).toBe('step outside');
    expect(COPY.entry.buttonLoading).toBe('growing grass…');
    expect(COPY.entry.note).toBe('sound starts when you click.');
  });

  it('has exact HUD copy per copywriting.md', () => {
    expect(COPY.hud.moods.dawn).toBe('dawn');
    expect(COPY.hud.moods.golden).toBe('golden');
    expect(COPY.hud.moods.night).toBe('night');
    expect(COPY.hud.uptimePrefix).toBe('uptime outside: ');
    expect(COPY.hud.soundAriaLabel.on).toBe('sound on');
    expect(COPY.hud.soundAriaLabel.off).toBe('sound off');
    expect(COPY.hud.helpButton).toBe('how it works');
    expect(COPY.hud.helpAriaLabel).toBe('how it works, help');
  });

  it('has exact hints copy per copywriting.md', () => {
    expect(COPY.hints.desktop).toEqual([
      "> move your mouse over the grass. it's been waiting for you.",
      '> click to scatter some seeds.',
      "> hold the mouse down to lie down. you've earned it.",
      "> that's everything. press ? if you forget.",
    ]);
    expect(COPY.hints.touch).toEqual([
      '> drag a finger across the grass.',
      '> tap to scatter seeds.',
      "> press and hold to lie down. you've earned it.",
      "> that's everything. tap ? if you forget.",
    ]);
    expect(COPY.hints.idle).toBe('> still there? the grass is fine. so are you.');
  });

  it('has exact how it works copy per copywriting.md', () => {
    expect(COPY.howItWorks.title).toBe('how it works');
    expect(COPY.howItWorks.what).toBe(
      'grass is a tiny meadow in your browser. no account, no tracking, no point. just a minute outside.',
    );
    expect(COPY.howItWorks.controls).toHaveLength(6);
    expect(COPY.howItWorks.controls[0]).toEqual({
      action: 'brush the grass',
      mouse: 'move',
      touch: 'drag',
      keyboard: 'arrow keys',
    });
    expect(COPY.howItWorks.controls[1]).toEqual({
      action: 'scatter seeds',
      mouse: 'click',
      touch: 'tap',
      keyboard: 'enter',
    });
    expect(COPY.howItWorks.controls[2]).toEqual({
      action: 'lie down',
      mouse: 'hold',
      touch: 'press and hold',
      keyboard: 'hold space',
    });
    expect(COPY.howItWorks.controls[3]).toEqual({
      action: 'change mood',
      mouse: 'pills',
      touch: 'pills',
      keyboard: '1 2 3',
    });
    expect(COPY.howItWorks.controls[4]).toEqual({
      action: 'sound',
      mouse: 'speaker button',
      touch: 'speaker button',
      keyboard: 'm',
    });
    expect(COPY.howItWorks.controls[5]).toEqual({
      action: 'this help',
      mouse: '? button',
      touch: '? button',
      keyboard: '?',
    });
    expect(COPY.howItWorks.qa).toEqual([
      { q: 'is this a wellness app?', a: "no. it's grass." },
      { q: 'does it save anything?', a: 'only your mood and mute setting, in your own browser.' },
      { q: 'why?', a: 'you were debugging for four hours.' },
    ]);
    expect(COPY.howItWorks.credits).toBe('made with three.js. open source.');
    expect(COPY.howItWorks.closeButton).toBe('close');
  });

  it('has exact easter egg strings per copywriting.md', () => {
    expect(COPY.eggs.ee2).toBe('> fatal: no merge conflicts in this meadow.');
    expect(COPY.eggs.ee3_3min).toBe(
      "> you've been outside 3 minutes. your build is probably fine.",
    );
    expect(COPY.eggs.ee3_10min).toBe("> ok. that's a real break. proud of you.");
    expect(COPY.eggs.ee1ExitCmd).toBe('$ ./grass');
    expect(COPY.eggs.ee1ExitCode).toBe('process exited with code 0');
    expect(COPY.eggs.ee1RerunBtn).toBe('[ re-run ]');
    expect(COPY.eggs.ee4Devtools).toContain('hey dev. you opened devtools on a grass website.');
  });

  it('has exact state messages and 404 strings per copywriting.md', () => {
    expect(COPY.states.contextLost).toBe('the meadow blinked. recovering…');
    expect(COPY.states.fallbackTitle).toBe("your browser can't grow grass today.");
    expect(COPY.states.fallbackBody).toBe(
      'grass needs webgl2. try a recent chrome, edge, firefox or safari — or go find the real thing.',
    );
    expect(COPY.states.fallbackButton).toBe('reload');
    expect(COPY.states.notFoundTitle).toBe('404: grass not found');
    expect(COPY.states.notFoundBody).toBe("this patch of the internet doesn't exist.");
    expect(COPY.states.notFoundLink).toBe('go back outside');
    expect(COPY.states.noscript).toBe("grass needs javascript. the real grass doesn't, though.");
  });

  it('has metadata matching copywriting.md', () => {
    expect(COPY.meta.title).toBe('grass — a tiny meadow for a one-minute break');
    expect(COPY.meta.description).toBe(
      'a calm interactive meadow in your browser. brush the grass, scatter seeds, lie down. no account, no tracking.',
    );
  });
});
