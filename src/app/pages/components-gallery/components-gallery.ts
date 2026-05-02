import { Component, inject, signal } from '@angular/core';

import { DataTableComponent, ColumnDefinition } from '../../shared/components/data-table/data-table';
import { SearchBarComponent } from '../../shared/components/search-bar/search-bar';
import { FilterPanelComponent, FilterField } from '../../shared/components/filter-panel/filter-panel';
import { PaginationComponent } from '../../shared/components/pagination/pagination';
import { StatsCardComponent } from '../../shared/components/stats-card/stats-card';
import { EmployeeCardComponent, EmployeeStatus } from '../../shared/components/employee-card/employee-card';
import { BadgeComponent } from '../../shared/components/badge/badge';
import { AvatarComponent } from '../../shared/components/avatar/avatar';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton';
import { LoaderComponent } from '../../shared/components/loader/loader';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog';
import { FormFieldComponent } from '../../shared/components/form-field/form-field';
import { NotificationService } from '../../core/services/notification.service';
import { CsvService } from '../../core/services/csv.service';

interface EmployeeRow {
  id: string;
  name: string;
  department: string;
  status: EmployeeStatus;
  avatar: string | null;
}

@Component({
  selector: 'app-components-gallery',
  imports: [
    DataTableComponent,
    SearchBarComponent,
    FilterPanelComponent,
    PaginationComponent,
    StatsCardComponent,
    EmployeeCardComponent,
    BadgeComponent,
    AvatarComponent,
    EmptyStateComponent,
    SkeletonComponent,
    LoaderComponent,
    ConfirmDialogComponent,
    FormFieldComponent
  ],
  template: `
    <div class="gallery">
      <header class="gallery__header">
        <h1>Shared Components</h1>
        <p>Reference gallery used for visual, theme, and accessibility validation.</p>
      </header>

      <section class="gallery__section">
        <h2>Stats cards</h2>
        <div class="gallery__grid">
          <app-stats-card icon="👥" label="Employees" [value]="42" [trend]="{ direction: 'up', percent: 12 }" />
          <app-stats-card icon="🏢" label="Departments" [value]="8" />
          <app-stats-card icon="🕑" label="On leave" [value]="3" [trend]="{ direction: 'down', percent: 4 }" />
        </div>
      </section>

      <section class="gallery__section">
        <h2>Search &amp; filter</h2>
        <div class="gallery__toolbar">
          <app-search-bar placeholder="Search employees" [debounceMs]="300" (searchChange)="onSearch($event)" />
          <app-filter-panel [fields]="filters" (filterChange)="onFilter($event)" />
        </div>
      </section>

      <section class="gallery__section">
        <h2>Data table</h2>
        <app-data-table
          [columns]="columns"
          [data]="rows()"
          [selectable]="true"
          [loading]="loading()"
          [selectedIds]="selected()"
          (selectionChange)="selected.set($event)"
          (rowClick)="onRow($event)"
        />
        <app-pagination
          [total]="rows().length"
          [page]="page()"
          [pageSize]="pageSize()"
          (pageChange)="onPage($event)"
        />
      </section>

      <section class="gallery__section">
        <h2>Employee cards</h2>
        <div class="gallery__grid">
          @for (employee of employees(); track employee.id) {
            <app-employee-card
              [avatar]="employee.avatar"
              [name]="employee.name"
              [department]="employee.department"
              [status]="employee.status"
              (click)="notify('Opened ' + employee.name)"
            />
          }
        </div>
      </section>

      <section class="gallery__section">
        <h2>Badges &amp; avatars</h2>
        <div class="gallery__inline">
          <app-badge text="Full-time" variant="full-time" />
          <app-badge text="Contract" variant="contract" />
          <app-badge text="Active" variant="success" />
          <app-badge text="Warning" variant="warning" />
          <app-avatar name="Jane Doe" size="md" />
          <app-avatar name="Sam Smith" [src]="null" size="lg" />
        </div>
      </section>

      <section class="gallery__section">
        <h2>Loading states</h2>
        <div class="gallery__inline">
          <app-skeleton variant="text" />
          <app-skeleton variant="circle" width="3rem" height="3rem" />
          <app-skeleton variant="rectangle" width="8rem" height="3rem" />
          <app-loader variant="inline" />
        </div>
      </section>

      <section class="gallery__section">
        <h2>Form field</h2>
        <app-form-field controlId="demo" label="Email" hint="We will never share it" [error]="null">
          <input id="demo" class="gallery__input" type="email" placeholder="you@example.com" />
        </app-form-field>
      </section>

      <section class="gallery__section">
        <h2>Feedback</h2>
        <div class="gallery__inline">
          <button type="button" class="gallery__btn" (click)="notify('Saved successfully', 'success')">Toast: success</button>
          <button type="button" class="gallery__btn" (click)="notify('Something went wrong', 'error')">Toast: error</button>
          <button type="button" class="gallery__btn" (click)="confirmOpen.set(true)">Open confirm dialog</button>
          <button type="button" class="gallery__btn" (click)="exportSample()">Export CSV</button>
        </div>
      </section>

      <section class="gallery__section">
        <h2>Empty state</h2>
        <app-empty-state
          title="Nothing here yet"
          message="Create your first record to get started."
          actionText="Create"
          (action)="notify('Create clicked', 'info')"
        />
      </section>
    </div>

    <app-confirm-dialog
      [open]="confirmOpen()"
      title="Delete item"
      message="This action cannot be undone."
      confirmText="Delete"
      (confirmed)="onConfirmed()"
    />
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .gallery {
        max-width: 64rem;
        margin: 0 auto;
        padding: 2rem 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 2rem;
      }
      .gallery__header h1 {
        margin: 0 0 0.25rem;
        font-size: 1.5rem;
      }
      .gallery__header p {
        margin: 0;
        color: var(--fg-muted);
      }
      .gallery__section h2 {
        font-size: 1.1rem;
        margin: 0 0 0.75rem;
      }
      .gallery__grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
        gap: 1rem;
      }
      .gallery__toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        align-items: flex-end;
      }
      .gallery__inline {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.75rem;
      }
      .gallery__btn {
        padding: 0.5rem 0.875rem;
        border-radius: 0.5rem;
        border: 1px solid var(--border);
        background: var(--surface);
        color: var(--fg);
        font: inherit;
        cursor: pointer;
      }
      .gallery__btn:focus-visible {
        outline: 2px solid var(--color-brand);
        outline-offset: 2px;
      }
      .gallery__input {
        padding: 0.5rem 0.625rem;
        border: 1px solid var(--border);
        border-radius: 0.375rem;
        background: var(--surface);
        color: var(--fg);
        font: inherit;
      }
    `
  ]
})
export class ComponentsGallery {
  private readonly notifications = inject(NotificationService);
  private readonly csv = inject(CsvService);

