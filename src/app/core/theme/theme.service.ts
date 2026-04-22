import { Injectable, inject } from '@angular/core';

import { StorageService } from '../services/storage.service';
import { ThemeState, ThemeValue } from './theme.state';

const THEME_KEY = 'theme' as const;

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storage = inject(StorageService);
  private readonly state = inject(ThemeState);

  readonly theme = this.state.theme;
  readonly isDark = this.state.isDark;

  init(): void {
    const stored = this.storage.get<ThemeValue>(THEME_KEY);
    const initial: ThemeValue =
      stored === 'light' || stored === 'dark' ? stored : this.resolveSystemTheme();
    this.applyTheme(initial);
  }

  toggle(): void {
    this.setTheme(this.state.theme() === 'dark' ? 'light' : 'dark');
  }

  setTheme(value: ThemeValue): void {
    this.applyTheme(value);
    this.storage.set(THEME_KEY, value);
  }

  private resolveSystemTheme(): ThemeValue {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return 'light';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private applyTheme(value: ThemeValue): void {
    this.state.setTheme(value);
    const root = document.documentElement;
    root.classList.toggle('dark', value === 'dark');
  }
}
