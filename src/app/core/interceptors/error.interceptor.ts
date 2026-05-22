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

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
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
        const message =
          typeof error.error === 'object' && error.error && 'message' in error.error
            ? String((error.error as { message: unknown }).message)
            : 'Request failed. Please review your input and try again.';
        notifications.error(message);
      }

      return throwError(() => error);
    })
  );
};
