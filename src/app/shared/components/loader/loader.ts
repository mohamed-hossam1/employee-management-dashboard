import { Component, input } from '@angular/core';

export type LoaderVariant = 'overlay' | 'inline' | 'button';

@Component({
  selector: 'app-loader',
  imports: [],
  template: `
    <span
      class="loader"
      [class]="'loader--' + variant()"
      role="status"
      [attr.aria-label]="variant() === 'button' ? null : 'Loading'"
    >
      <span class="loader__spinner" aria-hidden="true"></span>
    </span>
  `,
  styles: [
    `
      :host {
        display: contents;
      }
      .loader {
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .loader--overlay {
        position: absolute;
        inset: 0;
        background: color-mix(in srgb, var(--surface) 70%, transparent);
        z-index: 5;
      }
      .loader--inline {
        display: inline-flex;
      }
      .loader--button {
        display: inline-flex;
      }
      .loader__spinner {
        width: 1.25rem;
        height: 1.25rem;
        border: 2px solid var(--border);
        border-top-color: var(--color-brand);
        border-radius: 9999px;
        animation: loader-spin 0.7s linear infinite;
      }
      .loader--overlay .loader__spinner {
        width: 2rem;
        height: 2rem;
      }
      @keyframes loader-spin {
        to {
          transform: rotate(360deg);
        }
      }
    `
  ]
})
export class LoaderComponent {
  readonly variant = input<LoaderVariant>('inline');
}
