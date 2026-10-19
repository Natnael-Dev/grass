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
  freeze: (on: boolean) => void;
  step: (dt: number) => void;
  enter: () => void;
}

declare global {
  interface Window {
    __grass?: GrassDebugApi;
  }
}

console.info(
  "%c  \\|/\n  \\|/\n~~~~~\nhey dev. you opened devtools on a grass website.\ngo touch some actual grass sometime. we'll be here.",
  'color: #a8d878; font-family: monospace; font-size: 12px; font-weight: bold;',
);

function boot(): void {
  try {
    const app = new App();
    app.boot();

    const enterBtn = document.getElementById('btn-enter') as HTMLButtonElement | null;
    const overlay = document.getElementById('entry-overlay');

    if (enterBtn && overlay) {
      enterBtn.addEventListener('click', () => {
        app.enter();
        overlay.classList.add('hidden');
      });
    }

    // Expose dev/test hooks only in DEV or when explicitly enabled
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
        freeze: (on: boolean) => {
          app.loop.setFrozen(on);
        },
        step: (dt: number) => {
          app.step(dt);
        },
        enter: () => {
          app.enter();
          overlay?.classList.add('hidden');
        },
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
