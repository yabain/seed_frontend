import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  AnnouncementsService,
  AnnouncementSettings,
} from '../../../core/services/announcements.service';
import { ToastService } from '../../../core/services/toast.service';
import type { ErrorMessage } from '../../../core/interceptors/error.interceptor';

@Component({
  selector: 'app-announcement-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './announcement-settings.component.html',
  styleUrls: ['../management.scss', './announcements.component.scss'],
})
export class AnnouncementSettingsComponent implements OnInit {
  readonly headerHtml = signal('');
  readonly footerHtml = signal('');
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly previewLoading = signal(false);
  readonly trustedPreviewUrl = signal<SafeResourceUrl | null>(null);

  private objectUrl: string | null = null;

  constructor(
    private readonly announcementsService: AnnouncementsService,
    private readonly toastService: ToastService,
    private readonly sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.announcementsService.getSettings().subscribe({
      next: (settings) => {
        this.headerHtml.set(settings.headerHtml);
        this.footerHtml.set(settings.footerHtml);
        this.refreshPreview();
      },
      error: () =>
        this.toastService.error('Impossible de charger les réglages.'),
      complete: () => this.loading.set(false),
    });
  }

  refreshPreview(): void {
    this.previewLoading.set(true);
    const html = `${this.headerHtml()}\n<div style="padding:24px;font-family:Arial,sans-serif;color:#374151;">
      <p>Bonjour <strong>{userName}</strong>,</p>
      <p>Le contenu de votre annonce apparaîtra ici.</p>
    </div>\n${this.footerHtml()}`;

    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
    const blob = new Blob([html], { type: 'text/html' });
    this.objectUrl = URL.createObjectURL(blob);
    this.trustedPreviewUrl.set(
      this.sanitizer.bypassSecurityTrustResourceUrl(this.objectUrl),
    );
    this.previewLoading.set(false);
  }

  save(): void {
    this.saving.set(true);
    const payload: Partial<AnnouncementSettings> = {
      headerHtml: this.headerHtml(),
      footerHtml: this.footerHtml(),
    };
    this.announcementsService.updateSettings(payload).subscribe({
      next: () => {
        this.toastService.success('Réglages enregistrés.');
        this.saving.set(false);
      },
      error: (err: ErrorMessage) => {
        this.saving.set(false);
        this.toastService.error(
          err.details?.join(' ') ||
            err.message ||
            'Erreur lors de la sauvegarde.',
        );
      },
    });
  }
}
