import { Component, input } from '@angular/core';

export interface StatsTrend {
  direction: 'up' | 'down';
  percent: number;
}

@Component({
  selector: 'app-stats-card',
  imports: [],
  template: `
    <div class="stats-card">
      <div class="stats-card__head">
        <span class="stats-card__icon" aria-hidden="true">{{ icon() }}</span>
        @if (trend(); as t) {
          <span class="stats-card__trend" [class]="'stats-card__trend--' + t.direction">
            {{ t.direction === 'up' ? '▲' : '▼' }} {{ t.percent }}%
          </span>
        }
      </div>
      <p class="stats-card__value">{{ value() }}</p>
      <p class="stats-card__label">{{ label() }}</p>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .stats-card {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 1rem 1.25rem;
        border: 1px solid var(--border);
        border-radius: 0.75rem;
        background: var(--surface);
        box-shadow: var(--shadow-card);
      }
      .stats-card__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .stats-card__icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2.25rem;
        height: 2.25rem;
        border-radius: 0.5rem;
        background: color-mix(in srgb, var(--color-brand) 15%, transparent);
        color: var(--color-brand);
        font-size: 1.1rem;
      }
      .stats-card__trend {
        font-size: 0.8125rem;
        font-weight: 600;
      }
      .stats-card__trend--up {
        color: var(--color-success);
      }
      .stats-card__trend--down {
        color: var(--color-danger);
      }
      .stats-card__value {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--fg);
      }
      .stats-card__label {
        margin: 0;
        font-size: 0.875rem;
        color: var(--fg-muted);
      }
    `
  ]
})
export class StatsCardComponent {
  readonly icon = input.required<string>();
  readonly label = input.required<string>();
  readonly value = input<string | number>();
  readonly trend = input<StatsTrend | null>(null);
}
