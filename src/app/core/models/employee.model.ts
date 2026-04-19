export type EmployeeStatus = 'active' | 'inactive' | 'on-leave';

export interface Employee {
  id: string;
  projectId: string;
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
  createdAt: string;
  updatedAt: string;
}
