import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-account-settings',
  imports: [ConfirmDialogComponent],
  templateUrl: './account-settings.html',
  styleUrl: './account-settings.css'
})
export class AccountSettingsComponent {
  private readonly settings = inject(SettingsService);
  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  readonly deleteOpen = signal(false);
  readonly deleting = signal(false);

  protected exportData(): void {
    try {
      this.settings.exportData();
      this.notifications.success('Account data exported.');
    } catch {
      this.notifications.error('Unable to export account data.');
    }
  }

  protected openDelete(): void {
    this.deleteOpen.set(true);
  }

  protected closeDelete(): void {
    this.deleteOpen.set(false);
  }

  protected async confirmDelete(): Promise<void> {
    this.deleting.set(true);
    try {
      await this.settings.deleteAccount();
      this.auth.logout();
      this.deleteOpen.set(false);
      this.notifications.success('Your account has been deleted.');
      this.router.navigate(['/auth/login']);
    } catch {
      this.notifications.error('Unable to delete account.');
    } finally {
      this.deleting.set(false);
    }
  }
}
