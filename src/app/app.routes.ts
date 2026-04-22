import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { MainLayout } from './layouts/main/main-layout';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.authRoutes)
  },
  {
    path: 'p',
    canActivate: [authGuard],
    loadComponent: () => import('./layouts/main/main-layout').then((m) => m.MainLayout),
    children: [
      {
        path: ':projectId/dashboard',
        loadComponent: () =>
          import('./pages/section-placeholder').then((m) => m.SectionPlaceholder),
        data: { section: 'dashboard' }
      },
      {
        path: ':projectId/employees',
        loadComponent: () =>
          import('./pages/section-placeholder').then((m) => m.SectionPlaceholder),
        data: { section: 'employees' }
      },
      {
        path: ':projectId/departments',
        loadComponent: () =>
          import('./pages/section-placeholder').then((m) => m.SectionPlaceholder),
        data: { section: 'departments' }
      },
      {
        path: ':projectId/attendance',
        loadComponent: () =>
          import('./pages/section-placeholder').then((m) => m.SectionPlaceholder),
        data: { section: 'attendance' }
      }
    ]
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./layouts/main/main-layout').then((m) => m.MainLayout),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/section-placeholder').then((m) => m.SectionPlaceholder),
        data: { section: 'profile' }
      }
    ]
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () => import('./layouts/main/main-layout').then((m) => m.MainLayout),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/section-placeholder').then((m) => m.SectionPlaceholder),
        data: { section: 'settings' }
      }
    ]
  },
  {
    path: 'projects',
    canActivate: [authGuard],
    loadComponent: () => import('./layouts/main/main-layout').then((m) => m.MainLayout),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/projects.placeholder').then((m) => m.ProjectsPlaceholder)
      }
    ]
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
