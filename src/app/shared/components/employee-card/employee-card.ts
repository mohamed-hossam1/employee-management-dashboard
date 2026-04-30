import { Component, input, output } from '@angular/core';

import { AvatarComponent } from '../avatar/avatar';
import { BadgeComponent, BadgeVariant } from '../badge/badge';

export type EmployeeStatus = 'active' | 'inactive' | 'on-leave';

@Component({
  selector: 'app-employee-card',
  imports: [AvatarComponent, BadgeComponent],
  template: `
    <article class="employee-card" (click)="click.emit()" tabindex="0" (keydown.enter)="click.emit()" (keydown.space)="click.emit()">
      <app-avatar [src]="avatar()" [name]="name()" size="lg" />
      <div class="employee-card__body">
        <h3 class="employee-card__name">{{ name() }}</h3>
        <p class="employee-card__dept">{{ department() }}</p>
        <app-badge [text]="statusLabel()" [variant]="statusVariant()" />
      </div>
    </article>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .employee-card {
        display: flex;
        align-items: center;
        gap: 0.875rem;
        padding: 1rem;
        border: 1px solid var(--border);
        border-radius: 0.75rem;
        background: var(--surface);
        box-shadow: var(--shadow-card);
        cursor: pointer;
      }
      .employee-card:focus-visible {
        outline: 2px solid var(--color-brand);
        outline-offset: 2px;
      }
      .employee-card__body {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .employee-card__name {
        margin: 0;
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--fg);
      }
      .employee-card__dept {
        margin: 0;
        font-size: 0.8125rem;
        color: var(--fg-muted);
      }
    `
  ]
})
export class EmployeeCardComponent {
  readonly avatar = input<string | null>(null);
  readonly name = input.required<string>();
  readonly department = input.required<string>();
  readonly status = input<EmployeeStatus>('active');

  readonly click = output<void>();

  protected statusLabel(): string {
    switch (this.status()) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'on-leave':
        return 'On Leave';
    }
  }

  protected statusVariant(): BadgeVariant {
    switch (this.status()) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      case 'on-leave':
        return 'warning';
    }
  }
}
