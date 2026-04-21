import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { authGuard } from './auth.guard';
import { guestGuard } from './guest.guard';
import { AuthState } from '../state/auth.state';

interface UrlTree {
  commands: unknown;
  extras?: { queryParams?: Record<string, unknown> };
}

describe('Auth guards', () => {
  let state: AuthState;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Router,
          useValue: {
            createUrlTree: (commands: unknown, extras?: { queryParams?: Record<string, unknown> }) =>
              ({ commands, extras }) as UrlTree
          }
        }
      ]
    });
    state = TestBed.inject(AuthState);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  function runGuard(guard: (route: never, state: never) => unknown): unknown {
    return TestBed.runInInjectionContext(() => guard({} as never, {} as never));
  }

  it('authGuard allows authenticated users', () => {
    state.setSession({ id: 'u1' } as never, 'tok');
    expect(runGuard(authGuard as (r: never, s: never) => unknown)).toBe(true);
  });

  it('authGuard redirects unauthenticated users to login with returnUrl', () => {
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/projects' } as never)
    ) as unknown as UrlTree;
    expect(result.commands).toEqual(['/auth/login']);
    expect(result.extras?.queryParams?.['returnUrl']).toBe('/projects');
  });

  it('guestGuard redirects authenticated users away from auth pages', () => {
    state.setSession({ id: 'u1' } as never, 'tok');
    const result = runGuard(guestGuard as (r: never, s: never) => unknown) as unknown as UrlTree;
    expect(result.commands).toEqual(['/projects']);
  });

  it('guestGuard allows unauthenticated users', () => {
    expect(runGuard(guestGuard as (r: never, s: never) => unknown)).toBe(true);
  });
});
