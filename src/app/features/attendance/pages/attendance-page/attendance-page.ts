import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { ProjectState } from '../../../../core/state/project.state';
import { NotificationService } from '../../../../core/services/notification.service';
import { SearchBarComponent } from '../../../../shared/components/search-bar/search-bar';
import { FilterPanelComponent, FilterField } from '../../../../shared/components/filter-panel/filter-panel';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';
import { SkeletonComponent } from '../../../../shared/components/skeleton/skeleton';
import { StatsCardComponent } from '../../../../shared/components/stats-card/stats-card';
import { Employee } from '../../../employees/models/employee.model';
import { EmployeeService } from '../../../employees/services/employee.service';
import { EmployeeState } from '../../../employees/state/employee.state';
import {
  AttendanceRecord,
  AttendanceRow,
  AttendanceStatus,
  ATTENDANCE_STATUSES,
  ATTENDANCE_STATUS_LABELS,
  DEFAULT_ATTENDANCE_FILTERS
} from '../../models/attendance.model';
import { AttendanceState } from '../../state/attendance.state';
import { AttendanceService } from '../../services/attendance.service';
import { AttendanceTableComponent } from '../../components/attendance-table/attendance-table';
import {
  CheckInOutComponent,
  EmployeeAttendanceOption
} from '../../components/check-in-out/check-in-out';
import { AttendanceStatsComponent } from '../../components/attendance-stats/attendance-stats';

type ViewMode = 'history' | 'report' | 'stats';

@Component({
  selector: 'app-attendance-page',
  imports: [
    SearchBarComponent,
    FilterPanelComponent,
    PaginationComponent,
    EmptyStateComponent,
    SkeletonComponent,
    StatsCardComponent,
    AttendanceTableComponent,
    CheckInOutComponent,
    AttendanceStatsComponent
  ],
  templateUrl: './attendance-page.html',
  styleUrl: './attendance-page.css',
  providers: [provideCharts(withDefaultRegisterables())]
})
export class AttendancePage {
  private readonly attendanceService = inject(AttendanceService);
  private readonly attendanceState = inject(AttendanceState);
  private readonly employeeService = inject(EmployeeService);
  private readonly employeeState = inject(EmployeeState);
  private readonly projectState = inject(ProjectState);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly records = toSignal(this.attendanceState.records$, {
    initialValue: [] as AttendanceRecord[]
  });
  private readonly filters = toSignal(this.attendanceState.filters$, {
    initialValue: { ...DEFAULT_ATTENDANCE_FILTERS }
  });
  readonly loading = toSignal(this.attendanceState.loading$, { initialValue: false });
  readonly todayStats = toSignal(this.attendanceState.todayStats$, {
    initialValue: this.attendanceState.todayStats
  });
  private readonly employees = toSignal(this.employeeState.employees$, {
    initialValue: [] as Employee[]
  });

  readonly checkInBusy = signal(false);
  readonly viewMode = signal<ViewMode>('history');
  readonly reportMonth = signal(this.currentMonth());
  readonly departments = signal<{ id: string; name: string }[]>([]);

  readonly departmentNames = computed(() => {
    const map: Record<string, string> = {};
    for (const d of this.departments()) {
      map[d.id] = d.name;
    }
    return map;
  });

  readonly employeeMap = computed(() => {
    const map = new Map<string, Employee>();
    for (const e of this.employees()) {
      map.set(e.id, e);
    }
    return map;
  });

  readonly checkInOptions = computed<EmployeeAttendanceOption[]>(() =>
    this.employees()
      .filter((e) => e.status !== 'inactive')
      .map((employee) => ({
        employee,
        todayRecord: this.attendanceService.findTodayRecord(employee.id, this.records())
      }))
      .sort((a, b) =>
        `${a.employee.firstName} ${a.employee.lastName}`.localeCompare(
          `${b.employee.firstName} ${b.employee.lastName}`
        )
      )
  );

  readonly filteredRecords = computed(() =>
    this.attendanceService.filterRecords(this.records(), this.employees(), this.filters())
  );

  readonly paged = computed(() => {
    const f = this.filters();
    return this.attendanceService.paginate(this.filteredRecords(), f.page, f.pageSize);
  });

