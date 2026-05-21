import { Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { AuthState } from '../../../../core/state/auth.state';
import { NotificationService } from '../../../../core/services/notification.service';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-notification-settings',
  imports: [ReactiveFormsModule],
  templateUrl: './notification-settings.html',
  styleUrl: './notification-settings.css'
})
export class NotificationSettingsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly settings = inject(SettingsService);
  private readonly authState = inject(AuthState);
  private readonly notifications = inject(NotificationService);

  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: [true],
    inApp: [true],
    attendanceAlerts: [true]
  });

  constructor() {
    effect(() => {
      const user = this.authState.currentUser();
      if (!user) {
        return;
      }
      this.form.patchValue(
        {
          email: user.settings.notifications.email,
          inApp: user.settings.notifications.inApp,
          attendanceAlerts: user.settings.notifications.attendanceAlerts
        },
        { emitEvent: false }
      );
    });
  }

  protected async save(): Promise<void> {
    this.saving.set(true);
    try {
      await this.settings.updateNotifications(this.form.getRawValue());
      this.notifications.success('Notification preferences saved.');
    } catch {
      this.notifications.error('Unable to save notification preferences.');
    } finally {
      this.saving.set(false);
    }
  }
}
