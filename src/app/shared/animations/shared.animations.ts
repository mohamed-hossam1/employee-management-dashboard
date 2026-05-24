import {
  animate,
  animateChild,
  group,
  keyframes,
  query,
  style,
  transition,
  trigger
} from '@angular/animations';

const reduceMotion =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const enterMs = reduceMotion ? '1ms' : '150ms';
const leaveMs = reduceMotion ? '1ms' : '150ms';
const slideMs = reduceMotion ? '1ms' : '200ms';

export const fadeInOut = trigger('fadeInOut', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate(`${enterMs} ease-out`, style({ opacity: 1 }))
  ]),
  transition(':leave', [animate(`${leaveMs} ease-in`, style({ opacity: 0 }))])
]);

export const slideIn = trigger('slideIn', [
  transition(':enter', [
    style({ transform: reduceMotion ? 'none' : 'translateX(100%)', opacity: 0 }),
    animate(
      `${slideMs} ease-out`,
      keyframes([
        style({
          transform: reduceMotion ? 'none' : 'translateX(100%)',
          opacity: 0,
          offset: 0
        }),
        style({ transform: 'translateX(0)', opacity: 1, offset: 1 })
      ])
    )
  ]),
  transition(':leave', [
    animate(
      `${leaveMs} ease-in`,
      keyframes([
        style({ transform: 'translateX(0)', opacity: 1, offset: 0 }),
        style({
          transform: reduceMotion ? 'none' : 'translateX(100%)',
          opacity: 0,
          offset: 1
        })
      ])
    )
  ])
]);

export const routeFade = trigger('routeFade', [
  transition('* <=> *', [
    query(
      ':enter, :leave',
      style({ position: 'absolute', left: 0, right: 0, width: '100%' }),
      { optional: true }
    ),
    group([
      query(
        ':leave',
        [animate(`${leaveMs} ease`, style({ opacity: 0 }))],
        { optional: true }
      ),
      query(
        ':enter',
        [style({ opacity: 0 }), animate(`${enterMs} ease`, style({ opacity: 1 }))],
        { optional: true }
      ),
      query('@*', animateChild(), { optional: true })
    ])
  ])
]);
