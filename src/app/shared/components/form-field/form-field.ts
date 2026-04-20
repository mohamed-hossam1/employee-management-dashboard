import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-form-field',
  imports: [],
  template: `
    <div class="form-field">
      @if (label()) {
        <label class="form-field__label" [attr.for]="controlId()">{{ label() }}</label>
      }
      <ng-content />
      @if (error()) {
        <p class="form-field__error" [id]="errorId()" role="alert">{{ error() }}</p>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .form-field {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
        margin-bottom: 1rem;
      }
      .form-field__label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--fg);
      }
      .form-field__error {
        margin: 0;
        font-size: 0.8125rem;
        color: var(--color-danger);
      }
    `
  ]
})
export class FormFieldComponent {
  readonly controlId = input.required<string>();
  readonly label = input<string>('');
  readonly error = input<string | null>(null);

  protected readonly errorId = computed(() => `${this.controlId()}-error`);
}
