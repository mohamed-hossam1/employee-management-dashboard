import { Routes } from '@angular/router';

import { authGuard } from '../../core/guards/auth.guard';
import { ProjectSelectorPage } from './pages/project-selector/project-selector';

export const projectsRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    component: ProjectSelectorPage
  }
];
