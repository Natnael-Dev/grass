/**
 * Single source of truth for all user-visible copy.
 * Matches docs/01-design/copywriting.md verbatim.
 */

export const COPY = {
  entry: {
    wordmark: 'grass_',
    tagline: 'go outside for a minute. your build will wait.',
    button: 'step outside',
    buttonLoading: 'growing grass…',
    note: 'sound starts when you click.',
  },
  hud: {
    moods: {
      dawn: 'dawn',
      golden: 'golden',
      night: 'night',
    },
    uptimePrefix: 'uptime outside: ',
    soundAriaLabel: {
      on: 'sound on',
      off: 'sound off',
    },
    helpButton: 'how it works',
    helpAriaLabel: 'how it works, help',
  },
  hints: {
    desktop: [
      "> move your mouse over the grass. it's been waiting for you.",
      '> click to scatter some seeds.',
      "> hold the mouse down to lie down. you've earned it.",
      "> that's everything. press ? if you forget.",
    ],
    touch: [
      '> drag a finger across the grass.',
      '> tap to scatter seeds.',
      "> press and hold to lie down. you've earned it.",
      "> that's everything. tap ? if you forget.",
    ],
    idle: '> still there? the grass is fine. so are you.',
  },
  howItWorks: {
    title: 'how it works',
    what: 'grass is a tiny meadow in your browser. no account, no tracking, no point. just a minute outside.',
    controls: [
      { action: 'brush the grass', mouse: 'move', touch: 'drag', keyboard: 'arrow keys' },
      { action: 'scatter seeds', mouse: 'click', touch: 'tap', keyboard: 'enter' },
      { action: 'lie down', mouse: 'hold', touch: 'press and hold', keyboard: 'hold space' },
      { action: 'change mood', mouse: 'pills', touch: 'pills', keyboard: '1 2 3' },
      { action: 'sound', mouse: 'speaker button', touch: 'speaker button', keyboard: 'm' },
      { action: 'this help', mouse: '? button', touch: '? button', keyboard: '?' },
    ],
    qa: [
      { q: 'is this a wellness app?', a: "no. it's grass." },
      { q: 'does it save anything?', a: 'only your mood and mute setting, in your own browser.' },
      { q: 'why?', a: 'you were debugging for four hours.' },
    ],
    credits: 'made with three.js. open source.',
    closeButton: 'close',
  },
  eggs: {
    ee2: '> fatal: no merge conflicts in this meadow.',
    ee3_3min: "> you've been outside 3 minutes. your build is probably fine.",
    ee3_10min: "> ok. that's a real break. proud of you.",
    ee1ExitCmd: '$ ./grass',
    ee1ExitCode: 'process exited with code 0',
    ee1RerunBtn: '[ re-run ]',
    ee4Devtools:
      "hey dev. you opened devtools on a grass website.\ngo touch some actual grass sometime. we'll be here.",
  },
  states: {
    contextLost: 'the meadow blinked. recovering…',
    fallbackTitle: "your browser can't grow grass today.",
    fallbackBody:
      'grass needs webgl2. try a recent chrome, edge, firefox or safari — or go find the real thing.',
    fallbackButton: 'reload',
    notFoundTitle: '404: grass not found',
    notFoundBody: "this patch of the internet doesn't exist.",
    notFoundLink: 'go back outside',
    noscript: "grass needs javascript. the real grass doesn't, though.",
  },
  meta: {
    title: 'grass — a tiny meadow for a one-minute break',
    description:
      'a calm interactive meadow in your browser. brush the grass, scatter seeds, lie down. no account, no tracking.',
  },
} as const;

export type CopyTree = typeof COPY;
