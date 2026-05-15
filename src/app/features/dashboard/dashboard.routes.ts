import { Routes } from '@angular/router';

import { authGuard } from '../../core/guards/auth.guard';
import { projectGuard } from '../../core/guards/project.guard';

export const dashboardRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard, projectGuard],
    loadComponent: () =>
      import('./pages/dashboard-page/dashboard-page').then((m) => m.DashboardPage)
  }
];
