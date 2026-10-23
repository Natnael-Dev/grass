import { COPY } from './copy';
import { ICONS } from './icons';

export interface HowItWorksOptions {
  container?: HTMLElement;
  onClose?: () => void;
}

export class HowItWorks {
  public readonly dialog: HTMLDialogElement;
  public readonly scrim: HTMLElement;
  public readonly closeButton: HTMLButtonElement;
  private opener: HTMLElement | null = null;
  private isOpen = false;
  private onClose?: () => void;
  private keydownListener?: (e: KeyboardEvent) => void;

  constructor(options: HowItWorksOptions = {}) {
    this.onClose = options.onClose;

    this.dialog = document.createElement('dialog');
    this.dialog.className = 'how-it-works-dialog glass-panel';
    this.dialog.setAttribute('role', 'dialog');
    this.dialog.setAttribute('aria-modal', 'true');
    this.dialog.setAttribute('aria-labelledby', 'how-it-works-title');
    this.dialog.style.position = 'fixed';
    this.dialog.style.inset = '0';
    this.dialog.style.margin = 'auto';
    this.dialog.style.width = 'calc(100% - 32px)';
    this.dialog.style.maxWidth = '520px';
    this.dialog.style.maxHeight = '85vh';
    this.dialog.style.overflowY = 'auto';
    this.dialog.style.padding = '24px';
    this.dialog.style.fontFamily = 'var(--font-ui)';
    this.dialog.style.color = 'var(--text)';
    this.dialog.style.border = '1px solid var(--glass-border)';
    this.dialog.style.borderRadius = 'var(--radius-l)';
    this.dialog.style.background = 'var(--glass-bg)';
    this.dialog.style.backdropFilter = 'blur(16px)';
    this.dialog.style.zIndex = '1000';
    this.dialog.style.display = 'none';

    this.scrim = this.dialog;

    // Header
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.justifyContent = 'space-between';
    header.style.marginBottom = 'var(--space-4)';

    const title = document.createElement('h2');
    title.id = 'how-it-works-title';
    title.textContent = COPY.howItWorks.title;
    title.style.margin = '0';
    title.style.fontSize = 'var(--size-text-l)';
    title.style.fontWeight = '600';
    header.appendChild(title);

    this.closeButton = document.createElement('button');
    this.closeButton.type = 'button';
    this.closeButton.className = 'glass-btn modal-close-btn';
    this.closeButton.setAttribute('aria-label', COPY.howItWorks.closeButton);
    this.closeButton.innerHTML = ICONS.close;
    this.closeButton.addEventListener('click', () => {
      this.close();
    });
    header.appendChild(this.closeButton);
    this.dialog.appendChild(header);

    // Paragraph
    const what = document.createElement('p');
    what.textContent = COPY.howItWorks.what;
    what.style.margin = '0 0 var(--space-4) 0';
    what.style.color = 'var(--text-muted)';
    this.dialog.appendChild(what);

    // Body: controls list
    const list = document.createElement('ul');
    list.style.listStyle = 'none';
    list.style.margin = '0';
    list.style.padding = '0';
    list.style.display = 'flex';
    list.style.flexDirection = 'column';
    list.style.gap = 'var(--space-3)';

    for (const item of COPY.howItWorks.controls) {
      const li = document.createElement('li');
      li.style.display = 'flex';
      li.style.justifyContent = 'space-between';
      li.style.alignItems = 'center';
      li.style.gap = 'var(--space-2)';

      const action = document.createElement('span');
      action.textContent = item.action;
      action.style.color = 'var(--text)';
      action.style.fontWeight = '500';

      const shortcut = document.createElement('span');
      shortcut.textContent = `${item.mouse} · ${item.keyboard}`;
      shortcut.style.color = 'var(--text-muted)';
      shortcut.style.fontFamily = 'var(--font-mono)';
      shortcut.style.fontSize = 'var(--size-text-s)';

      li.appendChild(action);
      li.appendChild(shortcut);
      list.appendChild(li);
    }
    this.dialog.appendChild(list);

    this.keydownListener = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.isOpen) {
        e.preventDefault();
        this.close();
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.keydownListener);
    }

    this.dialog.addEventListener('cancel', (e) => {
      e.preventDefault();
      this.close();
    });

    this.dialog.addEventListener('click', (e) => {
      if (e.target === this.dialog) {
        this.close();
      }
    });

    const targetContainer =
      options.container ?? (typeof document !== 'undefined' ? document.body : null);
    if (targetContainer) {
      targetContainer.appendChild(this.dialog);
    }
  }

  public open(opener?: HTMLElement): void {
    this.isOpen = true;
    this.opener = opener ?? (document.activeElement as HTMLElement | null);
    this.dialog.style.display = 'flex';
    if (typeof this.dialog.showModal === 'function') {
      try {
        this.dialog.showModal();
      } catch {
        this.dialog.setAttribute('open', '');
      }
    } else {
      this.dialog.setAttribute('open', '');
    }
    this.closeButton.focus();
  }

  public close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.dialog.style.display = 'none';
    if (this.dialog.open) {
      if (typeof this.dialog.close === 'function') {
        this.dialog.close();
      } else {
        this.dialog.removeAttribute('open');
      }
    }
    if (this.opener && typeof this.opener.focus === 'function') {
      this.opener.focus();
    }
    this.opener = null;
    this.onClose?.();
  }

  public getIsOpen(): boolean {
    return this.isOpen;
  }

  public dispose(): void {
    if (this.keydownListener && typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.keydownListener);
    }
    if (this.dialog.parentElement) {
      this.dialog.parentElement.removeChild(this.dialog);
    }
  }
}
