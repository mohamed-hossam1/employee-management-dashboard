import { signal, computed, Injectable } from '@angular/core';

export type ThemeValue = 'light' | 'dark';

const DESKTOP_BREAKPOINT = 1024;

@Injectable({ providedIn: 'root' })
export class ThemeState {
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
}
