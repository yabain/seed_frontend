import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NewsService } from '../../../../core/services/news.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthService } from '../../../../core/services/auth.service';
import { isAdminRole } from '../../../../core/constants/roles';
import type { ErrorMessage } from '../../../../core/interceptors/error.interceptor';
import type { News } from '../../../../core/models/models';

@Component({
  selector: 'app-news-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './news-detail.component.html',
  styleUrls: ['../../content-detail.scss', './news-detail.component.scss'],
})
export class NewsDetailComponent implements OnInit {
  readonly loading = signal(true);
  readonly news = signal<News | null>(null);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly newsService: NewsService,
    private readonly toastService: ToastService,
    protected readonly authService: AuthService,
  ) {}

  get isAdmin(): boolean {
    return isAdminRole(this.authService.admin()?.role);
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      void this.router.navigate(['/admin/news']);
      return;
    }
    this.load(id);
  }

  load(id: string): void {
    this.loading.set(true);
    this.newsService.getOne(id).subscribe({
      next: (news) => {
        this.news.set(news);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.error('Actualité introuvable.');
        void this.router.navigate(['/admin/news']);
      },
    });
  }

  paragraphs(): string[] {
    const content = this.news()?.content?.trim();
    return content ? content.split(/\n{2,}/).filter(Boolean) : [];
  }

  toggleStatus(): void {
    const item = this.news();
    if (!item) return;
    const nextStatus = item.status === 'published' ? 'draft' : 'published';
    this.newsService.update(item._id, { status: nextStatus }).subscribe({
      next: () => {
        this.news.set({ ...item, status: nextStatus });
        this.toastService.success(
          nextStatus === 'published'
            ? 'Actualité publiée.'
            : 'Actualité désactivée.',
        );
      },
      error: () => this.toastService.error('Erreur lors de la mise à jour.'),
    });
  }

  remove(): void {
    const item = this.news();
    if (!item) return;
    if (!window.confirm(`Supprimer l’actualité « ${item.title} » ?`)) {
      return;
    }
    this.newsService.remove(item._id).subscribe({
      next: () => {
        this.toastService.success('Actualité supprimée.');
        void this.router.navigate(['/admin/news']);
      },
      error: () => this.toastService.error('Erreur lors de la suppression.'),
    });
  }

  back(): void {
    void this.router.navigate(['/admin/news']);
  }

  formatDate(iso?: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
}
