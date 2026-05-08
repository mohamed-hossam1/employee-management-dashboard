import { Component, ElementRef, afterNextRender, inject, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  imports: [],
  template: `
    @if (open()) {
      <div class="confirm-backdrop" (click)="onCancel()">
        <div
          class="confirm-dialog"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="titleId"
          [attr.aria-describedby]="messageId"
          tabindex="-1"
          #dialog
          (click)="$event.stopPropagation()"
          (keydown)="onKeydown($event)"
        >
          <h2 class="confirm-dialog__title" [id]="titleId">{{ title() }}</h2>
          <p class="confirm-dialog__message" [id]="messageId">{{ message() }}</p>
          <div class="confirm-dialog__actions">
            <button type="button" class="confirm-dialog__btn confirm-dialog__btn--cancel" (click)="onCancel()">
              {{ cancelText() }}
            </button>
            <button type="button" class="confirm-dialog__btn confirm-dialog__btn--confirm" (click)="onConfirm()">
              {{ confirmText() }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: contents;
      }
      .confirm-backdrop {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: color-mix(in srgb, #000 45%, transparent);
        z-index: 1100;
        padding: 1rem;
      }
      .confirm-dialog {
        width: min(28rem, 100%);
        padding: 1.5rem;
        border-radius: 0.75rem;
        background: var(--surface);
        color: var(--fg);
        box-shadow: var(--shadow-card);
      }
      .confirm-dialog__title {
        margin: 0 0 0.5rem;
        font-size: 1.125rem;
        font-weight: 600;
      }
      .confirm-dialog__message {
        margin: 0 0 1.25rem;
        font-size: 0.875rem;
        color: var(--fg-muted);
      }
      .confirm-dialog__actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
      }
      .confirm-dialog__btn {
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        border: 1px solid var(--border);
        background: var(--surface-muted);
        color: var(--fg);
      }
      .confirm-dialog__btn--confirm {
        background: var(--color-danger);
        border-color: var(--color-danger);
        color: #fff;
      }
      .confirm-dialog__btn:focus-visible {
        outline: 2px solid var(--color-brand);
        outline-offset: 2px;
      }
    `
  ]
})
export class ConfirmDialogComponent {
  readonly open = input(false);
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly confirmText = input('Confirm');
  readonly cancelText = input('Cancel');

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  private static nextId = 0;
  private readonly instanceId = ConfirmDialogComponent.nextId++;

  protected readonly titleId = `confirm-dialog-title-${this.instanceId}`;
  protected readonly messageId = `confirm-dialog-message-${this.instanceId}`;

  private readonly host = inject(ElementRef);

  constructor() {
    afterNextRender(() => {
      if (this.open()) {
        this.focusDialog();
      }
    });
  }

  private focusDialog(): void {
    const dialog = this.host.nativeElement.querySelector('.confirm-dialog');
    if (dialog) {
      (dialog as HTMLElement).focus();
    }
  }

  protected onConfirm(): void {
    this.confirmed.emit();
  }

  protected onCancel(): void {
    this.cancelled.emit();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.onCancel();
      return;
    }
    if (event.key === 'Tab') {
      this.trapFocus(event);
    }
  }

  private trapFocus(event: KeyboardEvent): void {
    const dialog = this.host.nativeElement as HTMLElement;
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) {
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
