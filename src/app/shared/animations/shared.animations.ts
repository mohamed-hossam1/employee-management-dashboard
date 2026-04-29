import { animate, keyframes, style, transition, trigger } from '@angular/animations';

export const fadeInOut = trigger('fadeInOut', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate('150ms ease-out', style({ opacity: 1 }))
  ]),
  transition(':leave', [animate('150ms ease-in', style({ opacity: 0 }))])
]);

export const slideIn = trigger('slideIn', [
  transition(':enter', [
    style({ transform: 'translateX(100%)', opacity: 0 }),
    animate(
      '200ms ease-out',
      keyframes([
        style({ transform: 'translateX(100%)', opacity: 0, offset: 0 }),
        style({ transform: 'translateX(0)', opacity: 1, offset: 1 })
      ])
    )
  ]),
  transition(':leave', [
    animate(
      '150ms ease-in',
      keyframes([
        style({ transform: 'translateX(0)', opacity: 1, offset: 0 }),
        style({ transform: 'translateX(100%)', opacity: 0, offset: 1 })
      ])
    )
  ])
]);
