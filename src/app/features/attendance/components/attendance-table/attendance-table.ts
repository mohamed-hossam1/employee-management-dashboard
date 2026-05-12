import { Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';

import { BadgeComponent, BadgeVariant } from '../../../../shared/components/badge/badge';
import { LoaderComponent } from '../../../../shared/components/loader/loader';
import {
  AttendanceRow,
  AttendanceStatus,
  ATTENDANCE_STATUS_LABELS
} from '../../models/attendance.model';

@Component({
  selector: 'app-attendance-table',
  imports: [BadgeComponent, LoaderComponent, DatePipe],
  templateUrl: './attendance-table.html',
  styleUrl: './attendance-table.css'
})
export class AttendanceTableComponent {
  readonly rows = input.required<AttendanceRow[]>();
  readonly loading = input(false);

  protected statusLabel(status: AttendanceStatus): string {
    return ATTENDANCE_STATUS_LABELS[status];
  }

  protected statusVariant(status: AttendanceStatus): BadgeVariant {
    switch (status) {
      case 'present':
        return 'success';
      case 'late':
        return 'warning';
      case 'absent':
        return 'error';
      default:
        return 'info';
    }
  }

  protected formatTime(iso: string | null): string {
    if (!iso) {
      return '—';
    }
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  protected formatHours(hours: number | null): string {
    if (hours === null || hours === undefined) {
      return '—';
    }
    return `${hours.toFixed(2)} h`;
  }
}
