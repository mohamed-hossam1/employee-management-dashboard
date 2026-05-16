import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { ActivityItem } from '../../../core/models/activity.model';
import { Employee } from '../../../core/models/employee.model';

export interface DashboardStats {
  totalEmployees: number;
  totalDepartments: number;
  attendanceToday: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
}

export interface DashboardChartData {
  weeklyAttendance: { labels: string[]; data: number[] };
  departmentDistribution: { labels: string[]; data: number[] };
  employeeGrowth: { labels: string[]; data: number[] };
}

export const EMPTY_DASHBOARD_STATS: DashboardStats = {
  totalEmployees: 0,
  totalDepartments: 0,
  attendanceToday: 0,
  presentCount: 0,
  absentCount: 0,
  lateCount: 0
};

export const EMPTY_CHART_DATA: DashboardChartData = {
  weeklyAttendance: { labels: [], data: [] },
  departmentDistribution: { labels: [], data: [] },
  employeeGrowth: { labels: [], data: [] }
};

@Injectable({ providedIn: 'root' })
export class DashboardState {
  private readonly statsSubject = new BehaviorSubject<DashboardStats>({ ...EMPTY_DASHBOARD_STATS });
  private readonly recentEmployeesSubject = new BehaviorSubject<Employee[]>([]);
  private readonly recentActivitySubject = new BehaviorSubject<ActivityItem[]>([]);
  private readonly chartDataSubject = new BehaviorSubject<DashboardChartData>({ ...EMPTY_CHART_DATA });
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  private loadToken = 0;

  readonly stats$ = this.statsSubject.asObservable();
  readonly recentEmployees$ = this.recentEmployeesSubject.asObservable();
  readonly recentActivity$ = this.recentActivitySubject.asObservable();
  readonly chartData$ = this.chartDataSubject.asObservable();
  readonly loading$ = this.loadingSubject.asObservable();

  get stats(): DashboardStats {
    return this.statsSubject.value;
  }

  get recentEmployees(): Employee[] {
    return this.recentEmployeesSubject.value;
  }

  get recentActivity(): ActivityItem[] {
    return this.recentActivitySubject.value;
  }

  get chartData(): DashboardChartData {
    return this.chartDataSubject.value;
  }

  get loading(): boolean {
    return this.loadingSubject.value;
  }

  /** Returns a token used to ignore stale aggregation results after project switch. */
  beginLoad(): number {
    this.loadToken += 1;
    this.loadingSubject.next(true);
    return this.loadToken;
  }

  isCurrentLoad(token: number): boolean {
    return token === this.loadToken;
  }

  setStats(stats: DashboardStats): void {
    this.statsSubject.next(stats);
  }

  setRecentEmployees(employees: Employee[]): void {
    this.recentEmployeesSubject.next(employees);
  }

  setRecentActivity(items: ActivityItem[]): void {
    this.recentActivitySubject.next(items);
  }

  setChartData(data: DashboardChartData): void {
    this.chartDataSubject.next(data);
  }

  setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  reset(): void {
    this.loadToken += 1;
    this.statsSubject.next({ ...EMPTY_DASHBOARD_STATS });
    this.recentEmployeesSubject.next([]);
    this.recentActivitySubject.next([]);
    this.chartDataSubject.next({ ...EMPTY_CHART_DATA });
    this.loadingSubject.next(false);
  }
}
