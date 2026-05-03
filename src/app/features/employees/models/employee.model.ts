import { Employee, EmployeeStatus } from '../../../core/models/employee.model';

export type { Employee, EmployeeStatus };

export const EMPLOYEE_STATUSES: readonly EmployeeStatus[] = [
  'active',
  'inactive',
  'on-leave'
] as const;

export const EMPLOYEE_STATUS_LABELS: Record<EmployeeStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  'on-leave': 'On Leave'
};

export interface EmployeeCreateInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  departmentId: string;
  position: string;
  salary: number;
  hireDate: string;
  status: EmployeeStatus;
  avatar: string | null;
}

export type EmployeeUpdateInput = EmployeeCreateInput;

export interface EmployeeFilters {
  search: string;
  departmentId: string | null;
  status: string | null;
}

export type EmployeePageLimit = 10 | 25 | 50;

export interface EmployeeSort {
  field: string;
  dir: 'asc' | 'desc';
}

export interface EmployeePagination {
  page: number;
  limit: EmployeePageLimit;
  sort: EmployeeSort;
}

export const DEFAULT_EMPLOYEE_FILTERS: EmployeeFilters = {
  search: '',
  departmentId: null,
  status: null
};

export const DEFAULT_EMPLOYEE_PAGINATION: EmployeePagination = {
  page: 1,
  limit: 10,
  sort: { field: 'lastName', dir: 'asc' }
};
