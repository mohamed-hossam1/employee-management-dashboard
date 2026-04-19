import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { AuthState } from '../state/auth.state';
import { StorageService } from './storage.service';
import { ApiService } from './api.service';
import { User } from '../models/user.model';

export interface Credentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface AuthResult {
  user: User;
  token: string;
}

export class AuthError extends Error {
  constructor(
    message: string,
    readonly code: 'INVALID_CREDENTIALS' | 'EMAIL_TAKEN' | 'INVALID_TOKEN' = 'INVALID_CREDENTIALS'
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly storage = inject(StorageService);
  private readonly state = inject(AuthState);

  async login(credentials: Credentials): Promise<AuthResult> {
    const matches = await firstValueFrom(
      this.api.get<User[]>('api/users', { email: credentials.email })
    );
    const user = matches[0];

    if (!user || user.password !== credentials.password) {
      throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const token = this.mintToken(user.id);
    this.storage.set('token', token);
    this.state.setSession(user, token);
    await this.touchLastLogin(user.id);

    return { user, token };
  }

  async register(payload: RegisterPayload): Promise<AuthResult> {
    const existing = await firstValueFrom(
      this.api.get<User[]>('api/users', { email: payload.email })
    );

    if (existing.length > 0) {
      throw new AuthError('An account with this email already exists', 'EMAIL_TAKEN');
    }

    const now = new Date().toISOString();
    const created = await firstValueFrom(
      this.api.post<User>('api/users', {
        name: payload.name,
        email: payload.email,
        password: payload.password,
        avatar: null,
        phone: '',
        bio: '',
        role: 'user',
        createdAt: now,
        lastLogin: now,
        settings: {
          theme: 'light',
          notifications: { email: true, inApp: true, attendanceAlerts: true }
        }
      })
    );

    const token = this.mintToken(created.id);
    this.storage.set('token', token);
    this.state.setSession(created, token);

    return { user: created, token };
  }

  logout(): void {
    this.storage.remove('token');
    this.state.reset();
  }

  async autoLogin(): Promise<boolean> {
    const token = this.storage.get<string>('token');
    if (!token) {
      this.state.reset();
      return false;
    }

    const userId = this.decodeToken(token);
    if (!userId) {
      this.clearSession();
      return false;
    }

    try {
      const user = await firstValueFrom(this.api.get<User[]>(`api/users/${userId}`))
        .then(() => this.fetchUserById(userId))
        .catch(() => null);

      if (!user) {
        this.clearSession();
        return false;
      }

      this.state.setSession(user, token);
      return true;
    } catch {
      this.clearSession();
      return false;
    }
  }

  getCurrentUser(): User | null {
    return this.state.currentUser();
  }

  private async fetchUserById(id: string): Promise<User | null> {
    const users = await firstValueFrom(this.api.get<User[]>('api/users', { id }));
    return users[0] ?? null;
  }

  private async touchLastLogin(id: string): Promise<void> {
    const user = this.state.currentUser();
    if (!user) {
      return;
    }
    const updated: User = { ...user, lastLogin: new Date().toISOString() };
    try {
      await firstValueFrom(this.api.put<User>(`api/users/${id}`, updated));
      this.state.setUser(updated);
    } catch {
      /* best-effort; ignore network failures for lastLogin */
    }
  }

  private mintToken(userId: string): string {
    const issuedAt = Date.now();
    return btoa(`${userId}.${issuedAt}`);
  }

  private decodeToken(token: string): string | null {
    try {
      const decoded = atob(token);
      const [userId] = decoded.split('.');
      return userId || null;
    } catch {
      return null;
    }
  }

  private clearSession(): void {
    this.storage.remove('token');
    this.state.reset();
  }
}
