import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';

import { AuthState } from '../state/auth.state';

const AUTH_URL_PATTERNS = ['/api/users?email=', '/api/auth/'];

function isAuthRequest(url: string): boolean {
  return AUTH_URL_PATTERNS.some((pattern) => url.includes(pattern));
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authState = inject(AuthState);
  const token = authState.token();

  if (token && !isAuthRequest(req.url)) {
    const cloned = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(cloned);
  }

  return next(req);
};
