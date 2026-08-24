import { Component, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  AnnouncementsService,
  Announcement,
  AnnouncementAttachment,
  ANNOUNCEMENT_GROUP_OPTIONS,
  AnnouncementGroup,
} from '../../../core/services/announcements.service';
import { ToastService } from '../../../core/services/toast.service';
import type { ErrorMessage } from '../../../core/interceptors/error.interceptor';

@Component({
  selector: 'app-announcement-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './announcement-form.component.html',
  styleUrls: ['../management.scss', './announcements.component.scss'],
})
export class AnnouncementFormComponent implements OnInit, OnDestroy {
  readonly isEdit = signal(false);
  readonly id = signal('');
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly sending = signal(false);
  readonly scheduling = signal(false);

  readonly subject = signal('');
  readonly recipientGroup = signal<AnnouncementGroup>('all_users');
  readonly customRecipients = signal('');
  readonly includeHeader = signal(true);
  readonly includeFooter = signal(true);
  readonly bodyHtml = signal('');
  readonly attachments = signal<AnnouncementAttachment[]>([]);
  readonly scheduledAtInput = signal('');
  readonly status = signal('draft');
  readonly currentScheduledAt = signal<string | null>(null);

  readonly previewHtml = signal('');
  readonly previewLoading = signal(false);

  readonly uploadingFile = signal(false);
  private uploadTimer: any;
  private objectUrl: string | null = null;

