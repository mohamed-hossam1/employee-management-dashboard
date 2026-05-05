import { Component, input, output } from '@angular/core';

import { EmployeeFilters, EMPLOYEE_STATUSES, EMPLOYEE_STATUS_LABELS } from '../../models/employee.model';

export interface DepartmentOption {
  id: string;
  name: string;
}

@Component({
  selector: 'app-employee-filters',
  imports: [],
  template: `
    <form class="employee-filters" (submit)="$event.preventDefault()" aria-label="Employee filters">
      <div class="employee-filters__field">
        <label class="employee-filters__label" for="employee-filter-department">Department</label>
        <select
          id="employee-filter-department"
          class="employee-filters__control"
          [value]="filters().departmentId ?? ''"
          (change)="onDepartmentChange($event)"
        >
          <option value="">All departments</option>
          @for (dept of departments(); track dept.id) {
            <option [value]="dept.id">{{ dept.name }}</option>
          }
        </select>
      </div>

      <div class="employee-filters__field">
        <label class="employee-filters__label" for="employee-filter-status">Status</label>
        <select
          id="employee-filter-status"
          class="employee-filters__control"
          [value]="filters().status ?? ''"
          (change)="onStatusChange($event)"
        >
          <option value="">All statuses</option>
          @for (status of statuses; track status) {
            <option [value]="status">{{ statusLabels[status] }}</option>
          }
        </select>
      </div>
    </form>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .employee-filters {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
      }
      .employee-filters__field {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        min-width: 10rem;
      }
      .employee-filters__label {
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--muted);
      }
      .employee-filters__control {
        padding: 0.5rem 0.625rem;
        border: 1px solid var(--border);
        border-radius: 0.5rem;
        background: var(--surface);
        color: var(--fg);
        font: inherit;
      }
      .employee-filters__control:focus-visible {
        outline: 2px solid var(--color-brand);
        outline-offset: 2px;
      }
    `
  ]
})
export class EmployeeFiltersComponent {
  readonly filters = input.required<EmployeeFilters>();
  readonly departments = input<DepartmentOption[]>([]);

  readonly filterChange = output<Partial<EmployeeFilters>>();

  protected readonly statuses = EMPLOYEE_STATUSES;
  protected readonly statusLabels = EMPLOYEE_STATUS_LABELS;

  protected onDepartmentChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.filterChange.emit({ departmentId: value || null });
  }

  protected onStatusChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.filterChange.emit({ status: value || null });
  }
}
