import { Component, input } from '@angular/core';

export type BadgeVariant =
  | 'full-time'
  | 'part-time'
  | 'contract'
  | 'freelance'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';

@Component({
  selector: 'app-badge',
  imports: [],
  template: `
    <span class="badge" [class]="'badge--' + variant()">
      {{ text() }}
    </span>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        padding: 0.125rem 0.5rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 500;
        line-height: 1.25rem;
        background: var(--surface-muted);
        color: var(--fg-muted);
      }
      .badge--full-time {
        background: color-mix(in srgb, var(--color-success) 15%, transparent);
        color: var(--color-success);
      }
      .badge--part-time {
        background: color-mix(in srgb, var(--color-info) 15%, transparent);
        color: var(--color-info);
      }
      .badge--contract {
        background: color-mix(in srgb, var(--color-warning) 18%, transparent);
        color: var(--color-warning);
      }
      .badge--freelance {
        background: color-mix(in srgb, var(--color-brand) 15%, transparent);
        color: var(--color-brand);
      }
      .badge--success {
        background: color-mix(in srgb, var(--color-success) 15%, transparent);
        color: var(--color-success);
      }
      .badge--warning {
        background: color-mix(in srgb, var(--color-warning) 18%, transparent);
        color: var(--color-warning);
      }
      .badge--error {
        background: color-mix(in srgb, var(--color-danger) 15%, transparent);
        color: var(--color-danger);
      }
      .badge--info {
        background: color-mix(in srgb, var(--color-info) 15%, transparent);
        color: var(--color-info);
      }
    `
  ]
})
export class BadgeComponent {
  readonly text = input.required<string>();
  readonly variant = input<BadgeVariant>('info');
}
