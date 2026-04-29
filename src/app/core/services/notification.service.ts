import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private nextId = 0;
  private readonly toastsSignal = signal<Toast[]>([]);

  readonly toasts = this.toastsSignal.asReadonly();

  success(message: string, duration = 4000): void {
    this.push(message, 'success', duration);
  }

  error(message: string, duration = 5000): void {
    this.push(message, 'error', duration);
  }

  warning(message: string, duration = 4000): void {
    this.push(message, 'warning', duration);
  }

  info(message: string, duration = 4000): void {
    this.push(message, 'info', duration);
  }

  dismiss(id: number): void {
    this.toastsSignal.update((toasts) => toasts.filter((t) => t.id !== id));
  }

  private push(message: string, type: ToastType, duration: number): void {
    const id = this.nextId++;
    this.toastsSignal.update((toasts) => [...toasts, { id, message, type, duration }]);
    setTimeout(() => this.dismiss(id), duration);
  }
}
