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
        <div class="filter-panel__field">
          <label class="filter-panel__label" [attr.for]="'filter-' + field.key">{{ field.label }}</label>
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
                  class="filter-panel__control"
                  [id]="'filter-' + field.key + '-from'"
                  [value]="values[field.key + 'From'] ?? ''"
                  (change)="onChange(field.key + 'From', $event)"
                  aria-label="{{ field.label }} from"
                />
                <input
                  type="date"
                  class="filter-panel__control"
                  [id]="'filter-' + field.key + '-to'"
                  [value]="values[field.key + 'To'] ?? ''"
                  (change)="onChange(field.key + 'To', $event)"
                  aria-label="{{ field.label }} to"
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
      }
      .filter-panel {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
      }
      .filter-panel__field {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .filter-panel__label {
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--fg-muted);
      }
      .filter-panel__control {
        padding: 0.375rem 0.5rem;
        border: 1px solid var(--border);
        border-radius: 0.375rem;
        background: var(--surface);
        color: var(--fg);
        font: inherit;
      }
      .filter-panel__control:focus-visible {
        outline: 2px solid var(--color-brand);
        outline-offset: 2px;
      }
      .filter-panel__range {
        display: flex;
        gap: 0.5rem;
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
