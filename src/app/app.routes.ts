import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { projectGuard } from './core/guards/project.guard';
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
        canActivate: [projectGuard],
        loadComponent: () =>
          import('./pages/section-placeholder').then((m) => m.SectionPlaceholder),
        data: { section: 'dashboard' }
      },
      {
        path: ':projectId/employees',
        canActivate: [projectGuard],
        loadChildren: () =>
          import('./features/employees/employees.routes').then((m) => m.employeesRoutes)
      },
      {
        path: ':projectId/departments',
        canActivate: [projectGuard],
        loadChildren: () =>
          import('./features/departments/departments.routes').then((m) => m.departmentsRoutes)
      },
      {
        path: ':projectId/attendance',
        canActivate: [projectGuard],
        loadChildren: () =>
          import('./features/attendance/attendance.routes').then((m) => m.attendanceRoutes)
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
        loadChildren: () =>
          import('./features/projects/projects.routes').then((m) => m.projectsRoutes)
      }
    ]
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./pages/unauthorized').then((m) => m.UnauthorizedPage)
  },
  {
    path: 'components',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/components-gallery/components-gallery').then((m) => m.ComponentsGallery)
  },
  {
    path: '',
    redirectTo: 'projects',
    pathMatch: 'full'
  }
];