  readonly tableRows = computed<AttendanceRow[]>(() =>
    this.paged().items.map((r) => {
      const emp = this.employeeMap().get(r.employeeId);
      return {
        id: r.id,
        employeeId: r.employeeId,
        employeeName: emp ? `${emp.firstName} ${emp.lastName}` : r.employeeId,
        departmentId: emp?.departmentId ?? '',
        departmentName: emp
          ? this.departmentNames()[emp.departmentId] ?? '—'
          : '—',
        date: r.date,
        checkIn: r.checkIn,
        checkOut: r.checkOut,
        status: r.status,
        hoursWorked: r.hoursWorked,
        notes: r.notes
      };
    })
  );

  readonly total = computed(() => this.paged().total);
  readonly page = computed(() => this.paged().page);
  readonly pageSize = computed(() => this.filters().pageSize);
  readonly showEmpty = computed(() => !this.loading() && this.total() === 0);
  readonly initialLoad = computed(() => this.loading() && this.records().length === 0);

  readonly monthlyReport = computed(() =>
    this.attendanceService.buildMonthlyReport(
      this.reportMonth(),
      this.employees(),
      this.records()
    )
  );

  readonly chartData = computed(() =>
    this.attendanceService.buildChartData(
      this.reportMonth(),
      this.employees(),
      this.departmentNames(),
      this.records()
    )
  );

  readonly monthLabel = computed(() => {
    const [y, m] = this.reportMonth().split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric'
    });
  });

  readonly filterFields = computed<FilterField[]>(() => [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: ATTENDANCE_STATUSES.filter((s) => s !== 'absent').map((s) => ({
        value: s,
        label: ATTENDANCE_STATUS_LABELS[s]
      }))
    },
    {
      key: 'departmentId',
      label: 'Department',
      type: 'select',
      options: this.departments().map((d) => ({ value: d.id, label: d.name }))
    },
    {
      key: 'date',
      label: 'Date range',
      type: 'daterange'
    }
  ]);

  constructor() {
    this.projectState.activeProjectChanged$
      .pipe(startWith(this.projectState.activeProjectId()), takeUntilDestroyed(this.destroyRef))
      .subscribe((projectId) => {
        this.attendanceService.reset();
        if (projectId) {
          void this.refresh();
        }
      });
  }

  private currentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private async refresh(): Promise<void> {
    try {
      await Promise.all([
        this.attendanceService.loadRecords(),
        this.employeeService.loadEmployees()
      ]);
      const depts = await this.employeeService.getDepartments();
      this.departments.set(depts.map((d) => ({ id: d.id, name: d.name })));
      this.attendanceService.computeTodayStats(this.employeeState.employees);
    } catch {
      this.notifications.error('Unable to load attendance.');
    }
  }

  protected setView(mode: ViewMode): void {
    this.viewMode.set(mode);
  }

  protected onSearch(term: string): void {
    this.attendanceState.setFilters({ search: term, page: 1 });
  }

  protected onFilterChange(values: Record<string, unknown>): void {
    const status = (values['status'] as AttendanceStatus | undefined) ?? null;
    const departmentId = (values['departmentId'] as string | undefined) || null;
    const dateFrom = (values['dateFrom'] as string | undefined) || null;
    const dateTo = (values['dateTo'] as string | undefined) || null;
    this.attendanceState.setFilters({
      status: status && status !== 'absent' ? status : null,
      departmentId,
      dateFrom,
      dateTo,
      page: 1
    });
  }

  protected onPageChange(event: { page: number; pageSize: number }): void {
    this.attendanceState.setFilters({
      page: event.page,
      pageSize: event.pageSize
    });
  }

  protected onMonthChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (value) {
      this.reportMonth.set(value);
    }
  }

  protected async onCheckIn(employeeId: string): Promise<void> {
    this.checkInBusy.set(true);
    try {
      const record = await this.attendanceService.checkIn(employeeId);
      this.attendanceService.computeTodayStats(this.employeeState.employees);
      this.notifications.success(
        record.status === 'late' ? 'Checked in (late).' : 'Checked in successfully.'
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to check in.';
      this.notifications.error(message);
    } finally {
      this.checkInBusy.set(false);
    }
  }

  protected async onCheckOut(employeeId: string): Promise<void> {
    this.checkInBusy.set(true);
    try {
      const record = await this.attendanceService.checkOut(employeeId);
      this.attendanceService.computeTodayStats(this.employeeState.employees);
      this.notifications.success(
        `Checked out (${record.hoursWorked ?? 0} hours worked).`
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to check out.';
      this.notifications.error(message);
    } finally {
      this.checkInBusy.set(false);
    }
  }
}
