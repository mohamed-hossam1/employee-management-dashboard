import { Component, computed, input } from '@angular/core';

import { InitialsPipe } from '../../pipes/initials.pipe';

export type AvatarSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-avatar',
  imports: [InitialsPipe],
  template: `
    <span class="avatar" [class]="'avatar--' + size()">
      @if (src(); as avatarSrc) {
        <img class="avatar__img" [src]="avatarSrc" [alt]="name() + ' avatar'" />
      } @else {
        <span class="avatar__initials" aria-hidden="true">{{ name() | initials }}</span>
      }
    </span>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
      }
      .avatar {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        border-radius: 9999px;
        background: var(--surface-muted);
        color: var(--fg-muted);
        font-weight: 600;
      }
      .avatar--sm {
        width: 2rem;
        height: 2rem;
        font-size: 0.75rem;
      }
      .avatar--md {
        width: 2.5rem;
        height: 2.5rem;
        font-size: 0.875rem;
      }
      .avatar--lg {
        width: 3.5rem;
        height: 3.5rem;
        font-size: 1.125rem;
      }
      .avatar__img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .avatar__initials {
        user-select: none;
      }
    `
  ]
})
export class AvatarComponent {
  readonly src = input<string | null>(null);
  readonly name = input.required<string>();
  readonly size = input<AvatarSize>('md');

  protected readonly hasImage = computed(() => !!this.src());
}
