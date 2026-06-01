import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService, AuthError } from '../../../../core/services/auth.service';
import { ProjectService } from '../../../../core/services/project.service';
import { FormFieldComponent } from '../../../../shared/components/form-field/form-field';
import { scrollToFirstInvalid } from '../../../../shared/utils/form.utils';

/** Demo account used for one-click login (password matches email). */
const DEMO_EMAIL = 'mohamedhossamv8@gmail.com';
const DEMO_PASSWORD = 'mohamedhossamv8@gmail.com';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, FormFieldComponent],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly projectService = inject(ProjectService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly submitting = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly infoMessage = signal<string | null>(null);

  protected readonly demoEmail = DEMO_EMAIL;

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    if (params.get('registered') === '1') {
      this.infoMessage.set(
        'Account created. Confirm your email (if required), then sign in.'
      );
    }
    if (params.get('sessionExpired') === 'true') {
      this.infoMessage.set('Session expired. Please sign in again.');
    }
    const email = params.get('email');
    if (email) {
      this.form.controls.email.setValue(email);
    }
  }

  async onSubmit(): Promise<void> {
    this.formError.set(null);

    if (this.form.invalid) {
      scrollToFirstInvalid(this.form);
      return;
    }

    const { email, password } = this.form.getRawValue();
    await this.signIn(email, password);
  }

  /** Fill demo credentials and sign in immediately. */
  async useDemoLogin(): Promise<void> {
    this.form.setValue({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD
    });
    this.form.markAsPristine();
    await this.signIn(DEMO_EMAIL, DEMO_PASSWORD);
  }

  private async signIn(email: string, password: string): Promise<void> {
    this.formError.set(null);
    this.submitting.set(true);
    try {
      await this.auth.login({ email, password });
      // Mirror APP_INITIALIZER hydration so SPA login works without a full refresh.
      await this.hydrateAfterAuth();
      const returnUrl = this.router.parseUrl(this.router.url).queryParams['returnUrl'];
      const target = this.safeInternalUrl(returnUrl) ?? '/projects';
      await this.router.navigateByUrl(target);
    } catch (error) {
      if (AuthError.is(error) && error.code === 'INVALID_CREDENTIALS') {
        this.formError.set('Invalid email or password.');
      } else if (AuthError.is(error)) {
        this.formError.set(error.message);
      } else if (error instanceof Error && error.message) {
        this.formError.set(error.message);
      } else {
        this.formError.set('Unable to sign in. Please try again.');
      }
    } finally {
      this.submitting.set(false);
    }
  }

  /**
   * Load workspace state the same way a full page reload does.
   * Theme is intentionally left alone — browser preference (localStorage)
   * already applied by ThemeService.init(); profile defaults to "light" and
   * must not wipe a user-selected dark mode on login.
   */
  private async hydrateAfterAuth(): Promise<void> {
    const user = this.auth.getCurrentUser();
    if (!user) {
      return;
    }
    try {
      await this.projectService.loadActiveProject(user.id);
    } catch {
      // Projects page will retry; do not block navigation.
    }
  }

  /** Only allow same-app absolute paths (block open redirects). */
  private safeInternalUrl(value: unknown): string | null {
    if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) {
      return null;
    }
    if (value.startsWith('/auth')) {
      return null;
    }
    return value;
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
