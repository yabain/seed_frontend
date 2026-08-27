import {
  Component,
  OnInit,
  OnDestroy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  AnnouncementsService,
  Announcement,
} from '../../../core/services/announcements.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-announcement-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './announcement-detail.component.html',
  styleUrls: ['../management.scss', '../announcements-management/announcements.component.scss'],
})
export class AnnouncementDetailComponent implements OnInit, OnDestroy {
  readonly announcement = signal<Announcement | null>(null);
  readonly loading = signal(true);
  readonly previewLoading = signal(false);
  readonly showAllDeliveries = signal(false);
  readonly trustedPreviewUrl = signal<SafeResourceUrl | null>(null);
  readonly deliverySearch = signal('');

  private objectUrl: string | null = null;
  private rawHtml = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly announcementsService: AnnouncementsService,
    private readonly toastService: ToastService,
    private readonly sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      void this.router.navigate(['/admin/announcements']);
      return;
    }
    this.announcementsService.getOne(id).subscribe({
      next: (a) => {
        this.announcement.set(a);
        this.loadPreview(a);
      },
      error: () => {
        this.toastService.error('Annonce introuvable.');
        void this.router.navigate(['/admin/announcements']);
      },
      complete: () => this.loading.set(false),
    });
  }

  private loadPreview(a: Announcement): void {
    this.previewLoading.set(true);
    this.announcementsService
      .preview(a.bodyHtml, a.includeHeader ?? true, a.includeFooter ?? true)
      .subscribe({
        next: (html) => {
          this.rawHtml = html;
          this.renderPreview(html);
        },
        error: () =>
          this.toastService.error("Impossible de générer l'aperçu."),
        complete: () => this.previewLoading.set(false),
      });
  }

  private renderPreview(html: string): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
    const blob = new Blob([html], { type: 'text/html' });
    this.objectUrl = URL.createObjectURL(blob);
    this.trustedPreviewUrl.set(
      this.sanitizer.bypassSecurityTrustResourceUrl(this.objectUrl),
    );
  }

  openInNewTab(): void {
    if (!this.rawHtml) {
      this.toastService.error("Aperçu indisponible.");
      return;
    }
    const blob = new Blob([this.rawHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  async copySource(): Promise<void> {
    const body = this.announcement()?.bodyHtml ?? '';
    if (!body) {
      this.toastService.error('Aucun contenu à copier.');
      return;
    }
    try {
      await navigator.clipboard.writeText(body);
      this.toastService.success(
        'Code source du mail copié dans le presse-papier.',
      );
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = body;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        this.toastService.success(
          'Code source du mail copié dans le presse-papier.',
        );
      } catch {
        this.toastService.error('Impossible de copier le code source.');
      }
      document.body.removeChild(textarea);
    }
  }

  duplicate(): void {
    const a = this.announcement();
    if (!a) return;
    this.announcementsService.duplicate(a.id).subscribe({
      next: (created) => {
        this.toastService.success('Annonce dupliquée.');
        void this.router.navigate(['/admin/announcements', created.id, 'detail']);
      },
      error: () => this.toastService.error('Échec de la duplication.'),
    });
  }

  remove(): void {
    const a = this.announcement();
    if (!a) return;
    if (!confirm('Supprimer cette annonce définitivement ?')) return;
    this.announcementsService.delete(a.id).subscribe({
      next: () => {
        this.toastService.success('Annonce supprimée.');
        void this.router.navigate(['/admin/announcements']);
      },
      error: () => this.toastService.error('Échec de la suppression.'),
    });
  }

  ngOnDestroy(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }

  get visibleDeliveries() {
    const deliveries = this.announcement()?.deliveries ?? [];
    const search = this.deliverySearch().toLowerCase().trim();
    const filtered = search
      ? deliveries.filter(
          (d) =>
            d.email.toLowerCase().includes(search) ||
            (d.userName || '').toLowerCase().includes(search),
        )
      : deliveries;
    return this.showAllDeliveries() ? filtered : filtered.slice(0, 25);
  }

  toggleShowAll(): void {
    this.showAllDeliveries.update((v) => !v);
  }

  onDeliverySearch(value: string): void {
    this.deliverySearch.set(value);
    this.showAllDeliveries.set(false);
  }

  deliveryClass(status?: string): string {
    switch (status) {
      case 'sent':
        return 'badge badge--green';
      case 'failed':
        return 'badge badge--red';
      default:
        return 'badge badge--gray';
    }
  }

  deliveryIcon(status?: string): string {
    switch (status) {
      case 'sent':
        return 'ti ti-check';
      case 'failed':
        return 'ti ti-x';
      default:
        return 'ti ti-clock';
    }
  }

  deliveryLabel(status?: string): string {
    switch (status) {
      case 'sent':
        return 'Envoyé';
      case 'failed':
        return 'Échec';
      default:
        return 'En attente';
    }
  }

  statusClass(status?: string): string {
    switch (status) {
      case 'sent':
        return 'badge badge--green';
      case 'sending':
        return 'badge badge--amber';
      case 'scheduled':
        return 'badge badge--blue';
      case 'failed':
        return 'badge badge--red';
      default:
        return 'badge badge--gray';
    }
  }

  statusIcon(status?: string): string {
    switch (status) {
      case 'sent':
        return 'ti ti-check';
      case 'sending':
        return 'ti ti-loader';
      case 'scheduled':
        return 'ti ti-clock';
      case 'failed':
        return 'ti ti-alert-triangle';
      default:
        return 'ti ti-pencil';
    }
  }

  formatDate(iso?: string | null): string {
    if (!iso) {
      return '—';
    }
    return new Date(iso).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
