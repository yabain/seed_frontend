import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EventsService } from '../../../core/services/events.service';
import type { SeedEvent } from '../../../core/models/models';

@Component({
  selector: 'app-event-detail-public',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './event-detail.component.html',
  styleUrl: './event-detail.component.scss',
})
export class EventDetailPublicComponent implements OnInit {
  readonly event = signal<SeedEvent | null>(null);
  readonly notFound = signal(false);
  readonly loading = signal(true);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly eventsService: EventsService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.eventsService.getOne(id).subscribe({
      next: (item) => {
        this.event.set(item);
        this.loading.set(false);
      },
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      },
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

  statusClass(status: string): string {
    const classes: Record<string, string> = {
      soon: 'badge--blue',
      currently: 'badge--green',
      ended: 'badge--gray',
    };
    return classes[status] || '';
  }

  formatDate(iso?: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  formatDateTime(iso?: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  descriptionParagraphs(): string[] {
    const content = this.event()?.description?.trim();
    return content ? content.split(/\n{2,}/).filter(Boolean) : [];
  }

  programLines(): string[] {
    const content = this.event()?.program?.trim();
    return content ? content.split(/\n/).filter(Boolean) : [];
  }

  hasSocialLinks(): boolean {
    const e = this.event();
    return !!(e?.socialLinks?.facebook || e?.socialLinks?.x || e?.socialLinks?.youtube || e?.socialLinks?.linkedin);
  }

  hasPanelists(): boolean {
    return !!(this.event()?.panelists?.length);
  }
}
