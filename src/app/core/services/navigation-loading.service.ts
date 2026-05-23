import { Injectable, inject, signal } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router
} from '@angular/router';

/**
 * Tracks router navigation so the app shell can show a global loading overlay.
 */
@Injectable({ providedIn: 'root' })
export class NavigationLoadingService {
  private readonly router = inject(Router);
  private readonly loadingSignal = signal(false);
  private navigationCount = 0;

  readonly isLoading = this.loadingSignal.asReadonly();

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.navigationCount += 1;
        this.loadingSignal.set(true);
        return;
      }
      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.navigationCount = Math.max(0, this.navigationCount - 1);
        if (this.navigationCount === 0) {
          this.loadingSignal.set(false);
        }
      }
    });
  }
}
