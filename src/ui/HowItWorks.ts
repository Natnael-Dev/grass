import { COPY } from './copy';
import { ICONS } from './icons';

export interface HowItWorksOptions {
  container?: HTMLElement;
  onClose?: () => void;
}

export class HowItWorks {
  public readonly scrim: HTMLElement;
  public readonly dialog: HTMLElement;
  public readonly closeButton: HTMLButtonElement;
  private opener: HTMLElement | null = null;
  private isVisible = false;
  private onClose?: () => void;
  private keydownListener: (e: KeyboardEvent) => void;

  constructor(options: HowItWorksOptions = {}) {
    this.onClose = options.onClose;

    // 1. Scrim
    this.scrim = document.createElement('div');
    this.scrim.className = 'how-it-works-scrim';
    this.scrim.style.position = 'fixed';
    this.scrim.style.inset = '0';
    this.scrim.style.backgroundColor = 'rgba(0, 0, 0, 0.55)';
    this.scrim.style.backdropFilter = 'blur(6px)';
    this.scrim.style.display = 'none';
    this.scrim.style.alignItems = 'center';
    this.scrim.style.justifyContent = 'center';
    this.scrim.style.padding = '16px';
    this.scrim.style.zIndex = '1000';

    // 2. Dialog Panel
    this.dialog = document.createElement('div');
    this.dialog.className = 'how-it-works-dialog glass-panel';
    this.dialog.setAttribute('role', 'dialog');
    this.dialog.setAttribute('aria-modal', 'true');
    this.dialog.setAttribute('aria-labelledby', 'how-it-works-title');
    this.dialog.style.position = 'relative';
    this.dialog.style.width = '100%';
    this.dialog.style.maxWidth = '520px';
    this.dialog.style.maxHeight = '85vh';
    this.dialog.style.overflowY = 'auto';
    this.dialog.style.padding = '24px';
    this.dialog.style.fontFamily = 'var(--font-ui)';
    this.dialog.style.color = 'var(--text)';
    this.dialog.style.display = 'flex';
    this.dialog.style.flexDirection = 'column';
    this.dialog.style.gap = 'var(--space-4)';

    // Header
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.justifyContent = 'space-between';

    const title = document.createElement('h2');
    title.id = 'how-it-works-title';
    title.textContent = COPY.howItWorks.title;
    title.style.fontFamily = 'var(--font-mono)';
    title.style.fontSize = 'var(--size-text-l)';
    title.style.fontWeight = '600';
    title.style.margin = '0';

    this.closeButton = document.createElement('button');
    this.closeButton.type = 'button';
    this.closeButton.className = 'glass-btn close-btn';
    this.closeButton.setAttribute('aria-label', COPY.howItWorks.closeButton);
    this.closeButton.title = `${COPY.howItWorks.closeButton} (Esc)`;
    this.closeButton.innerHTML = `${ICONS.close}<span>${COPY.howItWorks.closeButton}</span>`;
    this.closeButton.addEventListener('click', () => {
      this.close();
    });

    header.appendChild(title);
    header.appendChild(this.closeButton);
    this.dialog.appendChild(header);

    // "What is this" section
    const whatSection = document.createElement('p');
    whatSection.className = 'dialog-what';
    whatSection.style.fontSize = 'var(--size-text-m)';
    whatSection.style.lineHeight = '1.5';
    whatSection.style.color = 'var(--text-muted)';
    whatSection.textContent = COPY.howItWorks.what;
    this.dialog.appendChild(whatSection);

    // Controls Table
    const tableContainer = document.createElement('div');
    tableContainer.style.overflowX = 'auto';

    const table = document.createElement('table');
    table.className = 'controls-table';
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.fontFamily = 'var(--font-mono)';
    table.style.fontSize = 'var(--size-text-s)';
    table.style.textAlign = 'left';

    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr style="border-bottom: 1px solid var(--panel-border); color: var(--text-muted);">
        <th style="padding: 6px 8px;"></th>
        <th style="padding: 6px 8px;">mouse</th>
        <th style="padding: 6px 8px;">touch</th>
        <th style="padding: 6px 8px;">keyboard</th>
      </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    for (const row of COPY.howItWorks.controls) {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid rgba(255, 255, 255, 0.08)';
      tr.innerHTML = `
        <td style="padding: 6px 8px; color: var(--text);">${row.action}</td>
        <td style="padding: 6px 8px; color: var(--text-muted);">${row.mouse}</td>
        <td style="padding: 6px 8px; color: var(--text-muted);">${row.touch}</td>
        <td style="padding: 6px 8px; color: var(--text-muted);">${row.keyboard}</td>
      `;
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    tableContainer.appendChild(table);
    this.dialog.appendChild(tableContainer);

    // Q&A section
    const qaContainer = document.createElement('div');
    qaContainer.style.display = 'flex';
    qaContainer.style.flexDirection = 'column';
    qaContainer.style.gap = 'var(--space-2)';
    qaContainer.style.fontSize = 'var(--size-text-s)';
    qaContainer.style.lineHeight = '1.4';

    for (const item of COPY.howItWorks.qa) {
      const p = document.createElement('p');
      p.innerHTML = `<strong style="color: var(--text);">${item.q}</strong> <span style="color: var(--text-muted);">${item.a}</span>`;
      qaContainer.appendChild(p);
    }
    this.dialog.appendChild(qaContainer);

    // Credits section
    const credits = document.createElement('div');
    credits.className = 'dialog-credits';
    credits.style.fontSize = 'var(--size-text-s)';
    credits.style.color = 'var(--text-muted)';
    credits.style.paddingTop = 'var(--space-2)';
    credits.style.borderTop = '1px solid var(--panel-border)';
    credits.textContent = COPY.howItWorks.credits;
    this.dialog.appendChild(credits);

    this.scrim.appendChild(this.dialog);

    // Click on scrim outside dialog closes
    this.scrim.addEventListener('click', (e) => {
      if (e.target === this.scrim) {
        this.close();
      }
    });

    // Keyboard navigation: Escape & Focus Trap
    this.keydownListener = (e: KeyboardEvent) => {
      if (!this.isVisible) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        this.close();
        return;
      }

      if (e.key === 'Tab') {
        const focusable = this.getFocusableElements();
        if (focusable.length === 0) return;

        const first = focusable[0]!;
        const last = focusable[focusable.length - 1]!;

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', this.keydownListener);

    const parent = options.container ?? document.body;
    parent.appendChild(this.scrim);
  }

  public getFocusableElements(): HTMLElement[] {
    const selector =
      'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.from(this.dialog.querySelectorAll<HTMLElement>(selector));
  }

  public open(triggerElement?: HTMLElement): void {
    if (this.isVisible) return;
    this.opener =
      triggerElement ??
      (typeof document !== 'undefined' ? (document.activeElement as HTMLElement) : null);
    this.isVisible = true;
    this.scrim.style.display = 'flex';
    this.closeButton.focus();
  }

  public close(): void {
    if (!this.isVisible) return;
    this.isVisible = false;
    this.scrim.style.display = 'none';
    if (this.opener && typeof this.opener.focus === 'function') {
      this.opener.focus();
    }
    this.opener = null;
    this.onClose?.();
  }

  public getIsOpen(): boolean {
    return this.isVisible;
  }

  public dispose(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.keydownListener);
    }
    if (this.scrim.parentElement) {
      this.scrim.parentElement.removeChild(this.scrim);
    }
  }
}
