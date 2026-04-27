import { Component, input, output } from '@angular/core';

import { Project } from '../../../../core/models/project.model';

@Component({
  selector: 'app-project-card',
  imports: [],
  templateUrl: './project-card.html',
  styleUrl: './project-card.css'
})
export class ProjectCardComponent {
  readonly project = input.required<Project>();
  readonly active = input(false);

  readonly activate = output<void>();
  readonly edit = output<void>();
  readonly delete = output<void>();

  protected iconGlyph(icon: string): string {
    const glyphs: Record<string, string> = {
      building: '🏢',
      briefcase: '💼',
      rocket: '🚀',
      globe: '🌐',
      store: '🏬',
      factory: '🏭',
      warehouse: '🏚',
      chart: '📊'
    };
    return glyphs[icon] ?? '◆';
  }
}
