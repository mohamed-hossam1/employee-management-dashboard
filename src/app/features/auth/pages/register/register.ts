import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService, AuthError } from '../../../../core/services/auth.service';
import { ProjectService } from '../../../../core/services/project.service';
import { FormFieldComponent } from '../../../../shared/components/form-field/form-field';
import { scrollToFirstInvalid } from '../../../../shared/utils/form.utils';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, FormFieldComponent],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly projectService = inject(ProjectService);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: [
      '',
      [Validators.required, Validators.minLength(8), this.passwordStrengthValidator]
    ],
    confirmPassword: ['', [Validators.required]]
  });

  async onSubmit(): Promise<void> {
    this.formError.set(null);

    if (this.form.invalid) {
      scrollToFirstInvalid(this.form);
      return;
    }

    const { name, email, password, confirmPassword } = this.form.getRawValue();
    if (password !== confirmPassword) {
      this.form.controls.confirmPassword.setErrors({ mismatch: true });
      this.form.controls.confirmPassword.markAsTouched();
      scrollToFirstInvalid(this.form);
      return;
    }

    this.submitting.set(true);
    try {
      await this.auth.register({ name, email, password });
      // Keep browser theme (do not force profile default "light").
      const user = this.auth.getCurrentUser();
      if (user) {
        try {
          await this.projectService.loadActiveProject(user.id);
        } catch {
          /* projects page will load list */
        }
      }
      await this.router.navigateByUrl('/projects');
    } catch (error) {
      console.error('[register]', error);

      if (AuthError.is(error) && error.code === 'EMAIL_CONFIRMATION_REQUIRED') {
        await this.router.navigate(['/auth/login'], {
          queryParams: { registered: '1', email: email.trim().toLowerCase() }
        });
        return;
      }

      if (AuthError.is(error) && error.code === 'EMAIL_TAKEN') {
        this.form.controls.email.setErrors({ emailTaken: true });
        this.form.controls.email.markAsTouched();
        this.formError.set(error.message);
        return;
      }

      const message =
        (AuthError.is(error) && error.message) ||
        (error instanceof Error && error.message) ||
        (typeof error === 'string' ? error : null) ||
        'Unable to create account. Please try again.';
      this.formError.set(message);
    } finally {
      this.submitting.set(false);
    }
  }

  protected nameError(): string | null {
    const c = this.form.controls.name;
    if (c.touched && c.hasError('required')) return 'Name is required.';
    if (c.touched && c.hasError('minlength')) return 'Name must be at least 2 characters.';
    return null;
  }

  protected emailError(): string | null {
    const c = this.form.controls.email;
    if (c.touched && c.hasError('required')) return 'Email is required.';
    if (c.touched && c.hasError('email')) return 'Enter a valid email address.';
    if (c.touched && c.hasError('emailTaken')) return 'An account with this email already exists.';
    return null;
  }

  protected passwordError(): string | null {
    const c = this.form.controls.password;
    if (c.touched && c.hasError('required')) return 'Password is required.';
    if (c.touched && c.hasError('minlength')) return 'Password must be at least 8 characters.';
    if (c.touched && c.hasError('passwordStrength'))
      return 'Password needs an uppercase letter and a number.';
    return null;
  }

  protected confirmError(): string | null {
    const c = this.form.controls.confirmPassword;
    if (c.touched && c.hasError('required')) return 'Please confirm your password.';
    if (c.touched && c.hasError('mismatch')) return 'Passwords do not match.';
    return null;
  }

  private passwordStrengthValidator(control: { value: string | null }) {
    const value = control.value ?? '';
    const hasUpper = /[A-Z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    return hasUpper && hasNumber ? null : { passwordStrength: true };
  }
}
