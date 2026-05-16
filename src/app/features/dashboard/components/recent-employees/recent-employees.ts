import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AvatarComponent } from '../../../../shared/components/avatar/avatar';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';
import { Employee } from '../../../employees/models/employee.model';

@Component({
  selector: 'app-recent-employees',
  imports: [AvatarComponent, EmptyStateComponent, RouterLink],
  templateUrl: './recent-employees.html',
  styleUrl: './recent-employees.css'
})
export class RecentEmployeesComponent {
  readonly employees = input.required<Employee[]>();
  readonly departmentNames = input<Record<string, string>>({});
  readonly projectId = input<string | null>(null);

  protected fullName(employee: Employee): string {
    return `${employee.firstName} ${employee.lastName}`;
  }

  protected departmentName(departmentId: string): string {
    return this.departmentNames()[departmentId] ?? '—';
  }

  protected employeeLink(employee: Employee): string[] {
    const projectId = this.projectId();
    return projectId
      ? ['/p', projectId, 'employees', employee.id]
      : ['/projects'];
  }
}
