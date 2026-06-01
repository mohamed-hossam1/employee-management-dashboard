import { Injectable, inject, signal } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationSkipped,
  NavigationStart,
  Router
} from '@angular/router';

/**
 * Tracks router navigation so the app shell can show a global loading indicator.
 * Terminal events (including NavigationSkipped) always clear the counter so the
 * overlay cannot get stuck and block interaction after login.
 */
@Injectable({ providedIn: 'root' })
export class NavigationLoadingService {
  private readonly router = inject(Router);
  private readonly loadingSignal = signal(false);
  private navigationCount = 0;
  private clearTimer: ReturnType<typeof setTimeout> | null = null;

  readonly isLoading = this.loadingSignal.asReadonly();

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.navigationCount += 1;
        this.loadingSignal.set(true);
        this.armSafetyClear();
        return;
      }

      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError ||
        event instanceof NavigationSkipped
      ) {
        this.navigationCount = Math.max(0, this.navigationCount - 1);
        if (this.navigationCount === 0) {
          this.loadingSignal.set(false);
          this.clearSafetyTimer();
        }
      }
    });
  }

  /** Fail-safe: never leave the loading flag stuck after a long navigation. */
  private armSafetyClear(): void {
    this.clearSafetyTimer();
    this.clearTimer = setTimeout(() => {
      this.navigationCount = 0;
      this.loadingSignal.set(false);
      this.clearTimer = null;
    }, 8_000);
  }

  private clearSafetyTimer(): void {
    if (this.clearTimer !== null) {
      clearTimeout(this.clearTimer);
      this.clearTimer = null;
    }
  }
}
