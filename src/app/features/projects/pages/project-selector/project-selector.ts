import { Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';

import { AuthState } from '../../../../core/state/auth.state';
import { ProjectState } from '../../../../core/state/project.state';
import { ProjectService, ProjectInput } from '../../../../core/services/project.service';
import { Project } from '../../../../core/models/project.model';
import { ProjectCardComponent } from '../../components/project-card/project-card';
import { ProjectFormDialogComponent } from '../../components/project-form-dialog/project-form-dialog';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-project-selector',
  imports: [ProjectCardComponent, ProjectFormDialogComponent, ConfirmDialogComponent],
  templateUrl: './project-selector.html',
  styleUrl: './project-selector.css'
})
export class ProjectSelectorPage {
  private readonly authState = inject(AuthState);
  private readonly projectState = inject(ProjectState);
  private readonly projectService = inject(ProjectService);
  private readonly router = inject(Router);

  readonly projects = this.projectState.projects;
  readonly activeProjectId = this.projectState.activeProjectId;
  readonly loading = this.projectState.loading;

  readonly dialogOpen = signal(false);
  readonly editing = signal<Project | null>(null);
  readonly saving = signal(false);

  readonly deleting = signal<Project | null>(null);

  readonly isEmpty = computed(() => !this.loading() && this.projects().length === 0);

  constructor() {
    void this.loadProjects();
  }

  private async loadProjects(): Promise<void> {
    const user = this.authState.currentUser();
    if (!user) {
      return;
    }
    try {
      await this.projectService.getProjects(user.id);
    } catch {
      // Error interceptor surfaces the failure; keep empty state usable.
    }
  }

  protected openCreate(): void {
    this.editing.set(null);
    this.dialogOpen.set(true);
  }

  protected openEdit(project: Project): void {
    this.editing.set(project);
    this.dialogOpen.set(true);
  }

  protected closeDialog(): void {
    this.dialogOpen.set(false);
    this.editing.set(null);
  }

  protected async onSave(input: ProjectInput): Promise<void> {
    const user = this.authState.currentUser();
    if (!user) {
      return;
    }
    this.saving.set(true);
    try {
      const editing = this.editing();
      if (editing) {
        await this.projectService.update(editing.id, input);
      } else {
        const created = await this.projectService.create(user.id, input);
        await this.projectService.setActiveProject(created.id, user.id);
        this.closeDialog();
        await this.router.navigateByUrl(`/p/${created.id}/dashboard`);
        return;
      }
      this.closeDialog();
    } finally {
      this.saving.set(false);
    }
  }

  protected async onActivate(project: Project): Promise<void> {
    const user = this.authState.currentUser();
    if (!user) {
      await this.router.navigateByUrl('/auth/login');
      return;
    }
    try {
      await this.projectService.setActiveProject(project.id, user.id);
      await this.router.navigateByUrl(`/p/${project.id}/dashboard`);
    } catch {
      // Toast from error interceptor; stay on selector so the user can retry.
    }
  }

  protected openDelete(project: Project): void {
    this.deleting.set(project);
  }

  protected closeDelete(): void {
    this.deleting.set(null);
  }

  protected async onConfirmDelete(): Promise<void> {
    const project = this.deleting();
    const user = this.authState.currentUser();
    if (!project || !user) {
      return;
    }
    const wasActive = this.projectState.activeProjectId() === project.id;
    await this.projectService.delete(project.id);
    this.deleting.set(null);
    if (wasActive) {
      const remaining = this.projectState.projects();
      if (remaining.length > 0) {
        await this.projectService.setActiveProject(remaining[0].id, user.id);
      }
      this.router.navigate(['/projects']);
    }
  }
}
