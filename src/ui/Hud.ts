import { MoodSwitch } from './MoodSwitch';
import { SoundToggle } from './SoundToggle';
import { Uptime } from './Uptime';
import { ICONS } from './icons';
import { COPY } from './copy';
import type { MoodName } from '../core/types';

export interface HudOptions {
  container?: HTMLElement;
  initialMood?: MoodName;
  initialMuted?: boolean;
  onMoodChange?: (mood: MoodName) => void;
  onMuteToggle?: (muted: boolean) => void;
  onOpenHelp?: () => void;
  onUptimeMilestone3?: () => void;
  onUptimeMilestone10?: () => void;
}

export class Hud {
  public readonly element: HTMLElement;
  public readonly moodSwitch: MoodSwitch;
  public readonly soundToggle: SoundToggle;
  public readonly uptime: Uptime;
  public readonly helpButton: HTMLButtonElement;

  private activityTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private pointerOverScene = false;

  constructor(options: HudOptions = {}) {
    this.element = document.createElement('nav');
    this.element.className = 'hud';
    this.element.setAttribute('aria-label', 'controls');
    this.element.style.position = 'fixed';
    this.element.style.inset = '0';
    this.element.style.pointerEvents = 'none';
    this.element.style.zIndex = '40';
    this.element.style.transition = 'opacity var(--dur-med) var(--ease-out)';
    this.element.style.opacity = '1';

    // 1. Top-Left: Wordmark
    const wordmarkContainer = document.createElement('div');
    wordmarkContainer.className = 'hud-wordmark';
    wordmarkContainer.style.position = 'absolute';
    wordmarkContainer.style.top = 'max(16px, var(--safe-top))';
    wordmarkContainer.style.left = 'max(16px, var(--safe-left))';
    wordmarkContainer.style.fontFamily = 'var(--font-mono)';
    wordmarkContainer.style.fontSize = 'var(--size-text-l)';
    wordmarkContainer.style.fontWeight = '600';
    wordmarkContainer.style.letterSpacing = '-0.02em';
    wordmarkContainer.style.color = 'var(--text)';
    wordmarkContainer.style.userSelect = 'none';
    wordmarkContainer.innerHTML = `${COPY.entry.wordmark.replace('_', '')}<span class="cursor-blink">_</span>`;
    this.element.appendChild(wordmarkContainer);

    // 2. Top-Right: Sound toggle + How it works
    const topControls = document.createElement('div');
    topControls.className = 'hud-top-controls';
    topControls.style.position = 'absolute';
    topControls.style.top = 'max(16px, var(--safe-top))';
    topControls.style.right = 'max(16px, var(--safe-right))';
    topControls.style.display = 'flex';
    topControls.style.alignItems = 'center';
    topControls.style.gap = 'var(--space-2)';
    topControls.style.pointerEvents = 'auto';

    this.soundToggle = new SoundToggle({
      initialMuted: options.initialMuted,
      onToggle: options.onMuteToggle,
    });

    this.helpButton = document.createElement('button');
    this.helpButton.type = 'button';
    this.helpButton.className = 'glass-btn help-btn';
    this.helpButton.setAttribute('aria-label', COPY.hud.helpAriaLabel);
    this.helpButton.title = `${COPY.hud.helpButton} (?)`;
    this.helpButton.innerHTML = `${ICONS.help}<span>${COPY.hud.helpButton}</span>`;
    this.helpButton.addEventListener('click', () => {
      options.onOpenHelp?.();
    });

    topControls.appendChild(this.helpButton);
    topControls.appendChild(this.soundToggle.element);
    this.element.appendChild(topControls);

    // 3. Bottom-Left: Uptime
    const bottomControls = document.createElement('div');
    bottomControls.className = 'hud-uptime-container';
    bottomControls.style.position = 'absolute';
    bottomControls.style.bottom = 'max(16px, var(--safe-bottom))';
    bottomControls.style.left = 'max(16px, var(--safe-left))';
    bottomControls.style.pointerEvents = 'auto';

    this.uptime = new Uptime({
      onMinute3: options.onUptimeMilestone3,
      onMinute10: options.onUptimeMilestone10,
    });
    bottomControls.appendChild(this.uptime.element);
    this.element.appendChild(bottomControls);

    // 4. Bottom-Centre: MoodSwitch
    const moodContainer = document.createElement('div');
    moodContainer.className = 'hud-mood-container';
    moodContainer.style.position = 'absolute';
    moodContainer.style.bottom = 'max(16px, var(--safe-bottom))';
    moodContainer.style.left = '50%';
    moodContainer.style.transform = 'translateX(-50%)';
    moodContainer.style.pointerEvents = 'auto';

    this.moodSwitch = new MoodSwitch({
      initialMood: options.initialMood,
      onSelect: options.onMoodChange,
    });
    moodContainer.appendChild(this.moodSwitch.element);
    this.element.appendChild(moodContainer);

    // Focus restoration on HUD element focus
    this.element.addEventListener('focusin', () => {
      this.restoreOpacity();
    });

    const parent = options.container ?? document.body;
    parent.appendChild(this.element);
  }

  public onPointerSceneActivity(): void {
    this.pointerOverScene = true;
    if (this.activityTimeoutId !== null) {
      clearTimeout(this.activityTimeoutId);
    }

    this.activityTimeoutId = setTimeout(() => {
      if (this.pointerOverScene) {
        this.element.style.opacity = '0.45';
      }
    }, 4000);
  }

  public onPointerLeaveScene(): void {
    this.pointerOverScene = false;
    this.restoreOpacity();
  }

  public restoreOpacity(): void {
    if (this.activityTimeoutId !== null) {
      clearTimeout(this.activityTimeoutId);
      this.activityTimeoutId = null;
    }
    this.element.style.opacity = '1';
  }

  public setVisible(visible: boolean): void {
    this.element.style.display = visible ? 'block' : 'none';
  }

  public dispose(): void {
    if (this.activityTimeoutId !== null) {
      clearTimeout(this.activityTimeoutId);
      this.activityTimeoutId = null;
    }
    this.moodSwitch.dispose();
    this.soundToggle.dispose();
    this.uptime.dispose();
    if (this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
    }
  }
}
