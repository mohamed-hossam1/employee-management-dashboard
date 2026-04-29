import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate'
})
export class TruncatePipe implements PipeTransform {
  transform(value: string | null | undefined, limit = 50, ellipsis = '…'): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (value.length <= limit) {
      return value;
    }
    return value.slice(0, limit).trimEnd() + ellipsis;
  }
}
