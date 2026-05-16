import { Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';

import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';
import { ActivityItem } from '../../../../core/models/activity.model';

@Component({
  selector: 'app-activity-feed',
  imports: [EmptyStateComponent, DatePipe],
  templateUrl: './activity-feed.html',
  styleUrl: './activity-feed.css'
})
export class ActivityFeedComponent {
  readonly items = input.required<ActivityItem[]>();

  protected actionIcon(action: string): string {
    switch (action) {
      case 'employee_added':
        return '＋';
      case 'employee_updated':
        return '✎';
      case 'department_created':
        return '🏢';
      case 'attendance_recorded':
        return '🕒';
      case 'project_updated':
        return '⚙';
      default:
        return '•';
    }
  }
}
