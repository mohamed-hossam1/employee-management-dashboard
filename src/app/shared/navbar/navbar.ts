import { Component, input, output, inject } from '@angular/core';

import { ThemeService } from '../../core/theme/theme.service';

@Component({
  selector: 'app-navbar',
  imports: [],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent {
  private readonly themeService = inject(ThemeService);

  readonly title = input('');
  readonly subtitle = input('');
  readonly user = input<{ name: string; avatar: string | null }>({ name: '', avatar: null });
  readonly isMobile = input(false);

  readonly menuToggle = output<void>();
  readonly openProfile = output<void>();
  readonly openSettings = output<void>();
  readonly logout = output<void>();

  readonly isDark = this.themeService.isDark;

  protected toggleTheme(): void {
    this.themeService.toggle();
  }
}
