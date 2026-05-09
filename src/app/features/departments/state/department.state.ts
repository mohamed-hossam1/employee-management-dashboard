import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { Department } from '../models/department.model';

@Injectable({ providedIn: 'root' })
export class DepartmentState {
  private readonly departmentsSubject = new BehaviorSubject<Department[]>([]);
  private readonly selectedDepartmentSubject = new BehaviorSubject<Department | null>(null);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);

  readonly departments$ = this.departmentsSubject.asObservable();
  readonly selectedDepartment$ = this.selectedDepartmentSubject.asObservable();
  readonly loading$ = this.loadingSubject.asObservable();

  get departments(): Department[] {
    return this.departmentsSubject.value;
  }

  get selectedDepartment(): Department | null {
    return this.selectedDepartmentSubject.value;
  }

  get loading(): boolean {
    return this.loadingSubject.value;
  }

  setDepartments(departments: Department[]): void {
    this.departmentsSubject.next(departments);
  }

  setSelectedDepartment(department: Department | null): void {
    this.selectedDepartmentSubject.next(department);
  }

  setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  reset(): void {
    this.departmentsSubject.next([]);
    this.selectedDepartmentSubject.next(null);
    this.loadingSubject.next(false);
  }
}