  protected readonly loading = signal(false);
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly selected = signal<string[]>([]);
  protected readonly confirmOpen = signal(false);

  protected readonly filters: FilterField[] = [
    { key: 'department', label: 'Department', type: 'select', options: [
      { value: 'engineering', label: 'Engineering' },
      { value: 'design', label: 'Design' }
    ] },
    { key: 'status', label: 'Status', type: 'select', options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' }
    ] }
  ];

  protected readonly columns: ColumnDefinition[] = [
    { key: 'name', header: 'Name', sortable: true, render: 'avatar' },
    { key: 'department', header: 'Department', sortable: true },
    { key: 'status', header: 'Status', sortable: true, render: 'badge', badgeVariant: 'info' }
  ];

  protected readonly rows = signal<Record<string, unknown>[]>([
    { id: '1', name: 'Jane Doe', department: 'Engineering', status: 'Active' },
    { id: '2', name: 'Sam Smith', department: 'Design', status: 'On Leave' },
    { id: '3', name: 'Lee Wong', department: 'Engineering', status: 'Inactive' }
  ]);

  protected readonly employees = signal<EmployeeRow[]>([
    { id: '1', name: 'Jane Doe', department: 'Engineering', status: 'active', avatar: null },
    { id: '2', name: 'Sam Smith', department: 'Design', status: 'on-leave', avatar: null }
  ]);

  protected onSearch(term: string): void {
    this.notify('Search: ' + term, 'info');
  }

  protected onFilter(filters: Record<string, unknown>): void {
    this.notify('Filters applied', 'info');
  }

  protected onRow(row: Record<string, unknown>): void {
    this.notify('Row: ' + (row['name'] as string), 'info');
  }

  protected onPage(event: { page: number; pageSize: number }): void {
    this.page.set(event.page);
    this.pageSize.set(event.pageSize);
  }

  protected notify(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
    this.notifications[type](message);
  }

  protected onConfirmed(): void {
    this.confirmOpen.set(false);
    this.notify('Confirmed', 'success');
  }

  protected async exportSample(): Promise<void> {
    this.csv.export(
      [
        { id: '1', name: 'Jane Doe', department: 'Engineering' },
        { id: '2', name: 'Sam Smith', department: 'Design' }
      ],
      'employees.csv'
    );
  }
}
