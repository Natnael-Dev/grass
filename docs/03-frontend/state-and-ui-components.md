# State and UI Components

**Purpose:** store shape, mood preset interface, component responsibilities. **Read in:** M4, M8.

## Types
```ts
export type MoodName = 'dawn' | 'golden' | 'night';
export type Phase = 'booting' | 'ready' | 'running' | 'exited' | 'fallback';
export type Tier = 'high' | 'medium' | 'low';

export interface MoodPreset {            // values from design-system.md
  skyTop: string; skyMid: string; skyHorizon: string;
  discColor: string; discElevationDeg: number; discAzimuthDeg: number; discSize: number; discHalo: number;
  lightColor: string; lightIntensity: number; ambientColor: string; ambientIntensity: number;
  grassBase: string; grassTip: string; terrainColor: string; ridge: [string, string, string];
  fogColor: string; fogDensity: number; cloudColor: string; cloudCover: number;
  starsAmount: number; firefliesAmount: number; windStrength: number; vignette: number;
  audio: { wind: number; birds: number; crickets: number };
}
export interface AppState {
  phase: Phase; mood: MoodName; muted: boolean; lying: boolean; helpOpen: boolean;
  hintsSeen: boolean; quality: Tier; reducedMotion: boolean; isTouch: boolean; uptimeSeconds: number;
}
```
`store`: `get()`, `set(partial)`, `subscribe(selector, cb)` (calls cb only when the selected value changes), `actions`: `enter()`, `setMood()`, `toggleMute()`, `setLying()`, `openHelp()/closeHelp()`, `exit()/rerun()`. Pure; unit-tested.

## Components (each: constructor(deps) / mount / dispose; DOM only; no global CSS leaks)
| Component | Responsibility | Inputs | Outputs |
|---|---|---|---|
| `Entry` | static overlay logic: loading/ready, click→`actions.enter()`, focus | store.phase | enter |
| `Hud` | container, fade-on-activity, safe-area layout | store | – |
| `MoodSwitch` | 3 pills, `aria-pressed`, key hints in `title` | store.mood | `setMood` |
| `SoundToggle` | speaker button | store.muted | `toggleMute` |
| `HintLine` | typed text, live region, queue, durations | `show(text)` | – |
| `HintSequencer` (pure logic, in `ui/` or `easter/`) | decides which hint when (cumulative path, taps, lie-downs, timers) | events | `HintLine.show` + `hintsSeen` |
| `HowItWorks` | dialog, focus trap, Esc | store.helpOpen | open/close |
| `Uptime` | 1 Hz text, pause when hidden | store | – |
| `HandCursor` | follows pointer, 3 states | pointer events, store.lying | – |
| `ExitScreen` | EE-1 screen and re-run | exit event | rerun |
| `Fallback` | static fallback markup | reason | reload |
| `eggs.ts` | EE-1..EE-4 logic (pure triggers + effects) | events, store | HintLine, store |

## Rules
- UI text from `copy.ts` only. Styles from `tokens.css`. No inline magic numbers duplicating tokens.
- DOM updates only on state change (no per-frame DOM writes; the hand cursor transform is the single allowed per-frame DOM write).
- Every component has a `dispose()` removing listeners/timers.
- Keep each file < 250 lines; split otherwise.
