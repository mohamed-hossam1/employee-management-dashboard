import { Injectable, signal, computed } from '@angular/core';

import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthState {
  private readonly currentUserSignal = signal<User | null>(null);
  private readonly tokenSignal = signal<string | null>(null);

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly token = this.tokenSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null && this.tokenSignal() !== null);

  setSession(user: User, token: string): void {
    this.currentUserSignal.set(user);
    this.tokenSignal.set(token);
  }

  setUser(user: User): void {
    this.currentUserSignal.set(user);
  }

  setToken(token: string): void {
    this.tokenSignal.set(token);
  }

  reset(): void {
    this.currentUserSignal.set(null);
    this.tokenSignal.set(null);
  }
}
