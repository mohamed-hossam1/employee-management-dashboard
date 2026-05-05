import { Component, computed, input, output } from '@angular/core';

import { AvatarComponent } from '../../../../shared/components/avatar/avatar';
import { BadgeComponent, BadgeVariant } from '../../../../shared/components/badge/badge';
import { LoaderComponent } from '../../../../shared/components/loader/loader';
import {
  Employee,
  EmployeeStatus,
  EMPLOYEE_STATUS_LABELS
} from '../../models/employee.model';

export type SortDirection = 'asc' | 'desc';

export interface EmployeeSortChange {
  field: string;
  dir: SortDirection;
}

@Component({
  selector: 'app-employee-table',
  imports: [AvatarComponent, BadgeComponent, LoaderComponent],
  template: `
    <div class="employee-table" [attr.aria-busy]="loading() ? 'true' : null">
      @if (loading()) {
        <app-loader variant="overlay" />
      }

      <table class="employee-table__table">
        <thead>
          <tr>
            @if (selectable()) {
              <th scope="col" class="employee-table__select">
                <input
                  type="checkbox"
                  [checked]="allSelected()"
                  [indeterminate]="someSelected()"
                  (change)="toggleAll()"
                  aria-label="Select all employees"
                />
              </th>
            }
            <th scope="col" [attr.aria-sort]="ariaSort('name')">
              <button type="button" class="employee-table__sort" (click)="toggleSort('name')">
                Name
                <span aria-hidden="true">{{ sortGlyph('name') }}</span>
              </button>
            </th>
            <th scope="col" [attr.aria-sort]="ariaSort('email')">
              <button type="button" class="employee-table__sort" (click)="toggleSort('email')">
                Email
                <span aria-hidden="true">{{ sortGlyph('email') }}</span>
              </button>
            </th>
            <th scope="col">Department</th>
            <th scope="col" [attr.aria-sort]="ariaSort('position')">
              <button type="button" class="employee-table__sort" (click)="toggleSort('position')">
                Position
                <span aria-hidden="true">{{ sortGlyph('position') }}</span>
              </button>
            </th>
            <th scope="col" [attr.aria-sort]="ariaSort('status')">
              <button type="button" class="employee-table__sort" (click)="toggleSort('status')">
                Status
                <span aria-hidden="true">{{ sortGlyph('status') }}</span>
              </button>
            </th>
            @if (showActions()) {
              <th scope="col" class="employee-table__actions-col">Actions</th>
            }
          </tr>
        </thead>
        <tbody>
          @for (employee of employees(); track employee.id) {
            <tr class="employee-table__row" (click)="rowClick.emit(employee)">
              @if (selectable()) {
                <td class="employee-table__select" (click)="$event.stopPropagation()">
                  <input
                    type="checkbox"
                    [checked]="isSelected(employee.id)"
                    (change)="toggleRow(employee.id)"
                    [attr.aria-label]="'Select ' + fullName(employee)"
                  />
                </td>
              }
              <td>
                <span class="employee-table__person">
                  <app-avatar
                    [src]="employee.avatar"
                    [name]="fullName(employee)"
                    size="sm"
                  />
                  <span>{{ fullName(employee) }}</span>
                </span>
              </td>
              <td>{{ employee.email }}</td>
              <td>{{ departmentName(employee.departmentId) }}</td>
              <td>{{ employee.position }}</td>
              <td>
                <app-badge
                  [text]="statusLabel(employee.status)"
                  [variant]="statusVariant(employee.status)"
                />
              </td>
              @if (showActions()) {
                <td class="employee-table__actions" (click)="$event.stopPropagation()">
                  <button
                    type="button"
                    class="employee-table__action"
                    (click)="edit.emit(employee)"
                    [attr.aria-label]="'Edit ' + fullName(employee)"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    class="employee-table__action employee-table__action--danger"
                    (click)="delete.emit(employee)"
                    [attr.aria-label]="'Delete ' + fullName(employee)"
                  >
                    Delete
                  </button>
                </td>
              }
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .employee-table {
        position: relative;
        overflow-x: auto;
        border: 1px solid var(--border);
        border-radius: 0.75rem;
        background: var(--surface);
      }
      .employee-table__table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.875rem;
      }
      .employee-table__table th,
      .employee-table__table td {
        text-align: left;
        padding: 0.75rem 0.875rem;
        border-bottom: 1px solid var(--border);
        vertical-align: middle;
      }
      .employee-table__table th {
        font-weight: 600;
        color: var(--muted);
        white-space: nowrap;
        background: color-mix(in srgb, var(--surface) 80%, var(--border));
      }
      .employee-table__row {
        cursor: pointer;
      }
      .employee-table__row:hover {
        background: color-mix(in srgb, var(--color-brand) 6%, transparent);
      }
      .employee-table__sort {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        border: 0;
        background: transparent;
        color: inherit;
        font: inherit;
        font-weight: 600;
        cursor: pointer;
        padding: 0;
      }
      .employee-table__sort:focus-visible {
        outline: 2px solid var(--color-brand);
        outline-offset: 2px;
      }
      .employee-table__person {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 500;
      }
      .employee-table__select {
        width: 2.5rem;
        text-align: center;
      }
      .employee-table__actions-col,
      .employee-table__actions {
        white-space: nowrap;
        text-align: right;
      }
      .employee-table__action {
        margin-left: 0.375rem;
        padding: 0.25rem 0.5rem;
        border: 1px solid var(--border);
        border-radius: 0.375rem;
        background: var(--bg);
        color: var(--fg);
        font-size: 0.8125rem;
        cursor: pointer;
      }
      .employee-table__action--danger {
        color: var(--color-danger);
        border-color: color-mix(in srgb, var(--color-danger) 40%, var(--border));
      }
      .employee-table__action:focus-visible {
        outline: 2px solid var(--color-brand);
        outline-offset: 2px;
      }
    `
  ]
})
export class EmployeeTableComponent {
  readonly employees = input.required<Employee[]>();
  readonly loading = input(false);
  readonly selectable = input(false);
  readonly showActions = input(false);
  readonly selectedIds = input<string[]>([]);
  readonly sortField = input<string>('lastName');
  readonly sortDir = input<SortDirection>('asc');
  readonly departmentNames = input<Record<string, string>>({});

