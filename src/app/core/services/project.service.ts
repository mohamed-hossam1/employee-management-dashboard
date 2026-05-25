import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { Project } from '../models/project.model';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import { ProjectState } from '../state/project.state';

export interface ProjectInput {
  name: string;
  description: string;
  color: string;
  icon: string;
}

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly api = inject(ApiService);
  private readonly storage = inject(StorageService);
  private readonly state = inject(ProjectState);

  async getProjects(userId: string): Promise<Project[]> {
    this.state.setLoading(true);
    try {
      const projects = await firstValueFrom(
        this.api.get<Project[]>('projects', { userId })
      );
      this.state.setProjects(projects);
      return projects;
    } finally {
      this.state.setLoading(false);
    }
  }

  async create(userId: string, input: ProjectInput): Promise<Project> {
    const now = new Date().toISOString();
    const created = await firstValueFrom(
      this.api.post<Project>('projects', {
        userId,
        name: input.name,
        description: input.description,
        color: input.color,
        icon: input.icon,
        createdAt: now,
        updatedAt: now
      })
    );
    this.state.setProjects([...this.state.projects(), created]);
    return created;
  }

  async update(id: string, input: ProjectInput): Promise<Project> {
    const now = new Date().toISOString();
    const updated = await firstValueFrom(
      this.api.put<Project>(`projects/${id}`, {
        name: input.name,
        description: input.description,
        color: input.color,
        icon: input.icon,
        updatedAt: now
      })
    );
    this.state.setProjects(this.state.projects().map((p) => (p.id === id ? updated : p)));
    if (this.state.activeProjectId() === id) {
      this.state.setActiveProject(updated);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await firstValueFrom(this.api.delete<void>(`projects/${id}`));
    this.state.setProjects(this.state.projects().filter((p) => p.id !== id));
    if (this.state.activeProjectId() === id) {
      this.state.setActiveProject(null);
    }
  }

  async setActiveProject(id: string, userId: string): Promise<void> {
    if (!this.state.projects().length) {
      await this.getProjects(userId);
    }
    const project = this.state.projects().find((p) => p.id === id) ?? null;
    this.state.setActiveProject(project);
    this.storage.set('activeProjectId', id);
  }

  async loadActiveProject(userId: string): Promise<Project | null> {
    const persistedId = this.storage.get<string>('activeProjectId');
    if (!persistedId) {
      return null;
    }
    if (!this.state.projects().length) {
      await this.getProjects(userId);
    }
    const project = this.state.projects().find((p) => p.id === persistedId) ?? null;
    if (project) {
      this.state.setActiveProject(project);
    } else {
      this.storage.remove('activeProjectId');
    }
    return project;
  }

  reset(): void {
    this.state.reset();
    this.storage.remove('activeProjectId');
  }
}
