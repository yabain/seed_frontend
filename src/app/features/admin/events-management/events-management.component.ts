import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { EventsService } from '../../../core/services/events.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { isAdminRole } from '../../../core/constants/roles';
import { SegmentVisibilityComponent } from '../../../shared/components/segment-visibility/segment-visibility.component';
import { LandingSectionEditorComponent } from '../../../shared/components/landing-section-editor/landing-section-editor.component';
import type { ErrorMessage } from '../../../core/interceptors/error.interceptor';
import type { SeedEvent, Paginated } from '../../../core/models/models';

@Component({
  selector: 'app-events-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SegmentVisibilityComponent, LandingSectionEditorComponent],
  templateUrl: './events-management.component.html',
  styleUrls: ['../management.scss', './events-management.component.scss'],
})
export class EventsManagementComponent implements OnInit {
  readonly result = signal<Paginated<SeedEvent>>({ items: [], total: 0, page: 1, limit: 10 });
  readonly loading = signal(true);
  readonly page = signal(1);
  readonly limit = signal(10);
  readonly searchQuery = signal('');

  private searchTimer: any;

  get isAdmin(): boolean {
    return isAdminRole(this.authService.admin()?.role);
  }

  constructor(
    private readonly eventsService: EventsService,
    private readonly toastService: ToastService,
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const query = { page: this.page(), limit: this.limit(), search: this.searchQuery() };
    const request = this.isAdmin
      ? this.eventsService.getAll(query)
      : this.eventsService.getPublic(query);
    request.subscribe({
      next: (data) => this.result.set(data),
      error: () => this.toastService.error('Impossible de charger les événements.'),
      complete: () => this.loading.set(false),
    });
  }

  open(item: SeedEvent): void {
    void this.router.navigate(['/admin/events', item._id]);
  }

  onSearch(value: string): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchQuery.set(value);
    this.page.set(1);
    this.searchTimer = setTimeout(() => this.load(), 300);
  }

  totalPages(): number {
    const { total, limit } = this.result();
    return Math.max(1, Math.ceil(total / limit));
  }

  hasPrev(): boolean {
    return this.page() > 1;
  }

  hasNext(): boolean {
    return this.page() < this.totalPages();
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

  onLimitChange(value: string): void {
    this.limit.set(parseInt(value, 10));
    this.page.set(1);
    this.load();
  }

  remove(item: SeedEvent): void {
    if (!window.confirm(`Supprimer l'événement « ${item.title} » ?`)) {
      return;
    }
    this.eventsService.remove(item._id).subscribe({
      next: () => {
        this.load();
        this.toastService.success('Événement supprimé.');
      },
      error: (err: ErrorMessage) =>
        this.toastService.error(
          err.details?.join(' ') || err.message || 'Erreur lors de la suppression.',
        ),
    });
  }

  toggleVisibility(item: SeedEvent): void {
    this.eventsService.toggleVisibility(item._id).subscribe({
      next: () => {
        this.load();
        this.toastService.success(
          item.isVisibleOnLanding
            ? 'Événement masqué sur la landing.'
            : 'Événement visible sur la landing.',
        );
      },
      error: (err: ErrorMessage) =>
        this.toastService.error(
          err.details?.join(' ') || err.message || 'Erreur lors du changement de visibilité.',
        ),
    });
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      soon: 'Bientôt',
      currently: 'En cours',
      ended: 'Terminé',
    };
    return labels[status] || status;
  }

  formatDate(iso?: string): string {
    if (!iso) {
      return '';
    }
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
}
