import { COPY } from './copy';

export interface ExitScreenOptions {
  container?: HTMLElement;
  onRerun?: () => void;
}

export class ExitScreen {
  public readonly element: HTMLElement;
  public readonly rerunButton: HTMLButtonElement;
  private isVisible = false;
  private onRerun?: () => void;

  constructor(options: ExitScreenOptions = {}) {
    this.onRerun = options.onRerun;

    this.element = document.createElement('div');
    this.element.className = 'exit-screen';
    this.element.setAttribute('role', 'region');
    this.element.setAttribute('aria-label', 'terminal exit screen');
    this.element.style.position = 'fixed';
    this.element.style.inset = '0';
    this.element.style.backgroundColor = '#080d08';
    this.element.style.zIndex = '2000';
    this.element.style.display = 'none';
    this.element.style.opacity = '0';
    this.element.style.transition = 'opacity 800ms var(--ease-out)';
    this.element.style.fontFamily = 'var(--font-mono)';
    this.element.style.padding = '32px';
    this.element.style.flexDirection = 'column';
    this.element.style.alignItems = 'flex-start';
    this.element.style.justifyContent = 'center';
    this.element.style.gap = 'var(--space-3)';

    const termBox = document.createElement('div');
    termBox.style.maxWidth = '480px';
    termBox.style.width = '100%';
    termBox.style.margin = '0 auto';
    termBox.style.display = 'flex';
    termBox.style.flexDirection = 'column';
    termBox.style.gap = 'var(--space-3)';

    const cmdLine = document.createElement('p');
    cmdLine.style.color = 'var(--text-muted)';
    cmdLine.style.fontSize = 'var(--size-text-m)';
    cmdLine.style.margin = '0';
    cmdLine.textContent = COPY.eggs.ee1ExitCmd;

    const exitLine = document.createElement('p');
    exitLine.style.color = 'var(--accent)';
    exitLine.style.fontSize = 'var(--size-text-m)';
    exitLine.style.margin = '0';
    exitLine.textContent = COPY.eggs.ee1ExitCode;

    this.rerunButton = document.createElement('button');
    this.rerunButton.type = 'button';
    this.rerunButton.className = 'glass-btn rerun-btn';
    this.rerunButton.style.marginTop = 'var(--space-4)';
    this.rerunButton.style.alignSelf = 'flex-start';
    this.rerunButton.textContent = COPY.eggs.ee1RerunBtn;

    this.rerunButton.addEventListener('click', () => {
      this.hide();
      this.onRerun?.();
    });

    termBox.appendChild(cmdLine);
    termBox.appendChild(exitLine);
    termBox.appendChild(this.rerunButton);
    this.element.appendChild(termBox);

    const parent = options.container ?? document.body;
    parent.appendChild(this.element);
  }

  public show(): void {
    if (this.isVisible) return;
    this.isVisible = true;
    this.element.style.display = 'flex';
    // Force layout before transition
    void this.element.offsetHeight;
    this.element.style.opacity = '1';

    // Auto-focus the re-run button on appear
    setTimeout(() => {
      this.rerunButton.focus();
    }, 100);
  }

  public hide(): void {
    if (!this.isVisible) return;
    this.isVisible = false;
    this.element.style.opacity = '0';
    this.element.style.display = 'none';
  }

  public getIsOpen(): boolean {
    return this.isVisible;
  }

  public dispose(): void {
    if (this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
    }
  }
}
