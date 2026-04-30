import { Component, computed, input, output, signal } from '@angular/core';

import { BadgeComponent, BadgeVariant } from '../badge/badge';
import { AvatarComponent } from '../avatar/avatar';
import { EmptyStateComponent } from '../empty-state/empty-state';

export type SortDirection = 'asc' | 'desc';

export interface ColumnDefinition {
  key: string;
  header: string;
  sortable?: boolean;
  render?: 'text' | 'badge' | 'avatar' | 'custom';
  badgeVariant?: BadgeVariant;
}

export interface SortChangeEvent {
  key: string;
  direction: SortDirection;
}

@Component({
  selector: 'app-data-table',
  imports: [BadgeComponent, AvatarComponent, EmptyStateComponent],
  template: `
    <div class="data-table-wrapper">
      @if (loading()) {
        <div class="data-table-loading" role="status" aria-label="Loading data">
          <span class="data-table-spinner" aria-hidden="true"></span>
        </div>
      }

      @if (data().length === 0 && !loading()) {
        <app-empty-state
          title="No records found"
          message="There is nothing to display yet."
        />
      } @else {
        <table class="data-table">
          <thead>
            <tr>
              @if (selectable()) {
                <th class="data-table__select" scope="col">
                  <input
                    type="checkbox"
                    [checked]="allSelected()"
                    [indeterminate]="someSelected()"
                    (change)="toggleAll()"
                    aria-label="Select all rows"
                  />
                </th>
              }
              @for (col of columns(); track col.key) {
                <th
                  scope="col"
                  [attr.aria-sort]="col.sortable ? sortDir()[col.key] ?? 'none' : null"
                >
                  @if (col.sortable) {
                    <button type="button" class="data-table__sort" (click)="toggleSort(col.key)">
                      {{ col.header }}
                      <span class="data-table__caret" aria-hidden="true">
                        {{ sortDir()[col.key] === 'asc' ? '▲' : sortDir()[col.key] === 'desc' ? '▼' : '⇅' }}
                      </span>
                    </button>
                  } @else {
                    {{ col.header }}
                  }
                </th>
              }
            </tr>
          </thead>
          <tbody>
            @for (row of data(); track row[trackBy()]) {
              <tr
                class="data-table__row"
                (click)="rowClick.emit(row)"
              >
                @if (selectable()) {
                  <td class="data-table__select">
                    <input
                      type="checkbox"
                      [checked]="isSelected(row)"
                      (change)="toggleRow(row)"
                      [attr.aria-label]="'Select ' + (row['name'] ?? row[trackBy()])"
                      (click)="$event.stopPropagation()"
                    />
                  </td>
                }
                @for (col of columns(); track col.key) {
                  <td>
                    @switch (col.render) {
                      @case ('badge') {
                        <app-badge [text]="cellText(row, col.key)" [variant]="col.badgeVariant ?? 'info'" />
                      }
                      @case ('avatar') {
                        <span class="data-table__avatar">
                          <app-avatar [src]="avatarSrc(row, col.key)" [name]="avatarName(row)" size="sm" />
                        </span>
                      }
                      @default {
                        {{ row[col.key] }}
                      }
                    }
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .data-table-wrapper {
        position: relative;
        overflow-x: auto;
      }
      table.data-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.875rem;
      }
      .data-table th,
      .data-table td {
        text-align: left;
        padding: 0.625rem 0.75rem;
        border-bottom: 1px solid var(--border);
      }
      .data-table th {
        color: var(--fg-muted);
        font-weight: 600;
        white-space: nowrap;
      }
      .data-table__row {
        cursor: pointer;
      }
      .data-table__row:hover {
        background: var(--surface-muted);
      }
      .data-table__sort {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        background: transparent;
        border: 0;
        color: inherit;
        font: inherit;
        font-weight: 600;
        cursor: pointer;
        padding: 0;
      }
      .data-table__sort:focus-visible {
        outline: 2px solid var(--color-brand);
        outline-offset: 2px;
      }
      .data-table__select {
        width: 2.5rem;
        text-align: center;
      }
      .data-table-loading {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: color-mix(in srgb, var(--surface) 60%, transparent);
        z-index: 2;
      }
      .data-table-spinner {
        width: 1.75rem;
        height: 1.75rem;
        border: 2px solid var(--border);
        border-top-color: var(--color-brand);
        border-radius: 9999px;
        animation: dt-spin 0.7s linear infinite;
      }
      @keyframes dt-spin {
        to {
          transform: rotate(360deg);
        }
      }
    `
  ]
})
export class DataTableComponent {
  readonly columns = input.required<ColumnDefinition[]>();
  readonly data = input<Record<string, unknown>[]>([]);
  readonly loading = input(false);
  readonly selectable = input(false);
  readonly selectedIds = input<string[]>([]);
  readonly trackBy = input<string>('id');

  readonly sortChange = output<SortChangeEvent>();
  readonly selectionChange = output<string[]>();
  readonly rowClick = output<Record<string, unknown>>();

  protected readonly sortDir = signal<Record<string, SortDirection>>({});

  private readonly selectedSet = computed(() => new Set(this.selectedIds()));
  protected readonly allSelected = computed(
    () => this.data().length > 0 && this.data().every((r) => this.selectedSet().has(String(r[this.trackBy()])))
  );
  protected readonly someSelected = computed(
    () => !this.allSelected() && this.data().some((r) => this.selectedSet().has(String(r[this.trackBy()])))
  );

  protected isSelected(row: Record<string, unknown>): boolean {
    return this.selectedSet().has(String(row[this.trackBy()]));
  }

  protected avatarSrc(row: Record<string, unknown>, key: string): string | null {
    const value = row[key];
    return typeof value === 'string' && value.length > 0 ? value : null;
  }

  protected cellText(row: Record<string, unknown>, key: string): string {
    const value = row[key];
    return value === null || value === undefined ? '' : String(value);
  }

  protected avatarName(row: Record<string, unknown>): string {
    const name = row['name'];
    const key = this.trackBy();
    return typeof name === 'string' && name.length > 0
      ? name
      : typeof row[key] === 'string'
        ? (row[key] as string)
        : '';
  }

  protected toggleSort(key: string): void {
    const current = this.sortDir()[key];
    const next: SortDirection | undefined = current === 'asc' ? 'desc' : current === 'desc' ? undefined : 'asc';
    const updated = { ...this.sortDir() };
    if (next === undefined) {
      delete updated[key];
    } else {
      updated[key] = next;
    }
    this.sortDir.set(updated);
    if (next) {
      this.sortChange.emit({ key, direction: next });
    }
  }

  protected toggleRow(row: Record<string, unknown>): void {
    const id = String(row[this.trackBy()]);
    const set = new Set(this.selectedSet());
    if (set.has(id)) {
      set.delete(id);
    } else {
      set.add(id);
    }
    this.selectionChange.emit([...set]);
  }

  protected toggleAll(): void {
    if (this.allSelected()) {
      this.selectionChange.emit([]);
    } else {
      this.selectionChange.emit(this.data().map((r) => String(r[this.trackBy()])));
    }
  }
}
