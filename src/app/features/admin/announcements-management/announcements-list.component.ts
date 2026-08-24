import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import {
  AnnouncementsService,
  Announcement,
  AnnouncementsListResult,
  AnnouncementsStats,
  ANNOUNCEMENT_GROUP_OPTIONS,
} from '../../../core/services/announcements.service';
import { ToastService } from '../../../core/services/toast.service';
import type { ErrorMessage } from '../../../core/interceptors/error.interceptor';

interface StatusFilter {
  value: string;
  label: string;
}

@Component({
  selector: 'app-announcements-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './announcements-list.component.html',
  styleUrls: ['../management.scss', './announcements.component.scss'],
})
export class AnnouncementsListComponent implements OnInit {
  readonly items = signal<Announcement[]>([]);
  readonly stats = signal<AnnouncementsStats | null>(null);
  readonly loading = signal(true);
  readonly statusFilter = signal('');
  readonly groupFilter = signal('');
  readonly searchQuery = signal('');
  readonly page = signal(1);
  readonly limit = signal(10);
  readonly pagination = signal<AnnouncementsListResult['pagination'] | null>(
    null,
  );

  private searchTimer: any;

  readonly groupOptions = ANNOUNCEMENT_GROUP_OPTIONS;
  readonly statusFilters: StatusFilter[] = [
    { value: '', label: 'Tous les statuts' },
    { value: 'draft', label: 'Brouillons' },
    { value: 'scheduled', label: 'Programmées' },
    { value: 'sending', label: 'En cours' },
    { value: 'sent', label: 'Envoyées' },
    { value: 'failed', label: 'Échecs' },
  ];

  constructor(
    private readonly announcementsService: AnnouncementsService,
    private readonly toastService: ToastService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.announcementsService
      .list({
        status: this.statusFilter() || undefined,
        group: this.groupFilter() || undefined,
        search: this.searchQuery().trim() || undefined,
        page: this.page(),
        limit: this.limit(),
      })
      .subscribe({
        next: (result) => {
          // Tri du plus récent au plus ancien (sécurité côté client).
          const sorted = [...result.data].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
          this.items.set(sorted);
          if (result.stats) {
            this.stats.set(result.stats);
          }
          this.pagination.set(result.pagination ?? null);
        },
        error: () =>
          this.toastService.error('Impossible de charger les annonces.'),
        complete: () => this.loading.set(false),
      });
  }

  onSearch(value: string): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchQuery.set(value);
    this.page.set(1);
    this.searchTimer = setTimeout(() => this.load(), 300);
  }

  onStatusChange(value: string): void {
    this.statusFilter.set(value);
    this.page.set(1);
    this.load();
  }

  onGroupChange(value: string): void {
    this.groupFilter.set(value);
    this.page.set(1);
    this.load();
  }

  onLimitChange(value: string): void {
    this.limit.set(parseInt(value, 10));
    this.page.set(1);
    this.load();
  }

  hasPrev(): boolean {
    return this.pagination()?.hasPrevPage ?? false;
  }

  hasNext(): boolean {
    return this.pagination()?.hasNextPage ?? false;
  }

  previousPage(): void {
    if (this.hasPrev()) {
      this.page.update((p) => p - 1);
      this.load();
    }
  }

  nextPage(): void {
    if (this.hasNext()) {
      this.page.update((p) => p + 1);
      this.load();
    }
  }

  open(item: Announcement): void {
    void this.router.navigate(['/admin/announcements', item.id, 'detail']);
  }

  cancelSchedule(item: Announcement): void {
    if (!window.confirm(`Annuler la programmation de « ${item.subject} » ?`)) {
      return;
    }
    this.announcementsService.cancelSchedule(item.id).subscribe({
      next: () => {
        this.toastService.success('Programmation annulée.');
        this.load();
      },
      error: (err: ErrorMessage) =>
        this.toastService.error(
          err.details?.join(' ') ||
            err.message ||
            "Erreur lors de l'annulation.",
        ),
    });
  }

  duplicate(item: Announcement): void {
    this.announcementsService.duplicate(item.id).subscribe({
      next: () => {
        this.toastService.success('Annonce dupliquée en brouillon.');
        this.load();
      },
      error: (err: ErrorMessage) =>
        this.toastService.error(
          err.details?.join(' ') ||
            err.message ||
            'Erreur lors de la duplication.',
        ),
    });
  }

  remove(item: Announcement): void {
    if (!window.confirm(`Supprimer définitivement « ${item.subject} » ?`)) {
      return;
    }
    this.announcementsService.delete(item.id).subscribe({
      next: () => {
        this.toastService.success('Annonce supprimée.');
        this.load();
      },
      error: (err: ErrorMessage) =>
        this.toastService.error(
          err.details?.join(' ') ||
            err.message ||
            'Erreur lors de la suppression.',
        ),
    });
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

  groupLabel(group: string): string {
    return (
      ANNOUNCEMENT_GROUP_OPTIONS.find((o) => o.value === group)?.label ?? group
    );
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
