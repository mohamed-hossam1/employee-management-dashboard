import { Component, computed, inject, input, output, signal } from '@angular/core';

import { CsvService } from '../../../../core/services/csv.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  EMPLOYEE_STATUSES,
  Employee,
  EmployeeCreateInput,
  EmployeeStatus
} from '../../models/employee.model';
import { EmployeeService } from '../../services/employee.service';
import { DepartmentOption } from '../employee-filters/employee-filters';

const CSV_COLUMNS = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'department',
  'position',
  'salary',
  'hireDate',
  'status'
] as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+]?[\d\s().-]{7,20}$/;

export interface ImportSummary {
  successCount: number;
  failureCount: number;
  failures: { row: number; message: string }[];
}

@Component({
  selector: 'app-import-export-dialog',
  imports: [],
  template: `
    @if (open()) {
      <div class="ie-backdrop" (click)="close.emit()">
        <div
          class="ie-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ie-dialog-title"
          tabindex="-1"
          (click)="$event.stopPropagation()"
          (keydown)="onKeydown($event)"
        >
          <header class="ie-dialog__header">
            <h2 id="ie-dialog-title" class="ie-dialog__title">Import / Export employees</h2>
            <button type="button" class="ie-dialog__close" (click)="close.emit()" aria-label="Close dialog">
              ×
            </button>
          </header>

          @if (summary(); as result) {
            <section class="ie-dialog__summary" aria-live="polite">
              <h3 class="ie-dialog__section-title">Import results</h3>
              <p>
                {{ result.successCount }} succeeded,
                {{ result.failureCount }} failed.
              </p>
              @if (result.failures.length > 0) {
                <ul class="ie-dialog__failures">
                  @for (failure of result.failures; track failure.row + failure.message) {
                    <li>Row {{ failure.row }}: {{ failure.message }}</li>
                  }
                </ul>
              }
              <button type="button" class="ie-dialog__btn ie-dialog__btn--primary" (click)="done()">
                Done
              </button>
            </section>
          } @else {
            <section class="ie-dialog__section">
              <h3 class="ie-dialog__section-title">Export</h3>
              <p class="ie-dialog__text">
                Download the currently filtered employee list as CSV
                ({{ employees().length }} row{{ employees().length === 1 ? '' : 's' }}).
              </p>
              <button
                type="button"
                class="ie-dialog__btn ie-dialog__btn--primary"
                [disabled]="employees().length === 0 || busy()"
                (click)="exportCsv()"
              >
                Export CSV
              </button>
            </section>

            <section class="ie-dialog__section">
              <h3 class="ie-dialog__section-title">Import</h3>
              <p class="ie-dialog__text">
                Upload a CSV with columns:
                firstName, lastName, email, phone, department, position, salary, hireDate, status.
              </p>
              <label class="ie-dialog__file-label" for="employee-csv-import">
                Choose CSV file
                <input
                  id="employee-csv-import"
                  type="file"
                  accept=".csv,text/csv"
                  class="ie-dialog__file"
                  [disabled]="busy()"
                  (change)="onFileSelected($event)"
                />
              </label>
              @if (importError()) {
                <p class="ie-dialog__error" role="alert">{{ importError() }}</p>
              }
              @if (busy()) {
                <p class="ie-dialog__text" role="status">Importing…</p>
              }
            </section>
          }
        </div>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: contents;
      }
      .ie-backdrop {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: color-mix(in srgb, #000 45%, transparent);
        z-index: 1100;
        padding: 1rem;
      }
      .ie-dialog {
        width: min(32rem, 100%);
        max-height: min(90vh, 40rem);
        overflow: auto;
        padding: 1.25rem 1.5rem;
        border-radius: 0.75rem;
        background: var(--surface);
        color: var(--fg);
        box-shadow: var(--shadow-card);
      }
      .ie-dialog__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 1rem;
      }
      .ie-dialog__title {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
      }
      .ie-dialog__close {
        border: 0;
        background: transparent;
        color: var(--muted);
        font-size: 1.5rem;
        line-height: 1;
        cursor: pointer;
        padding: 0.25rem;
      }
      .ie-dialog__section {
        padding: 1rem 0;
        border-top: 1px solid var(--border);
      }
      .ie-dialog__section-title {
        margin: 0 0 0.5rem;
        font-size: 0.9375rem;
        font-weight: 600;
      }
      .ie-dialog__text {
        margin: 0 0 0.75rem;
        font-size: 0.875rem;
        color: var(--muted);
      }
      .ie-dialog__btn {
        padding: 0.5rem 0.875rem;
        border-radius: 0.5rem;
        border: 1px solid var(--border);
        background: var(--bg);
        color: var(--fg);
        font: inherit;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
      }
      .ie-dialog__btn--primary {
        background: var(--color-brand);
        border-color: var(--color-brand);
        color: #fff;
      }
      .ie-dialog__btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .ie-dialog__file-label {
        position: relative;
        display: inline-flex;
        padding: 0.5rem 0.875rem;
        border-radius: 0.5rem;
        border: 1px solid var(--border);
        background: var(--bg);
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
      }
      .ie-dialog__file {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      .ie-dialog__error {
        margin: 0.75rem 0 0;
        color: var(--color-danger);
        font-size: 0.875rem;
      }
      .ie-dialog__summary {
        padding-top: 0.25rem;
      }
      .ie-dialog__failures {
        margin: 0 0 1rem;
        padding-left: 1.25rem;
        font-size: 0.875rem;
        color: var(--muted);
        max-height: 12rem;
        overflow: auto;
      }
      .ie-dialog__btn:focus-visible,
      .ie-dialog__close:focus-visible,
      .ie-dialog__file-label:focus-within {
        outline: 2px solid var(--color-brand);
        outline-offset: 2px;
      }
    `
  ]
})
export class ImportExportDialogComponent {
  private readonly csv = inject(CsvService);
  private readonly employeeService = inject(EmployeeService);
  private readonly notifications = inject(NotificationService);

