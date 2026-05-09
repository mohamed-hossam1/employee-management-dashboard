import { Component, input, output } from '@angular/core';

import { BadgeComponent } from '../../../../shared/components/badge/badge';
import { DepartmentWithCount } from '../../models/department.model';

@Component({
  selector: 'app-department-card',
  imports: [BadgeComponent],
  templateUrl: './department-card.html',
  styleUrl: './department-card.css'
})
export class DepartmentCardComponent {
  readonly department = input.required<DepartmentWithCount>();
  readonly managerName = input<string>('Unassigned');

  readonly open = output<void>();
  readonly edit = output<void>();
  readonly delete = output<void>();
}
