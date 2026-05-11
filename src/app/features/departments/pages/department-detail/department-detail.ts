import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { startWith } from 'rxjs';

import { ProjectState } from '../../../../core/state/project.state';
import { NotificationService } from '../../../../core/services/notification.service';
import { AvatarComponent } from '../../../../shared/components/avatar/avatar';
import { BadgeComponent } from '../../../../shared/components/badge/badge';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';
import { LoaderComponent } from '../../../../shared/components/loader/loader';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import {
  ColumnDefinition,
  DataTableComponent
} from '../../../../shared/components/data-table/data-table';
import { Employee } from '../../../employees/models/employee.model';
import { EmployeeService } from '../../../employees/services/employee.service';
import { EmployeeState } from '../../../employees/state/employee.state';
import {
  Department,
  DepartmentCreateInput,
  ManagerOption
} from '../../models/department.model';
import { DepartmentState } from '../../state/department.state';
import { DepartmentService } from '../../services/department.service';
import { DepartmentFormDialogComponent } from '../../components/department-form-dialog/department-form-dialog';

@Component({
  selector: 'app-department-detail',
  imports: [
    RouterLink,
    AvatarComponent,
    BadgeComponent,
    EmptyStateComponent,
    LoaderComponent,
    ConfirmDialogComponent,
    DataTableComponent,
    DepartmentFormDialogComponent
  ],
  templateUrl: './department-detail.html',
  styleUrl: './department-detail.css'
})
export class DepartmentDetailPage {
  private readonly departmentService = inject(DepartmentService);
  private readonly departmentState = inject(DepartmentState);
  private readonly employeeService = inject(EmployeeService);
  private readonly employeeState = inject(EmployeeState);
  private readonly projectState = inject(ProjectState);
  private readonly notifications = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = toSignal(this.departmentState.loading$, { initialValue: true });
  readonly department = toSignal(this.departmentState.selectedDepartment$, {
    initialValue: null as Department | null
  });
  private readonly employees = toSignal(this.employeeState.employees$, {
    initialValue: [] as Employee[]
  });
  private readonly allDepartments = toSignal(this.departmentState.departments$, {
    initialValue: [] as Department[]
  });

  readonly notFound = signal(false);
  readonly dialogOpen = signal(false);
  readonly saving = signal(false);
  readonly deleteOpen = signal(false);
  readonly deleting = signal(false);
  readonly reassignEmployee = signal<Employee | null>(null);
  readonly reassignTargetId = signal('');
  readonly reassigning = signal(false);

  readonly assignedEmployees = computed(() => {
    const dept = this.department();
    if (!dept) {
      return [] as Employee[];
    }
    return this.employees().filter((e) => e.departmentId === dept.id);
  });

  readonly employeeCount = computed(() => this.assignedEmployees().length);

  readonly managerName = computed(() => {
    const managerId = this.department()?.managerId;
    if (!managerId) {
      return 'Unassigned';
    }
    const manager = this.employees().find((e) => e.id === managerId);
    return manager ? `${manager.firstName} ${manager.lastName}` : 'Unknown';
  });

  readonly managerEmployee = computed(() => {
    const managerId = this.department()?.managerId;
    if (!managerId) {
      return null;
    }
    return this.employees().find((e) => e.id === managerId) ?? null;
  });

  readonly managerOptions = computed<ManagerOption[]>(() =>
    this.employees()
      .filter((e) => e.status === 'active' || e.status === 'on-leave')
      .map((e) => ({ id: e.id, name: `${e.firstName} ${e.lastName}` }))
      .sort((a, b) => a.name.localeCompare(b.name))
  );

  readonly existingNames = computed(() => this.allDepartments().map((d) => d.name));

  readonly otherDepartments = computed(() => {
    const currentId = this.department()?.id;
    return this.allDepartments().filter((d) => d.id !== currentId);
  });

  readonly tableRows = computed(() =>
    this.assignedEmployees().map((e) => ({
      id: e.id,
      name: `${e.firstName} ${e.lastName}`,
      email: e.email,
      position: e.position,
      status: e.status,
      avatar: e.avatar
    }))
  );

