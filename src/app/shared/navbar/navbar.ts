import { Component, input, output, inject } from '@angular/core';

import { ThemeState } from '../../core/theme/theme.state';

@Component({
  selector: 'app-navbar',
  imports: [],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent {
  private readonly themeState = inject(ThemeState);

  readonly title = input('');
  readonly subtitle = input('');
  readonly user = input<{ name: string; avatar: string | null }>({ name: '', avatar: null });
  readonly isMobile = input(false);

  readonly menuToggle = output<void>();
  readonly openProfile = output<void>();
  readonly openSettings = output<void>();
  readonly logout = output<void>();

  readonly isDark = this.themeState.isDark;
}
