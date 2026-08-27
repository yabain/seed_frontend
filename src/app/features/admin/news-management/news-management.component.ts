import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { NewsService } from '../../../core/services/news.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { SegmentVisibilityComponent } from '../../../shared/components/segment-visibility/segment-visibility.component';
import { LandingSectionEditorComponent } from '../../../shared/components/landing-section-editor/landing-section-editor.component';
import type { ErrorMessage } from '../../../core/interceptors/error.interceptor';
import type { News, Paginated } from '../../../core/models/models';

@Component({
  selector: 'app-news-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SegmentVisibilityComponent, LandingSectionEditorComponent],
  templateUrl: './news-management.component.html',
  styleUrls: ['../management.scss', './news-management.component.scss'],
})
export class NewsManagementComponent implements OnInit {
  readonly result = signal<Paginated<News>>({ items: [], total: 0, page: 1, limit: 10 });
  readonly loading = signal(true);
  readonly page = signal(1);
  readonly limit = signal(10);
  readonly searchQuery = signal('');

  private searchTimer: any;

  get isAdmin(): boolean {
    return ['admin', 'superadmin'].includes(this.authService.admin()?.role ?? '');
  }

  constructor(
    private readonly newsService: NewsService,
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
    const request$ = this.isAdmin
      ? this.newsService.getAll(query)
      : this.newsService.getPublished(query);
    request$.subscribe({
      next: (data) => this.result.set(data),
      error: () => this.toastService.error('Impossible de charger les actualités.'),
      complete: () => this.loading.set(false),
    });
  }

  open(item: News): void {
    void this.router.navigate(['/admin/news', item._id]);
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

  remove(item: News): void {
    if (!window.confirm(`Supprimer l’actualité « ${item.title} » ?`)) {
      return;
    }
    this.newsService.remove(item._id).subscribe({
      next: () => {
        this.load();
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
        this.load();
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
