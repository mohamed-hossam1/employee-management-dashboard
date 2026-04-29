import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  imports: [],
  template: `
    <div class="empty-state">
      @if (icon()) {
        <span class="empty-state__icon" aria-hidden="true">{{ icon() }}</span>
      }
      <h3 class="empty-state__title">{{ title() }}</h3>
      @if (message()) {
        <p class="empty-state__message">{{ message() }}</p>
      }
      @if (actionText()) {
        <button type="button" class="empty-state__action" (click)="action.emit()">
          {{ actionText() }}
        </button>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 2.5rem 1.5rem;
        text-align: center;
        color: var(--fg-muted);
      }
      .empty-state__icon {
        font-size: 2rem;
        line-height: 1;
      }
      .empty-state__title {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--fg);
      }
      .empty-state__message {
        margin: 0;
        font-size: 0.875rem;
        max-width: 28rem;
      }
      .empty-state__action {
        margin-top: 0.25rem;
        padding: 0.5rem 1rem;
        border: 1px solid var(--color-brand);
        border-radius: 0.5rem;
        background: var(--color-brand);
        color: var(--on-brand);
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
      }
      .empty-state__action:focus-visible {
        outline: 2px solid var(--color-brand);
        outline-offset: 2px;
      }
    `
  ]
})
export class EmptyStateComponent {
  readonly title = input.required<string>();
  readonly message = input<string>('');
  readonly actionText = input<string>('');
  readonly icon = input<string>('');

  readonly action = output<void>();
}
