import './ui/styles/tokens.css';
import { App } from './app/App';
import type { MoodName, QualityTier } from './app/flags';
import type { AppState } from './app/store';

export interface GrassDebugApi {
  app: App;
  getState: () => Readonly<AppState>;
  stats: () => {
    fps: number;
    tier: string;
    drawCalls: number;
    triangles: number;
    blades: number;
  };
  setTier: (tier: QualityTier) => void;
  setMood: (m: MoodName) => void;
  setLying: (lying: boolean) => void;
  setIdle: (idle: boolean) => void;
  advanceIdle: (seconds: number) => void;
  freeze: (on: boolean) => void;
  step: (dt: number) => void;
  enter: (viaKeyboard?: boolean) => void;
  spawnSeeds: (x?: number, z?: number) => void;
  getSeedsCount: () => number;
  getFirefliesCount: () => number;
  openHelp: () => void;
  closeHelp: () => void;
  showHint: (text: string) => void;
  getUptime: () => number;
  setUptime: (seconds: number) => void;
  triggerExit: () => void;
  isHelpOpen: () => boolean;
  isExitOpen: () => boolean;
}

declare global {
  interface Window {
    __grass?: GrassDebugApi;
  }
}

function boot(): void {
  try {
    const app = new App();
    app.boot();

    // Expose dev/test hooks in DEV or when explicitly enabled
    if (import.meta.env.DEV || import.meta.env.VITE_EXPOSE_DEBUG === '1' || app.flags.debug) {
      window.__grass = {
        app,
        getState: () => app.store.getState(),
        stats: () => app.getStats(),
        setTier: (t: QualityTier) => {
          app.setQuality(t);
        },
        setMood: (m: MoodName) => {
          app.setMood(m);
        },
        setLying: (l: boolean) => {
          app.setLying(l);
        },
        setIdle: (i: boolean) => {
          app.setIdle(i);
        },
        advanceIdle: (s: number) => {
          app.advanceIdle(s);
        },
        freeze: (on: boolean) => {
          app.loop.setFrozen(on);
        },
        step: (dt: number) => {
          app.step(dt);
        },
        enter: (viaKeyboard = false) => {
          app.enter(viaKeyboard);
        },
        spawnSeeds: (x?: number, z?: number) => {
          app.spawnSeeds(x, z);
        },
        getSeedsCount: () => app.getSeedsCount(),
        getFirefliesCount: () => app.getFirefliesCount(),
        openHelp: () => {
          app.openHelp();
        },
        closeHelp: () => {
          app.closeHelp();
        },
        showHint: (text: string) => {
          app.hintLine.show(text);
        },
        getUptime: () => app.hud.uptime.getSeconds(),
        setUptime: (seconds: number) => {
          app.hud.uptime.setSeconds(seconds);
        },
        triggerExit: () => {
          app.triggerExit();
        },
        isHelpOpen: () => app.howItWorks.getIsOpen(),
        isExitOpen: () => app.exitScreen.getIsOpen(),
      };
    }
  } catch (error) {
    console.error('Fatal initialization error:', error);
    const overlay = document.getElementById('entry-overlay');
    if (overlay) {
      overlay.innerHTML = `
        <div class="entry-content">
          <h1 class="entry-wordmark">grass_</h1>
          <p class="entry-tagline" style="color: #ff9e8a;">your device or browser could not initialize WebGL2.</p>
          <p class="entry-note">try updating graphics drivers or enabling hardware acceleration.</p>
        </div>
      `;
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
