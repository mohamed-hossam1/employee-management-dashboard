import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthState } from '../state/auth.state';
import { ProjectState } from '../state/project.state';
import { ProjectService } from '../services/project.service';

export const projectGuard: CanActivateFn = (route) => {
  const authState = inject(AuthState);
  const projectState = inject(ProjectState);
  const projectService = inject(ProjectService);
  const router = inject(Router);

  const user = authState.currentUser();
  if (!user) {
    return router.createUrlTree(['/auth/login']);
  }

  const projectId = route.paramMap.get('projectId');
  if (!projectId) {
    return router.createUrlTree(['/projects']);
  }

  const owned = projectState.projects().find((p) => p.id === projectId);
  if (owned) {
    if (projectState.activeProjectId() !== projectId) {
      projectState.setActiveProject(owned);
    }
    return true;
  }

  const activate = (id: string) => {
    const project = projectState.projects().find((p) => p.id === id);
    if (project) {
      projectState.setActiveProject(project);
    }
    return true;
  };

  if (projectState.projects().length > 0) {
    return projectState.projects().some((p) => p.id === projectId)
      ? activate(projectId)
      : router.createUrlTree(['/projects']);
  }

  return projectService.getProjects(user.id).then((list) =>
    list.some((p) => p.id === projectId)
      ? activate(projectId)
      : router.createUrlTree(['/projects'])
  );
};
