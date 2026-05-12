import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import {
  AttendanceFilters,
  AttendanceRecord,
  DEFAULT_ATTENDANCE_FILTERS,
  TodayStats
} from '../models/attendance.model';

const EMPTY_STATS: TodayStats = {
  date: '',
  presentCount: 0,
  lateCount: 0,
  absentCount: 0,
  totalEmployees: 0,
  attendanceRate: 0
};

@Injectable({ providedIn: 'root' })
export class AttendanceState {
  private readonly recordsSubject = new BehaviorSubject<AttendanceRecord[]>([]);
  private readonly todayStatsSubject = new BehaviorSubject<TodayStats>({ ...EMPTY_STATS });
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  private readonly filtersSubject = new BehaviorSubject<AttendanceFilters>({
    ...DEFAULT_ATTENDANCE_FILTERS
  });

  readonly records$ = this.recordsSubject.asObservable();
  readonly todayStats$ = this.todayStatsSubject.asObservable();
  readonly loading$ = this.loadingSubject.asObservable();
  readonly filters$ = this.filtersSubject.asObservable();

  get records(): AttendanceRecord[] {
    return this.recordsSubject.value;
  }

  get todayStats(): TodayStats {
    return this.todayStatsSubject.value;
  }

  get loading(): boolean {
    return this.loadingSubject.value;
  }

  get filters(): AttendanceFilters {
    return this.filtersSubject.value;
  }

  setRecords(records: AttendanceRecord[]): void {
    this.recordsSubject.next(records);
  }

  setTodayStats(stats: TodayStats): void {
    this.todayStatsSubject.next(stats);
  }

  setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  setFilters(filters: Partial<AttendanceFilters>): void {
    this.filtersSubject.next({ ...this.filtersSubject.value, ...filters });
  }

  reset(): void {
    this.recordsSubject.next([]);
    this.todayStatsSubject.next({ ...EMPTY_STATS });
    this.loadingSubject.next(false);
    this.filtersSubject.next({ ...DEFAULT_ATTENDANCE_FILTERS });
  }
}
