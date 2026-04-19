import { Routes } from '@angular/router';

import { guestGuard } from '../../core/guards/guest.guard';

import { LoginPage } from './pages/login/login';
import { RegisterPage } from './pages/register/register';

export const authRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('../../layouts/auth-layout/auth-layout').then((m) => m.AuthLayout),
    children: [
      {
        path: 'login',
        canActivate: [guestGuard],
        component: LoginPage,
        title: 'Sign in'
      },
      {
        path: 'register',
        canActivate: [guestGuard],
        component: RegisterPage,
        title: 'Create account'
      }
    ]
  }
];
