import { TestBed } from '@angular/core/testing';

import { AuthState } from './auth.state';
import { User } from '../models/user.model';

describe('AuthState', () => {
  let state: AuthState;

  const makeUser = (overrides: Partial<User> = {}): User => ({
    id: 'u1',
    name: 'Test User',
    email: 'test@example.com',
    password: 'Secret1',
    avatar: null,
    phone: '',
    bio: '',
    role: 'user',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    settings: { theme: 'light', notifications: { email: true, inApp: true, attendanceAlerts: true } },
    ...overrides
  });

  beforeEach(() => {
    TestBed.configureTestingModule({});
    state = TestBed.inject(AuthState);
  });

  it('is unauthenticated by default', () => {
    expect(state.isAuthenticated()).toBe(false);
    expect(state.currentUser()).toBeNull();
    expect(state.token()).toBeNull();
  });

  it('is authenticated once a session is set', () => {
    state.setSession(makeUser(), 'token-abc');
    expect(state.isAuthenticated()).toBe(true);
    expect(state.currentUser()?.id).toBe('u1');
    expect(state.token()).toBe('token-abc');
  });

  it('resets all state on logout', () => {
    state.setSession(makeUser(), 'token-abc');
    state.reset();
    expect(state.isAuthenticated()).toBe(false);
    expect(state.currentUser()).toBeNull();
    expect(state.token()).toBeNull();
  });
});
