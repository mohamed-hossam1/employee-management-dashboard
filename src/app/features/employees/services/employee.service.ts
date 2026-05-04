import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';
import { ProjectState } from '../../../core/state/project.state';
import { Department } from '../../../core/models/department.model';
import {
  Employee,
  EmployeeCreateInput,
  EmployeeFilters,
  EmployeePageLimit,
  EmployeePagination,
  EmployeeUpdateInput
} from '../models/employee.model';
import { EmployeeState } from '../state/employee.state';

export interface EmployeeQueryResult {
  items: Employee[];
  total: number;
  page: number;
  limit: EmployeePageLimit;
}

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private readonly api = inject(ApiService);
  private readonly state = inject(EmployeeState);
  private readonly projectState = inject(ProjectState);

  private requireProjectId(): string {
    const projectId = this.projectState.activeProjectId();
    if (!projectId) {
      throw new Error('No active project selected');
    }
    return projectId;
  }

  async loadEmployees(): Promise<Employee[]> {
    const projectId = this.requireProjectId();
    this.state.setLoading(true);
    try {
      const employees = await firstValueFrom(
        this.api.get<Employee[]>('employees', { projectId })
      );
      const scoped = employees.filter((e) => e.projectId === projectId);
      this.state.setEmployees(scoped);
      return scoped;
    } finally {
      this.state.setLoading(false);
    }
  }

  async getById(id: string): Promise<Employee | null> {
    this.state.setLoading(true);
    try {
      const employee = await firstValueFrom(this.api.get<Employee>(`employees/${id}`));
      const projectId = this.projectState.activeProjectId();
      if (projectId && employee.projectId !== projectId) {
        this.state.setSelectedEmployee(null);
        return null;
      }
      this.state.setSelectedEmployee(employee);
      return employee;
    } catch {
      this.state.setSelectedEmployee(null);
      return null;
    } finally {
      this.state.setLoading(false);
    }
  }

  async create(input: EmployeeCreateInput): Promise<Employee> {
    const projectId = this.requireProjectId();
    const now = new Date().toISOString();
    const created = await firstValueFrom(
      this.api.post<Employee>('employees', {
        ...input,
        projectId,
        createdAt: now,
        updatedAt: now
      })
    );
    this.state.setEmployees([...this.state.employees, created]);
    return created;
  }

  async update(id: string, input: EmployeeUpdateInput): Promise<Employee> {
    const existing = this.state.employees.find((e) => e.id === id);
    const projectId = existing?.projectId ?? this.requireProjectId();
    const now = new Date().toISOString();
    const updated = await firstValueFrom(
      this.api.put<Employee>(`employees/${id}`, {
        ...existing,
        ...input,
        id,
        projectId,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now
      })
    );
    this.state.setEmployees(this.state.employees.map((e) => (e.id === id ? updated : e)));
    if (this.state.selectedEmployee?.id === id) {
      this.state.setSelectedEmployee(updated);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await firstValueFrom(this.api.delete<void>(`employees/${id}`));
    this.state.setEmployees(this.state.employees.filter((e) => e.id !== id));
    if (this.state.selectedEmployee?.id === id) {
      this.state.setSelectedEmployee(null);
    }
  }

  async deleteMany(ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.delete(id);
    }
  }

  async getDepartments(): Promise<Department[]> {
    const projectId = this.requireProjectId();
    const departments = await firstValueFrom(
      this.api.get<Department[]>('departments', { projectId })
    );
    return departments.filter((d) => d.projectId === projectId);
  }

  filterSortPaginate(
    employees: Employee[],
    filters: EmployeeFilters,
    pagination: EmployeePagination
  ): EmployeeQueryResult {
    let result = [...employees];

    const search = filters.search.trim().toLowerCase();
    if (search) {
      result = result.filter((e) => {
        const haystack = [
          e.firstName,
          e.lastName,
          e.email,
          e.position,
          e.phone
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(search);
      });
    }

    if (filters.departmentId) {
      result = result.filter((e) => e.departmentId === filters.departmentId);
    }

    if (filters.status) {
      result = result.filter((e) => e.status === filters.status);
    }

    const { field, dir } = pagination.sort;
    result.sort((a, b) => {
      const av = this.sortValue(a, field);
      const bv = this.sortValue(b, field);
      if (av < bv) {
        return dir === 'asc' ? -1 : 1;
      }
      if (av > bv) {
        return dir === 'asc' ? 1 : -1;
      }
      return 0;
    });

    const total = result.length;
    const limit = pagination.limit;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const page = Math.min(Math.max(1, pagination.page), totalPages);
    const start = (page - 1) * limit;
    const items = result.slice(start, start + limit);

    return { items, total, page, limit };
  }

  private sortValue(employee: Employee, field: string): string | number {
    switch (field) {
      case 'firstName':
        return employee.firstName.toLowerCase();
      case 'lastName':
        return employee.lastName.toLowerCase();
      case 'email':
        return employee.email.toLowerCase();
      case 'position':
        return employee.position.toLowerCase();
      case 'salary':
        return employee.salary;
      case 'hireDate':
        return employee.hireDate;
      case 'status':
        return employee.status;
      case 'name':
        return `${employee.lastName} ${employee.firstName}`.toLowerCase();
      default:
        return String((employee as unknown as Record<string, unknown>)[field] ?? '').toLowerCase();
    }
  }

  reset(): void {
    this.state.reset();
  }
}
