import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpStatusCode } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../environments/environment';
import { User, UserSettings } from '../models/user.model';
import { AuthState } from '../state/auth.state';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';

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

interface StoredSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface SupabaseAuthUser {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  user_metadata?: Record<string, unknown>;
}

interface SupabaseAuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: SupabaseAuthUser;
}

interface ProfileRecord {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  phone: string;
  bio: string;
  role: 'admin' | 'user';
  createdAt: string;
  lastLogin: string;
  settings: UserSettings;
}

export class AuthError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'INVALID_CREDENTIALS'
      | 'EMAIL_TAKEN'
      | 'EMAIL_CONFIRMATION_REQUIRED'
      | 'INVALID_TOKEN' = 'INVALID_CREDENTIALS'
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

  private readonly authUrl = `${environment.supabaseUrl}/auth/v1`;
  private readonly apiKey = environment.supabasePublishableKey;

  async login(credentials: Credentials): Promise<AuthResult> {
    try {
      const response = await firstValueFrom(
        this.http.post<SupabaseAuthResponse>(
          `${this.authUrl}/token?grant_type=password`,
          credentials,
          { headers: this.baseHeaders() }
        )
      );

      return this.applySession(response);
    } catch (error) {
      throw this.toAuthError(error, 'INVALID_CREDENTIALS');
    }
  }

  async register(payload: RegisterPayload): Promise<AuthResult> {
    try {
      const response = await firstValueFrom(
        this.http.post<Partial<SupabaseAuthResponse> & { user: SupabaseAuthUser }>(
          `${this.authUrl}/signup`,
          {
            email: payload.email.trim().toLowerCase(),
            password: payload.password,
            data: { name: payload.name.trim() }
          },
          { headers: this.baseHeaders() }
        )
      );

      if (!response.access_token || !response.refresh_token || !response.expires_in) {
        throw new AuthError(
          'Account created. Confirm the email from Supabase before signing in.',
          'EMAIL_CONFIRMATION_REQUIRED'
        );
      }

      return this.applySession(response as SupabaseAuthResponse, payload.name.trim());
    } catch (error) {
      throw this.toAuthError(error, 'EMAIL_TAKEN');
    }
  }

  async autoLogin(): Promise<boolean> {
    const stored = this.storage.get<StoredSession>('session');
    if (!stored) {
      this.clearSession();
      return false;
    }

    try {
      const session = await this.ensureValidSession(stored);
      const authUser = await this.fetchAuthUser(session.accessToken);
      this.state.setToken(session.accessToken);
      const user = await this.syncProfile(authUser);
      this.state.setSession(user, session.accessToken);
      this.storage.set('session', session);
      return true;
    } catch {
      this.clearSession();
      return false;
    }
  }

  logout(): void {
    const token = this.state.token();
    if (token) {
      void firstValueFrom(
        this.http.post(
          `${this.authUrl}/logout`,
          {},
          { headers: this.authorizedHeaders(token) }
        )
      ).catch(() => undefined);
    }

    this.clearSession();
  }

  getCurrentUser(): User | null {
    return this.state.currentUser();
  }

  async reloadCurrentUser(): Promise<User | null> {
    const stored = this.storage.get<StoredSession>('session');
    if (!stored) {
      return null;
    }

    const session = await this.ensureValidSession(stored);
    const authUser = await this.fetchAuthUser(session.accessToken);
    this.state.setToken(session.accessToken);
    const user = await this.syncProfile(authUser);
    this.state.setSession(user, session.accessToken);
    this.storage.set('session', session);
    return user;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const user = this.state.currentUser();
    if (!user) {
      throw new Error('You must be signed in.');
    }
    if (newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters.');
    }

    try {
      await firstValueFrom(
        this.http.post<SupabaseAuthResponse>(
          `${this.authUrl}/token?grant_type=password`,
          {
            email: user.email,
            password: currentPassword
          },
          { headers: this.baseHeaders() }
        )
      );
    } catch {
      throw new Error('Current password is incorrect.');
    }

    const token = this.state.token();
    if (!token) {
      throw new Error('You must be signed in.');
    }

    await firstValueFrom(
      this.http.put(
        `${this.authUrl}/user`,
        { password: newPassword },
        { headers: this.authorizedHeaders(token) }
      )
    );
  }

  async updateAuthEmail(nextEmail: string): Promise<void> {
    const token = this.state.token();
    if (!token) {
      throw new Error('You must be signed in.');
    }

    await firstValueFrom(
      this.http.put(
        `${this.authUrl}/user`,
        { email: nextEmail.trim().toLowerCase() },
        { headers: this.authorizedHeaders(token) }
      )
    );
  }

  private async applySession(
    response: SupabaseAuthResponse,
    preferredName?: string
  ): Promise<AuthResult> {
    const session = this.toStoredSession(response);
    this.state.setToken(session.accessToken);
    const user = await this.syncProfile(response.user, preferredName);
    this.storage.set('session', session);
    this.state.setSession(user, session.accessToken);
    return { user, token: session.accessToken };
  }

  private async ensureValidSession(stored: StoredSession): Promise<StoredSession> {
    if (Date.now() < stored.expiresAt - 60_000) {
      return stored;
    }

    const response = await firstValueFrom(
      this.http.post<SupabaseAuthResponse>(
        `${this.authUrl}/token?grant_type=refresh_token`,
        { refresh_token: stored.refreshToken },
        { headers: this.baseHeaders() }
      )
    );

    return this.toStoredSession(response);
  }

  private async fetchAuthUser(accessToken: string): Promise<SupabaseAuthUser> {
    return firstValueFrom(
      this.http.get<SupabaseAuthUser>(`${this.authUrl}/user`, {
        headers: this.authorizedHeaders(accessToken)
      })
    );
  }

  private async syncProfile(authUser: SupabaseAuthUser, preferredName?: string): Promise<User> {
    const profiles = await firstValueFrom(
      this.api.get<ProfileRecord[]>('profiles', { id: authUser.id })
    );
    const existing = profiles[0] ?? null;
    const now = new Date().toISOString();
    const profile = await firstValueFrom(
      this.api.upsert<ProfileRecord>('profiles', {
        id: authUser.id,
        email: authUser.email ?? existing?.email ?? '',
        name:
          preferredName ??
          existing?.name ??
          this.userMetadataName(authUser.user_metadata) ??
          (authUser.email?.split('@')[0] ?? 'User'),
        avatar: existing?.avatar ?? null,
        phone: existing?.phone ?? '',
        bio: existing?.bio ?? '',
        role: existing?.role ?? 'user',
        createdAt: existing?.createdAt ?? authUser.created_at ?? now,
        lastLogin: authUser.last_sign_in_at ?? now,
        settings: existing?.settings ?? this.defaultSettings()
      })
    );

    return {
      id: authUser.id,
      name: profile.name,
      email: profile.email || authUser.email || '',
      avatar: profile.avatar,
      phone: profile.phone,
      bio: profile.bio,
      role: profile.role,
      createdAt: profile.createdAt || authUser.created_at,
      lastLogin: profile.lastLogin || authUser.last_sign_in_at || authUser.created_at,
      settings: profile.settings ?? this.defaultSettings()
    };
  }

  private toStoredSession(response: SupabaseAuthResponse): StoredSession {
    return {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiresAt: Date.now() + response.expires_in * 1000
    };
  }

  private clearSession(): void {
    this.storage.remove('session');
    this.storage.remove('token');
    this.state.reset();
  }

  private baseHeaders(): HttpHeaders {
    return new HttpHeaders({
      apikey: this.apiKey,
      'Content-Type': 'application/json'
    });
  }

  private authorizedHeaders(token: string): HttpHeaders {
    return this.baseHeaders().set('Authorization', `Bearer ${token}`);
  }

  private userMetadataName(metadata?: Record<string, unknown>): string | null {
    const value = metadata?.['name'];
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }

  private defaultSettings(): UserSettings {
    return {
      theme: 'light',
      notifications: {
        email: true,
        inApp: true,
        attendanceAlerts: true
      }
    };
  }

  private toAuthError(error: unknown, fallback: AuthError['code']): AuthError {
    if (error instanceof AuthError) {
      return error;
    }

    const message =
      error instanceof Error
        ? error.message
        : 'Authentication failed.';

    if (message.toLowerCase().includes('already registered')) {
      return new AuthError('An account with this email already exists.', 'EMAIL_TAKEN');
    }

    if (message.toLowerCase().includes('email not confirmed')) {
      return new AuthError(
        'Confirm your email address before signing in.',
        'EMAIL_CONFIRMATION_REQUIRED'
      );
    }

    if (
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      (error as { status?: number }).status === HttpStatusCode.Unauthorized
    ) {
      return new AuthError('Invalid email or password.', 'INVALID_CREDENTIALS');
    }

    return new AuthError(message, fallback);
  }
}
