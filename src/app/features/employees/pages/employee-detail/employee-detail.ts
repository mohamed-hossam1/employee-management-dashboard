import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';

import { ProjectState } from '../../../../core/state/project.state';
import { NotificationService } from '../../../../core/services/notification.service';
import { AvatarComponent } from '../../../../shared/components/avatar/avatar';
import { BadgeComponent, BadgeVariant } from '../../../../shared/components/badge/badge';
import { LoaderComponent } from '../../../../shared/components/loader/loader';
import {
  EMPLOYEE_STATUS_LABELS,
  Employee,
  EmployeeStatus
} from '../../models/employee.model';
import { EmployeeState } from '../../state/employee.state';
import { EmployeeService } from '../../services/employee.service';

@Component({
  selector: 'app-employee-detail',
  imports: [RouterLink, AvatarComponent, BadgeComponent, LoaderComponent, CurrencyPipe, DatePipe],
  templateUrl: './employee-detail.html',
  styleUrl: './employee-detail.css'
})
export class EmployeeDetailPage {
  private readonly employeeService = inject(EmployeeService);
  private readonly employeeState = inject(EmployeeState);
  private readonly projectState = inject(ProjectState);
  private readonly notifications = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = toSignal(this.employeeState.loading$, { initialValue: true });
  readonly employee = toSignal(this.employeeState.selectedEmployee$, {
    initialValue: null as Employee | null
  });

  readonly departmentName = signal('—');
  readonly notFound = signal(false);

  readonly fullName = computed(() => {
    const e = this.employee();
    return e ? `${e.firstName} ${e.lastName}` : '';
  });

  readonly statusLabel = computed(() => {
    const e = this.employee();
    return e ? EMPLOYEE_STATUS_LABELS[e.status] : '';
  });

  readonly statusVariant = computed<BadgeVariant>(() => {
    const status = this.employee()?.status;
    return this.variantFor(status);
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('employeeId');
      if (id) {
        void this.load(id);
      }
    });
  }

  private async load(id: string): Promise<void> {
    this.notFound.set(false);
    try {
      const employee = await this.employeeService.getById(id);
      if (!employee) {
        this.notFound.set(true);
        return;
      }
      const depts = await this.employeeService.getDepartments();
      this.departmentName.set(
        depts.find((d) => d.id === employee.departmentId)?.name ?? '—'
      );
    } catch {
      this.notFound.set(true);
      this.notifications.error('Unable to load employee.');
    }
  }

  protected listLink(): string[] {
    const projectId = this.projectState.activeProjectId();
    return projectId ? ['/p', projectId, 'employees'] : ['/projects'];
  }

  protected editLink(): string[] {
    const projectId = this.projectState.activeProjectId();
    const id = this.employee()?.id;
    return projectId && id
      ? ['/p', projectId, 'employees', id, 'edit']
      : this.listLink();
  }

  protected goBack(): void {
    this.router.navigate(this.listLink());
  }

  private variantFor(status: EmployeeStatus | undefined): BadgeVariant {
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
}
