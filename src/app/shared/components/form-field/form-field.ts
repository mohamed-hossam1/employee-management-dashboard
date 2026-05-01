import { Component, computed, input } from '@angular/core';
import { AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-form-field',
  imports: [],
  template: `
    <div class="form-field">
      @if (label()) {
        <label class="form-field__label" [attr.for]="controlId()">{{ label() }}</label>
      }
      <ng-content />
      @if (resolvedError(); as message) {
        <p class="form-field__error" [id]="errorId()" role="alert">{{ message }}</p>
      }
      @if (hint() && !error()) {
        <p class="form-field__hint" [id]="hintId()">{{ hint() }}</p>
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
      .form-field__hint {
        margin: 0;
        font-size: 0.8125rem;
        color: var(--fg-muted);
      }
    `
  ]
})
export class FormFieldComponent {
  readonly controlId = input.required<string>();
  readonly label = input<string>('');
  readonly hint = input<string>('');

  readonly control = input<AbstractControl | null>(null);
  readonly error = input<string | null>(null);

  protected readonly errorId = computed(() => `${this.controlId()}-error`);
  protected readonly hintId = computed(() => `${this.controlId()}-hint`);

  protected readonly resolvedError = computed(() => {
    const direct = this.error();
    if (direct) {
      return direct;
    }
    const control = this.control();
    if (!control) {
      return null;
    }
    if (control.invalid && (control.touched || control.dirty)) {
      return this.firstError(control);
    }
    return null;
  });

  private firstError(control: AbstractControl): string | null {
    const errors = control.errors;
    if (!errors) {
      return null;
    }
    const firstKey = Object.keys(errors)[0];
    if (!firstKey) {
      return null;
    }
    const value = errors[firstKey];
    if (typeof value === 'string') {
      return value;
    }
    if (value && typeof value === 'object' && 'message' in value) {
      return String((value as { message: unknown }).message);
    }
    return firstKey;
  }
}
