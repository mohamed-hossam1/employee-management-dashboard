import { Routes } from '@angular/router';

import { authGuard } from '../../core/guards/auth.guard';
import { projectGuard } from '../../core/guards/project.guard';

export const employeesRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard, projectGuard],
    loadComponent: () =>
      import('./pages/employee-list/employee-list').then((m) => m.EmployeeListPage)
  },
  {
    path: 'new',
    canActivate: [authGuard, projectGuard],
    loadComponent: () =>
      import('./pages/employee-form/employee-form').then((m) => m.EmployeeFormPage)
  },
  {
    path: ':employeeId',
    canActivate: [authGuard, projectGuard],
    loadComponent: () =>
      import('./pages/employee-detail/employee-detail').then((m) => m.EmployeeDetailPage)
  },
  {
    path: ':employeeId/edit',
    canActivate: [authGuard, projectGuard],
    loadComponent: () =>
      import('./pages/employee-form/employee-form').then((m) => m.EmployeeFormPage)
  }
];
