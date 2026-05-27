import { Component, input, output } from '@angular/core';

export interface FilterField {
  key: string;
  label: string;
  type: 'select' | 'date' | 'daterange';
  options?: { value: string; label: string }[];
}

@Component({
  selector: 'app-filter-panel',
  imports: [],
  template: `
    <form class="filter-panel" (submit)="$event.preventDefault()">
      @for (field of fields(); track field.key) {
        <div
          class="filter-panel__field"
          [class.filter-panel__field--range]="field.type === 'daterange'"
        >
          <label class="filter-panel__label" [attr.for]="'filter-' + field.key">
            {{ field.label }}
          </label>
          @switch (field.type) {
            @case ('select') {
              <select
                class="filter-panel__control"
                [id]="'filter-' + field.key"
                [value]="values[field.key] ?? ''"
                (change)="onChange(field.key, $event)"
              >
                <option value="">All</option>
                @for (opt of field.options ?? []; track opt.value) {
                  <option [value]="opt.value">{{ opt.label }}</option>
                }
              </select>
            }
            @case ('date') {
              <input
                type="date"
                class="filter-panel__control"
                [id]="'filter-' + field.key"
                [value]="values[field.key] ?? ''"
                (change)="onChange(field.key, $event)"
              />
            }
            @case ('daterange') {
              <div class="filter-panel__range">
                <input
                  type="date"
                  class="filter-panel__control filter-panel__control--date"
                  [id]="'filter-' + field.key + '-from'"
                  [value]="values[field.key + 'From'] ?? ''"
                  (change)="onChange(field.key + 'From', $event)"
                  [attr.aria-label]="field.label + ' from'"
                />
                <span class="filter-panel__range-sep" aria-hidden="true">–</span>
                <input
                  type="date"
                  class="filter-panel__control filter-panel__control--date"
                  [id]="'filter-' + field.key + '-to'"
                  [value]="values[field.key + 'To'] ?? ''"
                  (change)="onChange(field.key + 'To', $event)"
                  [attr.aria-label]="field.label + ' to'"
                />
              </div>
            }
          }
        </div>
      }
    </form>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        min-width: 0;
      }
      .filter-panel {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
        gap: 0.75rem 1rem;
        width: 100%;
        min-width: 0;
      }
      .filter-panel__field {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        min-width: 0;
      }
      .filter-panel__field--range {
        grid-column: 1 / -1;
      }
      .filter-panel__label {
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--muted);
      }
      .filter-panel__control {
        box-sizing: border-box;
        width: 100%;
        min-width: 0;
        max-width: 100%;
        padding: 0.5rem 0.625rem;
        border: 1px solid var(--border);
        border-radius: 0.5rem;
        background: var(--bg);
        color: var(--fg);
        font: inherit;
        font-size: 0.875rem;
      }
      .filter-panel__control--date {
        min-width: 0;
      }
      .filter-panel__control:focus-visible {
        outline: 2px solid var(--color-brand);
        outline-offset: 2px;
      }
      .filter-panel__range {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
        align-items: center;
        gap: 0.5rem;
        width: 100%;
        min-width: 0;
      }
      .filter-panel__range-sep {
        color: var(--muted);
        font-size: 0.875rem;
      }
      @media (max-width: 30rem) {
        .filter-panel {
          grid-template-columns: 1fr;
        }
        .filter-panel__range {
          grid-template-columns: 1fr;
          gap: 0.5rem;
        }
        .filter-panel__range-sep {
          display: none;
        }
      }
    `
  ]
})
export class FilterPanelComponent {
  readonly fields = input.required<FilterField[]>();

  readonly filterChange = output<Record<string, unknown>>();

  protected values: Record<string, string> = {};

  protected onChange(key: string, event: Event): void {
    const value = (event.target as HTMLInputElement | HTMLSelectElement).value;
    if (value) {
      this.values[key] = value;
    } else {
      delete this.values[key];
    }
    const active: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(this.values)) {
      if (v) {
        active[k] = v;
      }
    }
    this.filterChange.emit(active);
  }
}
