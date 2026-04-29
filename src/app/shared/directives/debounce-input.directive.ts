import { Directive, ElementRef, EventEmitter, inject, Input, NgZone, OnDestroy, Output } from '@angular/core';

@Directive({
  selector: 'input[appDebounceInput], textarea[appDebounceInput]'
})
export class DebounceInputDirective implements OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLInputElement | HTMLTextAreaElement>);
  private readonly zone = inject(NgZone);

  @Output() debouncedChange = new EventEmitter<string>();

  private timer: ReturnType<typeof setTimeout> | null = null;

  @Input()
  set appDebounceInput(debounceMs: number) {
    this.debounceMs = debounceMs ?? 300;
  }
  private debounceMs = 300;

  private readonly listener = (event: Event): void => {
    const value = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      this.zone.run(() => this.debouncedChange.emit(value));
    }, this.debounceMs);
  };

  constructor() {
    this.elementRef.nativeElement.addEventListener('input', this.listener);
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.elementRef.nativeElement.removeEventListener('input', this.listener);
  }
}
