# Copywriting (all user-visible text)

**Purpose:** exact strings. Keep them in `src/ui/copy.ts` (single source). Lowercase, kind, dry. **Read in:** M8.

## Entry
- Wordmark: `grass_`
- Tagline: `go outside for a minute. your build will wait.`
- Button: `step outside`; loading: `growing grass…`
- Note: `sound starts when you click.`

## HUD
- Moods: `dawn` · `golden` · `night`
- Uptime: `uptime outside: 00:42`
- Sound: aria-label `sound on` / `sound off`
- Help button: `how it works` (aria-label `how it works, help`)

## Hints (desktop)
1. `> move your mouse over the grass. it's been waiting for you.`
2. `> click to scatter some seeds.`
3. `> hold the mouse down to lie down. you've earned it.`
4. `> that's everything. press ? if you forget.`
## Hints (touch)
1. `> drag a finger across the grass.` 2. `> tap to scatter seeds.` 3. `> press and hold to lie down. you've earned it.` 4. `> that's everything. tap ? if you forget.`
## Idle: `> still there? the grass is fine. so are you.`

## How it works (dialog)
- Title: `how it works`
- What: `grass is a tiny meadow in your browser. no account, no tracking, no point. just a minute outside.`
- Controls table:
  | | mouse | touch | keyboard |
  |---|---|---|---|
  | brush the grass | move | drag | arrow keys |
  | scatter seeds | click | tap | enter |
  | lie down | hold | press and hold | hold space |
  | change mood | pills | pills | 1 2 3 |
  | sound | speaker button | speaker button | m |
  | this help | ? button | ? button | ? |
- Q&A: `q: is this a wellness app?` `a: no. it's grass.` · `q: does it save anything?` `a: only your mood and mute setting, in your own browser.` · `q: why?` `a: you were debugging for four hours.`
- Credits: `made with three.js. open source.` (link to the repo URL recorded at M13)
- Close button: `close`

## Easter eggs
- EE-2: `> fatal: no merge conflicts in this meadow.`
- EE-3: `> you've been outside 3 minutes. your build is probably fine.` / `> ok. that's a real break. proud of you.`
- EE-1 exit screen: `$ ./grass` / `process exited with code 0` / button `[ re-run ]`
- EE-4 console (use `console.info` with `%c`): 
  ```
  hey dev. you opened devtools on a grass website.
  go touch some actual grass sometime. we'll be here.
  ```
  plus a small ASCII blade: `  \|/` / `  \|/` / `~~~~~`

## States
- Context lost toast: `the meadow blinked. recovering…`
- Fallback title: `your browser can't grow grass today.` Body: `grass needs webgl2. try a recent chrome, edge, firefox or safari — or go find the real thing.` Button: `reload`
- 404: title `404: grass not found` body `this patch of the internet doesn't exist.` link `go back outside` → `/`
- noscript: `grass needs javascript. the real grass doesn't, though.`

## Metadata
- `<title>`: `grass — a tiny meadow for a one-minute break`
- description: `a calm interactive meadow in your browser. brush the grass, scatter seeds, lie down. no account, no tracking.`
