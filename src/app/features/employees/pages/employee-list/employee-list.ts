import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { startWith } from 'rxjs';

import { ProjectState } from '../../../../core/state/project.state';
import { NotificationService } from '../../../../core/services/notification.service';
import { SearchBarComponent } from '../../../../shared/components/search-bar/search-bar';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';
import { SkeletonComponent } from '../../../../shared/components/skeleton/skeleton';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import {
  Employee,
  EmployeeFilters,
  EmployeePageLimit
} from '../../models/employee.model';
import { EmployeeState } from '../../state/employee.state';
import { EmployeeService } from '../../services/employee.service';
import {
  EmployeeTableComponent,
  EmployeeSortChange
} from '../../components/employee-table/employee-table';
import {
  EmployeeFiltersComponent,
  DepartmentOption
} from '../../components/employee-filters/employee-filters';

@Component({
  selector: 'app-employee-list',
  imports: [
    RouterLink,
    SearchBarComponent,
    PaginationComponent,
    EmptyStateComponent,
    SkeletonComponent,
    ConfirmDialogComponent,
    EmployeeTableComponent,
    EmployeeFiltersComponent
  ],
  templateUrl: './employee-list.html',
  styleUrl: './employee-list.css'
})
export class EmployeeListPage {
  private readonly employeeService = inject(EmployeeService);
  private readonly employeeState = inject(EmployeeState);
  private readonly projectState = inject(ProjectState);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private readonly employees = toSignal(this.employeeState.employees$, {
    initialValue: [] as Employee[]
  });
  private readonly filters = toSignal(this.employeeState.filters$, {
    initialValue: this.employeeState.filters
  });
  private readonly pagination = toSignal(this.employeeState.pagination$, {
    initialValue: this.employeeState.pagination
  });
  readonly loading = toSignal(this.employeeState.loading$, { initialValue: false });

  readonly departments = signal<DepartmentOption[]>([]);
  readonly selectedIds = signal<string[]>([]);
  readonly deleteTarget = signal<Employee | null>(null);
  readonly bulkDeleteOpen = signal(false);
  readonly deleting = signal(false);

  readonly departmentNames = computed(() => {
    const map: Record<string, string> = {};
    for (const dept of this.departments()) {
      map[dept.id] = dept.name;
    }
    return map;
  });

  readonly queryResult = computed(() =>
    this.employeeService.filterSortPaginate(
      this.employees(),
      this.filters(),
      this.pagination()
    )
  );

  readonly pagedEmployees = computed(() => this.queryResult().items);
  readonly total = computed(() => this.queryResult().total);
  readonly page = computed(() => this.queryResult().page);
  readonly pageSize = computed(() => this.queryResult().limit);
  readonly currentFilters = computed(() => this.filters());
  readonly currentSortField = computed(() => this.pagination().sort.field);
  readonly currentSortDir = computed(() => this.pagination().sort.dir);
  readonly selectedCount = computed(() => this.selectedIds().length);
  readonly showEmpty = computed(() => !this.loading() && this.total() === 0);
  readonly projectId = computed(() => this.projectState.activeProjectId());
  readonly initialLoad = computed(() => this.loading() && this.employees().length === 0);

  readonly deleteMessage = computed(() => {
    const employee = this.deleteTarget();
    if (!employee) {
      return '';
    }
    return `Delete ${employee.firstName} ${employee.lastName}? This action cannot be undone.`;
  });

  readonly bulkDeleteMessage = computed(
    () =>
      `Delete ${this.selectedCount()} selected employee${this.selectedCount() === 1 ? '' : 's'}? This action cannot be undone.`
  );

  constructor() {
    this.projectState.activeProjectChanged$
      .pipe(startWith(this.projectState.activeProjectId()), takeUntilDestroyed(this.destroyRef))
      .subscribe((projectId) => {
        this.employeeService.reset();
        this.selectedIds.set([]);
        if (projectId) {
          void this.refresh();
        }
      });
  }

  private async refresh(): Promise<void> {
    try {
      await this.employeeService.loadEmployees();
      const depts = await this.employeeService.getDepartments();
      this.departments.set(depts.map((d) => ({ id: d.id, name: d.name })));
    } catch {
      this.notifications.error('Unable to load employees.');
    }
  }

  protected onSearch(term: string): void {
    this.employeeState.setFilters({ search: term });
    this.employeeState.setPagination({ page: 1 });
    this.selectedIds.set([]);
  }

  protected onFilterChange(partial: Partial<EmployeeFilters>): void {
    this.employeeState.setFilters(partial);
    this.employeeState.setPagination({ page: 1 });
    this.selectedIds.set([]);
  }

  protected onSortChange(event: EmployeeSortChange): void {
    this.employeeState.setPagination({
      sort: { field: event.field, dir: event.dir },
      page: 1
    });
  }

  protected onPageChange(event: { page: number; pageSize: number }): void {
    const limit = event.pageSize as EmployeePageLimit;
    this.employeeState.setPagination({
      page: event.page,
      limit: limit === 25 || limit === 50 ? limit : 10
    });
  }

  protected onSelectionChange(ids: string[]): void {
    this.selectedIds.set(ids);
  }

  protected onRowClick(employee: Employee): void {
    const projectId = this.projectId();
    if (!projectId) {
      return;
    }
    this.router.navigate(['/p', projectId, 'employees', employee.id]);
  }

  protected onEdit(employee: Employee): void {
    const projectId = this.projectId();
    if (!projectId) {
      return;
    }
    this.router.navigate(['/p', projectId, 'employees', employee.id, 'edit']);
  }

  protected onDeleteRequest(employee: Employee): void {
    this.deleteTarget.set(employee);
  }

  protected closeDelete(): void {
    this.deleteTarget.set(null);
  }

  protected async confirmDelete(): Promise<void> {
    const employee = this.deleteTarget();
    if (!employee) {
      return;
    }
    this.deleting.set(true);
    try {
      await this.employeeService.delete(employee.id);
      this.selectedIds.update((ids) => ids.filter((id) => id !== employee.id));
      this.deleteTarget.set(null);
      this.notifications.success('Employee deleted.');
    } catch {
      this.notifications.error('Unable to delete employee.');
    } finally {
      this.deleting.set(false);
    }
  }

  protected openBulkDelete(): void {
    if (this.selectedIds().length === 0) {
      return;
    }
    this.bulkDeleteOpen.set(true);
  }

  protected closeBulkDelete(): void {
    this.bulkDeleteOpen.set(false);
  }

  protected async confirmBulkDelete(): Promise<void> {
    const ids = this.selectedIds();
    if (ids.length === 0) {
      return;
    }
    this.deleting.set(true);
    try {
      await this.employeeService.deleteMany(ids);
      this.selectedIds.set([]);
      this.bulkDeleteOpen.set(false);
      this.notifications.success(
        ids.length === 1 ? 'Employee deleted.' : `${ids.length} employees deleted.`
      );
    } catch {
      this.notifications.error('Unable to delete selected employees.');
    } finally {
      this.deleting.set(false);
    }
  }

  protected addEmployeeLink(): string[] {
    const projectId = this.projectId();
    return projectId ? ['/p', projectId, 'employees', 'new'] : ['/projects'];
  }

  protected onEmptyAction(): void {
    const projectId = this.projectId();
    if (projectId) {
      this.router.navigate(['/p', projectId, 'employees', 'new']);
    }
  }
}
