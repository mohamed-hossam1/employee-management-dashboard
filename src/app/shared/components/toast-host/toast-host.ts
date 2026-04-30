import { Component, inject } from '@angular/core';

import { NotificationService } from '../../../core/services/notification.service';
import { slideIn } from '../../animations/shared.animations';

@Component({
  selector: 'app-toast-host',
  imports: [],
  animations: [slideIn],
  template: `
    <div class="toast-host" role="status" aria-live="polite" aria-label="Notifications">
      @for (toast of toasts(); track toast.id) {
        <div class="toast" [@slideIn] [class]="'toast--' + toast.type">
          <span class="toast__message">{{ toast.message }}</span>
          <button
            type="button"
            class="toast__close"
            (click)="dismiss(toast.id)"
            aria-label="Dismiss notification"
          >
            &times;
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: contents;
      }
      .toast-host {
        position: fixed;
        top: 1rem;
        right: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        z-index: 1200;
        max-width: min(22rem, calc(100vw - 2rem));
      }
      .toast {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        padding: 0.75rem 0.875rem;
        border-radius: 0.5rem;
        box-shadow: var(--shadow-card);
        background: var(--surface);
        color: var(--fg);
        border: 1px solid var(--border);
      }
      .toast--error {
        border-color: var(--color-danger);
        color: var(--color-danger);
      }
      .toast--success {
        border-color: var(--color-success);
        color: var(--color-success);
      }
      .toast--warning {
        border-color: var(--color-warning);
        color: var(--color-warning);
      }
      .toast__message {
        font-size: 0.875rem;
      }
      .toast__close {
        background: transparent;
        border: 0;
        color: inherit;
        font-size: 1.25rem;
        line-height: 1;
        cursor: pointer;
      }
      .toast__close:focus-visible {
        outline: 2px solid var(--color-brand);
        outline-offset: 2px;
      }
    `
  ]
})
export class ToastHost {
  private readonly notifications = inject(NotificationService);
  protected readonly toasts = this.notifications.toasts;
  protected dismiss(id: number): void {
    this.notifications.dismiss(id);
  }
}
