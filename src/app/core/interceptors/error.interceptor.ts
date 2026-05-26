import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const notifications = inject(NotificationService);
  const isAuthRequest = req.url.includes('/auth/v1/');

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Auth pages handle their own form-level errors; avoid noisy global toasts.
      if (isAuthRequest) {
        return throwError(() => error);
      }

      if (error.status === 401) {
        authService.logout();
        notifications.error('Session expired. Please sign in again.');
        router.navigate(['/auth/login'], {
          queryParams: { sessionExpired: 'true' }
        });
      } else if (error.status === 403) {
        notifications.warning('You are not allowed to access that resource.');
        router.navigate(['/unauthorized']);
      } else if (error.status === 404) {
        notifications.error('The requested resource was not found.');
      } else if (error.status === 0) {
        notifications.error('Network error. Check your connection and try again.');
      } else if (error.status >= 500) {
        notifications.error('A server error occurred. Please try again later.');
      } else if (error.status >= 400) {
        const body = error.error;
        const message =
          typeof body === 'object' && body !== null
            ? String(
                (body as { msg?: unknown; message?: unknown }).msg ??
                  (body as { message?: unknown }).message ??
                  'Request failed. Please review your input and try again.'
              )
            : 'Request failed. Please review your input and try again.';
        notifications.error(message);
      }

      return throwError(() => error);
    })
  );
};
