import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { AuthState } from '../../../../core/state/auth.state';
import { NotificationService } from '../../../../core/services/notification.service';
import { User } from '../../../../core/models/user.model';
import { FormFieldComponent } from '../../../../shared/components/form-field/form-field';
import { AvatarComponent } from '../../../../shared/components/avatar/avatar';
import { ProfileService } from '../../services/profile.service';
import { readFileAsDataUrl } from '../../services/avatar.util';
import { scrollToFirstInvalid } from '../../../../shared/utils/form.utils';

const PHONE_PATTERN = /^[+]?[\d\s().-]{7,20}$/;

@Component({
  selector: 'app-profile-page',
  imports: [ReactiveFormsModule, FormFieldComponent, AvatarComponent, DatePipe],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.css'
})
export class ProfilePage {
  private readonly fb = inject(FormBuilder);
  private readonly profile = inject(ProfileService);
  private readonly authState = inject(AuthState);
  private readonly notifications = inject(NotificationService);

  readonly user = this.authState.currentUser;
  readonly savingProfile = signal(false);
  readonly savingPassword = signal(false);
  readonly savingAvatar = signal(false);
  readonly profileError = signal<string | null>(null);
  readonly passwordError = signal<string | null>(null);
  readonly avatarError = signal<string | null>(null);
  readonly avatarPreview = signal<string | null>(null);

  readonly displayAvatar = computed(
    () => this.avatarPreview() ?? this.user()?.avatar ?? null
  );

  readonly profileForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.pattern(PHONE_PATTERN)]],
    bio: ['']
  });

  readonly passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]]
  });

  constructor() {
    const current = this.user();
    if (current) {
      this.patchProfile(current);
    }
  }

  private patchProfile(user: User): void {
    this.profileForm.patchValue({
      name: user.name,
      email: user.email,
      phone: user.phone ?? '',
      bio: user.bio ?? ''
    });
    this.avatarPreview.set(null);
  }

  protected profileFieldError(
    controlName: 'name' | 'email' | 'phone' | 'bio'
  ): string | null {
    return this.controlError(this.profileForm.controls[controlName]);
  }

  protected passwordFieldError(
    controlName: 'currentPassword' | 'newPassword' | 'confirmPassword'
  ): string | null {
    return this.controlError(this.passwordForm.controls[controlName]);
  }

  private controlError(control: { touched: boolean; dirty: boolean; errors: Record<string, unknown> | null }): string | null {
    if (!(control.touched || control.dirty) || !control.errors) {
      return null;
    }
    if (control.errors['required']) {
      return 'This field is required.';
    }
    if (control.errors['email']) {
      return 'Enter a valid email address.';
    }
    if (control.errors['minlength']) {
      const min = (control.errors['minlength'] as { requiredLength: number }).requiredLength;
      return `Must be at least ${min} characters.`;
    }
    if (control.errors['pattern']) {
      return 'Enter a valid phone number.';
    }
    return 'Invalid value.';
  }

  async saveProfile(): Promise<void> {
    this.profileError.set(null);
    if (this.profileForm.invalid) {
      scrollToFirstInvalid(this.profileForm);
      return;
    }
    this.savingProfile.set(true);
    try {
      const raw = this.profileForm.getRawValue();
      await this.profile.updateProfile(raw);
      this.notifications.success('Profile updated.');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to update profile.';
      this.profileError.set(message);
      this.notifications.error(message);
    } finally {
      this.savingProfile.set(false);
    }
  }

  async savePassword(): Promise<void> {
    this.passwordError.set(null);
    if (this.passwordForm.invalid) {
      scrollToFirstInvalid(this.passwordForm);
      return;
    }
    const { currentPassword, newPassword, confirmPassword } =
      this.passwordForm.getRawValue();
    if (newPassword !== confirmPassword) {
      this.passwordError.set('New password and confirmation do not match.');
      return;
    }

    this.savingPassword.set(true);
    try {
      await this.profile.changePassword(currentPassword, newPassword);
      this.passwordForm.reset({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      this.notifications.success('Password updated.');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to change password.';
      this.passwordError.set(message);
      this.notifications.error(message);
    } finally {
      this.savingPassword.set(false);
    }
  }

  async onAvatarSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.avatarError.set(null);
    if (!file) {
      return;
    }
    const result = await readFileAsDataUrl(file);
    if (!result.ok) {
      this.avatarError.set(result.message);
      input.value = '';
      return;
    }
    this.avatarPreview.set(result.dataUrl);
  }

  clearAvatarPreview(): void {
    this.avatarPreview.set(null);
    this.avatarError.set(null);
  }

  async saveAvatar(): Promise<void> {
    const preview = this.avatarPreview();
    if (preview === null && !this.user()?.avatar) {
      return;
    }
    this.savingAvatar.set(true);
    this.avatarError.set(null);
    try {
      // If user cleared preview while having previous avatar, keep previous unless explicit remove
      const next = this.avatarPreview();
      if (next) {
        await this.profile.updateAvatar(next);
        this.avatarPreview.set(null);
        this.notifications.success('Avatar updated.');
      }
    } catch {
      this.avatarError.set('Unable to save avatar.');
      this.notifications.error('Unable to save avatar.');
    } finally {
      this.savingAvatar.set(false);
    }
  }

  async removeAvatar(): Promise<void> {
    this.savingAvatar.set(true);
    this.avatarError.set(null);
    try {
      await this.profile.updateAvatar(null);
      this.avatarPreview.set(null);
      this.notifications.success('Avatar removed.');
    } catch {
      this.notifications.error('Unable to remove avatar.');
    } finally {
      this.savingAvatar.set(false);
    }
  }
}
