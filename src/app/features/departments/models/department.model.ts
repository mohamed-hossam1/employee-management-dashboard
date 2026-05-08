import { Department } from '../../../core/models/department.model';

export type { Department };

export const DEPARTMENT_NAME_MIN = 2;
export const DEPARTMENT_DESCRIPTION_MAX = 500;

export interface DepartmentCreateInput {
  name: string;
  description: string;
  managerId: string | null;
}

export type DepartmentUpdateInput = DepartmentCreateInput;

export interface DepartmentWithCount extends Department {
  employeeCount: number;
}

export interface ManagerOption {
  id: string;
  name: string;
}
