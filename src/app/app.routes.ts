import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.authRoutes)
  },
  {
    path: 'projects',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/projects.placeholder').then((m) => m.ProjectsPlaceholder)
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./pages/unauthorized').then((m) => m.UnauthorizedPage)
  },
  {
    path: '',
    redirectTo: 'projects',
    pathMatch: 'full'
  }
];
