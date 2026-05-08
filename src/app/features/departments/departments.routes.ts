import { Routes } from '@angular/router';

import { authGuard } from '../../core/guards/auth.guard';
import { projectGuard } from '../../core/guards/project.guard';

export const departmentsRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard, projectGuard],
    loadComponent: () =>
      import('./pages/department-list/department-list').then((m) => m.DepartmentListPage)
  },
  {
    path: ':departmentId',
    canActivate: [authGuard, projectGuard],
    loadComponent: () =>
      import('./pages/department-detail/department-detail').then((m) => m.DepartmentDetailPage)
  }
];
