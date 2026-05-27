import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  Project,
  PROJECT_COLOR_PALETTE,
  PROJECT_ICON_SET,
  PROJECT_NAME_MIN,
  PROJECT_NAME_MAX,
  PROJECT_DESCRIPTION_MAX
} from '../../../../core/models/project.model';
import { ProjectInput } from '../../../../core/services/project.service';
import { scrollToFirstInvalid } from '../../../../shared/utils/form.utils';

@Component({
  selector: 'app-project-form-dialog',
  imports: [ReactiveFormsModule],
  templateUrl: './project-form-dialog.html',
  styleUrl: './project-form-dialog.css'
})
export class ProjectFormDialogComponent {
  private readonly fb = inject(FormBuilder);

  readonly project = input<Project | null>(null);
  readonly saving = input(false);

  readonly cancel = output<void>();
  readonly save = output<ProjectInput>();

  readonly colors = PROJECT_COLOR_PALETTE;
  readonly icons = PROJECT_ICON_SET;

  protected readonly form = this.fb.nonNullable.group({
    name: [
      '',
      [Validators.required, Validators.minLength(PROJECT_NAME_MIN), Validators.maxLength(PROJECT_NAME_MAX)]
    ],
    description: ['', [Validators.maxLength(PROJECT_DESCRIPTION_MAX)]],
    color: [this.colors[0] as string, [Validators.required]],
    icon: [this.icons[0] as string, [Validators.required]]
  });

  constructor() {
    effect(() => {
      const initial = this.project();
      this.form.reset({
        name: initial?.name ?? '',
        description: initial?.description ?? '',
        color: initial?.color || this.colors[0],
        icon: initial?.icon || this.icons[0]
      });
    });
  }

  protected get isEdit(): boolean {
    return this.project() !== null;
  }

  protected selectColor(color: string): void {
    this.form.controls.color.setValue(color);
  }

  protected selectIcon(icon: string): void {
    this.form.controls.icon.setValue(icon);
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      scrollToFirstInvalid(this.form);
      return;
    }
    const { name, description, color, icon } = this.form.getRawValue();
    this.save.emit({ name: name.trim(), description: description.trim(), color, icon });
  }

  protected nameError(): string | null {
    const c = this.form.controls.name;
    if (c.touched && c.hasError('required')) return 'Name is required.';
    if (c.touched && c.hasError('minlength'))
      return `Name must be at least ${PROJECT_NAME_MIN} characters.`;
    if (c.touched && c.hasError('maxlength'))
      return `Name must be ${PROJECT_NAME_MAX} characters or fewer.`;
    return null;
  }

  protected descriptionError(): string | null {
    const c = this.form.controls.description;
    if (c.touched && c.hasError('maxlength'))
      return `Description must be ${PROJECT_DESCRIPTION_MAX} characters or fewer.`;
    return null;
  }
}
