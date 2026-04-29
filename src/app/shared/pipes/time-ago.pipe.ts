import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeAgo'
})
export class TimeAgoPipe implements PipeTransform {
  transform(value: Date | string | number | null | undefined): string {
    if (value === null || value === undefined) {
      return '';
    }
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) {
      return '';
    }
    const now = Date.now();
    const diffMs = now - date.getTime();
    const seconds = Math.round(diffMs / 1000);
    if (seconds < 60) {
      return 'just now';
    }
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes}m ago`;
    }
    const hours = Math.round(minutes / 60);
    if (hours < 24) {
      return `${hours}h ago`;
    }
    const days = Math.round(hours / 24);
    if (days < 30) {
      return `${days}d ago`;
    }
    const months = Math.round(days / 30);
    if (months < 12) {
      return `${months}mo ago`;
    }
    const years = Math.round(months / 12);
    return `${years}y ago`;
  }
}