  readonly open = input(false);
  readonly employees = input<Employee[]>([]);
  readonly departments = input<DepartmentOption[]>([]);
  readonly existingEmails = input<string[]>([]);

  readonly close = output<void>();
  readonly imported = output<void>();

  readonly busy = signal(false);
  readonly importError = signal<string | null>(null);
  readonly summary = signal<ImportSummary | null>(null);

  private readonly departmentByName = computed(() => {
    const map = new Map<string, string>();
    for (const dept of this.departments()) {
      map.set(dept.name.trim().toLowerCase(), dept.id);
    }
    return map;
  });

  protected exportCsv(): void {
    const deptNames = new Map(this.departments().map((d) => [d.id, d.name]));
    const rows = this.employees().map((e) => ({
      firstName: e.firstName,
      lastName: e.lastName,
      email: e.email,
      phone: e.phone ?? '',
      department: deptNames.get(e.departmentId) ?? '',
      position: e.position,
      salary: e.salary,
      hireDate: e.hireDate,
      status: e.status
    }));
    this.csv.export(rows, 'employees.csv');
    this.notifications.success('Employees exported.');
  }

  protected async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    this.importError.set(null);
    this.summary.set(null);

    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      this.importError.set('Please choose a .csv file.');
      return;
    }

    this.busy.set(true);
    try {
      const parsed = await this.csv.parse(file, [...CSV_COLUMNS]);
      if (parsed.errors.some((e) => e.row === 0)) {
        this.importError.set(parsed.errors[0]?.message ?? 'Invalid CSV file.');
        return;
      }

      const knownEmails = new Set(
        this.existingEmails().map((email) => email.trim().toLowerCase())
      );
      const failures: { row: number; message: string }[] = [...parsed.errors];
      let successCount = 0;

      for (let i = 0; i < parsed.valid.length; i++) {
        const row = parsed.valid[i];
        const rowNumber = i + 2; // header is row 1
        const validation = this.validateRow(row, knownEmails);
        if (!validation.ok) {
          failures.push({ row: rowNumber, message: validation.message });
          continue;
        }
        try {
          await this.employeeService.create(validation.payload);
          knownEmails.add(validation.payload.email.toLowerCase());
          successCount++;
        } catch {
          failures.push({ row: rowNumber, message: 'Failed to create employee.' });
        }
      }

      this.summary.set({
        successCount,
        failureCount: failures.length,
        failures: failures.slice(0, 50)
      });

      if (successCount > 0) {
        this.notifications.success(
          successCount === 1
            ? '1 employee imported.'
            : `${successCount} employees imported.`
        );
      }
    } catch {
      this.importError.set('Unable to parse the CSV file.');
    } finally {
      this.busy.set(false);
    }
  }

  private validateRow(
    row: Record<string, string>,
    knownEmails: Set<string>
  ): { ok: true; payload: EmployeeCreateInput } | { ok: false; message: string } {
    const firstName = (row['firstName'] ?? '').trim();
    const lastName = (row['lastName'] ?? '').trim();
    const email = (row['email'] ?? '').trim().toLowerCase();
    const phone = (row['phone'] ?? '').trim();
    const departmentName = (row['department'] ?? '').trim();
    const position = (row['position'] ?? '').trim();
    const salaryRaw = (row['salary'] ?? '').trim();
    const hireDate = (row['hireDate'] ?? '').trim();
    const statusRaw = (row['status'] ?? '').trim().toLowerCase();

    if (!firstName || firstName.length < 2) {
      return { ok: false, message: 'Invalid first name.' };
    }
    if (!lastName || lastName.length < 2) {
      return { ok: false, message: 'Invalid last name.' };
    }
    if (!EMAIL_PATTERN.test(email)) {
      return { ok: false, message: 'Invalid email.' };
    }
    if (knownEmails.has(email)) {
      return { ok: false, message: 'Duplicate email within project.' };
    }
    if (phone && !PHONE_PATTERN.test(phone)) {
      return { ok: false, message: 'Invalid phone number.' };
    }
    const departmentId = this.departmentByName().get(departmentName.toLowerCase());
    if (!departmentId) {
      return { ok: false, message: `Unknown department "${departmentName}".` };
    }
    if (!position || position.length < 2) {
      return { ok: false, message: 'Invalid position.' };
    }
    const salary = Number(salaryRaw);
    if (!salaryRaw || Number.isNaN(salary) || salary <= 0) {
      return { ok: false, message: 'Salary must be greater than 0.' };
    }
    if (!hireDate) {
      return { ok: false, message: 'Hire date is required.' };
    }
    const hire = new Date(hireDate + 'T00:00:00');
    if (Number.isNaN(hire.getTime())) {
      return { ok: false, message: 'Invalid hire date.' };
    }
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (hire.getTime() > today.getTime()) {
      return { ok: false, message: 'Hire date cannot be in the future.' };
    }
    if (!EMPLOYEE_STATUSES.includes(statusRaw as EmployeeStatus)) {
      return { ok: false, message: 'Invalid status.' };
    }

    return {
      ok: true,
      payload: {
        firstName,
        lastName,
        email,
        phone,
        departmentId,
        position,
        salary,
        hireDate,
        status: statusRaw as EmployeeStatus,
        avatar: null
      }
    };
  }

  protected done(): void {
    const hadSuccess = (this.summary()?.successCount ?? 0) > 0;
    this.summary.set(null);
    if (hadSuccess) {
      this.imported.emit();
    } else {
      this.close.emit();
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close.emit();
    }
  }
}
