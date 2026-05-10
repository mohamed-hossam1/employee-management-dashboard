import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { startWith } from 'rxjs';

import { ProjectState } from '../../../../core/state/project.state';
import { NotificationService } from '../../../../core/services/notification.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';
import { SkeletonComponent } from '../../../../shared/components/skeleton/skeleton';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { Employee } from '../../../employees/models/employee.model';
import { EmployeeService } from '../../../employees/services/employee.service';
import { EmployeeState } from '../../../employees/state/employee.state';
import {
  Department,
  DepartmentCreateInput,
  DepartmentWithCount,
  ManagerOption
} from '../../models/department.model';
import { DepartmentState } from '../../state/department.state';
import { DepartmentService } from '../../services/department.service';
import { DepartmentCardComponent } from '../../components/department-card/department-card';
import { DepartmentFormDialogComponent } from '../../components/department-form-dialog/department-form-dialog';

@Component({
  selector: 'app-department-list',
  imports: [
    EmptyStateComponent,
    SkeletonComponent,
    ConfirmDialogComponent,
    DepartmentCardComponent,
    DepartmentFormDialogComponent
  ],
  templateUrl: './department-list.html',
  styleUrl: './department-list.css'
})
export class DepartmentListPage {
  private readonly departmentService = inject(DepartmentService);
  private readonly departmentState = inject(DepartmentState);
  private readonly employeeService = inject(EmployeeService);
  private readonly employeeState = inject(EmployeeState);
  private readonly projectState = inject(ProjectState);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private readonly departments = toSignal(this.departmentState.departments$, {
    initialValue: [] as Department[]
  });
  private readonly employees = toSignal(this.employeeState.employees$, {
    initialValue: [] as Employee[]
  });
  readonly loading = toSignal(this.departmentState.loading$, { initialValue: false });

  readonly dialogOpen = signal(false);
  readonly editing = signal<Department | null>(null);
  readonly saving = signal(false);
  readonly deleteTarget = signal<DepartmentWithCount | null>(null);
  readonly deleting = signal(false);

  readonly departmentsWithCounts = computed(() =>
    this.departmentService.withCounts(this.departments(), this.employees())
  );

  readonly managerNames = computed(() => {
    const map: Record<string, string> = {};
    for (const e of this.employees()) {
      map[e.id] = `${e.firstName} ${e.lastName}`;
    }
    return map;
  });

  readonly managerOptions = computed<ManagerOption[]>(() =>
    this.employees()
      .filter((e) => e.status === 'active' || e.status === 'on-leave')
      .map((e) => ({ id: e.id, name: `${e.firstName} ${e.lastName}` }))
      .sort((a, b) => a.name.localeCompare(b.name))
  );

  readonly existingNames = computed(() => this.departments().map((d) => d.name));

  readonly showEmpty = computed(
    () => !this.loading() && this.departmentsWithCounts().length === 0
  );
  readonly initialLoad = computed(
    () => this.loading() && this.departments().length === 0
  );
  readonly projectId = computed(() => this.projectState.activeProjectId());

  readonly deleteMessage = computed(() => {
    const dept = this.deleteTarget();
    if (!dept) {
      return '';
    }
    if (dept.employeeCount > 0) {
      return `Delete "${dept.name}"? ${dept.employeeCount} assigned employee${dept.employeeCount === 1 ? '' : 's'} will be unassigned. Employee records will not be deleted.`;
    }
    return `Delete "${dept.name}"? This action cannot be undone.`;
  });

  constructor() {
    this.projectState.activeProjectChanged$
      .pipe(startWith(this.projectState.activeProjectId()), takeUntilDestroyed(this.destroyRef))
      .subscribe((projectId) => {
        this.departmentService.reset();
        if (projectId) {
          void this.refresh();
        }
      });
  }

  private async refresh(): Promise<void> {
    try {
      await Promise.all([
        this.departmentService.loadDepartments(),
        this.employeeService.loadEmployees()
      ]);
    } catch {
      this.notifications.error('Unable to load departments.');
    }
  }

  protected managerName(managerId: string | null): string {
    if (!managerId) {
      return 'Unassigned';
    }
    return this.managerNames()[managerId] ?? 'Unknown';
  }

  protected openCreate(): void {
    this.editing.set(null);
    this.dialogOpen.set(true);
  }

  protected openEdit(department: Department): void {
    this.editing.set(department);
    this.dialogOpen.set(true);
  }

  protected closeDialog(): void {
    this.dialogOpen.set(false);
    this.editing.set(null);
  }

  protected async onSave(input: DepartmentCreateInput): Promise<void> {
    this.saving.set(true);
    try {
      const editing = this.editing();
      if (editing) {
        await this.departmentService.update(editing.id, input);
        this.notifications.success('Department updated.');
      } else {
        await this.departmentService.create(input);
        this.notifications.success('Department created.');
      }
      this.closeDialog();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to save department.';
      this.notifications.error(message);
    } finally {
      this.saving.set(false);
    }
  }

  protected openDepartment(department: Department): void {
    const projectId = this.projectId();
    if (!projectId) {
      return;
    }
    this.router.navigate(['/p', projectId, 'departments', department.id]);
  }

  protected requestDelete(department: DepartmentWithCount): void {
    this.deleteTarget.set(department);
  }

  protected closeDelete(): void {
    this.deleteTarget.set(null);
  }

  protected async confirmDelete(): Promise<void> {
    const department = this.deleteTarget();
    if (!department) {
      return;
    }
    this.deleting.set(true);
    try {
      await this.departmentService.delete(department.id, this.employees());
      await this.employeeService.loadEmployees();
      this.deleteTarget.set(null);
      this.notifications.success('Department deleted.');
    } catch {
      this.notifications.error('Unable to delete department.');
    } finally {
      this.deleting.set(false);
    }
  }
}
