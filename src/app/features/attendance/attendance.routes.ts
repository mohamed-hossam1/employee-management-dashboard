import { Routes } from '@angular/router';

import { authGuard } from '../../core/guards/auth.guard';
import { projectGuard } from '../../core/guards/project.guard';

export const attendanceRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard, projectGuard],
    loadComponent: () =>
      import('./pages/attendance-page/attendance-page').then((m) => m.AttendancePage)
  }
];
