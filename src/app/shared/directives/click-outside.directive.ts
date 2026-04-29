import {
  Directive,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  NgZone,
  OnDestroy,
  Output
} from '@angular/core';

@Directive({
  selector: '[appClickOutside]'
})
export class ClickOutsideDirective implements OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly zone = inject(NgZone);

  @Output() appClickOutside = new EventEmitter<void>();

  private readonly handler = (event: MouseEvent): void => {
    const target = event.target as Node | null;
    if (target && !this.elementRef.nativeElement.contains(target)) {
      this.appClickOutside.emit();
    }
  };

  @Input()
  set appClickOutsideEnabled(enabled: boolean) {
    if (enabled) {
      this.zone.runOutsideAngular(() => {
        document.addEventListener('click', this.handler, true);
      });
    } else {
      document.removeEventListener('click', this.handler, true);
    }
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.handler, true);
  }
}