  readonly columns: ColumnDefinition[] = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'email', header: 'Email', sortable: true },
    { key: 'position', header: 'Position', sortable: true },
    { key: 'status', header: 'Status', render: 'badge', badgeVariant: 'info' }
  ];

  readonly deleteMessage = computed(() => {
    const dept = this.department();
    if (!dept) {
      return '';
    }
    const count = this.employeeCount();
    if (count > 0) {
      return `Delete "${dept.name}"? ${count} assigned employee${count === 1 ? '' : 's'} will be unassigned. Employee records will not be deleted.`;
    }
    return `Delete "${dept.name}"? This action cannot be undone.`;
  });

  readonly projectId = computed(() => this.projectState.activeProjectId());

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('departmentId');
      if (id) {
        void this.load(id);
      }
    });

    this.projectState.activeProjectChanged$
      .pipe(startWith(this.projectState.activeProjectId()), takeUntilDestroyed(this.destroyRef))
      .subscribe((projectId) => {
        if (!projectId) {
          this.departmentService.reset();
          return;
        }
        const id = this.route.snapshot.paramMap.get('departmentId');
        if (id) {
          void this.load(id);
        }
      });
  }

  private async load(id: string): Promise<void> {
    this.notFound.set(false);
    try {
      await Promise.all([
        this.departmentService.loadDepartments(),
        this.employeeService.loadEmployees()
      ]);
      const department = await this.departmentService.getById(id);
      if (!department) {
        this.notFound.set(true);
      }
    } catch {
      this.notFound.set(true);
      this.notifications.error('Unable to load department.');
    }
  }

  protected listLink(): string[] {
    const projectId = this.projectId();
    return projectId ? ['/p', projectId, 'departments'] : ['/projects'];
  }

  protected openEdit(): void {
    this.dialogOpen.set(true);
  }

  protected closeDialog(): void {
    this.dialogOpen.set(false);
  }

  protected async onSave(input: DepartmentCreateInput): Promise<void> {
    const dept = this.department();
    if (!dept) {
      return;
    }
    this.saving.set(true);
    try {
      await this.departmentService.update(dept.id, input);
      this.notifications.success('Department updated.');
      this.closeDialog();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to save department.';
      this.notifications.error(message);
    } finally {
      this.saving.set(false);
    }
  }

  protected openDelete(): void {
    this.deleteOpen.set(true);
  }

  protected closeDelete(): void {
    this.deleteOpen.set(false);
  }

  protected async confirmDelete(): Promise<void> {
    const dept = this.department();
    if (!dept) {
      return;
    }
    this.deleting.set(true);
    try {
      await this.departmentService.delete(dept.id, this.employees());
      await this.employeeService.loadEmployees();
      this.deleteOpen.set(false);
      this.notifications.success('Department deleted.');
      this.router.navigate(this.listLink());
    } catch {
      this.notifications.error('Unable to delete department.');
    } finally {
      this.deleting.set(false);
    }
  }

  protected openReassign(row: Record<string, unknown>): void {
    const id = String(row['id'] ?? '');
    const employee = this.assignedEmployees().find((e) => e.id === id) ?? null;
    this.reassignEmployee.set(employee);
    this.reassignTargetId.set(this.otherDepartments()[0]?.id ?? '');
  }

  protected closeReassign(): void {
    this.reassignEmployee.set(null);
    this.reassignTargetId.set('');
  }

  protected onReassignTargetChange(event: Event): void {
    this.reassignTargetId.set((event.target as HTMLSelectElement).value);
  }

  protected async confirmReassign(): Promise<void> {
    const employee = this.reassignEmployee();
    const targetId = this.reassignTargetId();
    if (!employee || !targetId) {
      return;
    }
    this.reassigning.set(true);
    try {
      await this.departmentService.reassignEmployee(employee, targetId);
      await this.employeeService.loadEmployees();
      this.notifications.success(
        `${employee.firstName} ${employee.lastName} moved to the selected department.`
      );
      this.closeReassign();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to reassign employee.';
      this.notifications.error(message);
    } finally {
      this.reassigning.set(false);
    }
  }

  protected onRowClick(row: Record<string, unknown>): void {
    this.openReassign(row);
  }
}
