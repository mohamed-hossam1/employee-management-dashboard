import { Component, inject, computed, DestroyRef } from '@angular/core';
import { RouterOutlet, RouterLink, NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';

import { SidebarComponent } from '../../shared/sidebar/sidebar';
import { NavbarComponent } from '../../shared/navbar/navbar';
import { NAVIGATION_SECTIONS } from '../../core/navigation/navigation.config';
import { NavigationSection } from '../../core/navigation/navigation-section.model';
import { ThemeState } from '../../core/theme/theme.state';
import { AuthState } from '../../core/state/auth.state';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, SidebarComponent, NavbarComponent],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css'
})
export class MainLayout {
  private readonly router = inject(Router);
  private readonly themeState = inject(ThemeState);
  private readonly authState = inject(AuthState);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly sections = NAVIGATION_SECTIONS;

  readonly collapsed = this.themeState.collapsed;
  readonly drawerOpen = this.themeState.drawerOpen;
  readonly isMobile = this.themeState.isMobile;

  readonly user = computed(() => {
    const current = this.authState.currentUser();
    return { name: current?.name ?? 'User', avatar: current?.avatar ?? null };
  });

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  readonly activeSection = computed<NavigationSection | null>(() => {
    const url = this.currentUrl();
    const matches = this.sections.filter((s) => url.startsWith(s.route.split('/:')[0]));
    return matches.length ? matches[matches.length - 1] : null;
  });

  readonly activeSectionId = computed(() => this.activeSection()?.id ?? '');
  readonly title = computed(() => this.activeSection()?.label ?? 'Dashboard');
  readonly subtitle = computed(() => this.activeSection()?.label ?? '');

  readonly projectSlot = computed(() => ({ projectId: null, name: null }));

  constructor() {
    this.themeState.listenForBreakpoint(this.destroyRef);
  }

  onToggleCollapsed(): void {
    this.themeState.toggleCollapsed();
  }

  openDrawer(): void {
    this.themeState.openDrawer();
  }

  closeDrawer(): void {
    this.themeState.closeDrawer();
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  onSearchFocus(): void {
    /* presentational entry point; global search behavior lands in a later phase */
  }

  onOpenProfile(): void {
    this.router.navigate(['/profile']);
  }

  onOpenSettings(): void {
    this.router.navigate(['/settings']);
  }
}
