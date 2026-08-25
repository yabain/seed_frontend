import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EventsService } from '../../../../core/services/events.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthService } from '../../../../core/services/auth.service';
import type { ErrorMessage } from '../../../../core/interceptors/error.interceptor';
import type { SeedEvent } from '../../../../core/models/models';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './event-detail.component.html',
  styleUrls: ['../../content-detail.scss', './event-detail.component.scss'],
})
export class EventDetailComponent implements OnInit {
  readonly loading = signal(true);
  readonly event = signal<SeedEvent | null>(null);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly eventsService: EventsService,
    private readonly toastService: ToastService,
    protected readonly authService: AuthService,
  ) {}

  get isAdmin(): boolean {
    return ['admin', 'superadmin'].includes(this.authService.admin()?.role ?? '');
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      void this.router.navigate(['/admin/events']);
      return;
    }
    this.load(id);
  }

  load(id: string): void {
    this.loading.set(true);
    this.eventsService.getOne(id).subscribe({
      next: (event) => {
        this.event.set(event);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.error('Événement introuvable.');
        void this.router.navigate(['/admin/events']);
      },
    });
  }

  toggleVisibility(): void {
    const item = this.event();
    if (!item) return;
    this.eventsService.toggleVisibility(item._id).subscribe({
      next: () => {
        this.event.set({ ...item, isVisibleOnLanding: !item.isVisibleOnLanding });
        this.toastService.success(
          item.isVisibleOnLanding
            ? 'Événement masqué sur la landing.'
            : 'Événement visible sur la landing.',
        );
      },
      error: () => this.toastService.error('Erreur lors de la mise à jour.'),
    });
  }

  remove(): void {
    const item = this.event();
    if (!item) return;
    if (!window.confirm(`Supprimer l'événement « ${item.title} » ?`)) {
      return;
    }
    this.eventsService.remove(item._id).subscribe({
      next: () => {
        this.toastService.success('Événement supprimé.');
        void this.router.navigate(['/admin/events']);
      },
      error: () => this.toastService.error('Erreur lors de la suppression.'),
    });
  }

  back(): void {
    void this.router.navigate(['/admin/events']);
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      soon: 'Bientôt',
      currently: 'En cours',
      ended: 'Terminé',
    };
    return labels[status] || status;
  }

  hasSocialLinks(e: SeedEvent): boolean {
    return !!(e.socialLinks?.facebook || e.socialLinks?.x || e.socialLinks?.youtube || e.socialLinks?.linkedin);
  }

  formatDate(iso?: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