  readonly groupOptions = ANNOUNCEMENT_GROUP_OPTIONS;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly announcementsService: AnnouncementsService,
    private readonly toastService: ToastService,
    private readonly sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    const paramId = this.route.snapshot.paramMap.get('id');
    if (paramId) {
      this.isEdit.set(true);
      this.id.set(paramId);
      this.loadAnnouncement(paramId);
    }
    this.schedulePreviewRefresh();
  }

  ngOnDestroy(): void {
    if (this.uploadTimer) {
      clearTimeout(this.uploadTimer);
    }
    this.revokePreviewUrl();
  }

  private loadAnnouncement(id: string): void {
    this.loading.set(true);
    this.announcementsService.getOne(id).subscribe({
      next: (a) => {
        this.subject.set(a.subject);
        this.recipientGroup.set(a.recipientGroup);
        this.customRecipients.set((a.customRecipients ?? []).join(', '));
        this.includeHeader.set(a.includeHeader ?? true);
        this.includeFooter.set(a.includeFooter ?? true);
        this.bodyHtml.set(a.bodyHtml ?? '');
        this.attachments.set(a.attachments ?? []);
        this.status.set(a.status);
        this.currentScheduledAt.set(a.scheduledAt ?? null);
        if (a.scheduledAt) {
          this.scheduledAtInput.set(this.toDatetimeLocal(a.scheduledAt));
        }
        this.refreshPreview();
      },
      error: () => {
        this.toastService.error('Annonce introuvable.');
        void this.router.navigate(['/admin/announcements']);
      },
      complete: () => this.loading.set(false),
    });
  }

  /* --------------------------- Aperçu live -------------------------- */

  schedulePreviewRefresh(): void {
    if (this.uploadTimer) {
      clearTimeout(this.uploadTimer);
    }
    this.uploadTimer = setTimeout(() => this.refreshPreview(), 600);
  }

  refreshPreview(): void {
    this.previewLoading.set(true);
    this.announcementsService
      .preview(this.bodyHtml(), this.includeHeader(), this.includeFooter())
      .subscribe({
        next: (html) => this.renderPreview(html),
        error: () => this.previewLoading.set(false),
      });
  }

  private renderPreview(html: string): void {
    this.previewHtml.set(html);
    this.revokePreviewUrl();
    const blob = new Blob([html], { type: 'text/html' });
    this.objectUrl = URL.createObjectURL(blob);
    this.trustedPreviewUrl =
      this.sanitizer.bypassSecurityTrustResourceUrl(this.objectUrl);
    this.previewLoading.set(false);
  }

  /** URL du blob sécurisée pour l'iframe. */
  trustedPreviewUrl: SafeResourceUrl | null = null;

  private revokePreviewUrl(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }

  /* ------------------------ Pièces jointes ------------------------- */

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.toastService.error('Pièce jointe trop volumineuse (max 10 Mo).');
      return;
    }

    this.uploadingFile.set(true);
    this.announcementsService.uploadAttachment(file).subscribe({
      next: (uploaded) => {
        this.attachments.update((list) => [
          ...list,
          {
            fileName: uploaded.fileName,
            path: uploaded.path,
            size: uploaded.size,
          },
        ]);
        this.uploadingFile.set(false);
      },
      error: () => {
        this.toastService.error("Échec de l'upload de la pièce jointe.");
        this.uploadingFile.set(false);
      },
    });
  }

  removeAttachment(index: number): void {
    this.attachments.update((list) => list.filter((_, i) => i !== index));
  }

  formatSize(bytes?: number): string {
    if (!bytes && bytes !== 0) {
      return '';
    }
    if (bytes < 1024) {
      return `${bytes} o`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} Ko`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  }

  /* ----------------------------- Sauvegarde ------------------------ */

  private buildPayload() {
    return {
      subject: this.subject().trim(),
      bodyHtml: this.bodyHtml(),
      recipientGroup: this.recipientGroup(),
      customRecipients: this.customRecipients()
        .split(',')
        .map((e) => e.trim())
        .filter((e) => e.includes('@')),
      attachments: this.attachments(),
      includeHeader: this.includeHeader(),
      includeFooter: this.includeFooter(),
    };
  }

  saveDraft(): void {
    if (!this.validate()) {
      return;
    }
    this.saving.set(true);
    const request$ = this.isEdit()
      ? this.announcementsService.update(this.id(), this.buildPayload())
      : this.announcementsService.create(this.buildPayload());
    request$.subscribe({
      next: (saved) => {
        this.toastService.success('Brouillon enregistré.');
        if (!this.isEdit()) {
          void this.router.navigate([
            '/admin/announcements',
            saved.id,
            'edit',
          ], { replaceUrl: true });
        } else {
          this.saving.set(false);
        }
      },
      error: (err: ErrorMessage) => this.handleSaveError(err),
    });
  }

  sendNow(): void {
    if (!this.validate()) {
      return;
    }
    if (!window.confirm(`Envoyer « ${this.subject()} » maintenant ?`)) {
      return;
    }

    this.sending.set(true);
    const finish = (id: string) =>
      this.announcementsService.sendNow(id).subscribe({
        next: () => {
          this.toastService.success(
            'Envoi lancé : les e-mails partiront par vagues.',
          );
          void this.router.navigate(['/admin/announcements']);
        },
        error: (err: ErrorMessage) => {
          this.sending.set(false);
          this.handleSaveError(err);
        },
      });

    if (this.isEdit()) {
      this.announcementsService.update(this.id(), this.buildPayload()).subscribe({
        next: (saved) => finish(saved.id),
        error: (err: ErrorMessage) => {
          this.sending.set(false);
          this.handleSaveError(err);
        },
      });
    } else {
      this.announcementsService.create(this.buildPayload()).subscribe({
        next: (saved) => finish(saved.id),
        error: (err: ErrorMessage) => {
          this.sending.set(false);
          this.handleSaveError(err);
        },
      });
    }
  }

  schedule(): void {
    if (!this.validate()) {
      return;
    }
    if (!this.scheduledAtInput()) {
      this.toastService.error("Choisissez une date d'envoi.");
      return;
    }
    const iso = new Date(this.scheduledAtInput()).toISOString();
    if (new Date(iso).getTime() <= Date.now()) {
      this.toastService.error("La date doit être dans le futur.");
      return;
    }

    this.scheduling.set(true);
    const afterSave = (id: string) =>
      this.announcementsService.schedule(id, iso).subscribe({
        next: () => {
          this.toastService.success('Annonce programmée.');
          void this.router.navigate(['/admin/announcements']);
        },
        error: (err: ErrorMessage) => {
          this.scheduling.set(false);
          this.handleSaveError(err);
        },
      });

    if (this.isEdit()) {
      this.announcementsService.update(this.id(), this.buildPayload()).subscribe({
        next: (saved) => afterSave(saved.id),
        error: (err: ErrorMessage) => {
          this.scheduling.set(false);
          this.handleSaveError(err);
        },
      });
    } else {
      this.announcementsService.create(this.buildPayload()).subscribe({
        next: (saved) => afterSave(saved.id),
        error: (err: ErrorMessage) => {
          this.scheduling.set(false);
          this.handleSaveError(err);
        },
      });
    }
  }

  private validate(): boolean {
    if (!this.subject().trim()) {
      this.toastService.error('Le sujet est requis.');
      return false;
    }
    if (!this.bodyHtml().trim()) {
      this.toastService.error('Le contenu HTML est requis.');
      return false;
    }
    return true;
  }

  private handleSaveError(err: ErrorMessage): void {
    this.saving.set(false);
    this.toastService.error(
      err.details?.join(' ') || err.message || 'Erreur lors de la sauvegarde.',
    );
  }

  private toDatetimeLocal(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}
