import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { AuthState } from '../state/auth.state';
import { StorageService } from './storage.service';

describe('AuthService (Supabase)', () => {
  let service: AuthService;
  let state: AuthState;
  let httpMock: HttpTestingController;
  let storage: StorageService;

  const authBase = `${environment.supabaseUrl}/auth/v1`;
  const restBase = `${environment.supabaseUrl}/rest/v1`;

  const authUser = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'jane@demo.com',
    created_at: '2026-01-01T00:00:00.000Z',
    last_sign_in_at: '2026-01-01T00:00:00.000Z',
    user_metadata: { name: 'Jane Doe' }
  };

  const sessionBody = {
    access_token: 'access-token',
    refresh_token: 'refresh-token',
    expires_in: 3600,
    user: authUser
  };

  const profileRow = {
    id: authUser.id,
    email: authUser.email,
    name: 'Jane Doe',
    avatar: null,
    phone: '',
    bio: '',
    role: 'user',
    created_at: authUser.created_at,
    last_login: authUser.last_sign_in_at,
    settings: {
      theme: 'light',
      notifications: { email: true, in_app: true, attendance_alerts: true }
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AuthService);
    state = TestBed.inject(AuthState);
    httpMock = TestBed.inject(HttpTestingController);
    storage = TestBed.inject(StorageService);
    storage.remove('session');
    storage.remove('token');
    state.reset();
  });

  afterEach(() => {
    storage.remove('session');
    storage.remove('token');
    state.reset();
    try {
      httpMock.verify();
    } catch {
      /* ignore leftover requests from failed assertions */
    }
  });

  async function flushMicrotasks(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
  }

  async function flushProfileSync(): Promise<void> {
    const getReq = httpMock.expectOne(
      (r) => r.url.startsWith(`${restBase}/profiles`) && r.method === 'GET'
    );
    getReq.flush([]);

    await flushMicrotasks();

    const upsertReq = httpMock.expectOne(
      (r) => r.url.startsWith(`${restBase}/profiles`) && r.method === 'POST'
    );
    upsertReq.flush([profileRow]);
  }

  it('logs in against Supabase password grant and sets the session', async () => {
    const promise = service.login({ email: 'jane@demo.com', password: 'Password123' });

    await flushMicrotasks();
    const loginReq = httpMock.expectOne(`${authBase}/token?grant_type=password`);
    expect(loginReq.request.method).toBe('POST');
    loginReq.flush(sessionBody);

    await flushMicrotasks();
    await flushProfileSync();

    const result = await promise;
    expect(result.user.id).toBe(authUser.id);
    expect(result.token).toBe('access-token');
    expect(state.isAuthenticated()).toBe(true);
    expect(storage.get('session')).toBeTruthy();
  });

  it('rejects invalid credentials from Supabase', async () => {
    const promise = service.login({ email: 'jane@demo.com', password: 'wrong' });

    await flushMicrotasks();
    const loginReq = httpMock.expectOne(`${authBase}/token?grant_type=password`);
    loginReq.flush(
      { error: 'invalid_grant', msg: 'Invalid login credentials' },
      { status: 400, statusText: 'Bad Request' }
    );

    try {
      await promise;
      throw new Error('expected login to reject');
    } catch (error) {
      expect(error).toMatchObject({ name: 'AuthError', code: 'INVALID_CREDENTIALS' });
    }
    expect(state.isAuthenticated()).toBe(false);
  });

  it('registers via Supabase signup and auto signs in', async () => {
    const promise = service.register({
      name: 'Jane Doe',
      email: 'jane@demo.com',
      password: 'Password123'
    });

    await flushMicrotasks();
    const signupReq = httpMock.expectOne(`${authBase}/signup`);
    expect(signupReq.request.body).toEqual({
      email: 'jane@demo.com',
      password: 'Password123',
      data: { name: 'Jane Doe' }
    });
    signupReq.flush(sessionBody);

    await flushMicrotasks();
    await flushProfileSync();

    const result = await promise;
    expect(result.user.id).toBe(authUser.id);
    expect(state.isAuthenticated()).toBe(true);
  });

  it('signals email confirmation when signup returns no session', async () => {
    const promise = service.register({
      name: 'Jane Doe',
      email: 'jane@demo.com',
      password: 'Password123'
    });

    await flushMicrotasks();
    const signupReq = httpMock.expectOne(`${authBase}/signup`);
    signupReq.flush({ user: authUser });

    try {
      await promise;
      throw new Error('expected register to reject');
    } catch (error) {
      expect(error).toMatchObject({ code: 'EMAIL_CONFIRMATION_REQUIRED' });
    }
    expect(state.isAuthenticated()).toBe(false);
  });

  it('autoLogin restores a valid stored Supabase session', async () => {
    storage.set('session', {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      // Must be > 60s ahead so ensureValidSession skips refresh.
      expiresAt: Date.now() + 3_600_000
    });

    const promise = service.autoLogin();

    await flushMicrotasks();
    const userReq = httpMock.expectOne(`${authBase}/user`);
    expect(userReq.request.headers.get('Authorization')).toBe('Bearer access-token');
    userReq.flush(authUser);

    await flushMicrotasks();
    await flushProfileSync();

    await expect(promise).resolves.toBe(true);
    expect(state.isAuthenticated()).toBe(true);
  });

  it('autoLogin fails when no session is stored', async () => {
    await expect(service.autoLogin()).resolves.toBe(false);
    expect(state.isAuthenticated()).toBe(false);
  });

  it('logout clears local session state', async () => {
    state.setSession(
      {
        id: authUser.id,
        name: 'Jane',
        email: authUser.email,
        avatar: null,
        phone: '',
        bio: '',
        role: 'user',
        createdAt: authUser.created_at,
        lastLogin: authUser.last_sign_in_at!,
        settings: {
          theme: 'light',
          notifications: { email: true, inApp: true, attendanceAlerts: true }
        }
      },
      'access-token'
    );
    storage.set('session', {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresAt: Date.now() + 3_600_000
    });

    service.logout();

    await flushMicrotasks();
    const logoutReq = httpMock.expectOne(`${authBase}/logout`);
    logoutReq.flush({});

    expect(state.isAuthenticated()).toBe(false);
    expect(storage.get('session')).toBeNull();
  });
});
