import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';
import { AuthState } from '../../../core/state/auth.state';
import { CsvService } from '../../../core/services/csv.service';
import {
  NotificationPreferences,
  User,
  UserSettings
} from '../../../core/models/user.model';

export interface ProfileUpdateInput {
  name: string;
  email: string;
  phone: string;
  bio: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly api = inject(ApiService);
  private readonly authState = inject(AuthState);
  private readonly csv = inject(CsvService);

  getCurrentUser(): User | null {
    return this.authState.currentUser();
  }

  async reloadCurrentUser(): Promise<User | null> {
    const current = this.authState.currentUser();
    if (!current) {
      return null;
    }
    const users = await firstValueFrom(this.api.get<User[]>('users', { id: current.id }));
    const user = users[0] ?? null;
    if (user) {
      this.authState.setUser(user);
    }
    return user;
  }

  async updateProfile(input: ProfileUpdateInput): Promise<User> {
    const user = this.requireUser();
    await this.ensureEmailUnique(input.email, user.id);
    const updated = await this.putUser({
      ...user,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      bio: input.bio.trim()
    });
    return updated;
  }

  async updateAvatar(avatar: string | null): Promise<User> {
    const user = this.requireUser();
    return this.putUser({ ...user, avatar });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<User> {
    const user = this.requireUser();
    if (user.password !== currentPassword) {
      throw new Error('Current password is incorrect.');
    }
    if (newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters.');
    }
    return this.putUser({ ...user, password: newPassword });
  }

  async updateSettings(settings: UserSettings): Promise<User> {
    const user = this.requireUser();
    return this.putUser({
      ...user,
      settings: {
        theme: settings.theme,
        notifications: { ...settings.notifications }
      }
    });
  }

  async updateNotifications(notifications: NotificationPreferences): Promise<User> {
    const user = this.requireUser();
    return this.putUser({
      ...user,
      settings: {
        ...user.settings,
        notifications: { ...notifications }
      }
    });
  }

  async updateThemePreference(theme: 'light' | 'dark'): Promise<User> {
    const user = this.requireUser();
    return this.putUser({
      ...user,
      settings: {
        ...user.settings,
        theme
      }
    });
  }

  exportUserData(): void {
    const user = this.requireUser();
    this.csv.export(
      [
        {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          bio: user.bio,
          role: user.role,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
          theme: user.settings.theme,
          emailNotifications: user.settings.notifications.email,
          inAppNotifications: user.settings.notifications.inApp,
          attendanceAlerts: user.settings.notifications.attendanceAlerts
        }
      ],
      'my-account-data.csv'
    );
  }

  async deleteAccount(): Promise<void> {
    const user = this.requireUser();
    await firstValueFrom(this.api.delete<void>(`users/${user.id}`));
  }

  verifyCurrentPassword(password: string): boolean {
    const user = this.getCurrentUser();
    return !!user && user.password === password;
  }

  private async putUser(user: User): Promise<User> {
    const updated = await firstValueFrom(this.api.put<User>(`users/${user.id}`, user));
    this.authState.setUser(updated);
    return updated;
  }

  private async ensureEmailUnique(email: string, excludeId: string): Promise<void> {
    const matches = await firstValueFrom(
      this.api.get<User[]>('users', { email: email.trim().toLowerCase() })
    );
    if (matches.some((u) => u.id !== excludeId)) {
      throw new Error('An account with this email already exists.');
    }
  }

  private requireUser(): User {
    const user = this.authState.currentUser();
    if (!user) {
      throw new Error('You must be signed in.');
    }
    return user;
  }
}
