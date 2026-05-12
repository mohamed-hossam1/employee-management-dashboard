import { Component, computed, input, output, signal } from '@angular/core';

import { Employee } from '../../../employees/models/employee.model';
import { AttendanceRecord } from '../../models/attendance.model';

export interface EmployeeAttendanceOption {
  employee: Employee;
  todayRecord: AttendanceRecord | undefined;
}

@Component({
  selector: 'app-check-in-out',
  imports: [],
  templateUrl: './check-in-out.html',
  styleUrl: './check-in-out.css'
})
export class CheckInOutComponent {
  readonly options = input.required<EmployeeAttendanceOption[]>();
  readonly busy = input(false);

  readonly checkIn = output<string>();
  readonly checkOut = output<string>();

  readonly selectedId = signal('');

  readonly selectedOption = computed(() => {
    const id = this.selectedId();
    return this.options().find((o) => o.employee.id === id) ?? null;
  });

  readonly canCheckIn = computed(() => {
    const opt = this.selectedOption();
    return !!opt && !opt.todayRecord && !this.busy();
  });

  readonly canCheckOut = computed(() => {
    const opt = this.selectedOption();
    return !!opt && !!opt.todayRecord?.checkIn && !opt.todayRecord.checkOut && !this.busy();
  });

  readonly statusText = computed(() => {
    const opt = this.selectedOption();
    if (!opt) {
      return 'Select an employee to record attendance.';
    }
    if (!opt.todayRecord) {
      return 'Not checked in today.';
    }
    if (opt.todayRecord.checkOut) {
      return `Checked out (${opt.todayRecord.hoursWorked ?? 0} h).`;
    }
    return `Checked in as ${opt.todayRecord.status}. Ready to check out.`;
  });

  protected onSelect(event: Event): void {
    this.selectedId.set((event.target as HTMLSelectElement).value);
  }

  protected onCheckIn(): void {
    const id = this.selectedId();
    if (id && this.canCheckIn()) {
      this.checkIn.emit(id);
    }
  }

  protected onCheckOut(): void {
    const id = this.selectedId();
    if (id && this.canCheckOut()) {
      this.checkOut.emit(id);
    }
  }
}
