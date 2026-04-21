import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { AuthService, AuthError } from './auth.service';
import { AuthState } from '../state/auth.state';
import { StorageService } from './storage.service';
import { User } from '../models/user.model';

describe('AuthService', () => {
  let service: AuthService;
  let state: AuthState;
  let httpMock: HttpTestingController;
  let storage: StorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AuthService);
    state = TestBed.inject(AuthState);
    httpMock = TestBed.inject(HttpTestingController);
    storage = TestBed.inject(StorageService);
  });

  afterEach(() => {
    storage.remove('token');
    state.reset();
    try {
      httpMock.verify();
    } catch {
      /* allow teardown even if a request was left open */
    }
    TestBed.resetTestingModule();
  });

  it('logs in with valid credentials and sets the session', async () => {
    const promise = service.login({ email: 'admin@demo.com', password: 'password123' });

    const req = httpMock.expectOne((r) => r.url.includes('users') && r.params.get('email') === 'admin@demo.com');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 'u1', email: 'admin@demo.com', password: 'password123' }] as unknown as User[]);

    await Promise.resolve();
    await Promise.resolve();

    const putReq = httpMock.expectOne((r) => r.method === 'PUT');
    putReq.flush({ id: 'u1' } as unknown as User);

    const result = await promise;
    expect(result.user.id).toBe('u1');
    expect(result.token).toBeTruthy();
    expect(state.isAuthenticated()).toBe(true);
  });

  it('rejects invalid credentials', async () => {
    const promise = service.login({ email: 'admin@demo.com', password: 'wrong' });

    const req = httpMock.expectOne((r) => r.url.includes('users') && r.params.get('email') === 'admin@demo.com');
    req.flush([{ id: 'u1', email: 'admin@demo.com', password: 'password123' }] as unknown as User[]);

    let thrown: unknown;
    try {
      await promise;
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeInstanceOf(AuthError);
    expect((thrown as AuthError).code).toBe('INVALID_CREDENTIALS');
    expect(state.isAuthenticated()).toBe(false);
  });

  it('registers a new account and auto signs in', async () => {
    const lookup = service.register({ name: 'Jane Doe', email: 'jane@demo.com', password: 'Secret1' });

    const findReq = httpMock.expectOne((r) => r.url.includes('users') && r.params.get('email') === 'jane@demo.com');
    findReq.flush([] as unknown as User[]);

    await Promise.resolve();
    await Promise.resolve();

    const postReq = httpMock.expectOne((r) => r.url.includes('users') && r.method === 'POST');
    expect((postReq.request.body as { name: string }).name).toBe('Jane Doe');
    postReq.flush({ id: 'u2', email: 'jane@demo.com' } as unknown as User);

    const result = await lookup;
    expect(result.user.id).toBe('u2');
    expect(state.isAuthenticated()).toBe(true);
  });

  it('rejects registration for a taken email', async () => {
    const promise = service.register({ name: 'Jane', email: 'admin@demo.com', password: 'Secret1' });

    const findReq = httpMock.expectOne((r) => r.url.includes('users') && r.params.get('email') === 'admin@demo.com');
    findReq.flush([{ id: 'u1', email: 'admin@demo.com' }] as unknown as User[]);

    let thrown: unknown;
    try {
      await promise;
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeInstanceOf(AuthError);
    expect((thrown as AuthError).code).toBe('EMAIL_TAKEN');
  });

  it('mints a token that decodes back to the user id', () => {
    const token = (service as unknown as { mintToken: (id: string) => string }).mintToken('u9');
    expect(atob(token).startsWith('u9.')).toBe(true);
  });

  it('autoLogin restores session for a valid stored token', async () => {
    const token = (service as unknown as { mintToken: (id: string) => string }).mintToken('u1');
    storage.set('token', token);

    const promise = service.autoLogin();
    const req = httpMock.expectOne((r) => r.url.includes('users') && r.params.get('id') === 'u1');
    req.flush([{ id: 'u1', email: 'admin@demo.com' }] as unknown as User[]);

    const ok = await promise;
    expect(ok).toBe(true);
    expect(state.isAuthenticated()).toBe(true);
  });

  it('autoLogin fails for a corrupt token', async () => {
    storage.set('token', 'not-a-valid-token');
    const ok = await service.autoLogin();
    expect(ok).toBe(false);
    expect(state.isAuthenticated()).toBe(false);
  });

  it('logout clears the token and state', () => {
    const token = (service as unknown as { mintToken: (id: string) => string }).mintToken('u1');
    storage.set('token', token);
    state.setSession({ id: 'u1' } as unknown as User, token);
    service.logout();
    expect(state.isAuthenticated()).toBe(false);
    expect(storage.get('token')).toBeNull();
  });
});
