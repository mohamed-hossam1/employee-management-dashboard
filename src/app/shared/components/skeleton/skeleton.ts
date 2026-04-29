import { Component, input } from '@angular/core';

export type SkeletonVariant = 'text' | 'circle' | 'rectangle';

@Component({
  selector: 'app-skeleton',
  imports: [],
  template: `
    <span
      class="skeleton"
      [class]="'skeleton--' + variant()"
      [style.width]="width()"
      [style.height]="height()"
      aria-hidden="true"
    ></span>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
      }
      .skeleton {
        display: block;
        background: var(--surface-muted);
        border-radius: 0.375rem;
        animation: skeleton-pulse 1.5s ease-in-out infinite;
      }
      .skeleton--text {
        height: 0.875rem;
        width: 100%;
        border-radius: 0.25rem;
      }
      .skeleton--circle {
        border-radius: 9999px;
      }
      .skeleton--rectangle {
        width: 100%;
        height: 4rem;
      }
      @keyframes skeleton-pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.45;
        }
      }
    `
  ]
})
export class SkeletonComponent {
  readonly variant = input<SkeletonVariant>('text');
  readonly width = input<string>('');
  readonly height = input<string>('');
}
