import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { startWith } from 'rxjs';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { ProjectState } from '../../../../core/state/project.state';
import { NotificationService } from '../../../../core/services/notification.service';
import { CsvService } from '../../../../core/services/csv.service';
import { SkeletonComponent } from '../../../../shared/components/skeleton/skeleton';
import { Employee } from '../../../employees/models/employee.model';
import { DepartmentCreateInput } from '../../../departments/models/department.model';
import { DepartmentService } from '../../../departments/services/department.service';
import { DepartmentFormDialogComponent } from '../../../departments/components/department-form-dialog/department-form-dialog';
import { EmployeeService } from '../../../employees/services/employee.service';
import {
  DashboardChartData,
  DashboardState,
  DashboardStats,
  EMPTY_CHART_DATA,
  EMPTY_DASHBOARD_STATS
} from '../../state/dashboard.state';
import { DashboardService } from '../../services/dashboard.service';
import { StatsWidgetComponent } from '../../components/stats-widget/stats-widget';
import { RecentEmployeesComponent } from '../../components/recent-employees/recent-employees';
import { ActivityFeedComponent } from '../../components/activity-feed/activity-feed';
import { AttendanceChartComponent } from '../../components/attendance-chart/attendance-chart';
import { ActivityItem } from '../../../../core/models/activity.model';

@Component({
  selector: 'app-dashboard-page',
  imports: [
    SkeletonComponent,
    StatsWidgetComponent,
    RecentEmployeesComponent,
    ActivityFeedComponent,
    AttendanceChartComponent,
    DepartmentFormDialogComponent
  ],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.css',
  providers: [provideCharts(withDefaultRegisterables())]
})
export class DashboardPage {
  private readonly dashboardService = inject(DashboardService);
  private readonly dashboardState = inject(DashboardState);
  private readonly departmentService = inject(DepartmentService);
  private readonly employeeService = inject(EmployeeService);
  private readonly projectState = inject(ProjectState);
  private readonly notifications = inject(NotificationService);
  private readonly csv = inject(CsvService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = toSignal(this.dashboardState.loading$, { initialValue: true });
  readonly stats = toSignal(this.dashboardState.stats$, {
    initialValue: { ...EMPTY_DASHBOARD_STATS } as DashboardStats
  });
  readonly recentEmployees = toSignal(this.dashboardState.recentEmployees$, {
    initialValue: [] as Employee[]
  });
  readonly recentActivity = toSignal(this.dashboardState.recentActivity$, {
    initialValue: [] as ActivityItem[]
  });
  readonly chartData = toSignal(this.dashboardState.chartData$, {
    initialValue: { ...EMPTY_CHART_DATA } as DashboardChartData
  });

  readonly departmentNames = signal<Record<string, string>>({});
  readonly managerOptions = signal<{ id: string; name: string }[]>([]);
  readonly existingDeptNames = signal<string[]>([]);
  readonly departmentDialogOpen = signal(false);
  readonly savingDepartment = signal(false);

  readonly projectId = computed(() => this.projectState.activeProjectId());
  readonly projectName = computed(
    () => this.projectState.activeProject()?.name ?? 'Project'
  );

  constructor() {
    this.projectState.activeProjectChanged$
      .pipe(startWith(this.projectState.activeProjectId()), takeUntilDestroyed(this.destroyRef))
      .subscribe((projectId) => {
        this.dashboardService.reset();
        if (projectId) {
          void this.refresh();
        }
      });
  }

  private async refresh(): Promise<void> {
    try {
      await this.dashboardService.loadDashboard();
      const depts = await this.employeeService.getDepartments();
      const names: Record<string, string> = {};
      for (const d of depts) {
        names[d.id] = d.name;
      }
      this.departmentNames.set(names);
      this.existingDeptNames.set(depts.map((d) => d.name));

      const allEmployees = await this.employeeService.loadEmployees();
      this.managerOptions.set(
        allEmployees
          .filter((e) => e.status === 'active' || e.status === 'on-leave')
          .map((e) => ({ id: e.id, name: `${e.firstName} ${e.lastName}` }))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
    } catch {
      this.notifications.error('Unable to load dashboard.');
    }
  }

  protected addEmployee(): void {
    const projectId = this.projectId();
    if (!projectId) {
      return;
    }
    this.router.navigate(['/p', projectId, 'employees', 'new']);
  }

  protected recordAttendance(): void {
    const projectId = this.projectId();
    if (!projectId) {
      return;
    }
    this.router.navigate(['/p', projectId, 'attendance']);
  }

  protected openNewDepartment(): void {
    this.departmentDialogOpen.set(true);
  }

  protected closeDepartmentDialog(): void {
    this.departmentDialogOpen.set(false);
  }

  protected async onSaveDepartment(input: DepartmentCreateInput): Promise<void> {
    this.savingDepartment.set(true);
    try {
      await this.departmentService.create(input);
      this.notifications.success('Department created.');
      this.departmentDialogOpen.set(false);
      await this.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to create department.';
      this.notifications.error(message);
    } finally {
      this.savingDepartment.set(false);
    }
  }

  protected exportReport(): void {
    const rows = this.dashboardService.exportReportRows();
    if (rows.length === 0) {
      this.notifications.warning('Nothing to export yet.');
      return;
    }
    const project = this.projectName().toLowerCase().replace(/\s+/g, '-');
    this.csv.export(rows, `${project}-dashboard-report.csv`);
    this.notifications.success('Dashboard report exported.');
  }
}