  readonly sortChange = output<EmployeeSortChange>();
  readonly selectionChange = output<string[]>();
  readonly rowClick = output<Employee>();
  readonly edit = output<Employee>();
  readonly delete = output<Employee>();

  private readonly selectedSet = computed(() => new Set(this.selectedIds()));

  protected readonly allSelected = computed(
    () =>
      this.employees().length > 0 &&
      this.employees().every((e) => this.selectedSet().has(e.id))
  );

  protected readonly someSelected = computed(
    () =>
      !this.allSelected() && this.employees().some((e) => this.selectedSet().has(e.id))
  );

  protected fullName(employee: Employee): string {
    return `${employee.firstName} ${employee.lastName}`;
  }

  protected departmentName(departmentId: string): string {
    return this.departmentNames()[departmentId] ?? '—';
  }

  protected statusLabel(status: EmployeeStatus): string {
    return EMPLOYEE_STATUS_LABELS[status];
  }

  protected statusVariant(status: EmployeeStatus): BadgeVariant {
    switch (status) {
      case 'active':
        return 'success';
      case 'on-leave':
        return 'warning';
      case 'inactive':
        return 'error';
      default:
        return 'info';
    }
  }

  protected ariaSort(field: string): 'ascending' | 'descending' | 'none' {
    if (this.sortField() !== field) {
      return 'none';
    }
    return this.sortDir() === 'asc' ? 'ascending' : 'descending';
  }

  protected sortGlyph(field: string): string {
    if (this.sortField() !== field) {
      return '⇅';
    }
    return this.sortDir() === 'asc' ? '▲' : '▼';
  }

  protected isSelected(id: string): boolean {
    return this.selectedSet().has(id);
  }

  protected toggleSort(field: string): void {
    if (this.sortField() === field) {
      this.sortChange.emit({
        field,
        dir: this.sortDir() === 'asc' ? 'desc' : 'asc'
      });
    } else {
      this.sortChange.emit({ field, dir: 'asc' });
    }
  }

  protected toggleRow(id: string): void {
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
      this.selectionChange.emit(this.employees().map((e) => e.id));
    }
  }
}
