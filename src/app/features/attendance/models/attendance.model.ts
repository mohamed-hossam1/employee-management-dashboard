import { AttendanceRecord, AttendanceStatus } from '../../../core/models/attendance.model';

export type { AttendanceRecord, AttendanceStatus };

export const ATTENDANCE_STATUSES: readonly AttendanceStatus[] = [
  'present',
  'late',
  'absent'
] as const;

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: 'Present',
  late: 'Late',
  absent: 'Absent'
};

/** Check-ins at or after this local time (HH:mm) are marked late. */
export const LATE_THRESHOLD = '09:00';

export interface AttendanceFilters {
  search: string;
  status: AttendanceStatus | null;
  departmentId: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  page: number;
  pageSize: number;
}

export const DEFAULT_ATTENDANCE_FILTERS: AttendanceFilters = {
  search: '',
  status: null,
  departmentId: null,
  dateFrom: null,
  dateTo: null,
  page: 1,
  pageSize: 10
};

export interface TodayStats {
  date: string;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  totalEmployees: number;
  attendanceRate: number;
}

export interface MonthlyEmployeeReport {
  employeeId: string;
  employeeName: string;
  present: number;
  late: number;
  absent: number;
  attendanceRate: number;
}

export interface MonthlyDayReport {
  date: string;
  present: number;
  late: number;
  absent: number;
  attendanceRate: number;
}

export interface MonthlyReport {
  month: string; // YYYY-MM
  presentCount: number;
  lateCount: number;
  absentCount: number;
  attendanceRate: number;
  byEmployee: MonthlyEmployeeReport[];
  byDay: MonthlyDayReport[];
}

export interface ChartDatasetBundle {
  labels: string[];
  data: number[];
}

export interface AttendanceChartData {
  dailyRate: ChartDatasetBundle;
  lateTrend: ChartDatasetBundle;
  departmentSplit: ChartDatasetBundle;
}

export interface AttendanceRow {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentId: string;
  departmentName: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: AttendanceStatus;
  hoursWorked: number | null;
  notes: string;
}
