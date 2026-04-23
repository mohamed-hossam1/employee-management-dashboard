import { signal, computed, Injectable, inject, NgZone, PLATFORM_ID, DestroyRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ThemeValue = 'light' | 'dark';

const MOBILE_QUERY = '(max-width: 1023px)';

@Injectable({ providedIn: 'root' })
export class ThemeState {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly zone = inject(NgZone);

  private readonly themeSignal = signal<ThemeValue>('light');
  private readonly collapsedSignal = signal(false);
  private readonly drawerOpenSignal = signal(false);
  private readonly isMobileSignal = signal(false);

  readonly theme = this.themeSignal.asReadonly();
  readonly isDark = computed(() => this.themeSignal() === 'dark');
  readonly collapsed = this.collapsedSignal.asReadonly();
  readonly drawerOpen = this.drawerOpenSignal.asReadonly();
  readonly isMobile = this.isMobileSignal.asReadonly();

  setTheme(value: ThemeValue): void {
    this.themeSignal.set(value);
  }

  toggleTheme(): void {
    this.themeSignal.update((current) => (current === 'dark' ? 'light' : 'dark'));
  }

  toggleCollapsed(): void {
    this.collapsedSignal.update((collapsed) => !collapsed);
  }

  openDrawer(): void {
    this.drawerOpenSignal.set(true);
  }

  closeDrawer(): void {
    this.drawerOpenSignal.set(false);
  }

  setMobile(isMobile: boolean): void {
    this.isMobileSignal.set(isMobile);
    if (!isMobile && this.drawerOpenSignal()) {
      this.drawerOpenSignal.set(false);
    }
  }

  listenForBreakpoint(destroyRef: DestroyRef): void {
    if (!isPlatformBrowser(this.platformId) || typeof window === 'undefined' || !window.matchMedia) {
      return;
    }
    const mql = window.matchMedia(MOBILE_QUERY);
    this.setMobile(mql.matches);
    const handler = (event: MediaQueryListEvent) => this.setMobile(event.matches);
    mql.addEventListener('change', handler);
    destroyRef.onDestroy(() => mql.removeEventListener('change', handler));
  }
}
