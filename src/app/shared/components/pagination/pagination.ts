import { Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  imports: [],
  template: `
    <nav class="pagination" aria-label="Pagination">
      <button
        type="button"
        class="pagination__btn"
        [disabled]="page() <= 1"
        (click)="goTo(page() - 1)"
        aria-label="Previous page"
      >
        ‹
      </button>

      <span class="pagination__status">
        Page {{ page() }} of {{ totalPages() }}
      </span>

      <button
        type="button"
        class="pagination__btn"
        [disabled]="page() >= totalPages()"
        (click)="goTo(page() + 1)"
        aria-label="Next page"
      >
        ›
      </button>

      <label class="pagination__size">
        <span class="pagination__size-label">Per page</span>
        <select
          class="pagination__select"
          [value]="pageSize()"
          (change)="onSizeChange($event)"
          aria-label="Items per page"
        >
          @for (size of pageSizes(); track size) {
            <option [value]="size">{{ size }}</option>
          }
        </select>
      </label>
    </nav>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .pagination {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: var(--fg-muted);
      }
      .pagination__btn {
        min-width: 2rem;
        height: 2rem;
        padding: 0 0.5rem;
        border: 1px solid var(--border);
        border-radius: 0.375rem;
        background: var(--surface);
        color: var(--fg);
        cursor: pointer;
      }
      .pagination__btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .pagination__btn:not(:disabled):focus-visible {
        outline: 2px solid var(--color-brand);
        outline-offset: 2px;
      }
      .pagination__status {
        padding: 0 0.25rem;
      }
      .pagination__size {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        margin-left: 0.5rem;
      }
      .pagination__select {
        padding: 0.25rem 0.375rem;
        border: 1px solid var(--border);
        border-radius: 0.375rem;
        background: var(--surface);
        color: var(--fg);
        font: inherit;
      }
      .pagination__select:focus-visible {
        outline: 2px solid var(--color-brand);
        outline-offset: 2px;
      }
    `
  ]
})
export class PaginationComponent {
  readonly total = input.required<number>();
  readonly page = input<number>(1);
  readonly pageSize = input<number>(10);
  readonly pageSizes = input<number[]>([10, 25, 50]);

  readonly pageChange = output<{ page: number; pageSize: number }>();

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.total() / Math.max(1, this.pageSize())))
  );

  protected goTo(page: number): void {
    if (page < 1 || page > this.totalPages()) {
      return;
    }
    this.pageChange.emit({ page, pageSize: this.pageSize() });
  }

  protected onSizeChange(event: Event): void {
    const size = Number((event.target as HTMLSelectElement).value);
    this.pageChange.emit({ page: 1, pageSize: size });
  }
}
