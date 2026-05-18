import { Routes } from '@angular/router';

import { authGuard } from '../../core/guards/auth.guard';

export const settingsRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/settings-page/settings-page').then((m) => m.SettingsPage)
  }
];
