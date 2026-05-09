import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';
import { ProjectState } from '../../../core/state/project.state';
import { Employee } from '../../../core/models/employee.model';
import {
  Department,
  DepartmentCreateInput,
  DepartmentUpdateInput,
  DepartmentWithCount
} from '../models/department.model';
import { DepartmentState } from '../state/department.state';

@Injectable({ providedIn: 'root' })
export class DepartmentService {
  private readonly api = inject(ApiService);
  private readonly state = inject(DepartmentState);
  private readonly projectState = inject(ProjectState);

  private requireProjectId(): string {
    const projectId = this.projectState.activeProjectId();
    if (!projectId) {
      throw new Error('No active project selected');
    }
    return projectId;
  }

  async loadDepartments(): Promise<Department[]> {
    const projectId = this.requireProjectId();
    this.state.setLoading(true);
    try {
      const departments = await firstValueFrom(
        this.api.get<Department[]>('departments', { projectId })
      );
      const scoped = departments.filter((d) => d.projectId === projectId);
      this.state.setDepartments(scoped);
      return scoped;
    } finally {
      this.state.setLoading(false);
    }
  }

  async getById(id: string): Promise<Department | null> {
    this.state.setLoading(true);
    try {
      const department = await firstValueFrom(
        this.api.get<Department>(`departments/${id}`)
      );
      const projectId = this.projectState.activeProjectId();
      if (projectId && department.projectId !== projectId) {
        this.state.setSelectedDepartment(null);
        return null;
      }
      this.state.setSelectedDepartment(department);
      return department;
    } catch {
      this.state.setSelectedDepartment(null);
      return null;
    } finally {
      this.state.setLoading(false);
    }
  }

  async create(input: DepartmentCreateInput): Promise<Department> {
    const projectId = this.requireProjectId();
    if (!this.isNameUnique(input.name)) {
      throw new Error('Department name must be unique within the project.');
    }
    const now = new Date().toISOString();
    const created = await firstValueFrom(
      this.api.post<Department>('departments', {
        name: input.name.trim(),
        description: input.description.trim(),
        managerId: input.managerId,
        projectId,
        createdAt: now,
        updatedAt: now
      })
    );
    this.state.setDepartments([...this.state.departments, created]);
    return created;
  }

  async update(id: string, input: DepartmentUpdateInput): Promise<Department> {
    const existing = this.state.departments.find((d) => d.id === id);
    const projectId = existing?.projectId ?? this.requireProjectId();
    if (!this.isNameUnique(input.name, id)) {
      throw new Error('Department name must be unique within the project.');
    }
    const now = new Date().toISOString();
    const updated = await firstValueFrom(
      this.api.put<Department>(`departments/${id}`, {
        ...existing,
        name: input.name.trim(),
        description: input.description.trim(),
        managerId: input.managerId,
        id,
        projectId,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now
      })
    );
    this.state.setDepartments(this.state.departments.map((d) => (d.id === id ? updated : d)));
    if (this.state.selectedDepartment?.id === id) {
      this.state.setSelectedDepartment(updated);
    }
    return updated;
  }

  /**
   * Deletes a department and unassigns any employees that referenced it.
   * Employee records are never deleted.
   */
  async delete(id: string, employees: Employee[]): Promise<void> {
    const assigned = employees.filter((e) => e.departmentId === id);
    for (const employee of assigned) {
      await this.unassignEmployee(employee);
    }
    await firstValueFrom(this.api.delete<void>(`departments/${id}`));
    this.state.setDepartments(this.state.departments.filter((d) => d.id !== id));
    if (this.state.selectedDepartment?.id === id) {
      this.state.setSelectedDepartment(null);
    }
  }

  /** Clears an employee's departmentId without removing the employee record. */
  async unassignEmployee(employee: Employee): Promise<Employee> {
    const now = new Date().toISOString();
    return firstValueFrom(
      this.api.put<Employee>(`employees/${employee.id}`, {
        ...employee,
        departmentId: '',
        updatedAt: now
      })
    );
  }

  /** Moves an employee to another department in the same project. */
  async reassignEmployee(
    employee: Employee,
    targetDepartmentId: string
  ): Promise<Employee> {
    const projectId = this.requireProjectId();
    if (employee.projectId !== projectId) {
      throw new Error('Employee belongs to a different project.');
    }
    const target = this.state.departments.find((d) => d.id === targetDepartmentId);
    if (!target || target.projectId !== projectId) {
      throw new Error('Target department must belong to the active project.');
    }
    const now = new Date().toISOString();
    return firstValueFrom(
      this.api.put<Employee>(`employees/${employee.id}`, {
        ...employee,
        departmentId: targetDepartmentId,
        updatedAt: now
      })
    );
  }

  countEmployees(departmentId: string, employees: Employee[]): number {
    const projectId = this.projectState.activeProjectId();
    return employees.filter(
      (e) =>
        e.departmentId === departmentId &&
        (!projectId || e.projectId === projectId)
    ).length;
  }

  withCounts(departments: Department[], employees: Employee[]): DepartmentWithCount[] {
    return departments.map((d) => ({
      ...d,
      employeeCount: this.countEmployees(d.id, employees)
    }));
  }

  isNameUnique(name: string, excludeId?: string): boolean {
    const normalized = name.trim().toLowerCase();
    return !this.state.departments.some(
      (d) => d.id !== excludeId && d.name.trim().toLowerCase() === normalized
    );
  }

  reset(): void {
    this.state.reset();
  }
}
