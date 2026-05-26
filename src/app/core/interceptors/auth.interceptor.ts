import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';

import { environment } from '../../environments/environment';
import { AuthState } from '../state/auth.state';

/**
 * Attaches the Supabase publishable key + session JWT to outbound API calls.
 * Auth endpoints that already set their own headers are left untouched when
 * they already include an Authorization header.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authState = inject(AuthState);
  const isSupabaseRequest = req.url.startsWith(environment.supabaseUrl);

  if (!isSupabaseRequest) {
    return next(req);
  }

  let headers = req.headers;
  if (!headers.has('apikey')) {
    headers = headers.set('apikey', environment.supabasePublishableKey);
  }

  const token = authState.token();
  if (token && !headers.has('Authorization')) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  } else if (!headers.has('Authorization')) {
    // PostgREST accepts the publishable key as a bearer when unauthenticated.
    headers = headers.set('Authorization', `Bearer ${environment.supabasePublishableKey}`);
  }

  return next(req.clone({ headers }));
};
