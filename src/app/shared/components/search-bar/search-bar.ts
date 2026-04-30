import { Component, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-search-bar',
  imports: [],
  template: `
    <div class="search-bar" [class]="'search-bar--' + variant()">
      <span class="search-bar__icon" aria-hidden="true">⌕</span>
      <input
        type="search"
        class="search-bar__input"
        [placeholder]="placeholder()"
        [value]="term()"
        (input)="onInput($event)"
        role="searchbox"
        [attr.aria-label]="placeholder() || 'Search'"
      />
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .search-bar {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        border: 1px solid var(--border);
        border-radius: 0.5rem;
        background: var(--surface);
        color: var(--fg);
      }
      .search-bar--contextual {
        background: var(--surface-muted);
      }
      .search-bar__icon {
        color: var(--fg-muted);
        font-size: 1.1rem;
      }
      .search-bar__input {
        flex: 1;
        border: 0;
        background: transparent;
        color: inherit;
        font: inherit;
        outline: none;
      }
      .search-bar__input:focus-visible {
        outline: 2px solid var(--color-brand);
        outline-offset: 2px;
      }
    `
  ]
})
export class SearchBarComponent {
  readonly placeholder = input<string>('');
  readonly debounceMs = input<number>(300);
  readonly variant = input<'global' | 'contextual'>('global');

  readonly searchChange = output<string>();

  protected readonly term = signal('');
  private timer: ReturnType<typeof setTimeout> | null = null;

  protected onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.term.set(value);
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => this.searchChange.emit(value), this.debounceMs());
  }
}
