import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Toast, ToastService, ToastType } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-container.component.html',
  styleUrls: ['./toast-container.component.scss'],
})
export class ToastContainerComponent {
  private readonly toastService = inject(ToastService);
  readonly toasts = this.toastService.toasts;

  readonly ICONS: Record<ToastType, string> = {
    success: 'fa-circle-check',
    error: 'fa-circle-exclamation',
    warning: 'fa-triangle-exclamation',
    info: 'fa-circle-info',
  };

  icon(type: ToastType): string {
    return this.ICONS[type];
  }

  dismiss(id: number): void {
    this.toastService.dismiss(id);
  }

  shineDelay(toast: Toast): string {
    return `${Math.max(0, toast.duration / 2)}ms`;
  }
}
