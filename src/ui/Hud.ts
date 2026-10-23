import { ICONS } from './icons';
import { COPY } from './copy';
import type { MoodName } from '../core/types';

export interface SoundToggleOptions {
  initialMuted?: boolean;
  onToggle?: (muted: boolean) => void;
}

export class SoundToggle {
  public readonly element: HTMLButtonElement;
  private muted: boolean;
  private onToggle?: (muted: boolean) => void;

  constructor(options: SoundToggleOptions = {}) {
    this.muted = options.initialMuted ?? false;
    this.onToggle = options.onToggle;

    this.element = document.createElement('button');
    this.element.type = 'button';
    this.element.className = 'glass-btn sound-toggle-btn';
    this.element.title = 'toggle sound (m)';

    this.render();

    this.element.addEventListener('click', () => {
      this.setMuted(!this.muted);
      this.onToggle?.(this.muted);
    });
  }

  public setMuted(muted: boolean): void {
    if (this.muted === muted) return;
    this.muted = muted;
    this.render();
  }

  public getMuted(): boolean {
    return this.muted;
  }

  private render(): void {
    const isSoundOn = !this.muted;
    this.element.setAttribute('aria-pressed', isSoundOn ? 'true' : 'false');
    this.element.setAttribute(
      'aria-label',
      isSoundOn ? COPY.hud.soundAriaLabel.on : COPY.hud.soundAriaLabel.off,
    );
    this.element.innerHTML = isSoundOn ? ICONS.soundOn : ICONS.soundOff;
  }

  public dispose(): void {
    if (this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
    }
  }
}

export interface MoodSwitchOptions {
  initialMood?: MoodName;
  onSelect?: (mood: MoodName) => void;
}

export class MoodSwitch {
  public readonly element: HTMLElement;
  private currentMood: MoodName;
  private buttons: Map<MoodName, HTMLButtonElement> = new Map();
  private onSelect?: (mood: MoodName) => void;

  constructor(options: MoodSwitchOptions = {}) {
    this.currentMood = options.initialMood ?? 'golden';
    this.onSelect = options.onSelect;

    this.element = document.createElement('div');
    this.element.className = 'mood-switch glass-panel';
    this.element.setAttribute('role', 'group');
    this.element.setAttribute('aria-label', 'mood selection');
    this.element.style.display = 'inline-flex';
    this.element.style.alignItems = 'center';
    this.element.style.gap = 'var(--space-1)';
    this.element.style.padding = '3px';
    this.element.style.borderRadius = 'var(--radius-pill)';

    const moods: { name: MoodName; icon: string; keyHint: string }[] = [
      { name: 'dawn', icon: ICONS.dawn, keyHint: '1' },
      { name: 'golden', icon: ICONS.golden, keyHint: '2' },
      { name: 'night', icon: ICONS.night, keyHint: '3' },
    ];

    for (const { name, icon, keyHint } of moods) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'glass-btn mood-btn';
      btn.setAttribute('aria-pressed', name === this.currentMood ? 'true' : 'false');
      btn.title = `${name} (${keyHint})`;
      btn.innerHTML = `${icon}<span>${COPY.hud.moods[name]}</span>`;

      btn.addEventListener('click', () => {
        this.setMood(name);
        this.onSelect?.(name);
      });

      this.buttons.set(name, btn);
      this.element.appendChild(btn);
    }
  }

  public setMood(mood: MoodName): void {
    if (this.currentMood === mood) return;
    this.currentMood = mood;

    for (const [name, btn] of this.buttons.entries()) {
      btn.setAttribute('aria-pressed', name === mood ? 'true' : 'false');
    }
  }

  public getMood(): MoodName {
    return this.currentMood;
  }

  public dispose(): void {
    this.buttons.clear();
    if (this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
    }
  }
}

export interface HudOptions {
  container?: HTMLElement;
  initialMood?: MoodName;
  initialMuted?: boolean;
  onMoodChange?: (mood: MoodName) => void;
  onMuteToggle?: (muted: boolean) => void;
  onOpenHelp?: () => void;
}

export class Hud {
  public readonly element: HTMLElement;
  public readonly moodSwitch: MoodSwitch;
  public readonly soundToggle: SoundToggle;
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
    topControls.appendChild(this.soundToggle.element);

    this.helpButton = document.createElement('button');
    this.helpButton.type = 'button';
    this.helpButton.className = 'glass-btn help-btn';
    this.helpButton.title = 'how it works (?)';
    this.helpButton.setAttribute('aria-label', COPY.hud.helpAriaLabel);
    this.helpButton.innerHTML = ICONS.help;
    this.helpButton.addEventListener('click', () => {
      options.onOpenHelp?.();
    });
    topControls.appendChild(this.helpButton);
    this.element.appendChild(topControls);

    // 3. Bottom-Left: Mood switch
    const bottomControls = document.createElement('div');
    bottomControls.className = 'hud-bottom-controls';
    bottomControls.style.position = 'absolute';
    bottomControls.style.bottom = 'max(16px, var(--safe-bottom))';
    bottomControls.style.left = 'max(16px, var(--safe-left))';
    bottomControls.style.pointerEvents = 'auto';

    this.moodSwitch = new MoodSwitch({
      initialMood: options.initialMood,
      onSelect: options.onMoodChange,
    });
    bottomControls.appendChild(this.moodSwitch.element);
    this.element.appendChild(bottomControls);

    const targetContainer =
      options.container ?? (typeof document !== 'undefined' ? document.body : null);
    if (targetContainer) {
      targetContainer.appendChild(this.element);
    }
  }

  public onPointerSceneActivity(): void {
    this.pointerOverScene = true;
    this.fadeHudOutTemporarily();
  }

  public onPointerLeaveScene(): void {
    this.pointerOverScene = false;
    this.showHudImmediately();
  }

  private fadeHudOutTemporarily(): void {
    if (this.activityTimeoutId !== null) {
      clearTimeout(this.activityTimeoutId);
    }
    this.activityTimeoutId = setTimeout(() => {
      this.element.style.opacity = '0.45';
      this.activityTimeoutId = null;
    }, 4000);
  }

  private showHudImmediately(): void {
    if (this.activityTimeoutId !== null) {
      clearTimeout(this.activityTimeoutId);
      this.activityTimeoutId = null;
    }
    this.element.style.opacity = '1';
  }

  public dispose(): void {
    if (this.activityTimeoutId !== null) {
      clearTimeout(this.activityTimeoutId);
      this.activityTimeoutId = null;
    }
    this.moodSwitch.dispose();
    this.soundToggle.dispose();
    if (this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
    }
  }
}
