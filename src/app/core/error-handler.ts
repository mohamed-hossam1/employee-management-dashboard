import { ErrorHandler, Injectable, inject, NgZone } from '@angular/core';

import { NotificationService } from './services/notification.service';

/**
 * Application-wide error handler: logs unexpected errors and shows a generic toast
 * so the UI remains usable instead of failing silently.
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly notifications = inject(NotificationService);
  private readonly zone = inject(NgZone);
  private lastToastAt = 0;

  handleError(error: unknown): void {
    // Always log full details for developers
    // eslint-disable-next-line no-console
    console.error('[GlobalErrorHandler]', error);

    // Avoid toast storms if many errors fire in a short window
    const now = Date.now();
    if (now - this.lastToastAt < 1500) {
      return;
    }
    this.lastToastAt = now;

    this.zone.run(() => {
      this.notifications.error('Something went wrong. Please try again.');
    });
  }
}
