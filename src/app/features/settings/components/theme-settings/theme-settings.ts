import { Component, inject, signal } from '@angular/core';

import { ThemeValue } from '../../../../core/theme/theme.state';
import { NotificationService } from '../../../../core/services/notification.service';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-theme-settings',
  imports: [],
  templateUrl: './theme-settings.html',
  styleUrl: './theme-settings.css'
})
export class ThemeSettingsComponent {
  private readonly settings = inject(SettingsService);
  private readonly notifications = inject(NotificationService);

  readonly theme = this.settings.theme;
  readonly isDark = this.settings.isDark;
  readonly saving = signal(false);

  protected async setTheme(value: ThemeValue): Promise<void> {
    if (this.theme() === value || this.saving()) {
      return;
    }
    this.saving.set(true);
    try {
      await this.settings.setTheme(value);
      this.notifications.success(
        value === 'dark' ? 'Dark theme applied.' : 'Light theme applied.'
      );
    } catch {
      this.notifications.error('Unable to save theme preference.');
    } finally {
      this.saving.set(false);
    }
  }

  protected async toggle(): Promise<void> {
    await this.setTheme(this.isDark() ? 'light' : 'dark');
  }
}
