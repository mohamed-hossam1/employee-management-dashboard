import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
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
  private readonly authService = inject(AuthService);
  private readonly authState = inject(AuthState);
  private readonly csv = inject(CsvService);

  getCurrentUser(): User | null {
    return this.authState.currentUser();
  }

  async reloadCurrentUser(): Promise<User | null> {
    return this.authService.reloadCurrentUser();
  }

  async updateProfile(input: ProfileUpdateInput): Promise<User> {
    const user = this.requireUser();

    if (input.email.trim().toLowerCase() !== user.email.trim().toLowerCase()) {
      await this.authService.updateAuthEmail(input.email);
    }

    await this.putUser({
      ...user,
      name: input.name.trim(),
      phone: input.phone.trim(),
      bio: input.bio.trim()
    });

    const reloaded = await this.reloadCurrentUser();
    if (!reloaded) {
      throw new Error('Unable to reload your profile.');
    }
    return reloaded;
  }

  async updateAvatar(avatar: string | null): Promise<User> {
    const user = this.requireUser();
    return this.putUser({ ...user, avatar });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.authService.changePassword(currentPassword, newPassword);
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
    await firstValueFrom(this.api.rpc('delete_my_account'));
  }

  private async putUser(user: User): Promise<User> {
    const updated = await firstValueFrom(this.api.put<User>(`profiles/${user.id}`, user));
    this.authState.setUser(updated);
    return updated;
  }

  private requireUser(): User {
    const user = this.authState.currentUser();
    if (!user) {
      throw new Error('You must be signed in.');
    }
    return user;
  }
}
