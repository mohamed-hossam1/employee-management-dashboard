import { Component, input, output, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { NavigationSection } from '../../core/navigation/navigation-section.model';
import { ActiveProjectSlot } from '../../core/navigation/active-project-slot.model';
import { Project } from '../../core/models/project.model';
import { ThemeState } from '../../core/theme/theme.state';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class SidebarComponent {
  private readonly themeState = inject(ThemeState);

  readonly sections = input.required<NavigationSection[]>();
  readonly collapsed = input(false);
  readonly drawerOpen = input(false);
  readonly isMobile = input(false);
  readonly activeSectionId = input<string>('');
  readonly projectSlot = input<ActiveProjectSlot | null>(null);
  readonly projects = input<Project[]>([]);
  readonly activeProjectId = input<string | null>(null);
  readonly projectSwitchOpen = input(false);

  readonly linkSelected = output<void>();
  readonly toggleCollapsed = output<void>();
  readonly logout = output<void>();
  readonly selectProject = output<string>();
  readonly manageProjects = output<void>();
  readonly toggleProjectSwitch = output<void>();

  readonly isDark = this.themeState.isDark;

  readonly hasProject = computed(() => {
    const slot = this.projectSlot();
    return !!slot && !!slot.projectId;
  });

  protected iconGlyph(icon: string): string {
    const glyphs: Record<string, string> = {
      'layout-dashboard': '▦',
      users: '👥',
      'building-2': '🏢',
      clock: '🕑',
      user: '👤',
      settings: '⚙'
    };
    return glyphs[icon] ?? '•';
  }
}
