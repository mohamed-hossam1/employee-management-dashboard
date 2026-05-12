import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';
import { ProjectState } from '../../../core/state/project.state';
import { Employee } from '../../../core/models/employee.model';
import {
  AttendanceChartData,
  AttendanceFilters,
  AttendanceRecord,
  AttendanceStatus,
  LATE_THRESHOLD,
  MonthlyDayReport,
  MonthlyEmployeeReport,
  MonthlyReport,
  TodayStats
} from '../models/attendance.model';
import { AttendanceState } from '../state/attendance.state';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private readonly api = inject(ApiService);
  private readonly state = inject(AttendanceState);
  private readonly projectState = inject(ProjectState);

  private requireProjectId(): string {
    const projectId = this.projectState.activeProjectId();
    if (!projectId) {
      throw new Error('No active project selected');
    }
    return projectId;
  }

  todayDateString(date = new Date()): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  async loadRecords(): Promise<AttendanceRecord[]> {
    const projectId = this.requireProjectId();
    this.state.setLoading(true);
    try {
      const records = await firstValueFrom(
        this.api.get<AttendanceRecord[]>('attendance', { projectId })
      );
      const scoped = records.filter((r) => r.projectId === projectId);
      this.state.setRecords(scoped);
      return scoped;
    } finally {
      this.state.setLoading(false);
    }
  }

  findTodayRecord(employeeId: string, records?: AttendanceRecord[]): AttendanceRecord | undefined {
    const today = this.todayDateString();
    const source = records ?? this.state.records;
    return source.find((r) => r.employeeId === employeeId && r.date === today);
  }

  /**
   * Check an employee in for today. Blocks duplicate same-day check-in.
   * Status is present before LATE_THRESHOLD local time, otherwise late.
   */
  async checkIn(employeeId: string, notes = ''): Promise<AttendanceRecord> {
    const projectId = this.requireProjectId();
    const today = this.todayDateString();
    const existing = this.findTodayRecord(employeeId);
    if (existing) {
      throw new Error('Employee is already checked in for today.');
    }

    const now = new Date();
    const status = this.resolveCheckInStatus(now);
    const created = await firstValueFrom(
      this.api.post<AttendanceRecord>('attendance', {
        projectId,
        employeeId,
        date: today,
        checkIn: now.toISOString(),
        checkOut: null,
        status,
        hoursWorked: null,
        notes
      })
    );
    this.state.setRecords([...this.state.records, created]);
    return created;
  }

  async checkOut(employeeId: string): Promise<AttendanceRecord> {
    const existing = this.findTodayRecord(employeeId);
    if (!existing) {
      throw new Error('Employee has not checked in today.');
    }
    if (existing.checkOut) {
      throw new Error('Employee is already checked out for today.');
    }
    if (!existing.checkIn) {
      throw new Error('Check-in timestamp is missing.');
    }

    const now = new Date();
    const checkInTime = new Date(existing.checkIn);
    if (now.getTime() < checkInTime.getTime()) {
      throw new Error('Check-out cannot be before check-in.');
    }
    const hoursWorked = this.computeHours(existing.checkIn, now.toISOString());
    const updated = await firstValueFrom(
      this.api.put<AttendanceRecord>(`attendance/${existing.id}`, {
        ...existing,
        checkOut: now.toISOString(),
        hoursWorked,
        updatedAt: now.toISOString()
      })
    );
    this.state.setRecords(
      this.state.records.map((r) => (r.id === existing.id ? updated : r))
    );
    return updated;
  }

  resolveCheckInStatus(when: Date): Exclude<AttendanceStatus, 'absent'> {
    const [thresholdHour, thresholdMinute] = LATE_THRESHOLD.split(':').map(Number);
    const minutes = when.getHours() * 60 + when.getMinutes();
    const thresholdMinutes = thresholdHour * 60 + thresholdMinute;
    return minutes >= thresholdMinutes ? 'late' : 'present';
  }

  computeHours(checkInIso: string, checkOutIso: string): number {
    const start = new Date(checkInIso).getTime();
    const end = new Date(checkOutIso).getTime();
    const hours = (end - start) / (1000 * 60 * 60);
    return Math.round(hours * 100) / 100;
  }

  computeTodayStats(employees: Employee[], records?: AttendanceRecord[]): TodayStats {
    const today = this.todayDateString();
    const projectId = this.projectState.activeProjectId();
    const projectEmployees = employees.filter(
      (e) => !projectId || e.projectId === projectId
    );
    const todayRecords = (records ?? this.state.records).filter((r) => r.date === today);
    const presentCount = todayRecords.filter((r) => r.status === 'present').length;
    const lateCount = todayRecords.filter((r) => r.status === 'late').length;
    const checkedInIds = new Set(todayRecords.map((r) => r.employeeId));
    const absentCount = projectEmployees.filter((e) => !checkedInIds.has(e.id)).length;
    const totalEmployees = projectEmployees.length;
    const attendanceRate =
      totalEmployees === 0 ? 0 : Math.round(((presentCount + lateCount) / totalEmployees) * 1000) / 10;

    const stats: TodayStats = {
      date: today,
      presentCount,
      lateCount,
      absentCount,
      totalEmployees,
      attendanceRate
    };
    this.state.setTodayStats(stats);
    return stats;
  }

  filterRecords(
    records: AttendanceRecord[],
    employees: Employee[],
    filters: AttendanceFilters
  ): AttendanceRecord[] {
    const employeeMap = new Map(employees.map((e) => [e.id, e]));
    let result = [...records];

    if (filters.dateFrom) {
      result = result.filter((r) => r.date >= filters.dateFrom!);
    }
    if (filters.dateTo) {
      result = result.filter((r) => r.date <= filters.dateTo!);
    }
    if (filters.status && filters.status !== 'absent') {
      result = result.filter((r) => r.status === filters.status);
    }
    if (filters.departmentId) {
      result = result.filter((r) => {
        const emp = employeeMap.get(r.employeeId);
        return emp?.departmentId === filters.departmentId;
      });
    }
    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      result = result.filter((r) => {
        const emp = employeeMap.get(r.employeeId);
        if (!emp) {
          return false;
        }
        return `${emp.firstName} ${emp.lastName} ${emp.email}`
          .toLowerCase()
          .includes(q);
      });
    }

    result.sort((a, b) => {
      if (a.date === b.date) {
        return (b.checkIn ?? '').localeCompare(a.checkIn ?? '');
      }
      return b.date.localeCompare(a.date);
    });

    return result;
  }

  paginate<T>(items: T[], page: number, pageSize: number): { items: T[]; total: number; page: number } {
    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * pageSize;
    return { items: items.slice(start, start + pageSize), total, page: safePage };
  }

  buildMonthlyReport(
    month: string,
    employees: Employee[],
    records?: AttendanceRecord[]
  ): MonthlyReport {
    const projectId = this.projectState.activeProjectId();
    const projectEmployees = employees.filter(
      (e) => !projectId || e.projectId === projectId
    );
    const [yearStr, monthStr] = month.split('-');
    const year = Number(yearStr);
    const monthIndex = Number(monthStr) - 1;
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const today = this.todayDateString();
    const allRecords = records ?? this.state.records;
    const monthRecords = allRecords.filter((r) => r.date.startsWith(month));

    const byDay: MonthlyDayReport[] = [];
    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${month}-${String(day).padStart(2, '0')}`;
      if (date > today) {
        continue;
      }
      const dayRecords = monthRecords.filter((r) => r.date === date);
      const present = dayRecords.filter((r) => r.status === 'present').length;
      const late = dayRecords.filter((r) => r.status === 'late').length;
      const checked = new Set(dayRecords.map((r) => r.employeeId));
      const absent = projectEmployees.filter((e) => !checked.has(e.id)).length;
      presentCount += present;
      lateCount += late;
      absentCount += absent;
      const total = projectEmployees.length;
      byDay.push({
        date,
        present,
        late,
        absent,
        attendanceRate:
          total === 0 ? 0 : Math.round(((present + late) / total) * 1000) / 10
      });
    }

    const byEmployee: MonthlyEmployeeReport[] = projectEmployees.map((emp) => {
      const empRecords = monthRecords.filter((r) => r.employeeId === emp.id);
      const present = empRecords.filter((r) => r.status === 'present').length;
      const late = empRecords.filter((r) => r.status === 'late').length;
      const workedDays = byDay.length;
      const absent = Math.max(0, workedDays - present - late);
      const attendanceRate =
        workedDays === 0
          ? 0
          : Math.round(((present + late) / workedDays) * 1000) / 10;
      return {
        employeeId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        present,
        late,
        absent,
        attendanceRate
      };
    });

    const totalSlots = presentCount + lateCount + absentCount;
    const attendanceRate =
      totalSlots === 0
        ? 0
        : Math.round(((presentCount + lateCount) / totalSlots) * 1000) / 10;

    return {
      month,
      presentCount,
      lateCount,
      absentCount,
      attendanceRate,
      byEmployee,
      byDay
    };
  }

  buildChartData(
    month: string,
    employees: Employee[],
    departmentNames: Record<string, string>,
    records?: AttendanceRecord[]
  ): AttendanceChartData {
    const report = this.buildMonthlyReport(month, employees, records);
    const dailyRate = {
      labels: report.byDay.map((d) => d.date.slice(8)),
      data: report.byDay.map((d) => d.attendanceRate)
    };
    const lateTrend = {
      labels: report.byDay.map((d) => d.date.slice(8)),
      data: report.byDay.map((d) => d.late)
    };

    const projectId = this.projectState.activeProjectId();
    const projectEmployees = employees.filter(
      (e) => !projectId || e.projectId === projectId
    );
    const monthRecords = (records ?? this.state.records).filter((r) =>
      r.date.startsWith(month)
    );
    const deptCounts = new Map<string, number>();
    for (const record of monthRecords) {
      const emp = projectEmployees.find((e) => e.id === record.employeeId);
      const key = emp?.departmentId || 'unassigned';
      deptCounts.set(key, (deptCounts.get(key) ?? 0) + 1);
    }
    const departmentSplit = {
      labels: [...deptCounts.keys()].map((id) =>
        id === 'unassigned' ? 'Unassigned' : departmentNames[id] ?? id
      ),
      data: [...deptCounts.values()]
    };

    return { dailyRate, lateTrend, departmentSplit };
  }

  reset(): void {
    this.state.reset();
  }
}
