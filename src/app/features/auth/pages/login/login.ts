import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService, AuthError } from '../../../../core/services/auth.service';
import { FormFieldComponent } from '../../../../shared/components/form-field/form-field';
import { scrollToFirstInvalid } from '../../../../shared/utils/form.utils';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, FormFieldComponent],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  async onSubmit(): Promise<void> {
    this.formError.set(null);

    if (this.form.invalid) {
      scrollToFirstInvalid(this.form);
      return;
    }

    const { email, password } = this.form.getRawValue();
    this.submitting.set(true);
    try {
      await this.auth.login({ email, password });
      const returnUrl = this.router.parseUrl(this.router.url).queryParams['returnUrl'];
      this.router.navigateByUrl(returnUrl ?? '/projects');
    } catch (error) {
      if (error instanceof AuthError && error.code === 'INVALID_CREDENTIALS') {
        this.formError.set('Invalid email or password.');
      } else if (error instanceof AuthError) {
        this.formError.set(error.message);
      } else {
        this.formError.set('Unable to sign in. Please try again.');
      }
    } finally {
      this.submitting.set(false);
    }
  }

  protected emailError(): string | null {
    const c = this.form.controls.email;
    if (c.touched && c.hasError('required')) return 'Email is required.';
    if (c.touched && c.hasError('email')) return 'Enter a valid email address.';
    return null;
  }

  protected passwordError(): string | null {
    const c = this.form.controls.password;
    if (c.touched && c.hasError('required')) return 'Password is required.';
    if (c.touched && c.hasError('minlength')) return 'Password must be at least 6 characters.';
    return null;
  }
}
