import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NewsService } from '../../../core/services/news.service';
import { ToastService } from '../../../core/services/toast.service';
import { SegmentVisibilityComponent } from '../../../shared/components/segment-visibility/segment-visibility.component';
import type { ErrorMessage } from '../../../core/interceptors/error.interceptor';
import type { News, Paginated } from '../../../core/models/models';

@Component({
  selector: 'app-news-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SegmentVisibilityComponent],
  templateUrl: './news-management.component.html',
  styleUrls: ['../management.scss', './news-management.component.scss'],
})
export class NewsManagementComponent implements OnInit {
  readonly result = signal<Paginated<News>>({ items: [], total: 0, page: 1, limit: 10 });
  search = '';

  constructor(
    private readonly newsService: NewsService,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadPage(1);
  }

  loadPage(page: number): void {
    this.newsService.getAll({ page, limit: 10, search: this.search }).subscribe({
      next: (data) => this.result.set(data),
      error: () => this.toastService.error('Impossible de charger les actualités.'),
    });
  }

  onSearch(): void {
    this.loadPage(1);
  }

  pages(): number[] {
    const { total, limit } = this.result();
    return Array.from({ length: Math.max(1, Math.ceil(total / limit)) }, (_, i) => i + 1);
  }

  remove(item: News): void {
    if (!window.confirm(`Supprimer l’actualité « ${item.title} » ?`)) {
      return;
    }
    this.newsService.remove(item._id).subscribe({
      next: () => {
        this.loadPage(this.result().page);
        this.toastService.success('Actualité supprimée.');
      },
      error: (err: ErrorMessage) =>
        this.toastService.error(
          err.details?.join(' ') || err.message || 'Erreur lors de la suppression.',
        ),
    });
  }

  toggleStatus(item: News): void {
    const nextStatus = item.status === 'published' ? 'draft' : 'published';
    this.newsService.update(item._id, { status: nextStatus }).subscribe({
      next: () => {
        this.loadPage(this.result().page);
        this.toastService.success(
          nextStatus === 'published'
            ? 'Actualité publiée.'
            : 'Actualité désactivée.',
        );
      },
      error: (err: ErrorMessage) =>
        this.toastService.error(
          err.details?.join(' ') ||
            err.message ||
            'Erreur lors du changement de statut.',
        ),
    });
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