import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EventsService } from '../../core/services/events.service';
import { SiteConfigService } from '../../core/services/site-config.service';
import { PageBackgroundService } from '../../core/services/page-background.service';
import type { Paginated, SeedEvent } from '../../core/models/models';

@Component({
  selector: 'app-events-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './events-list.component.html',
  styleUrl: './events-list.component.scss',
})
export class EventsListComponent implements OnInit {
  private readonly siteConfigService = inject(SiteConfigService);
  private readonly pageBackgroundService = inject(PageBackgroundService);
  readonly siteConfig = this.siteConfigService.config;
  readonly pageBackground = this.pageBackgroundService.background;
  readonly result = signal<Paginated<SeedEvent>>({ items: [], total: 0, page: 1, limit: 9 });
  readonly loading = signal(true);
  search = '';
  private searchTimer: any;

  constructor(
    private readonly eventsService: EventsService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.pageBackgroundService.load();
    this.loadPage(1);
  }

  goToDetail(id: string): void {
    void this.router.navigate(['/events', id]);
  }

  onSearchInput(value: string): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.search = value;
    this.searchTimer = setTimeout(() => this.loadPage(1), 300);
  }

  loadPage(page: number): void {
    this.loading.set(true);
    this.eventsService.getPublic({ page, limit: 9, search: this.search }).subscribe({
      next: (data) => {
        this.result.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  pages(): number[] {
    const { total, limit } = this.result();
    return Array.from({ length: Math.max(1, Math.ceil(total / limit)) }, (_, i) => i + 1);
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      soon: 'Bientôt',
      currently: 'En cours',
      ended: 'Terminé',
    };
    return labels[status] || status;
  }

  statusClass(status: string): string {
    const classes: Record<string, string> = {
      soon: 'badge--blue',
      currently: 'badge--green',
      ended: 'badge--gray',
    };
    return classes[status] || '';
  }

  formatDate(iso?: string): string {
    if (!iso) {
      return '';
    }
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  formatDateTime(iso?: string): string {
    if (!iso) {
      return '';
    }
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
