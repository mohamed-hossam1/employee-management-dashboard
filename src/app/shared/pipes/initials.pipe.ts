import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'initials'
})
export class InitialsPipe implements PipeTransform {
  transform(value: string | null | undefined, max = 2): string {
    if (!value) {
      return '';
    }
    const parts = value.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return '';
    }
    if (parts.length === 1) {
      return parts[0].slice(0, max).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, max);
  }
}
