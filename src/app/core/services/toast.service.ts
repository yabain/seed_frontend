import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
  title?: string;
  duration: number;
  leaving: boolean;
}

const FADE_OUT_MS = 320;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  private nextId = 1;

  private readonly DURATIONS: Record<ToastType, number> = {
    success: 3500,
    error: 6000,
    warning: 5000,
    info: 4500,
  };

  success(message: string, title = 'Succès'): void {
    this.show('success', message, title);
  }

  error(message: string, title = 'Erreur'): void {
    this.show('error', message, title);
  }

  warning(message: string, title = 'Attention'): void {
    this.show('warning', message, title);
  }

  info(message: string, title = 'Information'): void {
    this.show('info', message, title);
  }

  dismiss(id: number): void {
    this._toasts.update((items) => items.filter((toast) => toast.id !== id));
  }

  private show(type: ToastType, message: string, title?: string): void {
    const toast: Toast = {
      id: this.nextId++,
      type,
      message,
      title,
      duration: this.DURATIONS[type],
      leaving: false,
    };
    this._toasts.update((items) => [...items, toast]);
    window.setTimeout(() => this.beginDismiss(toast.id), toast.duration);
  }

  private beginDismiss(id: number): void {
    this._toasts.update((items) =>
      items.map((toast) => (toast.id === id ? { ...toast, leaving: true } : toast)),
    );
    window.setTimeout(() => this.dismiss(id), FADE_OUT_MS);
  }
}
