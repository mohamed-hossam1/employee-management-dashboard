import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ProjectState } from '../../../../core/state/project.state';
import { NotificationService } from '../../../../core/services/notification.service';
import { FormFieldComponent } from '../../../../shared/components/form-field/form-field';
import {
  EMPLOYEE_STATUSES,
  EMPLOYEE_STATUS_LABELS,
  Employee,
  EmployeeCreateInput,
  EmployeeStatus
} from '../../models/employee.model';
import { EmployeeService } from '../../services/employee.service';
import { DepartmentOption } from '../../components/employee-filters/employee-filters';
import { scrollToFirstInvalid } from '../../../../shared/utils/form.utils';

const PHONE_PATTERN = /^[+]?[\d\s().-]{7,20}$/;
const MAX_AVATAR_BYTES = 500_000;

function salaryPositive(control: AbstractControl): ValidationErrors | null {
  const value = Number(control.value);
  if (control.value === null || control.value === '' || Number.isNaN(value)) {
    return { required: 'Salary is required.' };
  }
  if (value <= 0) {
    return { min: 'Salary must be greater than 0.' };
  }
  return null;
}

function hireDateNotFuture(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '');
  if (!value) {
    return { required: 'Hire date is required.' };
  }
  const date = new Date(value + 'T00:00:00');
  if (Number.isNaN(date.getTime())) {
    return { invalidDate: 'Enter a valid hire date.' };
  }
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (date.getTime() > today.getTime()) {
    return { futureDate: 'Hire date cannot be in the future.' };
  }
  return null;
}

@Component({
  selector: 'app-employee-form',
  imports: [ReactiveFormsModule, RouterLink, FormFieldComponent],
  templateUrl: './employee-form.html',
  styleUrl: './employee-form.css'
})
export class EmployeeFormPage {
  private readonly fb = inject(FormBuilder);
  private readonly employeeService = inject(EmployeeService);
  private readonly projectState = inject(ProjectState);
  private readonly notifications = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly statuses = EMPLOYEE_STATUSES;
  readonly statusLabels = EMPLOYEE_STATUS_LABELS;

  readonly departments = signal<DepartmentOption[]>([]);
  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly formError = signal<string | null>(null);
  readonly avatarPreview = signal<string | null>(null);
  readonly avatarError = signal<string | null>(null);
  readonly employeeId = signal<string | null>(null);

  readonly isEdit = computed(() => !!this.employeeId());
  readonly pageTitle = computed(() =>
    this.isEdit() ? 'Edit employee' : 'Add employee'
  );

  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.pattern(PHONE_PATTERN)]],
    departmentId: ['', [Validators.required]],
    position: ['', [Validators.required, Validators.minLength(2)]],
    salary: [0 as number, [salaryPositive]],
    hireDate: ['', [hireDateNotFuture]],
    status: ['active' as EmployeeStatus, [Validators.required]]
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('employeeId');
      this.employeeId.set(id);
      void this.bootstrap(id);
    });
  }

  private async bootstrap(id: string | null): Promise<void> {
    this.loading.set(true);
    this.formError.set(null);
    try {
      if (!this.projectState.activeProjectId()) {
        this.formError.set('Select a project before managing employees.');
        return;
      }
      const depts = await this.employeeService.getDepartments();
      this.departments.set(depts.map((d) => ({ id: d.id, name: d.name })));

      if (id) {
        const employee = await this.employeeService.getById(id);
        if (!employee) {
          this.formError.set('Employee not found.');
          return;
        }
        this.patchForm(employee);
      } else {
        this.form.reset({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          departmentId: depts[0]?.id ?? '',
          position: '',
          salary: 0,
          hireDate: '',
          status: 'active'
        });
        this.avatarPreview.set(null);
      }
    } catch {
      this.formError.set('Unable to load form data.');
    } finally {
      this.loading.set(false);
    }
  }

  private patchForm(employee: Employee): void {
    this.form.patchValue({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone ?? '',
      departmentId: employee.departmentId,
      position: employee.position,
      salary: employee.salary,
      hireDate: employee.hireDate,
      status: employee.status
    });
    this.avatarPreview.set(employee.avatar);
  }

  protected listLink(): string[] {
    const projectId = this.projectState.activeProjectId();
    return projectId ? ['/p', projectId, 'employees'] : ['/projects'];
  }

  protected onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.avatarError.set(null);

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.avatarError.set('Avatar must be an image file.');
      input.value = '';
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
      this.avatarError.set('Avatar must be 500KB or smaller.');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      this.avatarPreview.set(result);
    };
    reader.onerror = () => {
      this.avatarError.set('Unable to read the selected file.');
    };
    reader.readAsDataURL(file);
  }

  protected clearAvatar(): void {
    this.avatarPreview.set(null);
    this.avatarError.set(null);
  }

  protected fieldError(controlName: keyof typeof this.form.controls): string | null {
    const control = this.form.controls[controlName];
    if (!control || !(control.touched || control.dirty) || !control.errors) {
      return null;
    }
    const errors = control.errors;
    if (errors['required']) {
      return typeof errors['required'] === 'string'
        ? errors['required']
        : 'This field is required.';
    }
    if (errors['email']) {
      return 'Enter a valid email address.';
    }
    if (errors['minlength']) {
      return 'Must be at least 2 characters.';
    }
    if (errors['pattern']) {
      return 'Enter a valid phone number.';
    }
    if (errors['min']) {
      return typeof errors['min'] === 'string' ? errors['min'] : 'Value is too small.';
    }
    if (errors['futureDate']) {
      return String(errors['futureDate']);
    }
    if (errors['invalidDate']) {
      return String(errors['invalidDate']);
    }
    return 'Invalid value.';
  }

  async onSubmit(): Promise<void> {
    this.formError.set(null);
    if (this.form.invalid) {
      scrollToFirstInvalid(this.form);
      return;
    }

    const projectId = this.projectState.activeProjectId();
    if (!projectId) {
      this.formError.set('Select a project before managing employees.');
      return;
    }

    const raw = this.form.getRawValue();
    const payload: EmployeeCreateInput = {
      firstName: raw.firstName.trim(),
      lastName: raw.lastName.trim(),
      email: raw.email.trim().toLowerCase(),
      phone: raw.phone.trim(),
      departmentId: raw.departmentId,
      position: raw.position.trim(),
      salary: Number(raw.salary),
      hireDate: raw.hireDate,
      status: raw.status,
      avatar: this.avatarPreview()
    };

    this.submitting.set(true);
    try {
      const id = this.employeeId();
      if (id) {
        await this.employeeService.update(id, payload);
        this.notifications.success('Employee updated.');
      } else {
        await this.employeeService.create(payload);
        this.notifications.success('Employee created.');
      }
      this.router.navigate(['/p', projectId, 'employees']);
    } catch {
      this.formError.set('Unable to save employee. Please try again.');
    } finally {
      this.submitting.set(false);
    }
  }
}
