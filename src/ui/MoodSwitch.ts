import { ICONS } from './icons';
import { COPY } from './copy';
import type { MoodName } from '../core/types';

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
