import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { Component, effect, inject, input, output } from '@angular/core';

import { FormFieldComponent } from '../../../../shared/components/form-field/form-field';
import {
  DEPARTMENT_DESCRIPTION_MAX,
  DEPARTMENT_NAME_MIN,
  Department,
  DepartmentCreateInput,
  ManagerOption
} from '../../models/department.model';

function uniqueNameValidator(existingNames: () => string[], currentName: () => string | null): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '').trim().toLowerCase();
    if (!value) {
      return null;
    }
    const current = (currentName() ?? '').trim().toLowerCase();
    const taken = existingNames().some(
      (name) => name.trim().toLowerCase() === value && name.trim().toLowerCase() !== current
    );
    return taken ? { unique: 'A department with this name already exists.' } : null;
  };
}

@Component({
  selector: 'app-department-form-dialog',
  imports: [ReactiveFormsModule, FormFieldComponent],
  templateUrl: './department-form-dialog.html',
  styleUrl: './department-form-dialog.css'
})
export class DepartmentFormDialogComponent {
  private readonly fb = inject(FormBuilder);

  readonly department = input<Department | null>(null);
  readonly managers = input<ManagerOption[]>([]);
  readonly existingNames = input<string[]>([]);
  readonly saving = input(false);

  readonly cancel = output<void>();
  readonly save = output<DepartmentCreateInput>();

  protected readonly form = this.fb.nonNullable.group({
    name: [
      '',
      [
        Validators.required,
        Validators.minLength(DEPARTMENT_NAME_MIN),
        uniqueNameValidator(
          () => this.existingNames(),
          () => this.department()?.name ?? null
        )
      ]
    ],
    description: ['', [Validators.maxLength(DEPARTMENT_DESCRIPTION_MAX)]],
    managerId: ['']
  });

  constructor() {
    effect(() => {
      const dept = this.department();
      this.form.reset({
        name: dept?.name ?? '',
        description: dept?.description ?? '',
        managerId: dept?.managerId ?? ''
      });
    });
  }

  protected get isEdit(): boolean {
    return this.department() !== null;
  }

  protected onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    const raw = this.form.getRawValue();
    this.save.emit({
      name: raw.name.trim(),
      description: raw.description.trim(),
      managerId: raw.managerId ? raw.managerId : null
    });
  }

  protected nameError(): string | null {
    const c = this.form.controls.name;
    if (!(c.touched || c.dirty) || !c.errors) {
      return null;
    }
    if (c.errors['required']) {
      return 'Name is required.';
    }
    if (c.errors['minlength']) {
      return `Name must be at least ${DEPARTMENT_NAME_MIN} characters.`;
    }
    if (c.errors['unique']) {
      return String(c.errors['unique']);
    }
    return 'Invalid name.';
  }

  protected descriptionError(): string | null {
    const c = this.form.controls.description;
    if (!(c.touched || c.dirty) || !c.errors) {
      return null;
    }
    if (c.errors['maxlength']) {
      return `Description must be ${DEPARTMENT_DESCRIPTION_MAX} characters or fewer.`;
    }
    return null;
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.cancel.emit();
    }
  }
}
