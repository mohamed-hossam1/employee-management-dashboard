import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';
import { ProjectState } from '../../../core/state/project.state';
import { ActivityItem } from '../../../core/models/activity.model';
import { Employee } from '../../../core/models/employee.model';
import { Department } from '../../../core/models/department.model';
import { AttendanceRecord } from '../../../core/models/attendance.model';
import { EmployeeService } from '../../employees/services/employee.service';
import { DepartmentService } from '../../departments/services/department.service';
import { AttendanceService } from '../../attendance/services/attendance.service';
import {
  DashboardChartData,
  DashboardState,
  DashboardStats
} from '../state/dashboard.state';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = inject(ApiService);
  private readonly state = inject(DashboardState);
  private readonly projectState = inject(ProjectState);
  private readonly employeeService = inject(EmployeeService);
  private readonly departmentService = inject(DepartmentService);
  private readonly attendanceService = inject(AttendanceService);

  private requireProjectId(): string {
    const projectId = this.projectState.activeProjectId();
    if (!projectId) {
      throw new Error('No active project selected');
    }
    return projectId;
  }

  async loadDashboard(): Promise<void> {
    const token = this.state.beginLoad();
    const projectId = this.requireProjectId();

    try {
      const [employees, departments, attendance, activity] = await Promise.all([
        this.employeeService.loadEmployees(),
        this.departmentService.loadDepartments(),
        this.attendanceService.loadRecords(),
        this.loadActivity(projectId)
      ]);

      if (!this.state.isCurrentLoad(token)) {
        return;
      }

      const stats = this.computeStats(employees, departments, attendance);
      const recentEmployees = this.computeRecentEmployees(employees);
      const chartData = this.computeChartData(employees, departments, attendance);

      this.state.setStats(stats);
      this.state.setRecentEmployees(recentEmployees);
      this.state.setRecentActivity(activity);
      this.state.setChartData(chartData);
    } finally {
      if (this.state.isCurrentLoad(token)) {
        this.state.setLoading(false);
      }
    }
  }

  private async loadActivity(projectId: string): Promise<ActivityItem[]> {
    const items = await firstValueFrom(
      this.api.get<ActivityItem[]>('activity', { projectId })
    );
    return items
      .filter((item) => item.projectId === projectId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, 12);
  }

  computeStats(
    employees: Employee[],
    departments: Department[],
    attendance: AttendanceRecord[]
  ): DashboardStats {
    const today = this.attendanceService.todayDateString();
    const todayRecords = attendance.filter((r) => r.date === today);
    const presentCount = todayRecords.filter((r) => r.status === 'present').length;
    const lateCount = todayRecords.filter((r) => r.status === 'late').length;
    const checkedIn = new Set(todayRecords.map((r) => r.employeeId));
    const absentCount = employees.filter((e) => !checkedIn.has(e.id)).length;

    return {
      totalEmployees: employees.length,
      totalDepartments: departments.length,
      attendanceToday: presentCount + lateCount,
      presentCount,
      absentCount,
      lateCount
    };
  }

  computeRecentEmployees(employees: Employee[]): Employee[] {
    return [...employees]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5);
  }

  computeChartData(
    employees: Employee[],
    departments: Department[],
    attendance: AttendanceRecord[]
  ): DashboardChartData {
    return {
      weeklyAttendance: this.weeklyAttendanceSeries(employees, attendance),
      departmentDistribution: this.departmentDistribution(employees, departments),
      employeeGrowth: this.employeeGrowthSeries(employees)
    };
  }

  private weeklyAttendanceSeries(
    employees: Employee[],
    attendance: AttendanceRecord[]
  ): { labels: string[]; data: number[] } {
    const labels: string[] = [];
    const data: number[] = [];
    const total = employees.length || 1;
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const day = new Date(today);
      day.setDate(today.getDate() - i);
      const date = this.attendanceService.todayDateString(day);
      const weekday = day.toLocaleDateString(undefined, { weekday: 'short' });
      labels.push(weekday);
      const dayRecords = attendance.filter((r) => r.date === date);
      const presentOrLate = dayRecords.filter(
        (r) => r.status === 'present' || r.status === 'late'
      ).length;
      data.push(Math.round((presentOrLate / total) * 1000) / 10);
    }

    return { labels, data };
  }

  private departmentDistribution(
    employees: Employee[],
    departments: Department[]
  ): { labels: string[]; data: number[] } {
    const nameById = new Map(departments.map((d) => [d.id, d.name]));
    const counts = new Map<string, number>();

    for (const emp of employees) {
      const key = emp.departmentId || 'unassigned';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const labels: string[] = [];
    const data: number[] = [];
    for (const [id, count] of counts) {
      labels.push(id === 'unassigned' ? 'Unassigned' : nameById.get(id) ?? id);
      data.push(count);
    }
    return { labels, data };
  }

  private employeeGrowthSeries(employees: Employee[]): {
    labels: string[];
    data: number[];
  } {
    if (employees.length === 0) {
      return { labels: [], data: [] };
    }

    const byMonth = new Map<string, number>();
    for (const emp of employees) {
      const month = (emp.hireDate || emp.createdAt).slice(0, 7);
      byMonth.set(month, (byMonth.get(month) ?? 0) + 1);
    }

    const months = [...byMonth.keys()].sort();
    // Ensure at least a few points for a readable line
    if (months.length === 1) {
      const only = months[0];
      const [y, m] = only.split('-').map(Number);
      const prev = new Date(y, m - 2, 1);
      const prevKey = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
      months.unshift(prevKey);
      byMonth.set(prevKey, 0);
    }

    let cumulative = 0;
    const labels: string[] = [];
    const data: number[] = [];
    for (const month of months) {
      cumulative += byMonth.get(month) ?? 0;
      labels.push(month);
      data.push(cumulative);
    }
    return { labels, data };
  }

  exportReportRows(): Record<string, unknown>[] {
    const stats = this.state.stats;
    return [
      { metric: 'Total employees', value: stats.totalEmployees },
      { metric: 'Total departments', value: stats.totalDepartments },
      { metric: 'Attendance today', value: stats.attendanceToday },
      { metric: 'Present today', value: stats.presentCount },
      { metric: 'Absent today', value: stats.absentCount },
      { metric: 'Late today', value: stats.lateCount }
    ];
  }

  reset(): void {
    this.state.reset();
  }
}
