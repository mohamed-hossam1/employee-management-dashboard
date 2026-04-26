import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { Project } from '../models/project.model';

@Injectable({ providedIn: 'root' })
export class ProjectState {
  private readonly projectsSignal = signal<Project[]>([]);
  private readonly activeProjectSignal = signal<Project | null>(null);
  private readonly activeProjectIdSignal = signal<string | null>(null);
  private readonly loadingSignal = signal(false);

  readonly projects = this.projectsSignal.asReadonly();
  readonly activeProject = this.activeProjectSignal.asReadonly();
  readonly activeProjectId = this.activeProjectIdSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();

  readonly hasActiveProject = computed(() => this.activeProjectIdSignal() !== null);

  readonly activeProjectChanged$ = new BehaviorSubject<string | null>(null);

  setProjects(projects: Project[]): void {
    this.projectsSignal.set(projects);
  }

  setActiveProject(project: Project | null): void {
    const previous = this.activeProjectIdSignal();
    this.activeProjectSignal.set(project);
    this.activeProjectIdSignal.set(project?.id ?? null);
    if (previous !== (project?.id ?? null)) {
      this.activeProjectChanged$.next(project?.id ?? null);
    }
  }

  setActiveProjectId(id: string | null): void {
    const previous = this.activeProjectIdSignal();
    this.activeProjectIdSignal.set(id);
    if (id === null) {
      this.activeProjectSignal.set(null);
    } else {
      const match = this.projectsSignal().find((p) => p.id === id);
      this.activeProjectSignal.set(match ?? null);
    }
    if (previous !== id) {
      this.activeProjectChanged$.next(id);
    }
  }

  setLoading(loading: boolean): void {
    this.loadingSignal.set(loading);
  }

  reset(): void {
    this.projectsSignal.set([]);
    this.activeProjectSignal.set(null);
    this.activeProjectIdSignal.set(null);
    this.loadingSignal.set(false);
    this.activeProjectChanged$.next(null);
  }
}
