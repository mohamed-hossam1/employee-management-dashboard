import { Component, inject, computed, DestroyRef, effect, viewChild, ElementRef } from '@angular/core';
import { RouterOutlet, NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';

import { SidebarComponent } from '../../shared/sidebar/sidebar';
import { NavbarComponent } from '../../shared/navbar/navbar';
import { NAVIGATION_SECTIONS } from '../../core/navigation/navigation.config';
import { NavigationSection } from '../../core/navigation/navigation-section.model';
import { ThemeState } from '../../core/theme/theme.state';
import { AuthState } from '../../core/state/auth.state';
import { AuthService } from '../../core/services/auth.service';
import { ProjectState } from '../../core/state/project.state';
import { ProjectService } from '../../core/services/project.service';
import { ActiveProjectSlot } from '../../core/navigation/active-project-slot.model';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, SidebarComponent, NavbarComponent],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css'
})
export class MainLayout {
  private readonly router = inject(Router);
  private readonly themeState = inject(ThemeState);
  private readonly authState = inject(AuthState);
  private readonly authService = inject(AuthService);
  private readonly projectState = inject(ProjectState);
  private readonly projectService = inject(ProjectService);
  private readonly destroyRef = inject(DestroyRef);

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

  readonly projectSlot = computed<ActiveProjectSlot>(() => {
    const active = this.projectState.activeProject();
    return { projectId: active?.id ?? null, name: active?.name ?? null, color: active?.color ?? null };
  });

  readonly projectSwitchOpen = computed(() => this.themeState.projectSwitchOpen());

  readonly projects = this.projectState.projects;
  readonly activeProjectId = this.projectState.activeProjectId;

  /** Resolve `/p/:projectId/...` placeholders so sidebar links navigate correctly. */
  readonly sections = computed<NavigationSection[]>(() => {
    const projectId = this.activeProjectId();
    return NAVIGATION_SECTIONS.map((section) => {
      if (!section.route.includes(':projectId')) {
        return { ...section, disabled: false };
      }
      if (!projectId) {
        // Do not map every workspace link to `/projects` — that marks all of them
        // active and makes them look broken after first login.
        return { ...section, route: '', disabled: true };
      }
      return {
        ...section,
        route: section.route.replace(':projectId', projectId),
        disabled: false
      };
    });
  });

  readonly activeSection = computed<NavigationSection | null>(() => {
    const url = this.currentUrl().split('?')[0] ?? '';
    const sections = this.sections();

    // Account / workspace picker first so placeholder routes never steal the title.
    if (url.startsWith('/projects')) {
      return { id: 'projects', label: 'Projects', icon: 'briefcase', route: '/projects' };
    }
    if (url.startsWith('/profile')) {
      return sections.find((s) => s.id === 'profile') ?? null;
    }
    if (url.startsWith('/settings')) {
      return sections.find((s) => s.id === 'settings') ?? null;
    }

    // Prefer the longest concrete match so /p/{id}/employees wins over shorter paths.
    let best: NavigationSection | null = null;
    for (const section of sections) {
      if (section.disabled || !section.route) {
        continue;
      }
      if (url === section.route || url.startsWith(`${section.route}/`)) {
        if (!best || section.route.length > best.route.length) {
          best = section;
        }
      }
    }

    return best;
  });

  readonly activeSectionId = computed(() => this.activeSection()?.id ?? '');
  readonly title = computed(() => this.activeSection()?.label ?? 'App');
  readonly subtitle = computed(() => {
    const active = this.projectState.activeProject();
    const section = this.activeSection();
    if (!section) {
      return '';
    }
    if (section.id === 'profile' || section.id === 'settings' || section.id === 'projects') {
      return section.label;
    }
    return active?.name ? `Workspace · ${active.name}` : section.label;
  });

  async onSelectProject(id: string): Promise<void> {
    const user = this.authState.currentUser();
    if (!user) {
      await this.router.navigateByUrl('/auth/login');
      return;
    }
    try {
      await this.projectService.setActiveProject(id, user.id);
      this.themeState.closeProjectSwitch();
      await this.router.navigateByUrl(`/p/${id}/dashboard`);
    } catch {
      // Error interceptor notifies the user.
    }
  }

  onManageProjects(): void {
    this.themeState.closeProjectSwitch();
    void this.router.navigateByUrl('/projects');
  }

  async onToggleProjectSwitch(): Promise<void> {
    const willOpen = !this.themeState.projectSwitchOpen();
    if (willOpen) {
      await this.ensureProjectsLoaded();
    }
    this.themeState.toggleProjectSwitch();
  }

  private readonly sidebarRef = viewChild('sidebarEl', { read: ElementRef });
  private lastFocused: HTMLElement | null = null;

  constructor() {
    this.themeState.listenForBreakpoint(this.destroyRef);
    // Ensure the workspace picker has data even if the user never opened /projects.
    void this.ensureProjectsLoaded();

    effect(() => {
      const open = this.drawerOpen();
      const host = this.sidebarRef()?.nativeElement as HTMLElement | undefined;
      if (open && host) {
        this.lastFocused = (document.activeElement as HTMLElement) ?? null;
        const focusable = host.querySelector<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        focusable?.focus();
      } else if (!open && this.lastFocused) {
        this.lastFocused.focus();
        this.lastFocused = null;
      }
    });
  }

  private async ensureProjectsLoaded(): Promise<void> {
    const user = this.authState.currentUser();
    if (!user || this.projectState.projects().length > 0) {
      return;
    }
    try {
      await this.projectService.getProjects(user.id);
    } catch {
      // Error interceptor notifies; picker shows empty state.
    }
  }

  onDrawerKeydown(event: KeyboardEvent): void {
    if (!this.drawerOpen()) {
      return;
    }
    if (event.key !== 'Tab') {
      return;
    }
    const host = this.sidebarRef()?.nativeElement as HTMLElement | undefined;
    if (!host) {
      return;
    }
    const focusable = Array.from(
      host.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
    if (focusable.length === 0) {
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement;
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
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
    this.projectService.reset();
    void this.router.navigate(['/auth/login']);
  }

  onSearchFocus(): void {
    /* presentational entry point; global search behavior lands in a later phase */
  }

  onOpenProfile(): void {
    void this.router.navigateByUrl('/profile');
  }

  onOpenSettings(): void {
    void this.router.navigateByUrl('/settings');
  }
}
