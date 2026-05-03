import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { Employee } from '../models/employee.model';
import {
  DEFAULT_EMPLOYEE_FILTERS,
  DEFAULT_EMPLOYEE_PAGINATION,
  EmployeeFilters,
  EmployeePagination
} from '../models/employee.model';

@Injectable({ providedIn: 'root' })
export class EmployeeState {
  private readonly employeesSubject = new BehaviorSubject<Employee[]>([]);
  private readonly selectedEmployeeSubject = new BehaviorSubject<Employee | null>(null);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  private readonly filtersSubject = new BehaviorSubject<EmployeeFilters>({
    ...DEFAULT_EMPLOYEE_FILTERS
  });
  private readonly paginationSubject = new BehaviorSubject<EmployeePagination>({
    ...DEFAULT_EMPLOYEE_PAGINATION,
    sort: { ...DEFAULT_EMPLOYEE_PAGINATION.sort }
  });

  readonly employees$ = this.employeesSubject.asObservable();
  readonly selectedEmployee$ = this.selectedEmployeeSubject.asObservable();
  readonly loading$ = this.loadingSubject.asObservable();
  readonly filters$ = this.filtersSubject.asObservable();
  readonly pagination$ = this.paginationSubject.asObservable();

  get employees(): Employee[] {
    return this.employeesSubject.value;
  }

  get selectedEmployee(): Employee | null {
    return this.selectedEmployeeSubject.value;
  }

  get loading(): boolean {
    return this.loadingSubject.value;
  }

  get filters(): EmployeeFilters {
    return this.filtersSubject.value;
  }

  get pagination(): EmployeePagination {
    return this.paginationSubject.value;
  }

  setEmployees(employees: Employee[]): void {
    this.employeesSubject.next(employees);
  }

  setSelectedEmployee(employee: Employee | null): void {
    this.selectedEmployeeSubject.next(employee);
  }

  setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  setFilters(filters: Partial<EmployeeFilters>): void {
    this.filtersSubject.next({ ...this.filtersSubject.value, ...filters });
  }

  setPagination(pagination: Partial<EmployeePagination>): void {
    const current = this.paginationSubject.value;
    this.paginationSubject.next({
      ...current,
      ...pagination,
      sort: pagination.sort ? { ...pagination.sort } : { ...current.sort }
    });
  }

  reset(): void {
    this.employeesSubject.next([]);
    this.selectedEmployeeSubject.next(null);
    this.loadingSubject.next(false);
    this.filtersSubject.next({ ...DEFAULT_EMPLOYEE_FILTERS });
    this.paginationSubject.next({
      ...DEFAULT_EMPLOYEE_PAGINATION,
      sort: { ...DEFAULT_EMPLOYEE_PAGINATION.sort }
    });
  }
}
