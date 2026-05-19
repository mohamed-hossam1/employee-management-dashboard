import { Injectable, inject } from '@angular/core';

import { ThemeService } from '../../../core/theme/theme.service';
import { ThemeValue } from '../../../core/theme/theme.state';
import { NotificationPreferences } from '../../../core/models/user.model';
import { ProfileService } from '../../profile/services/profile.service';

/**
 * Thin facade over ProfileService + ThemeService for settings-page concerns.
 */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly profile = inject(ProfileService);
  private readonly themeService = inject(ThemeService);

  readonly theme = this.themeService.theme;
  readonly isDark = this.themeService.isDark;

  async setTheme(value: ThemeValue): Promise<void> {
    this.themeService.setTheme(value);
    await this.profile.updateThemePreference(value);
  }

  async toggleTheme(): Promise<void> {
    const next: ThemeValue = this.themeService.theme() === 'dark' ? 'light' : 'dark';
    await this.setTheme(next);
  }

  async updateNotifications(notifications: NotificationPreferences): Promise<void> {
    await this.profile.updateNotifications(notifications);
  }

  exportData(): void {
    this.profile.exportUserData();
  }

  async deleteAccount(): Promise<void> {
    await this.profile.deleteAccount();
  }
}
